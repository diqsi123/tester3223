import { HISTORY_PAINT } from './chat-history-layout';
import { useLayoutEffect, useRef } from 'react';
import { localBubbleBox, outgoingFlowOffset, outgoingGradientBounds } from './chat-outgoing-geometry';

const BUBBLE = '.chat-bubble.is-outgoing:not(.is-sticker)';

/** Every bubble clips the same viewport colour field using its native DOM contour.
 * Keeping the paint on its owner avoids a detached full-history SVG layer in WebKit.
 */
export function ChatOutgoingMask({ active }: { active: boolean }) {
  const marker = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const history = marker.current?.parentElement;
    const canvas = history?.closest<HTMLElement>('.dialog-canvas');
    const scroll = history?.closest<HTMLElement>('.mobile-scroll');
    const body = history?.closest<HTMLElement>('.mobile-scroll-content');
    if (!history || !canvas || !scroll || !active) return;
    let frame = 0, disposed = false, membership = true, geometry = true, flow = true;
    let flowOffset = 0, anchor: HTMLElement | null = null;
    const bubbles = new Set<HTMLElement>();
    let rows:Element[]=[];
    const dirty = new Set<HTMLElement>();
    const observed = new Set<HTMLElement>();
    const widths = new Map<Element, number>();
    const set = (node: HTMLElement, key: string, value: string) => {
      if (node.style.getPropertyValue(key) !== value) node.style.setProperty(key, value);
    };
    const schedule = () => {
      if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    };
    const affectFrom=(row:Element)=>{
      for(let node:Element|null=row;node;node=node.nextElementSibling){
        node.querySelectorAll<HTMLElement>(BUBBLE).forEach(bubble=>dirty.add(bubble));
      }
    };
    const resized = new ResizeObserver(entries => {
      for (const entry of entries) {
        const previous = widths.get(entry.target);
        widths.set(entry.target, entry.contentRect.width);
        // Existing rows share the flex translation. The final row uses
        // justify-content:flex-end, so its growing child also needs a local
        // position update; this must not remeasure the entire conversation.
        if (entry.target === history.lastElementChild) {
          const row = entry.target as HTMLElement;
          row.querySelectorAll<HTMLElement>(BUBBLE).forEach(node => dirty.add(node));
        }
        const middleRow = entry.target !== history && entry.target !== canvas && entry.target !== history.lastElementChild;
        if(middleRow)affectFrom(entry.target);
        if(previous!==undefined&&previous!==entry.contentRect.width)geometry=true;
      }
      flow = true; schedule();
    });
    const reconcile = () => {
      anchor = history.querySelector<HTMLElement>(':scope > .dialog-start-marker');
      const nextRows=[...history.children].filter(node=>node!==marker.current);
      if(!rows.every((row,index)=>nextRows[index]===row))geometry=true;
      rows=nextRows;
      const nextBubbles=new Set(history.querySelectorAll<HTMLElement>(BUBBLE));
      for(const bubble of bubbles)if(!nextBubbles.has(bubble)){bubbles.delete(bubble);dirty.delete(bubble);}
      for(const bubble of nextBubbles)if(!bubbles.has(bubble)){bubbles.add(bubble);dirty.add(bubble);}
      const sizes = new Set<HTMLElement>(history.querySelectorAll<HTMLElement>('.chat-message-row'));
      for (const node of history.children) if (node instanceof HTMLElement && node !== marker.current) sizes.add(node);
      for (const node of observed) if (!sizes.has(node)) {
        resized.unobserve(node); observed.delete(node); widths.delete(node);
      }
      for (const node of sizes) if (!observed.has(node)) { resized.observe(node); observed.add(node); }
      membership = false; flow = true;
    };
    function draw() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (disposed || document.hidden) return;
      if (membership) reconcile();
      const origin = history!.getBoundingClientRect(), screen = canvas!.getBoundingClientRect();
      if (!origin.width) return;
      const scale = origin.width / 402;
      if (flow || geometry) {
        flowOffset = anchor ? outgoingFlowOffset(anchor.getBoundingClientRect(), origin, scale) : 0;
        flow = false;
      }
      const bounds = outgoingGradientBounds(screen, origin, canvas!.clientHeight, flowOffset);
      // Finish layout reads before publishing the shared paint coordinates.
      const positions = geometry || dirty.size
        ? [...(geometry ? bubbles : dirty)].map(node => [node, localBubbleBox(node.getBoundingClientRect(), origin, scale, flowOffset).y] as const)
        : [];
      set(history!, '--chat-color-top', bounds.y1+'px');
      set(history!, '--chat-color-span', ((bounds.y2-bounds.y1)*.2788461446762085)+'px');
      for (const [node, y] of positions) set(node, '--chat-bubble-top', y+'px');
      geometry = false; dirty.clear();
    }
    const structure = new MutationObserver(() => { membership = true; schedule(); });
    structure.observe(history, { childList: true, subtree: true });
    // Style changes to a waveform, caret, bubble drag or reaction opacity cannot
    // invalidate the other message positions. Intrinsic layout is ResizeObserver-owned.
    const viewport = new MutationObserver(schedule);
    if (body) viewport.observe(body, { attributes: true, attributeFilter: ['style'] });
    // Footer layout changes synchronously publish HISTORY_PAINT after following
    // the bottom. Observing its style as well would force a second geometry pass.

    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else { geometry = true; schedule(); }
    };
    const paint=(event:Event)=>{
      const row=(event as CustomEvent<HTMLElement|undefined>).detail;
      row?.querySelectorAll<HTMLElement>(BUBBLE).forEach(node=>{if(!bubbles.has(node))membership=true;});
      if(row)affectFrom(row);
      flow=true;draw();
    };
    history.addEventListener(HISTORY_PAINT,paint);
    resized.observe(history); resized.observe(canvas);
    scroll.addEventListener('scroll', draw, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', visibility);
    draw();
    return () => {
      disposed = true; cancelAnimationFrame(frame); resized.disconnect();
      structure.disconnect(); viewport.disconnect();history.removeEventListener(HISTORY_PAINT,paint);
      scroll.removeEventListener('scroll', draw); window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [active]);
  return <span ref={marker} hidden aria-hidden="true" data-chat-color-field="viewport"/>;
}
