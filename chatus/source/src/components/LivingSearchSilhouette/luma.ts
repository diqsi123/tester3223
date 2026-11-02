import { LUMA_PRESET } from "./config";
/** Background shader from https://luma-final-alpha.vercel.app/.
 * User preset: speed .65, light .30, width .90, fluidity 1.55, 60fps, 1x.
 * Only adapted the entry point so background + character share one draw. */
export const lumaShader = `
const float TAU = 6.28318530718;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
}

float ribbon(float along, float across, float center, float width, float period, float phase, float time) {
  // Advect the entire shape in one direction, including its bends and highlights.
  // No back-and-forth translation: a crest always travels towards bottom-right.
  float travel = along - time * (2.0 / period);
  float flow = noise(vec2(travel * 1.1, phase * 3.0));
  float curve = ${LUMA_PRESET.bend.toFixed(2)} * (0.18 * sin(travel * 2.4 + phase) + 0.10 * (flow * 2.0 - 1.0));
  float d = (across - center - curve) / (width * ${LUMA_PRESET.width.toFixed(2)});
  // Brighter, elongated packets make travel visible along each soft ray.
  float crest = 0.5 + 0.5 * cos(travel * TAU / 2.0 + phase);
  float envelope = 0.20 + 0.80 * pow(crest, 1.2);
  return exp(-d * d * 1.7) * envelope;
}

vec3 lumaBackground(vec2 uv, vec2 resolution, float time) {
  // Coordinates measured in the shorter edge: no stretching on orientation changes.
  vec2 p = (uv - 0.5) * resolution / min(resolution.x, resolution.y);
  vec2 direction = normalize(vec2(1.0, 1.0));
  float along = dot(p, direction);
  float across = dot(p, vec2(-direction.y, direction.x));
  float a = ribbon(along, across, -0.55, 0.34, 8.0, 0.35, time);
  float b = ribbon(along, across,  0.00, 0.30, 10.0, 2.40, time);
  float c = ribbon(along, across,  0.55, 0.38, 12.0, 4.10, time);
  float light = 1.0 - exp(-(a * 1.45 + b * 1.30 + c * 1.20) * ${LUMA_PRESET.intensity.toFixed(2)});
  vec3 base = vec3(253.0, 171.0, 27.0) / 255.0;
  vec3 sun = vec3(255.0, 240.0, 56.0) / 255.0;
  vec3 color = mix(base, sun, light);
  // Static, sub-8-bit dither. It never moves with time.
  float grain = (hash(floor(gl_FragCoord.xy)) - 0.5) / 255.0;
  return clamp(color + grain, 0.0, 1.0);
}
`;
