/** Prefer physical pixels; WebKit can reject this box even when WebGPU is available. */
export function observeCanvasResize(observer: Pick<ResizeObserver, 'observe'>, canvas: HTMLCanvasElement) {
  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' })
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    observer.observe(canvas, { box: 'content-box' })
  }
}

/** Keep the source canvas sizing, including its CSS-pixel/DPR fallback. */
export function canvasPixelSize(
  entry: Pick<ResizeObserverEntry, 'devicePixelContentBoxSize' | 'contentBoxSize'>,
  dpr: number,
): { width: number; height: number } | null {
  const physical = entry.devicePixelContentBoxSize?.[0]
  if (physical) {
    return { width: Math.max(physical.inlineSize, 1), height: Math.max(physical.blockSize, 1) }
  }
  const content = entry.contentBoxSize?.[0]
  if (content) {
    return {
      width: Math.max(Math.round(content.inlineSize * dpr), 1),
      height: Math.max(Math.round(content.blockSize * dpr), 1),
    }
  }
  return null
}
