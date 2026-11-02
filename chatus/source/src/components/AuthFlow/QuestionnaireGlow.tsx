import { useEffect, useRef, useState } from 'react';
import './questionnaire-glow.css';

/** Animate the original Figma composite itself, keeping its colours and alpha.
 * A continuous image warp moves the rays/light instead of nudging a still PNG. */
export function QuestionnaireGlow({ active = true }: { active?: boolean } = {}) {
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(active && !document.hidden);
  const [renderer, setRenderer] = useState<'pending' | 'live' | 'fallback'>('pending');
  useEffect(() => {
    const target = canvas.current;
    if (!target || !active) { setPlaying(false); return; }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, disposed = false, frame = 0, elapsed = 0, last = 0;
    let draw: ((phase: number) => void) | undefined;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
    const tick = (now: number) => {
      if (disposed || document.hidden || !visible || reduced.matches) { stop(); return; }
      if (last) elapsed += Math.min(now - last, 100);
      last = now;
      draw?.(elapsed / 1000 * Math.PI * 2 / 10);
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      setPlaying(visible && !document.hidden && !reduced.matches);
      stop();
      if (reduced.matches) draw?.(0);
      else if (draw && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (layer.current) observer.observe(layer.current);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    const gl = target.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    const texture = gl?.createTexture();
    const program = gl?.createProgram();
    const buffer = gl?.createBuffer();
    const shaders: WebGLShader[] = [];
    const image = new Image();
    if (gl && program && texture && buffer) {
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type)!;
        shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader);
        gl.attachShader(program, shader);
      };
      compile(gl.VERTEX_SHADER, 'attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}');
      compile(gl.FRAGMENT_SHADER, `precision mediump float;
        varying vec2 uv; uniform sampler2D source; uniform float phase;
        void main(){
          // The fade and frame edges stay fixed; only the interior light flows.
          float edge=sin(uv.x*3.14159265)*sin(uv.y*3.14159265);
          vec2 wave=vec2(sin(uv.y*7.0+phase)*.072+sin(uv.y*13.0-phase*2.0)*.020,
                         sin(uv.x*6.0-phase)*.032);
          vec4 colour=texture2D(source,uv+wave*edge*sin(phase));
          // Let the original light breathe6%, with no hue shift or new layers.
          // At phase0 the source image and all its alpha values are exact.
          float alpha=colour.a*(.97+.03*cos(phase));
          gl_FragColor=vec4(colour.rgb*alpha,alpha);
        }`);
      gl.linkProgram(program);
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const point = gl.getAttribLocation(program, 'point');
        gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
        const phase = gl.getUniformLocation(program, 'phase');
        gl.uniform1i(gl.getUniformLocation(program, 'source'), 0);
        image.onload = () => {
          if (disposed) return;
          const ratio = Math.min(devicePixelRatio || 1, 2);
          target.width = Math.round(402 * ratio); target.height = Math.round(573 * ratio);
          gl.viewport(0, 0, target.width, target.height);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          draw = value => { gl.uniform1f(phase, value); gl.drawArrays(gl.TRIANGLES, 0, 6); };
          draw(0); setRenderer('live'); update();
        };
        image.src = '/assets/auth/questionnaire-glow-gold.png';
      }
    }
    if (!gl || !program || !texture || !buffer || !gl.getProgramParameter(program, gl.LINK_STATUS)) setRenderer('fallback');
    const lost = (event: Event) => { event.preventDefault(); stop(); draw = undefined; setRenderer('fallback'); };
    target.addEventListener('webglcontextlost', lost);
    update();
    return () => {
      disposed = true; stop(); image.onload = null;
      observer.disconnect(); document.removeEventListener('visibilitychange', update);
      reduced.removeEventListener('change', update); target.removeEventListener('webglcontextlost', lost);
      if (gl) { shaders.forEach(shader => gl.deleteShader(shader)); gl.deleteBuffer(buffer!); gl.deleteTexture(texture!); gl.deleteProgram(program!); }
    };
  }, [active]);
  return <div className="questionnaire-glow" ref={layer} aria-hidden="true" data-active={active} data-playing={playing} data-renderer={renderer} data-node-id="3084:31715">
    <img src="/assets/auth/questionnaire-glow-gold.png" alt="" draggable={false} />
    <canvas ref={canvas} />
  </div>;
}
