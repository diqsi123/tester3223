import { LUMA_PRESET, SEARCH_VISUAL } from "./config";
import { fragmentShader, vertexShader } from "./shaders";
import { createSearchPath, samplePath } from "./path";

export type SearchState = "searching" | "matched";
export type SceneLayout = { height: number; characterTop: number; searching: boolean };
export type VisualControls = { state: SearchState; intensity: number; paused: boolean; scene?: SceneLayout };

/** One texture, one quad, one draw; a baked contour field drives the trail. */
export function createSearchRenderer(canvas: HTMLCanvasElement, source: HTMLImageElement | HTMLCanvasElement,
  initial: VisualControls, ready: () => void) {
  const gl = canvas.getContext("webgl", {
    alpha: true, premultipliedAlpha: true, antialias: false,
    depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: "low-power",
  });
  if (!gl) throw new Error("WebGL unavailable");
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const release = () => {
    gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  };
  try {
    if (!program || !buffer || !texture) throw new Error("WebGL allocation failed");
    for (const [type, text] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Shader allocation failed");
      shaders.push(shader);
      gl.shaderSource(shader, text); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Shader link failed");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (gl.getError() !== gl.NO_ERROR) throw new Error("Mask upload failed");
    gl.uniform1i(gl.getUniformLocation(program, "uMask"), 0);
  } catch (error) { release(); throw error; }

  const sceneUniform = gl.getUniformLocation(program!, "uSceneSize");
  const topUniform = gl.getUniformLocation(program!, "uCharacterTop");
  const backgroundUniform = gl.getUniformLocation(program!, "uBackground");
  const searchingUniform = gl.getUniformLocation(program!, "uSearching");
  const timeUniform = gl.getUniformLocation(program!, "uTime");
  const headUniform = gl.getUniformLocation(program!, "uHead");
  const phaseUniform = gl.getUniformLocation(program!, "uPhase");
  const path = createSearchPath();
  const head = new Float32Array(2);
  const intensityUniform = gl.getUniformLocation(program!, "uIntensity");
  const matchUniform = gl.getUniformLocation(program!, "uMatch");
  const reducedUniform = gl.getUniformLocation(program!, "uReduced");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let controls = initial;
  let reduced = motion.matches;
  let visible = true;
  let disposed = false;
  let frame = 0;
  let previous = 0;
  let phase = 0.128;
  let time = 0;
  let match = initial.state === "matched" ? 1 : 0;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  let didDraw = false;
  const interval = 1000 / (initial.scene ? LUMA_PRESET.fps : SEARCH_VISUAL.FPS);

  const allowed = () => !disposed && !document.hidden && visible && !controls.paused && !gl.isContextLost();
  const moving = () => (!reduced && Boolean(controls.scene)) || (controls.state === "matched" ? match < 1 : !reduced);
  function draw() {
    // Luma 1× means one backing pixel per CSS pixel, not device DPR.
    const scale = controls.scene ? LUMA_PRESET.quality : Math.min(window.devicePixelRatio || 1, SEARCH_VISUAL.MAX_DPR) * SEARCH_VISUAL.RENDER_SCALE;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl!.viewport(0, 0, w, h); }
    samplePath(path, phase, head, 0);
    gl!.uniform2f(sceneUniform, width, height);
    gl!.uniform1f(topUniform, controls.scene?.characterTop ?? 0);
    gl!.uniform1f(backgroundUniform, controls.scene ? 1 : 0);
    gl!.uniform1f(searchingUniform, controls.scene?.searching === false ? 0 : 1);
    gl!.uniform1f(timeUniform, time);
    gl!.uniform2f(headUniform, head[0], head[1]);
    gl!.uniform1f(phaseUniform, phase);
    gl!.uniform1f(intensityUniform, controls.intensity);
    gl!.uniform1f(matchUniform, match);
    gl!.uniform1f(reducedUniform, reduced ? 1 : 0);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    if (!didDraw) { didDraw = true; ready(); }
  }
  function tick(now: number) {
    frame = 0;
    if (!allowed()) return;
    if (!previous) previous = now;
    const elapsed = now - previous;
    if (elapsed >= interval - 0.5) {
      const delta = Math.min(elapsed, 100);
      previous = now;
      if (!reduced) {
        time += delta / 1000 * LUMA_PRESET.speed;
        // First 300ms of a match accelerate along the current route, then gather.
        const accelerating = controls.state === "matched";
        const travelMs = accelerating ? Math.max(0, Math.min(delta, 300 - match * SEARCH_VISUAL.MATCH_DURATION_MS)) : delta;
        phase = (phase + travelMs / 1000 / SEARCH_VISUAL.LOOP_DURATION_SECONDS * (accelerating ? 1.65 : 1)) % 1;
      }
      if (controls.state === "matched") match = Math.min(1, match + delta / SEARCH_VISUAL.MATCH_DURATION_MS);
      draw();
    }
    if (moving()) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (!allowed()) return;
    draw();
    if (moving()) frame = requestAnimationFrame(tick);
  }
  const onMotion = () => { reduced = motion.matches; sync(); };
  const resize = new ResizeObserver(entries => {
    width = entries[0].contentRect.width; height = entries[0].contentRect.height; sync();
  });
  resize.observe(canvas);
  const intersection = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting; sync();
  });
  intersection?.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", sync);
  motion.addEventListener("change", onMotion);
  // Paused initially still gets one static composition, without a continuing RAF.
  if (!document.hidden) draw();
  sync();
  return {
    update(next: VisualControls) {
      if (next.state !== controls.state) match = 0;
      if (next.scene?.searching && !controls.scene?.searching) phase = 0.128;
      controls = next;
      sync();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect(); intersection?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", sync);
      motion.removeEventListener("change", onMotion);
      release();
    },
  };
}
