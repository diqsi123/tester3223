// Test-only bounded frame trace. No production import.
let traceGeneration = 0;
document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element) || !target.closest('button[aria-label="Отправить сообщение"],button[data-start-scroll-trace],button[aria-label^="Реакция "]')) return;
  const scroll = document.querySelector<HTMLElement>('.dialog-scroll .mobile-scroll');
  const history = document.querySelector<HTMLElement>('.dialog-history');
  const root = document.querySelector<HTMLElement>('.dialog-root');
  if (!scroll || !history || !root) return;
  const last = history.querySelector<HTMLElement>('.chat-message-row:last-child .chat-bubble');
  document.querySelector('pre[data-send-motion-trace]')?.remove();
  document.querySelector('[data-scroll-progress-probe]')?.remove();
  const progress=document.createElement('span');progress.hidden=true;progress.setAttribute('data-scroll-progress-probe','');document.body.append(progress);
  const start = performance.now(), version = ++traceGeneration;
  const frames: unknown[] = [];
  const sample = () => {
    if (version !== traceGeneration) return;
    if(scroll.scrollTop>=100&&!progress.hasAttribute('data-active-scroll'))progress.setAttribute('data-active-scroll','');
    const fresh = history.querySelector<HTMLElement>('.chat-message-row:last-child');
    const bubble = fresh?.querySelector<HTMLElement>('.chat-bubble');
    const style = bubble && getComputedStyle(bubble);
    const rootStyle = getComputedStyle(root);
    const scale=history.getBoundingClientRect().width/402;
    const n = (value: string|undefined) => Number((value || '0').replace('px',''));
    const painted = history.querySelector<HTMLElement>('.chat-bubble.is-outgoing.has-reply');
    const quote = painted?.querySelector<HTMLElement>('.chat-quote');
    const quoteStyle = quote && getComputedStyle(quote);
    const visibleFields=[...history.querySelectorAll<HTMLElement>('.chat-bubble.is-outgoing:not(.is-sticker)')].map(node=>{const rect=node.getBoundingClientRect(),paint=getComputedStyle(node);return{id:node.id,visible:rect.bottom>72*scale&&rect.top<scroll.getBoundingClientRect().bottom,field:rect.top+(n(paint.getPropertyValue('--chat-color-top'))-n(paint.getPropertyValue('--chat-bubble-top')))*scale};}).filter(item=>item.visible);
    frames.push({inputFocused:document.activeElement===document.querySelector('.chat-text-entry'),keyboardVisible:document.querySelector('.keyboard-dock')?.getAttribute('data-visible'),nativeInset:rootStyle.getPropertyValue('--dialog-keyboard-inset'),visibleFields,scale,expectedField:(document.querySelector('.dialog-canvas')?.getBoundingClientRect().top||0)-15*scale,anchor:document.getElementById('chat-outgoing-4')?.getBoundingClientRect().top,
      quoteField:quote&&quoteStyle?quote.getBoundingClientRect().top+(n(quoteStyle.getPropertyValue('--chat-color-top'))-n(quoteStyle.getPropertyValue('--chat-bubble-top'))-9)*scale:null,
      quoteBg:quote?.querySelector('.chat-quote-material')?getComputedStyle(quote.querySelector('.chat-quote-material')!).backgroundImage:null,
      t:performance.now()-start,scroll:scroll.scrollTop,max:scroll.scrollHeight-scroll.clientHeight,
      oldTop:last?.getBoundingClientRect().top,row:fresh?.getBoundingClientRect().height,bubble:bubble?.getBoundingClientRect().height,
      rowInline:fresh?.style.height,padding:style?.paddingBottom,body:window.scrollY,
      field:bubble&&style?bubble.getBoundingClientRect().top+(n(style.getPropertyValue('--chat-color-top'))-n(style.getPropertyValue('--chat-bubble-top')))*scale:null,
      footer:document.querySelector('.chat-input-surface')?.getBoundingClientRect().top,footerBottom:document.querySelector('.chat-input-surface')?.getBoundingClientRect().bottom,
      composer:n(rootStyle.getPropertyValue('--chat-composer-height'))});
    if (performance.now()-start < 1400) requestAnimationFrame(sample);
    else {
      let output = document.querySelector('pre[data-send-motion-trace]');
      if (!output) { output=document.createElement('pre');output.setAttribute('data-send-motion-trace','');output.setAttribute('hidden','');document.body.append(output); }
      output.textContent=JSON.stringify(frames);
    }
  };
  sample();
}, {capture:true});
