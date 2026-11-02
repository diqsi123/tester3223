/** Keep the browser focus font >=16 CSS px after layout zoom, while painting source typography. */
export function nativeTextPlane(sourceSize: number, native: boolean, layoutZoom = 1) {
  const fontSize = native ? Math.max(sourceSize, Math.ceil(16 / Math.min(1, Math.max(.1, layoutZoom)) * 64) / 64) : sourceSize;
  return { fontSize, scale: sourceSize / fontSize };
}
