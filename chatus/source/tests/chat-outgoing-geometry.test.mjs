import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localBubbleBox, outgoingContour, outgoingFlowOffset, outgoingGradientBounds } from '../src/components/chat-outgoing-geometry.ts';

const radii = [18, 18, 4, 18];
const origin = { left: 24, top: -120, width: 402, height: 1400 };
const bubble = { left: 120, top: 380, width: 290, height: 70 };

test('scroll and common rubber-band translation leave the cached contour unchanged', () => {
  const expected = { x: 96, y: 500, width: 290, height: 70 };
  assert.deepEqual(localBubbleBox(bubble, origin, 1), expected);
  const translate = (rect, delta) => ({ ...rect, top: rect.top + delta });
  for (const delta of [-500, 18.125, 1000]) {
    assert.deepEqual(localBubbleBox(translate(bubble, delta), translate(origin, delta), 1), expected);
  }
});

test('preview zoom normalises back to the same source coordinates', () => {
  for (const scale of [.75, .985, 1.25, 2]) {
    const zoom = rect => Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, value * scale]));
    assert.deepEqual(localBubbleBox(zoom(bubble), zoom(origin), scale),
      { x: 96, y: 500, width: 290, height: 70 });
  }
});

test('the viewport field moves by the inverse content scroll and keeps its exact extent', () => {
  const screen = { left: 24, top: 0, width: 402, height: 874 };
  assert.deepEqual(outgoingGradientBounds(screen, origin, 874), { y1: 105, y2: 1010, scale: 1 });
  assert.deepEqual(outgoingGradientBounds(screen, { ...origin, top: -420 }, 874),
    { y1: 405, y2: 1310, scale: 1 });
  assert.deepEqual(outgoingGradientBounds(screen, { ...origin, top: -100 }, 874),
    { y1: 85, y2: 990, scale: 1 });
});

test('ordinary and group-tail corners retain independent source radii', () => {
  const box = { x: 80, y: 100, width: 290, height: 70 };
  const tail = outgoingContour(box, radii);
  assert.match(tail, /^M98,100H352/);
  assert.match(tail, /V166Q370,170 366,170/);
  const middle = outgoingContour(box, [18, 18, 18, 18]);
  assert.match(middle, /V152Q370,170 352,170/);
  assert.notEqual(tail, middle);
});

test('radii remain inside small or temporarily growing message geometry', () => {
  assert.equal(outgoingContour({ x: 0, y: 0, width: 20, height: 10 }, radii),
    'M5,0H15Q20,0 20,5V6Q20,10 16,10H5Q0,10 0,5V5Q0,0 5,0Z');
  assert.deepEqual(localBubbleBox({ left: 24.1234, top: -119.8766, width: 123.4567, height: 35.996 }, origin, 1),
    { x: .12, y: .12, width: 123.46, height: 36 });
});


test('footer padding translates short-history contours as one group while preserving viewport colour', () => {
  const screen = {left:24,top:0,width:402,height:874};
  for (const scale of [.75, .985, 1, 1.25]) {
    const scaled = rect => Object.fromEntries(Object.entries(rect).map(([key,value])=>[key,value*scale]));
    const baseline = localBubbleBox(scaled(bubble),scaled(origin),scale,420);
    for (const delta of [-330,-12.25,0,118.5,330]) {
      const anchor = {top:(origin.top+420+delta)*scale};
      const flow = outgoingFlowOffset(anchor,scaled(origin),scale);
      assert.equal(flow,420+delta);
      const moved = {...bubble,top:bubble.top+delta};
      const cached = localBubbleBox(scaled(moved),scaled(origin),scale,flow);
      assert.deepEqual(cached,baseline);
      const gradient = outgoingGradientBounds(scaled(screen),scaled(origin),874,flow);
      const viewportGradient = outgoingGradientBounds(scaled(screen),scaled(origin),874);
      assert.ok(Math.abs(gradient.y1+flow-viewportGradient.y1)<.00001);
      assert.ok(Math.abs(gradient.y2+flow-viewportGradient.y2)<.00001);
    }
  }
});

test('a resized bubble remains dirty independently of the common flow translation and tail radius', () => {
  const before = localBubbleBox(bubble,origin,1,420);
  const after = localBubbleBox({...bubble,top:bubble.top+110,height:110},origin,1,530);
  assert.deepEqual(after,{...before,height:110});
  assert.notEqual(outgoingContour(before,radii),outgoingContour(after,radii));
  assert.notEqual(outgoingContour(after,radii),outgoingContour(after,[18,18,18,18]));
});
