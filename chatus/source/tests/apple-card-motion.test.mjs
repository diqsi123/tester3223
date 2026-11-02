import { test } from 'node:test';
import assert from 'node:assert/strict';
import { softTilt, tiltReleaseVelocity } from '../src/isolated-onboarding/apple-card-motion.ts';

test('tilt tracks directly near centre, resists progressively, and stays bounded', () => {
  assert.equal(softTilt(4, 16), 4);
  let previous = 0;
  for (let value = 0; value <= 1000; value++) {
    const next = softTilt(value, 16);
    assert.ok(next >= previous && next < 16);
    assert.equal(softTilt(-value, 16), -next);
    previous = next;
  }
  assert.ok(softTilt(13, 16) - softTilt(12, 16) > softTilt(23, 16) - softTilt(22, 16));
});

test('release carries signed recent angular velocity with a safe upper bound', () => {
  assert.deepEqual(tiltReleaseVelocity([
    { time: 0, pitch: 10, yaw: -10 },
    { time: 50, pitch: 8, yaw: -7 },
  ], 60), { pitch: -40, yaw: 60 });
  assert.deepEqual(tiltReleaseVelocity([
    { time: 0, pitch: 0, yaw: 0 },
    { time: 1, pitch: 10, yaw: -10 },
  ], 1), { pitch: 90, yaw: -90 });
});

test('holding still before release and incomplete histories add no stale momentum', () => {
  assert.deepEqual(tiltReleaseVelocity([{ time: 0, pitch: 0, yaw: 0 }, { time: 40, pitch: 3, yaw: 4 }], 200), { pitch: 0, yaw: 0 });
  assert.deepEqual(tiltReleaseVelocity([], 0), { pitch: 0, yaw: 0 });
  assert.deepEqual(tiltReleaseVelocity([{ time: 0, pitch: 3, yaw: 4 }], 0), { pitch: 0, yaw: 0 });
});
