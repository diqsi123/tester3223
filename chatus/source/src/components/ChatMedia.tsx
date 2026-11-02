import {MediaDurationBadge} from './MediaDurationBadge';
import { useEffect, useImperativeHandle, useLayoutEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Carousel, KeyboardTextarea, useKeyboard } from '../mobile';
import { STILL, UI_MOTION } from '../ui/motion';
import { getPressProps } from '../ui/press';
import {captionHeightFromMeasure,type AttachmentExample} from './caption-geometry';
import { nativeTextPlane } from '../ui/native-text-plane';
import { useChatusViewportLayout } from './ChatusViewport';
import type { ChatMediaItem } from './ChatConversation';
import './chat-media.css';

const A = '/assets/chat/mobile/';
const M = '/assets/chat-media/';

function trapFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return;
  const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,input:not([type="hidden"])'))
    .filter(node => !node.closest('[inert],[aria-hidden="true"]'));
  if (!nodes.length) return;
  const index = nodes.indexOf(document.activeElement as HTMLElement);
  event.preventDefault();
  nodes[(index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length]?.focus({ preventScroll: true });
}

export type ChatAttachmentsHandle = { openSource: () => void };

export function ChatAttachments({ open, height, keyboardInset, onOpen, onClose, onSend, onNotice, onBusyChange, ref, example }: {
  example?:AttachmentExample;
  ref?: Ref<ChatAttachmentsHandle>; onOpen?: () => void;
  open: boolean; height: number; keyboardInset: number; onClose: () => void;
  onSend: (items: ChatMediaItem[], caption: string, once: boolean) => void;
  onNotice: (text: string) => void; onBusyChange: (busy: boolean) => void;
}) {
  const library = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null), files = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>()), root = useRef<HTMLDivElement>(null), previewRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ChatMediaItem[]>(()=>example?[{url:'/assets/peer/photo-0.jpg',type:'image',name:'Тестовое фото'}]:[]), [selected, setSelected] = useState(0);
  const [caption, setCaption] = useState(example==='caption-text'?'Я кстати, гей!':''), [once, setOnce] = useState(example==='media-once'), [previewOpen, setPreviewOpen] = useState(Boolean(example));
  const [hint, setHint] = useState(example==='media-once'), [captionFocused, setCaptionFocused] = useState(false);
  const [captionHeight, setCaptionHeight] = useState(48);
  const closing = useRef<'discard' | 'sent' | null>(null), restoreFrame = useRef(0);
  const launcher = useRef<HTMLButtonElement | null>(null);
  const captionMeasure=useRef<HTMLDivElement>(null), measureCaption=useRef<()=>void>(()=>{}), maskId=useId();
  const keyboard = useKeyboard(), reduced = useReducedMotion();
  const { native, zoom: layoutZoom, keyboardVisible: nativeKeyboardVisible } = useChatusViewportLayout();
  const { fontSize: textFontSize, scale: textScale } = nativeTextPlane(15, native, layoutZoom);
  const press = getPressProps(reduced), transition = reduced ? STILL : UI_MOTION.surface;
  const current = items[selected], keyboardVisible = native ? nativeKeyboardVisible : keyboardInset > 1;

  useImperativeHandle(ref, () => ({ openSource: () => {
    launcher.current = library.current?.closest('.dialog-canvas')?.querySelector<HTMLButtonElement>('.chat-camera') ?? null;
    keyboard.hide();
    if (native) {
      // Keep the file chooser in this camera click's user activation. Safari owns the source menu.
      onClose(); library.current?.click();
    } else onOpen?.();
  } }), [native, keyboard, onOpen, onClose]);

  useEffect(() => { onBusyChange(open || items.length > 0); }, [open, items.length, onBusyChange]);
  measureCaption.current=()=>{
    const measure=captionMeasure.current;if(!measure)return;
    const next=captionHeightFromMeasure(measure.offsetHeight,textScale);
    setCaptionHeight(previous=>previous===next?previous:next);
  };
  useLayoutEffect(()=>{if(previewOpen)measureCaption.current();},[caption,textScale,previewOpen]);
  useLayoutEffect(() => {
    const measure=captionMeasure.current;if(!measure||!previewOpen)return;
    const update=()=>measureCaption.current();
    const observer=new ResizeObserver(update);observer.observe(measure);
    document.fonts.addEventListener('loadingdone',update);
    return()=>{observer.disconnect();document.fonts.removeEventListener('loadingdone',update);};
  }, [previewOpen]);
  useEffect(() => {
    if (previewOpen) previewRef.current?.querySelector<HTMLElement>(example?.startsWith('caption-')?'textarea':'button')?.focus({ preventScroll: true });
  }, [previewOpen,example]);
  useEffect(() => {
    if (open && !items.length) {
      launcher.current = root.current?.closest('.dialog-canvas')?.querySelector<HTMLButtonElement>('.chat-camera') ?? null;
      root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    }
  }, [open, items.length]);
  // Sent URLs belong to this conversation; cancelling revokes only the unsent selection.
  useEffect(() => () => { cancelAnimationFrame(restoreFrame.current); for (const url of urls.current) URL.revokeObjectURL(url); urls.current.clear(); }, []);
  useEffect(() => {
    if (!hint) return;
    const timer = window.setTimeout(() => setHint(false), 2600);
    return () => window.clearTimeout(timer);
  }, [hint]);

  const finishExit = () => {
    if (!closing.current) return;
    if (closing.current === 'discard') for (const item of items) {
      URL.revokeObjectURL(item.url); urls.current.delete(item.url);
    }
    closing.current = null;
    setItems([]); setSelected(0); setCaption(''); setCaptionHeight(48); setOnce(false); setCaptionFocused(false);
    restoreFrame.current = requestAnimationFrame(() => launcher.current?.focus({ preventScroll: true }));
  };
  const closePreview = (reason: 'discard' | 'sent') => {
    if (closing.current) return;
    keyboard.hide(); setHint(false); setCaptionFocused(false);
    closing.current = reason; setPreviewOpen(false); onClose();
  };
  const pick = (ref: typeof library) => { keyboard.hide(); onClose(); ref.current?.click(); };
  const chosen = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.from(event.target.files ?? []); event.target.value = '';
    if (!chosenFiles.length) return;
    const media = chosenFiles.filter(file => /^(image|video)\//.test(file.type));
    if (media.length !== chosenFiles.length) onNotice('Можно выбрать фото или видео');
    const added = media.map(file => {
      const url = URL.createObjectURL(file); urls.current.add(url);
      return { url, type: file.type.startsWith('video/') ? 'video' as const : 'image' as const, name: file.name };
    });
    if (added.length) {
      closing.current = null;
      setSelected(items.length); setItems(value => [...value, ...added]); setPreviewOpen(true);
    }
  };
  const send = () => {
    if (!items.length || closing.current) return;
    onSend(items, caption.trim(), once); closePreview('sent');
  };
  const toggleOnce = () => { setOnce(value => !value); setHint(!once); };

  return <>
    <input ref={library} type="file" accept="image/*,video/*" multiple hidden onChange={chosen}/>
    <input ref={camera} type="file" accept="image/*,video/*" capture="environment" hidden onChange={chosen}/>
    <input ref={files} type="file" accept="image/*,video/*" multiple hidden onChange={chosen}/>
    <AnimatePresence>
      {open && !current && <motion.div key="attachment-menu" ref={root} className="chat-attachment-layer"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduced ? STILL : UI_MOTION.fade}
        onKeyDown={event => { if (event.key === 'Escape') onClose(); else trapFocus(event); }}>
        <button className="chat-attachment-dismiss" aria-label="Закрыть выбор вложения" onClick={onClose}/>
        <motion.div role="menu" aria-label="Источник вложения" className="chat-attachment-menu"
          style={{ bottom: Math.max(190, keyboardInset + 76), transformOrigin: '24px bottom' }}
          initial={{ y: reduced ? 0 : 6, scale: reduced ? 1 : .98 }} animate={{ y: 0, scale: 1 }}
          exit={{ y: reduced ? 0 : 6, scale: reduced ? 1 : .98 }} transition={transition}>
          <motion.button {...press} role="menuitem" onClick={() => pick(library)}><span><img src={A + 'attachment-library.svg'} alt=""/></span>Медиатека</motion.button>
          <motion.button {...press} role="menuitem" onClick={() => pick(camera)}><span><img src={A + 'attachment-camera.svg'} alt=""/></span>Снять фото или видео</motion.button>
          <motion.button {...press} role="menuitem" onClick={() => pick(files)}><span><img src={A + 'attachment-files.svg'} alt=""/></span>Выбрать файлы</motion.button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
    <AnimatePresence onExitComplete={finishExit}>
      {previewOpen && current && <motion.div key="media-editor" ref={previewRef} className="chat-media-preview"
        role="dialog" aria-modal="true" aria-label="Предпросмотр вложения" data-caption-focused={captionFocused}
        style={{ '--media-height': `${height}px`, '--media-inset': `${keyboardInset}px` } as CSSProperties}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduced ? STILL : UI_MOTION.fade}
        onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closePreview('discard'); } else trapFocus(event); }}>
        <div className="chat-media-preview-wash" aria-hidden="true"/>
        <div className="chat-media-preview-picture">
          {current.type === 'video' ? <video key={current.url} src={current.url} controls playsInline preload="metadata"/> : <img key={current.url} src={current.url} alt={current.name} draggable={false}/>}
          <div className="chat-media-preview-actions">
            <motion.button {...press} aria-label="Отменить вложение" onPointerDown={event => event.preventDefault()} onClick={() => closePreview('discard')}><img src={A + 'media-close.svg'} alt=""/></motion.button>
            <motion.button {...press} aria-label="Разовый просмотр" aria-pressed={once} aria-describedby={hint ? 'chat-media-once-hint' : undefined}
              onPointerDown={event => event.preventDefault()} onClick={toggleOnce}>
              <span className="chat-media-once-symbol" aria-hidden="true">
                <motion.img src={A + 'media-once.svg'} alt="" initial={false} animate={{ opacity: once ? 0 : 1 }} transition={reduced ? STILL : UI_MOTION.fade}/>
                <motion.img className="is-filled" src={M + 'once-filled.svg'} alt="" initial={false} animate={{ opacity: once ? 1 : 0 }} transition={reduced ? STILL : UI_MOTION.fade}/>
              </span>
            </motion.button>
          </div>
          <AnimatePresence>{hint && <motion.div id="chat-media-once-hint" role="tooltip" className="chat-media-once-hint"
            initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 4 }} transition={transition}>
            <span>Исчезнет после просмотра</span><img src={M + 'tooltip-nose.svg'} alt=""/>
          </motion.div>}</AnimatePresence>
        </div>
        <motion.div className="chat-media-filmstrip" inert={keyboardVisible} aria-hidden={keyboardVisible}
          initial={false} animate={{ opacity: keyboardVisible ? 0 : 1 }} transition={reduced ? STILL : UI_MOTION.fade}>
          <Carousel ariaLabel="Выбранные вложения" className="chat-media-filmstrip-scroll" contentClassName="chat-media-filmstrip-track">
            {items.map((item, index) => <motion.button {...press} key={item.url} aria-label={'Вложение ' + (index + 1)} aria-pressed={index === selected}
              onClick={() => { setSelected(index); setHint(false); }}>
              {item.type === 'video' ? <video src={item.url} muted playsInline preload="metadata"/> : <img src={item.url} alt="" draggable={false}/>}
            </motion.button>)}
            <motion.button {...press} aria-label="Добавить ещё медиа" onClick={() => pick(library)}><span><img src={A + 'media-more.svg'} alt=""/>Ещё</span></motion.button>
          </Carousel>
        </motion.div>
        <div className="chat-media-caption">
          <svg className="chat-media-caption-mask" width="402" height="433" viewBox="0 0 402 433" aria-hidden="true">
            <defs><filter id={maskId} x="-64" y="-64" width="530" height="561" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="16"/></filter></defs>
            <ellipse cx="200.5" cy="216.5" rx="846.5" ry="184.5" fill="#F4F4F4" filter={'url(#'+maskId+')'}/>
          </svg>
          <div ref={captionMeasure} className="chat-media-caption-measure" aria-hidden="true" style={{fontSize:textFontSize,width:280/textScale,lineHeight:(15/textScale)+'px',letterSpacing:-.3/textScale}}>{caption+'\u200b'}</div>
          <div className="chat-media-caption-field" style={{ height: captionHeight }}>
            <KeyboardTextarea aria-label="Подпись к вложению" placeholder="Добавь подпись..." value={caption} rows={1} autoComplete="off" inputMode="text" autoCorrect="on" autoCapitalize="sentences" spellCheck={true}
              style={{ fontSize: textFontSize, lineHeight: `${15 / textScale}px`, letterSpacing: -.3 / textScale, width: 308 / textScale,
                minHeight: 48 / textScale, height: captionHeight / textScale, maxHeight: 132 / textScale, padding: `${16 / textScale}px ${14 / textScale}px ${17 / textScale}px`,
                borderRadius: 24 / textScale, transform: `scale(${textScale})`, transformOrigin: '0 0' }}
              onFocus={() => { setCaptionFocused(true); setHint(false); }} onBlur={() => { setCaptionFocused(false); keyboard.hide(); }}
              onChange={event => { setCaption(event.target.value); }}
              onKeyDown={event => { if (!native && event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}/>
          </div>
          <motion.button {...press} className="chat-media-send-vector" aria-label="Отправить вложение" onPointerDown={event => event.preventDefault()} onClick={send}><img src="/assets/chat/send-vector-a0a31a2ac9.svg" alt=""/></motion.button>
        </div>
      </motion.div>}
    </AnimatePresence>
  </>;
}

function MediaImage({ item, alt = '' }: { item: ChatMediaItem; alt?: string }) {
  if (item.source !== 'taken-now') return <img src={item.url} alt={alt} draggable={false} loading="lazy" decoding="async"/>;
  // Source4162:227384 contains three uploaded image fills in this order.
  return <div className="chat-media-taken-image"><img src={item.url} alt="" draggable={false} loading="lazy" decoding="async"/><img src={M + 'source-taken-cover.webp'} alt="" draggable={false} loading="lazy" decoding="async"/><img src={M + 'source-taken-front.webp'} alt={alt} draggable={false} loading="lazy" decoding="async"/></div>;
}

const mediaTime = (value: number) => { const seconds = Math.max(0, Math.floor(value)); return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; };

type ViewerProps = {
  items: ChatMediaItem[]; index: number; once?: boolean; onSelect: (index: number) => void;
  onClose: () => void; returnFocus: HTMLElement | null; sender?: string; timeLabel?: string;
};

/** Phone-scoped source viewer shared by chat attachments and profile media. */
export function ChatMediaViewer({ items, index, once, onSelect, onClose, returnFocus, sender = 'Новый собеседник', timeLabel = 'Сегодня' }: ViewerProps) {
  const root = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null), filmstrip = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion(), press = getPressProps(reduced);
  const current = items[index];
  useEffect(() => {
    const canvas = root.current?.closest('.dialog-canvas');
    const background = Array.from(canvas?.querySelectorAll<HTMLElement>(':scope > .dialog-session-scene,:scope > .dialog-peer-scene,:scope > .dialog-header,:scope > .dialog-bottom-nav') ?? []);
    const previous = background.map(node => node.inert); background.forEach(node => { node.inert = true; });
    close.current?.focus({ preventScroll: true });
    return () => { background.forEach((node, i) => { node.inert = previous[i]; }); returnFocus?.focus({ preventScroll: true }); };
  }, [returnFocus]);
  useLayoutEffect(() => {
    // Changing photo/video can remove the focused arrow, thumbnail or playback control.
    if (root.current && !root.current.contains(document.activeElement)) close.current?.focus({ preventScroll: true });
  }, [index, items.length, once, current?.type, current?.source, current?.url]);
  useEffect(() => {
    const scroll = filmstrip.current?.querySelector<HTMLElement>('.mobile-carousel');
    if (scroll) scroll.scrollTo({ left: Math.max(0, index * 74 - (scroll.clientWidth - 72) / 2), behavior: reduced ? 'auto' : 'smooth' });
  }, [index, reduced]);
  if (!current) return null;
  const move = (step: number) => onSelect((index + step + items.length) % items.length);
  return <motion.div key="media-viewer" ref={root} className="chat-media-viewer"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={reduced ? STILL : UI_MOTION.fade}
    onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
    role="dialog" aria-modal="true" aria-label="Просмотр медиа" onKeyDown={event => {
      event.stopPropagation();
      if (event.key === 'Escape') onClose();
      else if (event.key === 'Tab') trapFocus(event);
      else if (!once && !(event.target instanceof HTMLInputElement) && event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      else if (!once && !(event.target instanceof HTMLInputElement) && event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    }}>
    <header className="chat-media-viewer-header"><div><strong>{sender}</strong><img src={M + 'viewer-badge.svg'} alt="Premium"/></div><p>{timeLabel}</p></header>
    <motion.button {...press} ref={close} className="chat-media-viewer-close" aria-label="Закрыть просмотр медиа" onClick={onClose}><img src={A + 'media-close.svg'} alt=""/></motion.button>
    {current.type === 'video' || current.source === 'video-poster' ? <ViewerVideo key={current.url} item={current}/> : <div className="chat-media-viewer-picture"><MediaImage item={current} alt={current.name}/></div>}
    {!once && items.length > 1 && current.type !== 'video' && current.source !== 'video-poster' && <>
      <motion.button {...press} className="chat-media-viewer-step is-previous" aria-label="Предыдущее вложение" onClick={() => move(-1)}><img src={M + 'viewer-prev.svg'} alt=""/></motion.button>
      <motion.button {...press} className="chat-media-viewer-step is-next" aria-label="Следующее вложение" onClick={() => move(1)}><img src={M + 'viewer-next.svg'} alt=""/></motion.button>
      <div ref={filmstrip} className="chat-media-viewer-filmstrip"><Carousel ariaLabel="Вложения" contentClassName="chat-media-viewer-filmstrip-track">
        {items.map((item, i) => <motion.button {...press} key={`${item.url}-${i}`} aria-label={'Показать вложение ' + (i + 1)} aria-pressed={i === index} onClick={() => onSelect(i)}>
          {item.type === 'video' ? <video src={item.url} muted playsInline preload="metadata"/> : <MediaImage item={item}/>}
        </motion.button>)}
      </Carousel></div>
    </>}
  </motion.div>;
}

function ViewerVideo({ item }: { item: ChatMediaItem }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0), [duration, setDuration] = useState(item.duration ?? 0);
  const posterOnly = item.source === 'video-poster';
  const reduced = useReducedMotion(), press = getPressProps(reduced);
  useEffect(() => {
    const pauseHidden = () => { if (document.hidden) video.current?.pause(); };
    document.addEventListener('visibilitychange', pauseHidden);
    const player = video.current;
    return () => { document.removeEventListener('visibilitychange', pauseHidden); player?.pause(); };
  }, []);
  const toggle = () => { const player = video.current; if (!player) return; if (player.paused) void player.play().catch(() => setPlaying(false)); else player.pause(); };
  const fullScreen = () => {
    const player = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (player?.webkitEnterFullscreen) player.webkitEnterFullscreen();
    else if (player?.requestFullscreen) void player.requestFullscreen().catch(() => undefined);
  };
  return <>
    <div className="chat-media-viewer-picture">{posterOnly ? <MediaImage item={item} alt={item.name}/> : <video ref={video} src={item.url} playsInline preload="metadata" onClick={toggle}
      onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)}/>}</div>
    <motion.button {...press} className={`chat-media-viewer-play${playing ? ' is-playing' : ''}`} aria-label={posterOnly ? 'Видео из макета: доступен только постер' : playing ? 'Приостановить видео' : 'Воспроизвести видео'} aria-disabled={posterOnly} onClick={toggle}>
      {playing ? <span className="chat-media-viewer-pause"/> : <img src={M + 'viewer-play.svg'} alt=""/>}
    </motion.button>
    <div className="chat-media-viewer-playback"><div className="chat-media-viewer-timeline"><span>{mediaTime(time)}</span><input type="range" disabled={posterOnly} min={0} max={duration || 1} step="0.1" value={Math.min(time, duration || 1)} aria-label="Позиция видео" style={{ '--media-progress': `${duration ? time / duration * 100 : 0}%` } as CSSProperties}
      onChange={event => { if (video.current) video.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)); }}/><span>-{mediaTime(duration - time)}</span></div>
      <motion.button {...press} aria-label="Открыть видео на весь экран" aria-disabled={posterOnly} onClick={fullScreen}><img src={M + 'viewer-fullscreen.svg'} alt=""/></motion.button>
    </div>
  </>;
}

function VideoThumbnail({item,once}:{item:ChatMediaItem;once?:boolean}){
  const [duration,setDuration]=useState(item.duration);
  return <><video src={item.url} muted playsInline preload="metadata" onLoadedMetadata={event=>{const value=event.currentTarget.duration;if(Number.isFinite(value))setDuration(value);}}/>
    {!once&&<MediaDurationBadge className="chat-media-source-video-label" label={duration===undefined?'Видео':mediaTime(duration)}/>}</>;
}

export function ChatMediaContent({ items, once, timeLabel }: { items: ChatMediaItem[]; once?: boolean; timeLabel?: string }) {
  const [view, setView] = useState<number | null>(null), [viewerOpen, setViewerOpen] = useState(false), [viewed, setViewed] = useState(false);
  const opener = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion(), press = getPressProps(reduced);
  const dismiss = () => setViewerOpen(false);
  const finishExit = () => { if (viewerOpen) return; setView(null); if (once) setViewed(true); };
  const portal = opener.current?.closest('.dialog-canvas');
  if (viewed) return <span className="chat-media-consumed" hidden/>;
  return <>
    <div className={'chat-media-grid ' + (items.length > 1 ? 'is-album' : '')}>
      {items.map((item, index) =>
        <motion.button {...press} key={item.url} aria-label={once ? 'Открыть разовое медиа' : 'Открыть ' + (item.type === 'video' || item.source === 'video-poster' ? 'видео' : 'фото')}
          style={items.length === 1 && item.height ? { height: item.height } : undefined}
          onClick={event => { opener.current = event.currentTarget; setView(index); setViewerOpen(true); }}>
          {item.type === 'video' ? <VideoThumbnail item={item} once={once}/> : <MediaImage item={item} alt={item.name}/>}
          {item.source === 'video-poster' && <MediaDurationBadge className="chat-media-source-video-label" label={mediaTime(item.duration ?? 24)}/>}
          {once && <span className="chat-media-once-cover" aria-hidden="true"><img src={M + 'once-message.svg'} alt=""/></span>}
        </motion.button>)}
    </div>
    {items.length === 1 && items[0].source === 'taken-now' && <span className="chat-media-taken-label"><img src={M + 'source-captured-clock.svg'} alt=""/>Снято сейчас</span>}
    {portal && createPortal(<AnimatePresence onExitComplete={finishExit}>
      {viewerOpen && view !== null && <ChatMediaViewer items={items} index={view} timeLabel={timeLabel} onSelect={setView} onClose={dismiss} once={once} returnFocus={once ? portal.querySelector<HTMLButtonElement>('.chat-camera') : opener.current}/>}
    </AnimatePresence>, portal)}
  </>;
}
