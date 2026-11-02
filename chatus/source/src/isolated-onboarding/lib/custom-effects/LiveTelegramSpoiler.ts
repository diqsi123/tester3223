// The authored Figma export remains untouched in TelegramSpoiler.ts.
// Reuse its pipeline/uniform contract, with the user's requested livelier motion:
// 0.85 px orbital drift instead of 0.20, and independently phased shimmer.
import { setup as sourceSetup, render, manifest } from "./TelegramSpoiler";
import type { CustomEffectState } from "../custom-effect-runtime/types";

export { render, manifest };
export function setup(device: GPUDevice, frame: CustomEffectState) {
  sourceSetup(device, frame);
  frame.state.module = device.createShaderModule({ code: LIVE_WGSL });
}

const LIVE_WGSL = `
diagnostic(off,derivative_uniformity);
struct Uniforms {
  frameData: vec4f,
  inputDimsData: vec4f,
  bubbleColor: vec4f,
  particleColor: vec4f,
  particleDensity: vec4f,
  particleSize: vec4f,
  animationSpeed: vec4f,
  reveal: vec4f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsIn {
  @location(0) pos: vec2f,
  @location(1) uv: vec2f,
};
struct VsOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

fn grainHash(p: vec2f) -> vec4f {

  var q = fract(vec4f(p.x, p.y, p.x, p.y) * vec4f(0.1031, 0.1030, 0.0973, 0.1099));

  q = q + dot(q, q.wzxy + vec4f(33.33));

  return fract((q.xxyz + q.yzzw) * q.zywx);

}

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

@fragment fn fs_main(@location(0) outputUv_in: vec2f) -> @location(0) vec4f {
  let time = u.frameData.x;
  let outputUv = outputUv_in;
  let dims = max(u.frameData.yz, vec2f(1.0));
  let inputDims = max(u.inputDimsData.xy, vec2f(1.0));
  let inputTexel = vec2f(1.0) / inputDims;
  let uv = outputUv;
  // texel and aspect are input-relative to match uv. Zoom fills rescale texel
  // alongside their uv redefinition below (see zoomLocal).
  let texel = inputTexel;
  let aspect = inputDims.x / max(inputDims.y, 1.0);
  let bubbleColor = u.bubbleColor;
  let particleColor = u.particleColor;
  let particleDensity = u.particleDensity.x;
  let particleSize = u.particleSize.x;
  let animationSpeed = u.animationSpeed.x;
  let reveal = u.reveal.x;
  let progress = clamp(reveal / 100.0, 0.0, 1.0);
  let p = uv * dims;
  let spacing = 1.65;
  let cell = floor(p / spacing);
  let phase = time * animationSpeed * 2.4;
  var grain = 0.0;
  for (var iy = -1; iy <= 1; iy = iy + 1) {
    for (var ix = -1; ix <= 1; ix = ix + 1) {
      let id = cell + vec2f(f32(ix), f32(iy));
      let seed = grainHash(id);
      let seed2 = grainHash(id + vec2f(71.1, 19.7));
      let angle = seed.z * 6.28318530718;
      let drift = vec2f(sin(phase + angle), cos(phase + angle + seed.w * 2.0)) * (0.85 + progress * 0.55);
      let centerPx = (id + vec2f(0.5) + (seed.xy - vec2f(0.5)) * 0.92) * spacing + drift;
      let delta = p - centerPx;
      let radius = particleSize * 0.5 * mix(0.65, 1.12, seed2.x) * (1.0 - progress * 0.6);
      let ellipseDelta = delta * vec2f(mix(0.85, 1.2, seed2.y), mix(0.85, 1.2, seed2.z));
      let distancePx = length(ellipseDelta);
      let footprint = 1.0 - smoothstep(max(0.0, radius - 0.38), radius + 0.38, distancePx);
      let enabled = 1.0 - smoothstep(max(0.0, particleDensity * (1.0 - progress) - 0.035), particleDensity * (1.0 - progress) + 0.035, seed.w);
      let shimmer = 0.60 + 0.28 * sin(phase * 2.2 + angle) + 0.12 * sin(phase * 3.7 + seed2.w * 6.28318530718);
      grain = max(grain, footprint * enabled * shimmer);
    }
  }
  grain = select(0.0, clamp(grain * particleColor.a * (1.0 - progress), 0.0, 1.0), particleDensity > 0.0);
  // Premultiplied particles only: the actual card/background must show between
  // specks. An opaque bubble here creates a visible rectangle on the warm glow.
  let alpha = grain * (1.0 - progress);
  return select(vec4f(particleColor.rgb * alpha, alpha), vec4f(0.0), progress >= 1.0);
}
`;
