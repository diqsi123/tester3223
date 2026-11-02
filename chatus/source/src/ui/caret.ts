/** Current checked Figma composers: 3949:78834 / 78861 / 78889 / 78273. */
export const CHAT_CARET = { width: 1.6, height: 16 } as const;

export function composerLineMetrics(lineCount: number, reply: boolean) {
  const lines = Math.max(1, Math.min(5, lineCount));
  const measuringLineHeight = reply ? 15 : 19.5;
  const lineHeight = lines === 1 ? 15 : measuringLineHeight;
  return {
    lines,
    lineHeight,
    measuringLineHeight,
    barHeight: Math.max(48, lines > 1 ? lines * lineHeight + (reply ? 18 : 20.5) : 48),
    paddingTop: lines > 1 ? (reply ? 6 : 10) : 17,
    paddingBottom: lines > 1 ? (reply ? 12 : 10.5) : 16,
  };
}

type Point = { left: number; top: number };
type CaretGeometry = {
  caret: Point;
  first: Point;
  mirror: Point;
  zoom: number;
  fieldLeft: number;
  paddingTop: number;
  lineHeight: number;
  measuringLineHeight: number;
  lineCount: number;
  scrollTop: number;
  scrollLeft: number;
};

/** Relative Range boxes cancel the actual font's ascent and the common preview transform. */
export function textareaCaretGeometry(input: CaretGeometry) {
  const line = Math.max(0, Math.round((input.caret.top - input.first.top) /
    (input.zoom * input.measuringLineHeight)));
  // The single-line source caret begins 1px above its 15px text frame.
  const opticalTop = input.lineCount === 1 ? -1 : 0;
  const round = (value: number) => Math.round(value * 1000) / 1000;
  return {
    x: round(input.fieldLeft + (input.caret.left - input.mirror.left) / input.zoom - input.scrollLeft),
    y: round(input.paddingTop + line * input.lineHeight + opticalTop - input.scrollTop),
  };
}
