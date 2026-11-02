export type TiltSample = { time: number; pitch: number; yaw: number };

// Preserve direct tracking near the centre, then progressively resist the edge.
export function softTilt(value: number, limit: number) {
  const free = limit * .65;
  const excess = Math.max(0, Math.abs(value) - free);
  const room = limit - free;
  const resisted = excess * room / (room + excess);
  return Math.sign(value) * (Math.min(Math.abs(value), free) + resisted);
}

export function tiltReleaseVelocity(samples: TiltSample[], releasedAt: number) {
  const last = samples.at(-1);
  if (!last || releasedAt - last.time > 80) return { pitch: 0, yaw: 0 };
  const first = samples.find(sample => last.time - sample.time <= 80);
  if (!first || last.time <= first.time) return { pitch: 0, yaw: 0 };
  const seconds = (last.time - first.time) / 1000;
  const bounded = (value: number) => Math.max(-90, Math.min(90, value));
  return {
    pitch: bounded((last.pitch - first.pitch) / seconds),
    yaw: bounded((last.yaw - first.yaw) / seconds),
  };
}
