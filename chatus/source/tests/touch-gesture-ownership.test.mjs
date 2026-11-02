import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { softTilt, tiltReleaseVelocity } from '../src/isolated-onboarding/apple-card-motion.ts';
import { UI_MOTION } from '../src/ui/motion.ts';

// Execute the production event closures with controlled MotionValues/springs.
// No browser layout or copied gesture implementation is involved in these tests.
function cardHarness() {
  const source = readFileSync(new URL('../src/ui/useCardTilt.ts', import.meta.url), 'utf8');
  const code = stripTypeScriptTypes(source.replace(/^import[^\n]+\n/gm, '')).replace('export function', 'function');
  const animations = [];
  const bindings = {
    useEffect: () => {}, useRef: current => ({ current }), useState: initial => [initial, () => {}],
    useReducedMotion: () => false, useTransform: get => ({ get }),
    useMotionValue: initial => { let value = initial; return { get: () => value, set: next => { value = next; } }; },
    animate: (value, target, options) => {
      const control = { value, target, options, stopped: false, stop() { this.stopped = true; } };
      animations.push(control); return control;
    }, softTilt, tiltReleaseVelocity, UI_MOTION,
  };
  const hook = new Function(...Object.keys(bindings), code + '\nreturn useCardTilt();')(...Object.values(bindings));
  const captures = new Set();
  const target = { setPointerCapture: id => captures.add(id), getBoundingClientRect: () => ({ width: 362, height: 330 }) };
  const event = (type, id, x, y, pointerType = 'touch') => ({ type, pointerId: id, clientX: x, clientY: y, pointerType, button: 0,
    isPrimary: true, target: { closest: () => null }, currentTarget: target, preventDefault() {}, stopPropagation() {} });
  const beginReturn = () => {
    hook.handlers.onPointerDown(event('pointerdown', 1, 0, 0, 'mouse'));
    hook.handlers.onPointerMove(event('pointermove', 1, 40, 20, 'mouse'));
    hook.handlers.onPointerUp(event('pointerup', 1, 40, 20, 'mouse'));
    hook.style.rotateX.set(-1); hook.style.rotateY.set(2);
    return animations.slice(-2);
  };
  return { hook, animations, captures, event, beginReturn };
}

test('a vertical touch while the card returns never stops or restarts the return spring', () => {
  const h = cardHarness(), returning = h.beginReturn();
  h.hook.handlers.onPointerDown(h.event('pointerdown', 2, 10, 10));
  assert.ok(returning.every(control => !control.stopped));
  h.hook.handlers.onPointerMove(h.event('pointermove', 2, 11, 32));
  h.hook.handlers.onPointerCancel(h.event('pointercancel', 2, 11, 32));
  assert.ok(returning.every(control => !control.stopped));
  assert.equal(h.animations.length, 2);
  assert.equal(h.captures.has(2), false);
});

test('a pending touch can tap/cancel without disturbing the running spring', () => {
  const h = cardHarness(), returning = h.beginReturn();
  h.hook.handlers.onPointerDown(h.event('pointerdown', 2, 10, 10));
  h.hook.handlers.onPointerUp(h.event('pointerup', 2, 10, 10));
  assert.ok(returning.every(control => !control.stopped));
  assert.equal(h.animations.length, 2);
});

test('horizontal ownership grabs the live angle without a jump after the return advanced', () => {
  const h = cardHarness(), returning = h.beginReturn();
  h.hook.handlers.onPointerDown(h.event('pointerdown', 2, 10, 10));
  h.hook.style.rotateX.set(-.5); h.hook.style.rotateY.set(1);
  h.hook.handlers.onPointerMove(h.event('pointermove', 2, 28, 11));
  assert.ok(returning.every(control => control.stopped));
  assert.equal(h.hook.style.rotateX.get(), -.5);
  assert.equal(h.hook.style.rotateY.get(), 1);
  assert.equal(h.captures.has(2), true);
  h.hook.handlers.onPointerMove(h.event('pointermove', 2, 44, 11));
  assert.ok(h.hook.style.rotateY.get() > 1);
  h.hook.handlers.onPointerUp(h.event('pointerup', 3, 44, 11));
  assert.equal(h.animations.length, 2, 'another pointer cannot release the held card');
  h.hook.handlers.onPointerUp(h.event('pointerup', 2, 44, 11));
  assert.equal(h.animations.length, 4);
});

function bubbleFinishHarness() {
  const source = readFileSync(new URL('../src/components/ChatConversation.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('  const finish = ', source.indexOf('export const ChatBubble'));
  const end = source.indexOf('  const voice = ', start);
  assert.ok(start > 0 && end > start);
  const code = stripTypeScriptTypes(source.slice(start, end));
  const drag = { current: { id: 4, claimed: true, distance: 60, velocity: 180 } };
  const calls = { holdsStopped: 0, springs: [], replies: 0 };
  const bindings = { drag, stopHold: () => { calls.holdsStopped++; }, settle: { current: null }, reduced: false,
    x: { set() {} }, animate: (_value, _target, options) => { calls.springs.push(options); return { stop() {} }; },
    UI_MOTION, menuOpened: { current: false }, onReply: () => { calls.replies++; }, message: {} };
  const finish = new Function(...Object.keys(bindings), code + '\nreturn finish;')(...Object.values(bindings));
  const event = (type, pointerId) => ({ type, pointerId, currentTarget: { hasPointerCapture: () => false }, preventDefault() {}, stopPropagation() {} });
  return { finish, drag, calls, event };
}

test('another finger cannot end the active reply swipe or its long-press timer', () => {
  const h = bubbleFinishHarness();
  h.finish(h.event('pointerup', 5));
  assert.equal(h.drag.current.id, 4);
  assert.equal(h.calls.holdsStopped, 0);
  assert.equal(h.calls.springs.length, 0);
  assert.equal(h.calls.replies, 0);
});

test('browser cancellation returns the reply swipe without momentum or a reply', () => {
  const h = bubbleFinishHarness();
  h.finish(h.event('pointercancel', 4));
  assert.equal(h.drag.current, null);
  assert.equal(h.calls.springs[0].velocity, 0);
  assert.equal(h.calls.replies, 0);
});

test('an ordinary owned pointer-up still commits the reply swipe', () => {
  const h = bubbleFinishHarness();
  h.finish(h.event('pointerup', 4));
  assert.equal(h.calls.springs[0].velocity, 180);
  assert.equal(h.calls.replies, 1);
});
