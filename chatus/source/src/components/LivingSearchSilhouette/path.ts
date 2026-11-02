import { CONTOUR_PATH } from "./contour-data";

const RESOLUTION = 1024;
/** Constant-speed path extracted from the PNG outer alpha boundary. */
export function createSearchPath() {
  return new Float32Array(CONTOUR_PATH);
}

export function samplePath(path: Float32Array, phase: number, out: Float32Array, offset: number) {
  const index = ((phase % 1 + 1) % 1) * RESOLUTION;
  const i = Math.floor(index), t = index - i;
  out[offset] = path[i * 2] * (1 - t) + path[(i + 1) * 2] * t;
  out[offset + 1] = path[i * 2 + 1] * (1 - t) + path[(i + 1) * 2 + 1] * t;
}

