import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canvasPixelSize, observeCanvasResize } from '../src/isolated-onboarding/lib/custom-effect-runtime/canvasResize.ts';

const canvas = { tagName: 'CANVAS' };

test('supported physical-pixel observation stays preferred', () => {
  const calls = [];
  const observer = { observe(target, options) { calls.push({ target, box: options.box }); } };
  observeCanvasResize(observer, canvas);
  assert.deepEqual(calls, [{ target: canvas, box: 'device-pixel-content-box' }]);
});

test('a rejected physical-pixel enum falls back and permits mounting to continue', () => {
  const calls = [];
  const observer = { observe(target, options) {
    calls.push({ target, box: options.box });
    if (options.box === 'device-pixel-content-box') throw new TypeError('Unsupported ResizeObserverBoxOptions value');
  } };
  assert.doesNotThrow(() => observeCanvasResize(observer, canvas));
  assert.deepEqual(calls, [
    { target: canvas, box: 'device-pixel-content-box' },
    { target: canvas, box: 'content-box' },
  ]);
});

test('physical sizes take precedence without applying DPR twice', () => {
  assert.deepEqual(canvasPixelSize({
    devicePixelContentBoxSize: [{ inlineSize: 168, blockSize: 72 }],
    contentBoxSize: [{ inlineSize: 56, blockSize: 24 }],
  }, 3), { width: 168, height: 72 });
});

test('content-box fallback rounds CSS pixels at DPR and keeps at least one pixel', () => {
  assert.deepEqual(canvasPixelSize({ contentBoxSize: [{ inlineSize: 55.5, blockSize: 24.25 }] }, 3), { width: 167, height: 73 });
  assert.deepEqual(canvasPixelSize({ contentBoxSize: [{ inlineSize: 0, blockSize: 0 }] }, 2), { width: 1, height: 1 });
  assert.equal(canvasPixelSize({}, 3), null);
});

test('unrelated first-observation failures are propagated without a fallback attempt', () => {
  const failure = new Error('Observer unavailable');
  let calls = 0;
  const observer = { observe() { calls++; throw failure; } };
  assert.throws(() => observeCanvasResize(observer, canvas), error => error === failure);
  assert.equal(calls, 1);
});

test('a genuine fallback failure is not swallowed', () => {
  const failure = new TypeError('Target is not an Element');
  const observer = { observe(_target, options) {
    if (options.box === 'device-pixel-content-box') throw new TypeError('Unsupported enum');
    throw failure;
  } };
  assert.throws(() => observeCanvasResize(observer, canvas), error => error === failure);
});
