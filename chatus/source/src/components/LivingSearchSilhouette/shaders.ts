import { SEARCH_VISUAL as V } from "./config";
import { lumaShader } from "./luma";

export const vertexShader = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

export const fragmentShader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uMask;
uniform vec2 uHead;
uniform vec2 uSceneSize;
uniform float uCharacterTop;
uniform float uBackground;
uniform float uSearching;
uniform float uTime;
uniform float uPhase;
uniform float uIntensity;
uniform float uMatch;
uniform float uReduced;
${lumaShader}

void main() {
  // One atlas: original contour data, approved PNG artwork, exported Figma light.
  // The source PNG alpha and its 402 × 379 proportions remain unchanged.
  vec2 p = vUv * vec2(${402 + V.CANVAS_PADDING_PX * 2}.0, ${379 + V.CANVAS_PADDING_PX * 2}.0) - vec2(${V.CANVAS_PADDING_PX}.0);
  if (uBackground > 0.5) p = vUv * uSceneSize - vec2(0.0, uCharacterTop);
  vec2 inside = step(vec2(0.0), p) * step(p, vec2(402.0, 379.0));
  float coverage = inside.x * inside.y;
  vec2 sourcePixel = clamp(p, vec2(0.5), vec2(401.5, 378.5));
  vec4 field = texture2D(uMask, sourcePixel / vec2(544.0, 758.0));
  vec4 artwork = texture2D(uMask, (sourcePixel + vec2(0.0, 379.0)) / vec2(544.0, 758.0));
  float mask = field.a * coverage;
  vec2 direction = field.rg * 2.0 - 1.0;
  float contourPhase = atan(direction.y, direction.x) / TAU;
  float behind = fract(uPhase - contourPhase + 1.0);
  float contraction = (1.0 - uReduced) * smoothstep(0.34, 0.86, uMatch);
  float age = clamp(behind / (${V.TRAIL_FRACTION} * (1.0 - contraction * 0.985)), 0.0, 1.0);
  float contourDistance = field.b * 32.0;
  float radius = ${V.TRAIL_WIDTH_PX / 2} * mix(1.0, 0.25, age);
  float life = (1.0 - age) * (1.0 - smoothstep(0.8, 1.0, age));
  float line = exp2(-contourDistance * contourDistance / (radius * radius)) * life;
  float glow = exp2(-contourDistance * contourDistance / ${((V.TRAIL_GLOW_PX / 2) ** 2).toFixed(3)}) * life;
  float trailAlpha = (1.0 - (1.0 - line) * (1.0 - glow * 0.16)) * min(mask * 255.0, 1.0);

  // Use the actual Figma vector/filter export, including both star rays and all
  // three white drop-shadow radii. No approximate bloom or post-processing.
  vec2 lightPixel = p - uHead + vec2(70.8945, 98.1445);
  vec2 lightInside = step(vec2(0.0), lightPixel) * step(lightPixel, vec2(141.793, 195.817));
  vec2 lightUv = (clamp(lightPixel, vec2(0.5), vec2(141.293, 195.317)) + vec2(402.0, 0.0)) / vec2(544.0, 758.0);
  float headAlpha = texture2D(uMask, lightUv).a * lightInside.x * lightInside.y;
  float flash = smoothstep(0.60, 0.72, uMatch) * (1.0 - smoothstep(0.72, 0.90, uMatch)) * (1.0 - uReduced);
  headAlpha = 1.0 - (1.0 - headAlpha) * (1.0 - flash * exp(-dot(p - uHead, p - uHead) / 1200.0));
  float fade = 1.0 - smoothstep(0.76, 1.0, uMatch);
  if (uReduced > 0.5) fade = 1.0 - smoothstep(0.0, 1.0, uMatch);
  float energy = (1.0 - (1.0 - trailAlpha) * (1.0 - headAlpha)) * uSearching;
  energy = min(1.0, energy * (0.98 + 0.05714 * uIntensity));
  float bodyAlpha = mask * ${V.SILHOUETTE_OPACITY.toFixed(1)};
  vec3 premultiplied = mix(artwork.rgb * bodyAlpha, vec3(1.0), energy) * fade;
  float alpha = (energy + bodyAlpha * (1.0 - energy)) * fade;
  if (uBackground > 0.5) {
    vec3 background = lumaBackground(vUv, uSceneSize, uTime);
    gl_FragColor = vec4(premultiplied + background * (1.0 - alpha), 1.0);
  } else gl_FragColor = vec4(premultiplied, alpha);
}`;
