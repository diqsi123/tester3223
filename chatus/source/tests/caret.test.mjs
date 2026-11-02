import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAT_CARET, composerLineMetrics, textareaCaretGeometry } from '../src/ui/caret.ts';

const geometry = (overrides = {}) => textareaCaretGeometry({
  caret: { left: 50, top: 101 }, first: { left: 50, top: 101 },
  mirror: { left: 50, top: 100 }, zoom: 1, fieldLeft: 14,
  paddingTop: 17, lineHeight: 15, measuringLineHeight: 19.5,
  lineCount: 1, scrollTop: 0, scrollLeft: 0, ...overrides,
});

test('empty and one-line source use the same slot and 1.6 by 16 caret', () => {
  assert.deepEqual(CHAT_CARET, { width: 1.6, height: 16 });
  assert.equal(composerLineMetrics(1, false).lineHeight, 15);
  assert.deepEqual(geometry(), { x: 14, y: 16 });
  assert.deepEqual(geometry({ caret: { left: 147.3984375, top: 101 } }), { x: 111.398, y: 16 });
});

test('three-line source keeps 79px bar and aligns the caret to its actual third line', () => {
  const metrics = composerLineMetrics(3, false);
  assert.equal(metrics.barHeight, 79);
  assert.equal(metrics.paddingTop, 10);
  assert.deepEqual(geometry({ ...metrics, lineCount: 3, caret: { left: 213, top: 140 } }),
    { x: 177, y: 49 });
});

test('reply second line matches source y73 inside the write bar after its 52px quote slot', () => {
  const metrics = composerLineMetrics(2, true);
  assert.equal(metrics.barHeight, 48);
  const caret = geometry({ ...metrics, lineCount: 2, caret: { left: 181, top: 116 } });
  assert.deepEqual(caret, { x: 145, y: 21 });
  assert.equal(52 + caret.y, 73);
});

test('font ascent changes and common zoom do not move a caret within its line box', () => {
  const metrics = composerLineMetrics(3, false);
  for (const zoom of [.75, .985, 1.25, 2]) {
    assert.deepEqual(geometry({ ...metrics, lineCount: 3, zoom,
      mirror: { left: 50 * zoom, top: 100 * zoom },
      first: { left: 50 * zoom, top: 105 * zoom },
      caret: { left: 150 * zoom, top: 144 * zoom } }), { x: 114, y: 49 });
  }
});

test('a long textarea caps visible height but retains internal selection scroll geometry', () => {
  assert.equal(composerLineMetrics(9, false).barHeight, 118);
  assert.deepEqual(geometry({ lineCount: 9, lineHeight: 19.5, paddingTop: 10,
    caret: { left: 80, top: 257 }, scrollTop: 78, scrollLeft: 4 }), { x: 40, y: 88 });
});
