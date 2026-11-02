import {MediaDurationBadge} from './MediaDurationBadge';
import {UI_MOTION} from '../ui/motion';
import { getPressProps } from '../ui/press';
import './peer-profile.css';
import { ChatMediaViewer } from './ChatMedia';
import type { ChatMediaItem } from './ChatConversation';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useInView, useIsPresent, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { Carousel, MobileScroll } from '../mobile';
import { ShaderFill } from '../isolated-onboarding/lib/custom-effect-runtime';
import { setup, render, manifest } from '../isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler';

export const PEER_PREVIEWS = [
  ['media-bio-interests', 'Медиа · био и интересы'], ['media-only-bio-interests', 'Только фото и видео · био и интересы'],
  ['media-audio-bio-interests', 'Фото, видео и аудио · био и интересы'], ['media-audio-links-bio-interests', 'Фото, видео, аудио и ссылки · био и интересы'], ['media', 'Медиа · без био'],
  ['media-bio', 'Медиа · био'], ['media-interests', 'Медиа · интересы'],
  ['empty', 'Без медиа · пустой профиль'], ['bio', 'Без медиа · био'],
  ['bio-interests', 'Без медиа · био и интересы'], ['interests', 'Без медиа · интересы'],
  ['premium-empty', 'Премиум · без медиа'], ['premium-media-bio', 'Премиум · медиа и био'],
  ['premium-media-bio-interests', 'Премиум · медиа, био и интересы'], ['premium-media-interests', 'Премиум · медиа и интересы'],
] as const;
export type PeerPreview = typeof PEER_PREVIEWS[number][0];
const FADE=UI_MOTION.fade;
const interests = [{ id: 'music', label: 'Музыка', width: 81 }, { id: 'technology', label: 'Технологии и ИИ', width: 147 }, { id: 'meme', label: 'Мемы', width: 69 }, { id: 'fashion', label: 'Мода', width: 65 }, { id: 'pets', label: 'Питомцы', width: 92 }];
const media = [0, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 6, 6, 6, 7, 8];
const galleryItems: ChatMediaItem[] = media.map((photo, index) => ({ url: `/assets/peer/photo-${photo}.jpg`, type: 'image', name: `Медиа собеседника ${index + 1}`, ...(index === 1 || index === 5 ? { source: 'video-poster' as const, duration: index === 1 ? 24 : 12 } : {}) }));
const tabs = ['Медиа', 'Аудиосообщения', 'Ссылки', 'GIF'];
const tabWidths = [76, 145, 82, 52];
const tabOffsets = [0, 76, 221, 303];
const tabLabels = ['tab-label-0.svg', 'tab-label-audio.svg', 'tab-label-3.svg', 'tab-label-4.svg'];
type SharedMediaKind = 'voice' | 'circle' | 'link' | 'gif';
type OpenMessage = (kind: SharedMediaKind, index: number) => void;
const smoothstep = (value: number, start: number, end: number) => { const t = Math.min(1, Math.max(0, (value - start) / (end - start))); return t * t * (3 - 2 * t); };
function SourceIcon({ name }: { name: string }) { return <img src={`/assets/dialog/${name}.svg`} alt="" draggable={false}/>; }

function PeerSpoiler({ active,onPremium }: { active: boolean;onPremium:(trigger:HTMLButtonElement)=>void }) {
  const ref = useRef<HTMLButtonElement>(null); const inView = useInView(ref);
  const reduced = useReducedMotion(); const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const update = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
  const shader = useMemo(() => ({ setup, render, manifest: { ...manifest, isAnimated: active && inView && visible && !reduced }, params: {
    particleSize: 1.4, particleColor: { r: 28 / 255, g: 20 / 255, b: 7 / 255, a: .56 }, reveal: 0,
    animationSpeed: reduced ? 0 : 1.05, bubbleColor: { r: 244 / 255, g: 244 / 255, b: 244 / 255, a: 1 }, particleDensity: .24,
  } }), [active, inView, visible, reduced]);
  return <button type="button" ref={ref} className="peer-spoiler" aria-label="Пол и возраст скрыты — открыть премиум" aria-haspopup="dialog" onPointerDown={event=>{if(document.activeElement?.matches('input,textarea,[contenteditable=true]'))event.preventDefault();}} onClick={event=>onPremium(event.currentTarget)}><img src="/assets/dialog/spoiler-fallback.png" alt=""/><ShaderFill width={40} height={16} shader={shader}/></button>;
}

function PeerAudioList({ active, onOpenMessage }: { active: boolean; onOpenMessage: OpenMessage }) {
  const reduced = useReducedMotion();
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const stop = () => { player.current?.pause(); setPlaying(null); };
  useEffect(() => { if (!active) stop(); }, [active]);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onVisibility);
    const audio = player.current;
    return () => { document.removeEventListener('visibilitychange', onVisibility); audio?.pause(); };
  }, []);
  const play = async (index: number) => {
    const audio = player.current;
    if (!audio) return;
    if (playing === index) { stop(); return; }
    audio.pause(); audio.currentTime = 0;
    try { await audio.play(); setPlaying(index); } catch { setPlaying(null); }
  };
  return <div className="peer-shared-list peer-audio-list" aria-label="Аудиосообщения собеседника">
    <audio ref={player} src="/assets/chat/voice-short-demo.wav" preload="none" onEnded={() => setPlaying(null)} />
    {['00:01', '00:04', '00:01', '00:05'].map((duration, index) => {
      const circle = index % 2 === 1;
      const kind = circle ? 'circle' : 'voice';
      return <div className="peer-shared-row" key={index}>
        <motion.button className={`peer-audio-action${circle ? ` is-circle is-circle-${index}` : ''}`} {...getPressProps(reduced)} aria-label={circle ? `Открыть видеосообщение ${index === 1 ? 1 : 2} в чате` : `${playing === index ? 'Приостановить' : 'Воспроизвести'} аудиосообщение ${index === 0 ? 1 : 2}`} onClick={() => circle ? onOpenMessage(kind, index) : void play(index)}>
          {circle ? <img className="peer-circle-image" src={`/assets/peer/audio-circle-${index === 1 ? 1 : 2}.png`} alt="" draggable={false}/> : null}
          {playing === index ? <span className="peer-audio-pause"/> : <img className="peer-audio-play" src={`/assets/peer/${circle ? index === 1 ? 'circle-play.svg' : 'circle-play-2.svg' : 'audio-play.svg'}`} alt=""/>}
        </motion.button>
        <div className="peer-shared-details"><span>13 окт. 2026г.</span><span className="peer-shared-duration">{duration}</span></div>
        <motion.button className="peer-open-message" {...getPressProps(reduced)} aria-label={`Показать ${circle ? 'видеосообщение' : 'аудиосообщение'} в чате`} onClick={() => onOpenMessage(kind, index)}><img src="/assets/peer/open-message.svg" alt=""/></motion.button>
      </div>;
    })}
  </div>;
}

function PeerLinks({ onOpenMessage }: { onOpenMessage: OpenMessage }) {
  const reduced = useReducedMotion();
  return <div className="peer-shared-list peer-link-list" aria-label="Ссылки собеседника">{[0, 1].map(index => <motion.button className="peer-shared-row" {...getPressProps(reduced)} key={index} onClick={() => onOpenMessage('link', index)} aria-label={`Показать ссылку ${index + 1} в чате`}>
    <span className="peer-shared-details"><span>Heading Site</span><span className="peer-link-address">https://link.ru/maps/-/CXeQeXit</span></span><img className="peer-open-message" src="/assets/peer/open-message.svg" alt=""/>
  </motion.button>)}</div>;
}

function PeerMediaPanel({ tab, tabId, direction, reduced, active, panelHeight, onOpenMessage, onOpenMedia }: { tab: string; tabId: string; direction: number; reduced: boolean | null; active: boolean; panelHeight: number; onOpenMessage: OpenMessage; onOpenMedia: (index: number, trigger: HTMLButtonElement) => void }) {
  const present = useIsPresent();
  return <motion.div className="peer-tab-panel" key={tab} id={`${tabId}-${tab}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${tab}`} inert={!present} aria-hidden={!present} custom={direction} style={{ height: panelHeight }}
    variants={{ enter: (side: number) => ({ x: reduced ? 0 : side * 402 }), visible: { x: 0 }, leave: (side: number) => ({ x: reduced ? 0 : -side * 402 }) }}
    initial="enter" animate="visible" exit="leave" transition={reduced ? { duration: 0 } : FADE}>
    {tab === 'Медиа' ? <div className="peer-gallery">{media.map((photo, index) => <motion.button className="peer-media" {...getPressProps(reduced)} key={index} aria-label={`Открыть медиа собеседника ${index + 1}`} onClick={event => onOpenMedia(index, event.currentTarget)}><img src={`/assets/peer/photo-${photo}.jpg`} alt={`Медиа собеседника ${index + 1}`} draggable={false} decoding="async" loading={index < 6 ? 'eager' : 'lazy'}/>{index === 1 || index === 5 ? <MediaDurationBadge className="peer-duration" label={index === 1 ? '00:24' : '00:12'}/> : null}</motion.button>)}</div>
      : tab === 'Аудиосообщения' ? <PeerAudioList active={active && present} onOpenMessage={onOpenMessage}/>
      : tab === 'Ссылки' ? <PeerLinks onOpenMessage={onOpenMessage}/>
      : <div className="peer-gallery peer-gif-gallery">{[2, 3].map((photo, index) => <motion.button className="peer-media" {...getPressProps(reduced)} key={photo} aria-label={`Показать GIF ${index + 1} в чате`} onClick={() => onOpenMessage('gif', index)}><img src={`/assets/peer/photo-${photo}.jpg`} alt={`GIF ${index + 1}`} draggable={false} decoding="async"/></motion.button>)}</div>}
  </motion.div>;
}

type Props = { preview: PeerPreview; height: number; active: boolean; friend: boolean; pending?: boolean; ended: boolean; onBack: () => void; onFriend: () => void; onEnd: () => void; onNext: () => void; nextLabel?: string; onOpenMessage?: OpenMessage;onPremium:(trigger:HTMLButtonElement)=>void };
export function PeerProfile({ preview, height, active, friend, pending = false, ended, onBack, onFriend, onEnd, onNext,nextLabel='Дальше', onOpenMessage = onBack,onPremium }: Props) {
  const reduced = useReducedMotion(); const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const mediaTrigger = useRef<HTMLButtonElement | null>(null);
  const [mediaView, setMediaView] = useState<number | null>(null), [viewerOpen, setViewerOpen] = useState(false);
  const scrollY = useMotionValue(0);
  const [selection, setSelection] = useState({ tab: 'Медиа', direction: 1 });
  const { tab, direction } = selection;
  const selectTab = (next: string) => { if (next !== tab) setSelection({ tab: next, direction: tabs.indexOf(next) > tabs.indexOf(tab) ? 1 : -1 }); };
  const maskId = useId();
  const scrollAnimationId = `peer-scroll-${maskId.replace(/[^a-z0-9]/gi, '')}`;
  const nativeScrollAnimation = CSS.supports('animation-timeline', 'scroll()') && CSS.supports('animation-range', '0px 1px');
  const hasMedia = preview.includes('media'); const hasBio = preview.includes('bio'); const hasInterests = preview.includes('interests'); const premium = preview.startsWith('premium');
  const onlyMedia = preview.includes('media-only');
  const tabCount = onlyMedia ? 1 : preview.includes('media-audio-links') ? 3 : preview.includes('media-audio') ? 2 : 4;
  const visibleTabs = tabs.slice(0, tabCount);
  const tabsWidth = tabCount === 4 ? 362 : tabWidths.slice(0, tabCount).reduce((sum, width) => sum + width, 6);
  useEffect(() => { if (!visibleTabs.includes(tab)) setSelection({ tab: 'Медиа', direction: -1 }); }, [preview]);
  const infoHeight = hasBio && hasInterests ? 188 : hasBio || hasInterests ? 94 : 0;
  const headerHeight = premium ? 347 : 344;
  const tabsTop = 116 + headerHeight + (infoHeight ? 16 + infoHeight : 0) + 32;
  // Short panels fill the space beneath the pinned rail, without retaining the
  // gallery's 805px extent. Native scroll clamping keeps every row in view.
  const shortContentHeight = tab === 'Аудиосообщения' ? 256 : tab === 'Ссылки' ? 128 : 133.333333;
  const mediaPanelHeight = tab === 'Медиа' ? 805 : Math.max(0, height - 332, shortContentHeight);
  const compactOpacity = useTransform(scrollY, value => smoothstep(value, 128, 200));
  const compactY = useTransform(scrollY, value => 6 * (1 - smoothstep(value, 128, 200)));
  const identityOpacity = useTransform(scrollY, value => 1 - smoothstep(value, 100, 184));
  // Derive every mask property from the same scroll sample. Chaining transformed
  // values deferred the ellipse by one frame during the sticky transition.
  const maskRx = useTransform(scrollY, value => 846.5 - 92 * smoothstep(value, tabsTop - 132, tabsTop + 25));
  const maskRy = useTransform(scrollY, value => 169.5 - 5 * smoothstep(value, tabsTop - 132, tabsTop + 25));
  const maskCy = useTransform(scrollY, value => -61.5 + 8 * smoothstep(value, 0, 339) + 73 * smoothstep(value, tabsTop - 132, tabsTop + 25));
  const tabId = `peer-${preview}`;
  const railTransform = useTransform(scrollY, value => 'translateY(calc('+Math.max(132, tabsTop - value)+'px + var(--peer-rail-rubber,0px)))');
  const scrollKeyframes = useMemo(() => {
    const end = tabsTop + 25;
    const positions = [...new Set([0, 100, 128, 184, 200, 339, tabsTop - 132, end, ...Array.from({ length: Math.ceil(end / 2) }, (_, i) => i * 2)])].sort((a, b) => a - b);
    const frames = (values: (y: number) => string) => positions.map(y => `${y / end * 100}%{${values(y)}}`).join('');
    return `@keyframes ${scrollAnimationId}-mask{${frames(y => {
      const sticky = smoothstep(y, tabsTop - 132, end);
      return `cy:${-61.5 + 8 * smoothstep(y, 0, 339) + 73 * sticky}px;rx:${846.5 - 92 * sticky}px;ry:${169.5 - 5 * sticky}px`;
    })}}@keyframes ${scrollAnimationId}-rail{from{transform:translateY(calc(${tabsTop}px + var(--peer-rail-rubber,0px)))}to{transform:translateY(132px)}}@keyframes ${scrollAnimationId}-compact{${frames(y => `opacity:${smoothstep(y, 128, 200)};transform:translateY(${6 * (1 - smoothstep(y, 128, 200))}px)`)}}@keyframes ${scrollAnimationId}-identity{${frames(y => `opacity:${1 - smoothstep(y, 100, 184)}`)}}`;
  }, [scrollAnimationId, tabsTop]);
  const nativeAnimation = (name: string): CSSProperties => ({ animationName: `${scrollAnimationId}-${name}`, animationDuration: '1ms', animationTimingFunction: 'linear', animationFillMode: 'both', animationTimeline: '--peer-profile-scroll', animationRange: `0px ${tabsTop + 25}px` } as CSSProperties);

  useLayoutEffect(() => {
    const scroll = root.current?.querySelector<HTMLElement>('.peer-scroll .mobile-scroll');
    if (!scroll) return;
    let lastRubber = Number.NaN;
    let lastRailRubber = Number.NaN;
    const update = () => {
      const y = scroll.scrollTop; const rubber = Number(scroll.dataset.overscroll || 0);
      if (!nativeScrollAnimation) scrollY.set(y);
      if (rubber !== lastRubber) { root.current?.style.setProperty('--peer-content-rubber', `${rubber}px`); lastRubber = rubber; }
      // Keep the pinned rail stationary at the lower bounce. At the top it
      // follows exactly the same rubber-band translation as the content.
      const railRubber = y < tabsTop - 132 ? rubber : 0;
      if (rail.current && railRubber !== lastRailRubber) { rail.current.style.setProperty('--peer-rail-rubber', railRubber+'px'); lastRailRubber = railRubber; }
    };
    const observer = new MutationObserver(update); observer.observe(scroll, { attributes: true, attributeFilter: ['data-overscroll'] });
    scroll.addEventListener('scroll', update, { passive: true }); update();
    return () => { observer.disconnect(); scroll.removeEventListener('scroll', update); };
  }, [scrollY, tabsTop, nativeScrollAnimation]);


  const railContent = <motion.div ref={rail} className={`peer-tabs${onlyMedia ? ' is-media-only' : ''}`} style={{ width: tabsWidth, left: (402 - tabsWidth) / 2, ...(nativeScrollAnimation ? { ...nativeAnimation('rail'), animationRange: '0px '+(tabsTop - 132)+'px' } : { transform: railTransform }) }}>
    <Carousel className="peer-tabs-carousel" contentClassName="peer-tabs-track" ariaLabel="Вкладки материалов собеседника"><div role="tablist" aria-label="Материалы собеседника"><motion.span className="peer-tab-pill" aria-hidden="true" initial={false} animate={{ x: tabOffsets[tabs.indexOf(tab)], width: tabWidths[tabs.indexOf(tab)] }} transition={reduced ? { duration: 0 } : FADE}/>{visibleTabs.map((label, index) => <button key={label} role="tab" aria-label={label} id={`${tabId}-${label}`} style={{ width: tabWidths[index] }} aria-selected={tab === label} aria-controls={`${tabId}-${label}-panel`} tabIndex={tab === label ? 0 : -1} onClick={() => selectTab(label)} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = event.key === 'Home' ? 0 : event.key === 'End' ? visibleTabs.length - 1 : (visibleTabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + visibleTabs.length) % visibleTabs.length; selectTab(visibleTabs[index]); const button = event.currentTarget.parentElement?.querySelectorAll('button')[index]; button?.focus({ preventScroll: true }); }}><span className="peer-tab-label" style={{ width: tabWidths[index] - 32 }} aria-hidden="true"><img src={`/assets/peer/${tabLabels[index]}`} alt="" draggable={false}/></span></button>)}</div></Carousel>
  </motion.div>;
  return <section ref={root} className="peer-profile" aria-label="Профиль собеседника" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onBack(); } }}>
    {nativeScrollAnimation ? <style>{scrollKeyframes}</style> : null}
    <MobileScroll className="peer-scroll"><div className="peer-content" style={{ minHeight: hasMedia ? undefined : height, paddingBottom: hasMedia ? 0 : 140 }}>
      <div className="peer-expanded" style={{ height: headerHeight }}>
        <motion.div className="peer-expanded-identity" style={nativeScrollAnimation ? nativeAnimation('identity') : { opacity: identityOpacity }}>
          <div className="peer-avatar"><img className="peer-avatar-art" src="/assets/peer/avatar.png" alt="Аватар собеседника"/><img className="peer-avatar-ring" src="/assets/peer/ring.svg" alt=""/><img className="peer-avatar-badge" src="/assets/peer/premium-badge-03c580c084.svg" alt=""/></div>
          <h1>Новый собеседник</h1>
          <div className="peer-status"><span>{ended ? 'Не в чате' : 'В чате'}</span><i aria-hidden="true"/>{premium ? <span className="peer-age"><img src="/assets/auth/profile-male.svg" alt="Мужской"/>25–34</span> : <PeerSpoiler active={active && !viewerOpen} onPremium={onPremium}/>}</div>
          <div className="peer-reactions" aria-label="Оценки собеседника"><span className="dialog-reaction is-positive"><span><SourceIcon name="like"/></span>24</span><span className="dialog-reaction is-negative"><span><SourceIcon name="dislike"/></span>7</span></div>
        </motion.div>
        <div className="peer-actions" style={{ top: headerHeight - 69 }}>
          <motion.button {...getPressProps(reduced)} aria-pressed={friend} disabled={ended||pending||friend} onClick={onFriend}><span className="peer-action-icon is-friend"><img src="/assets/peer/friend-source.svg" alt=""/></span><span className="peer-action-label">{friend ? 'В друзьях' : pending ? 'Отправлено' : 'В друзья'}</span></motion.button>
          <motion.button {...getPressProps(reduced)} disabled={ended} onClick={onEnd}><span className="peer-action-icon is-end"><img src="/assets/peer/end.svg" alt=""/></span><span className="peer-action-label">Завершить</span></motion.button>
          <motion.button {...getPressProps(reduced)} onClick={onNext}><span className="peer-action-icon is-next"><img src="/assets/peer/next.svg" alt=""/></span><span className="peer-action-label">{nextLabel}</span></motion.button>
        </div>
      </div>
      {infoHeight > 0 ? <article className="peer-info" aria-label="Информация о собеседнике">
        {hasBio ? <div><h2>О собеседнике</h2><p>Люблю тихие, томные вечера и длинные разговоры ни о чём</p></div> : null}
        {hasBio && hasInterests ? <div className="peer-info-divider" role="separator"/> : null}
        {hasInterests ? <div><h2>Интересы</h2><div className="peer-interests">{interests.map(({ id, label, width }) => <span className="peer-interest-tag" key={id} style={{ width }}><span className="peer-interest-icon"><img src={`/assets/peer/interest-${id}.svg`} alt="" draggable={false}/></span><span className="peer-interest-label">{label}</span></span>)}</div></div> : null}
      </article> : null}
      {hasMedia ? <>
        <div className="peer-tabs-placeholder" aria-hidden="true"/>
        <div className="peer-media-content"><div className="peer-media-slot" style={{ height: mediaPanelHeight, minHeight: mediaPanelHeight }}>
          <AnimatePresence initial={false} custom={direction}><PeerMediaPanel key={tab} tab={tab} tabId={tabId} direction={direction} reduced={reduced} active={active && !viewerOpen} panelHeight={mediaPanelHeight} onOpenMessage={onOpenMessage} onOpenMedia={(index, trigger) => { mediaTrigger.current = trigger; setMediaView(index); setViewerOpen(true); }}/></AnimatePresence>
        </div></div>
      </> : null}
    </div></MobileScroll>
    {hasMedia ? railContent : null}
    {mediaView !== null && root.current?.closest('.dialog-canvas') ? createPortal(<AnimatePresence onExitComplete={() => { if (!viewerOpen) setMediaView(null); }}>
      {viewerOpen && <ChatMediaViewer items={galleryItems} index={mediaView} onSelect={setMediaView} onClose={() => setViewerOpen(false)} returnFocus={mediaTrigger.current}/>} 
    </AnimatePresence>, root.current.closest('.dialog-canvas')!) : null}
    <svg className="peer-top-mask" width="402" height="240" viewBox="0 0 402 240" aria-hidden="true">
      <defs><filter id={maskId} x="-64" y="-64" width="530" height="368" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="16"/></filter></defs>
      {nativeScrollAnimation ? <ellipse cx="201.5" cy={-61.5} rx={846.5} ry={169.5} fill="#F4F4F4" filter={`url(#${maskId})`} style={nativeAnimation('mask')}/> : <motion.ellipse cx="201.5" cy={maskCy} rx={maskRx} ry={maskRy} fill="#F4F4F4" filter={`url(#${maskId})`}/>}
    </svg>
    <header className="peer-toolbar">
      <motion.button {...getPressProps(reduced)} className="dialog-round-action peer-back" aria-label="Назад в диалог" onClick={onBack}><img className="dialog-round-glass" src="/assets/dialog/round-glass.png" alt=""/><img src="/assets/peer/back.svg" alt=""/></motion.button>
      <motion.div className="peer-compact" style={nativeScrollAnimation ? { ...nativeAnimation('compact'), opacity: 0, transform: 'translateY(6px)' } : { opacity: compactOpacity, y: compactY }} aria-hidden="true"><div><strong>Новый собеседник</strong><img src="/assets/peer/premium-badge-03c580c084.svg" alt=""/></div><p>{hasMedia ? '74 фото, 4 видео' : ended ? 'Не в чате' : 'В чате'}</p></motion.div>
      <button className="dialog-round-action dialog-report" aria-label="Пожаловаться" aria-disabled="true"><img className="dialog-round-glass" src="/assets/dialog/round-glass.png" alt=""/><SourceIcon name="report"/></button>
    </header>
    <img className="peer-bottom-mask" src="/assets/peer/bottom-mask.svg" alt=""/>
    <div className="peer-nav-blur" aria-hidden="true"/>
  </section>;
}
