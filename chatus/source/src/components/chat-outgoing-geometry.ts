export type BubbleRadii = [number, number, number, number];
export type BubbleBox = { x: number; y: number; width: number; height: number };
type Rect = { left: number; top: number; width: number; height: number };

export const maskCoordinate = (value: number) => Math.round(value * 100) / 100;

/** Normalise the common preview zoom without baking scroll/rubber-band into a contour. */
export function localBubbleBox(rect: Rect, origin: Rect, scale: number, flowOffset = 0): BubbleBox {
  return {
    x: maskCoordinate((rect.left - origin.left) / scale),
    y: maskCoordinate((rect.top - origin.top) / scale - flowOffset),
    width: maskCoordinate(rect.width / scale),
    height: maskCoordinate(rect.height / scale),
  };
}

/** A stable untransformed flow row tracks flex-end alignment without measuring each message. */
export function outgoingFlowOffset(anchor: Pick<Rect, 'top'>, origin: Pick<Rect, 'top'>, scale: number) {
  return maskCoordinate((anchor.top - origin.top) / scale);
}

/** Preserve the source's independent 18px corners and the final 4px group tail. */
export function outgoingContour({ x, y, width: w, height: h }: BubbleBox, radii: BubbleRadii): string {
  const [a, b, c, d] = radii.map(radius => Math.min(radius, w / 2, h / 2));
  return `M${x+a},${y}H${x+w-b}Q${x+w},${y} ${x+w},${y+b}V${y+h-c}Q${x+w},${y+h} ${x+w-c},${y+h}H${x+d}Q${x},${y+h} ${x},${y+h-d}V${y+a}Q${x},${y} ${x+a},${y}Z`;
}

/** One colour field stays fixed to the viewport as the cached contours scroll together. */
export function outgoingGradientBounds(screen: Rect, origin: Rect, canvasHeight: number, flowOffset = 0) {
  const scale = origin.width / 402;
  const y1 = maskCoordinate((screen.top - origin.top) / scale - 15 - flowOffset);
  return { y1, y2: y1 + canvasHeight + 31, scale };
}
