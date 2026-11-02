import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";

// Exercise the actual renderer with a deterministic clock and instrumented GL.
// This validates lifecycle/timing, not shader compilation or device GPU speed.
const cache = new Map();
function moduleUrl(file) {
  if (cache.has(file)) return cache.get(file);
  const code = stripTypeScriptTypes(fs.readFileSync(file, "utf8")).replace(/from "(\.\/[^"]+)"/g,
    (_all, name) => `from "${moduleUrl(path.resolve(path.dirname(file), `${name}.ts`))}"`);
  const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  cache.set(file, url);
  return url;
}
const { createSearchRenderer } = await import(moduleUrl(path.resolve("src/components/LivingSearchSilhouette/renderer.ts")));
const { createSearchPath, samplePath } = await import(moduleUrl(path.resolve("src/components/LivingSearchSilhouette/path.ts")));
const { SEARCH_VISUAL } = await import(moduleUrl(path.resolve("src/components/LivingSearchSilhouette/config.ts")));
const initial = { state: "searching", intensity: 0.35, paused: false };

function environment({ reduced = false, compile = true } = {}) {
  let now = 0, serial = 0, draws = 0;
  const pending = new Map(), allocated = new Set(), uniforms = {};
  const document = Object.assign(new EventTarget(), { hidden: false });
  const window = Object.assign(new EventTarget(), { devicePixelRatio: 3 });
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const observers = [];
  class Observer {
    constructor(fn) { this.fn = fn; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  Object.assign(globalThis, { document, window, matchMedia: () => motion,
    ResizeObserver: Observer, IntersectionObserver: Observer,
    requestAnimationFrame: fn => { const id = ++serial; pending.set(id, fn); return id; },
    cancelAnimationFrame: id => pending.delete(id),
  });
  const gl = new Proxy({
    getShaderParameter: () => compile, getProgramParameter: () => true,
    getShaderInfoLog: () => "Intentional compile failure", getError: () => 0, NO_ERROR: 0,
    isContextLost: () => false, getUniformLocation: (_p, key) => key,
    getAttribLocation: () => 0,
    uniform1f: (key, value) => { uniforms[key] = value; },
    uniform2f: (key, x, y) => { uniforms[key] = [x, y]; },
    drawArrays: () => { draws++; },
  }, { get(target, prop) {
    if (prop in target) return target[prop];
    if (String(prop).startsWith("create")) return () => { const item = {}; allocated.add(item); return item; };
    if (String(prop).startsWith("delete")) return item => allocated.delete(item);
    return /^[A-Z_0-9]+$/.test(String(prop)) ? 1 : () => {};
  } });
  const canvas = { width: 0, height: 0, clientWidth: 402, clientHeight: 379, getContext: () => gl };
  const image = { naturalWidth: 402, naturalHeight: 379 };
  return { canvas, image, document, motion, pending, allocated, uniforms, observers,
    get draws() { return draws; },
    advance(ms) {
      for (let elapsed = 0; elapsed < ms; elapsed += 1000 / 60) {
        now += 1000 / 60;
        const batch = [...pending.values()]; pending.clear(); batch.forEach(fn => fn(now));
      }
    },
  };
}

test("one quad per frame; capped resolution and ~30 FPS; complete cleanup", () => {
  const env = environment(); let ready = 0;
  const renderer = createSearchRenderer(env.canvas, env.image, initial, () => ready++);
  const baseline = env.draws;
  env.advance(1000);
  assert.ok(env.draws - baseline >= 28 && env.draws - baseline <= 31);
  assert.equal(ready, 1);
  assert.equal(env.canvas.width, 482);
  assert.equal(env.canvas.height, 455);
  renderer.dispose();
  assert.equal(env.pending.size, 0);
  assert.equal(env.allocated.size, 0);
  assert.ok(env.observers.every(o => o.disconnected));
});

test("paused, hidden and offscreen renderers stop and resume without time jumps", () => {
  const env = environment(); const renderer = createSearchRenderer(env.canvas, env.image, initial, () => {});
  env.advance(500);
  for (const [stop, resume] of [
    [() => renderer.update({ ...initial, paused: true }), () => renderer.update(initial)],
    [() => { env.document.hidden = true; env.document.dispatchEvent(new Event("visibilitychange")); }, () => { env.document.hidden = false; env.document.dispatchEvent(new Event("visibilitychange")); }],
    [() => env.observers[1].fn([{ isIntersecting: false }]), () => env.observers[1].fn([{ isIntersecting: true }])],
  ]) {
    stop(); const before = env.uniforms.uHead.slice(0, 2); const draws = env.draws;
    env.advance(5000); assert.equal(env.draws, draws); assert.equal(env.pending.size, 0);
    resume(); env.advance(100);
    const after = env.uniforms.uHead;
    const distance = Math.hypot(after[0] - before[0], after[1] - before[1]);
    assert.ok(distance > 0 && distance < 12);
  }
  renderer.dispose();
});

test("reduced motion has a static composition and zero continuing callbacks", () => {
  const env = environment({ reduced: true });
  const renderer = createSearchRenderer(env.canvas, env.image, initial, () => {});
  assert.equal(env.pending.size, 0); const draws = env.draws;
  const before = [...env.uniforms.uHead];
  env.advance(1000); assert.equal(env.draws, draws); assert.deepEqual(env.uniforms.uHead, before);
  env.motion.matches = false; env.motion.dispatchEvent(new Event("change"));
  env.advance(1000); assert.ok(env.draws > draws);
  renderer.dispose();
});

test("closed contour lookup wraps seamlessly with bounded pixel steps", () => {
  const path = createSearchPath(), before = new Float32Array(2), after = new Float32Array(2);
  assert.equal(path[0], path[path.length - 2]); assert.equal(path[1], path[path.length - 1]);
  for (let i = 2; i < path.length; i += 2) {
    const step = Math.hypot(path[i] - path[i - 2], path[i + 1] - path[i - 1]);
    assert.ok(step > .1 && step < 1.5);
  }
  samplePath(path, -.0001, before, 0); samplePath(path, .0001, after, 0);
  assert.ok(Math.hypot(after[0] - before[0], after[1] - before[1]) < .3);
});

test("match accelerates on the contour for 300ms, then holds the head during its flash", () => {
  const env = environment(); const renderer = createSearchRenderer(env.canvas, env.image, initial, () => {});
  const phase = env.uniforms.uPhase;
  renderer.update({ ...initial, state: "matched" }); env.advance(350);
  assert.ok(Math.abs(env.uniforms.uPhase - phase - .3 * 1.65 / SEARCH_VISUAL.LOOP_DURATION_SECONDS) < .001);
  const head = [...env.uniforms.uHead]; env.advance(350);
  assert.deepEqual(env.uniforms.uHead, head); renderer.dispose();
});

test("matched converges/fades within 700ms, stops, and can search again", () => {
  const env = environment(); const renderer = createSearchRenderer(env.canvas, env.image, initial, () => {});
  renderer.update({ ...initial, state: "matched" }); env.advance(300);
  assert.ok(env.uniforms.uMatch > 0.3 && env.uniforms.uMatch < 0.6);
  env.advance(400); assert.equal(env.uniforms.uMatch, 1); assert.equal(env.pending.size, 0);
  renderer.update(initial); env.advance(100); assert.equal(env.uniforms.uMatch, 0);
  assert.equal(env.pending.size, 1); renderer.dispose();
});

test("failed shader setup releases partial resources for the fallback", () => {
  const env = environment({ compile: false });
  assert.throws(() => createSearchRenderer(env.canvas, env.image, initial, () => {}), /compile failure/);
  assert.equal(env.allocated.size, 0); assert.equal(env.pending.size, 0);
});

test("Luma scene uses one draw at 60fps and 1x, independent of device DPR", () => {
  const env = environment(); env.canvas.clientHeight = 874;
  const scene = { height: 874, characterTop: 76, searching: true };
  const renderer = createSearchRenderer(env.canvas, env.image, { ...initial, scene }, () => {});
  const baseline = env.draws;
  env.advance(1000);
  assert.ok(env.draws - baseline >= 58 && env.draws - baseline <= 61);
  assert.equal(env.canvas.width, 402); assert.equal(env.canvas.height, 874);
  assert.deepEqual(env.uniforms.uSceneSize, [402, 874]);
  assert.ok(Math.abs(env.uniforms.uTime - .65) < .03);
  renderer.update({ ...initial, scene: { ...scene, searching: false, characterTop: 149 } });
  assert.equal(env.uniforms.uSearching, 0); assert.equal(env.uniforms.uCharacterTop, 149);
  const time = env.uniforms.uTime; env.advance(100); assert.ok(env.uniforms.uTime > time);
  renderer.dispose(); assert.equal(env.allocated.size, 0); assert.equal(env.pending.size, 0);
});

test("a reduced-motion Luma scene freezes both background and light", () => {
  const env = environment({ reduced: true });
  const renderer = createSearchRenderer(env.canvas, env.image, {
    ...initial, scene: { height: 874, characterTop: 76, searching: true },
  }, () => {});
  const draws = env.draws; env.advance(1000);
  assert.equal(env.draws, draws); assert.equal(env.uniforms.uTime, 0);
  assert.equal(env.pending.size, 0); renderer.dispose();
});
