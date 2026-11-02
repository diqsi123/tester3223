/** Source4055:116033:48px bar,15px lines,33px vertical text inset. */
export function captionHeightFromMeasure(height:number,textScale:number) {
  const lines=Math.max(1,Math.round(height/(15/textScale)));
  return Math.min(132,33+lines*15);
}
export type AttachmentExample='media-preview'|'media-once'|'caption-focus'|'caption-text';
