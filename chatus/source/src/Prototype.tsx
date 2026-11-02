import {getViewportSnapshot,subscribeViewport} from './ui/viewport';
import {AgeWheelDigits} from './components/AuthFlow/AgeWheelDigits';
import {readQuestionnaire,storeQuestionnaire} from './components/AuthFlow/questionnaire-storage';
import {useBioInput} from './ui/use-bio-input';
import {avatarImage} from './components/AuthFlow/avatar-image';
import { HISTORY_LAYOUT, HISTORY_PAINT, type HistoryRowLayout } from './components/chat-history-layout';
import { DraftComposer } from './components/DraftComposer';
import { createChatDraft } from './components/chat-draft';
import {ChatStickers} from './components/ChatStickers';
import {ChatOutgoingMask} from './components/ChatOutgoingMask';
import {useCardTilt} from './ui/useCardTilt';
import {UI_MOTION} from './ui/motion';
import {PremiumIllustration} from './components/PremiumIllustration';
import {PremiumSheet} from './components/premium/PremiumSheet';
import {useStableEvent} from './ui/useStableEvent';
import {getPressProps} from './ui/press';
import {BottomSheet} from './components/AppSheet';
import { AuthFlow, AUTH_PREVIEWS, type AuthRoute, type AuthScenario } from "./components/AuthFlow/AuthFlow";
import { createPortal,flushSync } from "react-dom";
import { memo, useEffect, useLayoutEffect, useRef, useState, useId, useMemo, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, useReducedMotion, useIsPresent, useInView } from "motion/react";
import { AVATAR_BACKGROUNDS, INTERESTS as PROFILE_INTERESTS, avatarBackground, ageRange } from "./components/AuthFlow/questionnaire-data";
import { CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Carousel, MobileScroll, KeyboardInput, KeyboardTextarea, useMobileDevice, useKeyboard } from "./mobile";
import { NotificationSheet } from './components/AuthFlow/NotificationSheet';
import { ShaderFill } from './isolated-onboarding/lib/custom-effect-runtime';
import { setup as setupDialogSpoiler, render as renderDialogSpoiler, manifest as dialogSpoilerManifest } from './isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler';
import { PeerProfile, PEER_PREVIEWS, type PeerPreview } from './components/PeerProfile';
import { ChatBubble, DEMO_CIRCLE, CHAT_LAYOUT, messageTailFlags, CHAT_PREVIEWS, chatScenario, chatPresence, useVoiceRecording, type ChatMessage, type ChatPreview } from './components/ChatConversation';

import { useChatusKeyboardInsets as useKeyboardInsets, useChatusKeyboardLayout, useChatusViewportLayout } from './components/ChatusViewport';
import { PreviewControls } from './components/PreviewControls';
import './components/mobile-app.css';

import { MessageActionMenu, ChatFriendshipCard, ChatRatingCard, ChatEndActions, ChatEndConfirmation, type Friendship, type MessageMenu } from './components/ChatActions';
import { ChatAttachments, type ChatAttachmentsHandle } from './components/ChatMedia';
import { ChatCircleRecorder, type CircleRecorderMode } from './components/ChatCircleRecorder';
import { editMessage, reactToMessage, requiresEndConfirmation, setFriendshipState } from './components/chat-session';

type ProfileField = 'nickname' | 'age' | 'interests' | 'gender' | 'bio' | 'avatar';
type ProfileData = { nickname: string; age: string; interests: string[]; gender: string; bio: string; character: number; background: number };
const onboardingProfile = (): ProfileData | null => {
  const saved=readQuestionnaire();
  if(!saved)return null;
  return {nickname:saved.nickname,age:saved.age===null?'':String(saved.age),gender:saved.gender==='male'?'Мужской':saved.gender==='female'?'Женский':'',interests:saved.interests,character:saved.character,background:saved.background,bio:saved.bio};
};
const persistProfile=(data:ProfileData)=>storeQuestionnaire({nickname:data.nickname,age:data.age?Number(data.age):null,gender:data.gender==='Мужской'?'male':data.gender==='Женский'?'female':null,interests:data.interests,character:data.character,background:data.background,bio:data.bio});
const emptyProfile = (): ProfileData => ({ nickname: 'ТихийЛис', age: '', interests: [], gender: '', bio: '', character: 0, background: 0 });
const profilePercent = (data: ProfileData) => [data.nickname.trim(), data.age, data.interests.length, data.gender, data.bio.trim()].filter(Boolean).length * 20;
const profileLabels: Record<ProfileField, string> = { nickname: 'Никнейм', age: 'Возраст', interests: 'Твои интересы', gender: 'Пол', bio: 'О себе', avatar: 'Аватар' };
function ProfileIcon({ name }: { name: string }) { return <img src={`/assets/profile/${name}.svg`} alt="" draggable={false} />; }

function CompletionBadge({ percent, persistent = false, compact = false }: { percent: number; persistent?: boolean; compact?: boolean }) {
  const reduced = useReducedMotion();
  const progress = useMotionValue(percent / 100);
  const [display, setDisplay] = useState(percent);
  const [phase, setPhase] = useState<'progress' | 'fill' | 'check' | 'hide'>('progress');
  const previous = useRef(percent);
  useEffect(() => {
    const timers: number[] = [];
    setPhase('progress');
    // Wait for the editing sheet to settle before drawing the final segment.
    const finish = percent === 100 && previous.current < 100;
    const delay = reduced ? 0 : finish ? 260 : 0;
    const ringDuration = reduced ? 0 : finish ? 1100 : 900;
    timers.push(window.setTimeout(() => {
      animate(progress, percent / 100, { duration: ringDuration / 1000, ease: [.42, 0, .22, 1], onUpdate: value => setDisplay(Math.round(value * 100)) });
    }, delay));
    if (percent === 100) {
      const fillAt = delay + ringDuration + (reduced ? 0 : 60);
      const checkAt = fillAt + (reduced ? 0 : 420);
      timers.push(window.setTimeout(() => setPhase('fill'), fillAt));
      timers.push(window.setTimeout(() => setPhase('check'), checkAt));
      if (!persistent) timers.push(window.setTimeout(() => setPhase('hide'), reduced ? 1600 : checkAt + 1760));
    }
    previous.current = percent;
    return () => { timers.forEach(clearTimeout); progress.stop(); };
  }, [percent, progress, reduced, persistent]);
  const success = phase === 'fill' || phase === 'check' || phase === 'hide';
  return <div className={`profile-badge-slot ${compact ? 'is-compact' : ''} ${percent === 100 ? 'is-complete' : ''} ${phase === 'hide' ? 'is-hidden' : ''}`} >
    <div className={`profile-completion-badge ${success ? 'is-success' : ''} phase-${phase}`} role="status" aria-hidden={phase === 'hide'} aria-label={`Анкета заполнена на ${display}%`}>
      <svg viewBox="0 0 14 14" width={compact ? 12 : 14} height={compact ? 12 : 14} aria-hidden="true">
        <circle className="profile-progress-track" cx="7" cy="7" r="5.833" />
        <motion.circle className="profile-progress-ring" cx="7" cy="7" r="5.833" pathLength="1" style={{ pathLength: progress }} transform="rotate(-90 7 7)" />
        <circle className="profile-progress-fill" cx="7" cy="7" r="6.4" />
        <path className="profile-progress-check" d="M3.7 7.1 6 9.2 10.2 4.9" pathLength="1" />
      </svg>
      <span>{display}%</span>
    </div>
  </div>;
}
function ProfileAvatar({ data }: { data: ProfileData }) {
  const reduced = useReducedMotion();
  const assigned = !!data.gender;
  const [assignmentPhase, setAssignmentPhase] = useState<'waiting' | 'reveal' | 'steady'>(assigned ? 'steady' : 'waiting');
  useEffect(() => {
    if (!assigned) { setAssignmentPhase('waiting'); return; }
    if (assignmentPhase !== 'waiting') return;
    let cancelled = false;
    // Keep the mask visible until the assigned artwork can paint its first frame.
    const image = new Image();
    const source=avatarImage(data.character);image.sizes=source.sizes;image.srcset=source.srcSet;image.src=source.src;
    image.decode().then(() => { if (!cancelled) setAssignmentPhase('reveal'); }).catch(() => {});
    return () => { cancelled = true; };
  }, [assigned, data.character, assignmentPhase]);
  const visibleAssigned = assigned && assignmentPhase !== 'waiting';
  const firstAssignment = assignmentPhase !== 'steady';
  const transition = { duration: reduced ? 0 : .72, ease: [.42, 0, .22, 1] as const };
  return <div className={`profile-avatar-art ${visibleAssigned ? '' : 'is-unassigned'}`}>
    <AnimatePresence initial={false}><motion.div className="profile-avatar-color" key={visibleAssigned ? data.background : 'unassigned'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: .999 }} transition={firstAssignment ? transition : { duration: reduced ? 0 : .55, ease: [.22, 1, .36, 1] }} style={{ background: avatarBackground(visibleAssigned ? data.background : 6) }} /></AnimatePresence>
    <AnimatePresence initial={false}><motion.img className={visibleAssigned ? '' : 'profile-avatar-unassigned'} key={visibleAssigned ? data.character : 'unassigned'} {...(visibleAssigned?avatarImage(data.character):{src:'/assets/profile/avatar-unassigned.png'})} alt="Твой аватар" draggable={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={firstAssignment ? transition : { duration: reduced ? 0 : .18 }} onAnimationComplete={() => { if (visibleAssigned && assignmentPhase === 'reveal') setAssignmentPhase('steady'); }} /></AnimatePresence>
  </div>;
}
type ProfilePreview = 'basic' | 'premium' | 'compact' | 'empty' | 'edit' | 'avatar' | 'interests' | 'age' | 'gender' | 'nickname' | 'bio' | 'complete' | 'settings' | 'notification-settings' | 'appearance' | 'logout' | 'deletion' | 'deletion-other' | 'deletion-confirm' | 'deleting';
const PROFILE_PREVIEWS: [ProfilePreview, string][] = [['basic', 'Профиль · без премиума'], ['premium', 'Профиль · премиум'], ['compact', 'Профиль · короткий экран'], ['empty', 'Профиль · анкета пропущена'], ['edit', 'Редактирование · 20%'], ['avatar', 'Шторка · аватар'], ['interests', 'Шторка · интересы'], ['age', 'Шторка · возраст'], ['gender', 'Шторка · пол'], ['nickname', 'Шторка · никнейм'], ['bio', 'О себе · 80%'], ['complete', 'Анкета · 100%'], ['settings', 'Настройки'], ['notification-settings', 'Настройки · уведомления'], ['appearance', 'Шторка · оформление'], ['logout', 'Шторка · выход из аккаунта'], ['deletion', 'Удаление · причина'], ['deletion-other', 'Удаление · другая причина'], ['deletion-confirm', 'Удаление · подтверждение'], ['deleting', 'Аккаунт удаляется']];
const completedProfile = (): ProfileData => ({ ...emptyProfile(), age: '27', interests: ['technology', 'music', 'fashion'], gender: 'Мужской', bio: 'Люблю тихие вечера и длинные разговоры' });
const PROFILE_AVATAR_CONTOUR = 'M0 38.5C0 24.9921 0 18.2381 2.61584 13.1042C4.9168 8.5883 8.5883 4.9168 13.1042 2.61584C18.2381 0 24.9921 0 38.5 0C52.0079 0 58.7619 0 63.8958 2.61584C68.4117 4.9168 72.0832 8.5883 74.3842 13.1042C77 18.2381 77 24.9921 77 38.5C77 52.0079 77 58.7619 74.3842 63.8958C72.0832 68.4117 68.4117 72.0832 63.8958 74.3842C58.7619 77 52.0079 77 38.5 77C24.9921 77 18.2381 77 13.1042 74.3842C8.5883 72.0832 4.9168 68.4117 2.61584 63.8958C0 58.7619 0 52.0079 0 38.5Z';
function ProfileChevron() { return <svg className="profile-row-chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4.5 5 5.5-5 5.5" /></svg>; }
function ProfileNavigation({ onDialog }: { onDialog: () => void }) { return <nav className="profile-editor-nav" aria-label="Навигация"><button aria-label="Перейти в диалог" onClick={onDialog}><ProfileIcon name="chats" /></button><span className="is-active" aria-current="page" aria-label="Профиль"><ProfileIcon name="profile" /></span></nav>; }
function ProfileAgeWheel({ age, onChange }: { age: number; onChange: (age: number) => void }) {
  const position = useMotionValue(age); const drag = useRef<{ pointerId:number; scale:number; y: number; age: number; lastY:number; lastTime:number; velocity:number } | null>(null); const reduced = useReducedMotion();
  useEffect(() => () => position.stop(), [position]);
  const settle = (next: number) => { const n = Math.max(18, Math.min(99, Math.round(next))); onChange(n); position.stop(); if(reduced)position.set(n); else animate(position, n, { type:'spring', stiffness:260, damping:30 }); };
  return <div className="profile-age-picker"><div className="profile-age-highlight"><span>Лет</span></div>
    <div className="profile-age-wheel" tabIndex={0} role="spinbutton" aria-label="Возраст" aria-valuemin={18} aria-valuemax={99} aria-valuenow={age}
      onWheel={event => {event.stopPropagation();settle(age + Math.sign(event.deltaY));}}
      onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {event.preventDefault();settle(age + (event.key === 'ArrowUp' ? -1 : 1));}}}
      onPointerDown={event => {if(event.button!==0||drag.current)return;position.stop();event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointerId:event.pointerId,scale:event.currentTarget.getBoundingClientRect().height/346,y:event.clientY,age:position.get(),lastY:event.clientY,lastTime:performance.now(),velocity:0};}}
      onPointerMove={event => {const d=drag.current;if(!d||d.pointerId!==event.pointerId)return;const now=performance.now();d.velocity=Math.max(-3,Math.min(3,(event.clientY-d.lastY)/Math.max(1,now-d.lastTime)));d.lastY=event.clientY;d.lastTime=now;position.set(Math.max(18,Math.min(99,d.age-(event.clientY-d.y)/d.scale/61)));}}
      onPointerUp={event => {const d=drag.current;if(!d||d.pointerId!==event.pointerId)return;const moved=Math.abs(event.clientY-d.y)>5;drag.current=null;event.currentTarget.releasePointerCapture(event.pointerId);settle(moved?position.get()-(performance.now()-d.lastTime<80?d.velocity:0)*110/d.scale/61:position.get()+Math.round(((event.clientY-event.currentTarget.getBoundingClientRect().top)/d.scale-173)/61));}}
      onPointerCancel={event => {if(drag.current?.pointerId!==event.pointerId)return;drag.current=null;settle(position.get());}}>
      <AgeWheelDigits position={position}/>
      <div className="profile-age-fade top"/><div className="profile-age-fade bottom"/>
    </div>
  </div>;
}
function ProfilePremiumPanel({ active = true }: { active?: boolean }) {
  const id=useId();const ref=useRef<HTMLElement>(null);const inView=useInView(ref);const reduced=useReducedMotion();const [visible,setVisible]=useState(!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  return <section ref={ref} className="profile-premium-banner" data-animated={active&&inView&&visible&&!reduced}>
    <div className="profile-premium-glow" aria-hidden="true"/>

    <h2>ОТКРОЙ <br/>ПРЕМИУМ</h2>
    <button aria-disabled="true"><i className="profile-premium-warm" aria-hidden="true"/><i className="profile-premium-inner" aria-hidden="true"/><i className="profile-premium-highlight" aria-hidden="true"/><span>Купить подписку</span><svg className="profile-premium-button-rim" viewBox="0 0 156 36" aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="white" stopOpacity=".88"/></linearGradient></defs><rect x=".5" y=".5" width="155" height="35" rx="17.5" fill="none" stroke={`url(#${id})`}/></svg></button>
    <PremiumIllustration/>
  </section>;
}
function ProfileScene({ editing, active = true, children }: {editing:boolean;active?:boolean;children:ReactNode}) {
  const reduced=useReducedMotion(); const present=useIsPresent();
  // Keep the profile underneath the editor for both directions of the same spring.
  return <motion.div className="profile-motion-scene" data-profile-scene={editing?'edit':'overview'} inert={!present||!active}
    style={{zIndex:editing?2:1}}
    initial={editing?{x:reduced?0:402,scale:1}:false}
    animate={{x:reduced||active?0:-402*.28,scale:reduced||active?1:.985}}
    exit={{x:reduced?0:402,scale:1}}
    transition={reduced?{duration:0}:UI_MOTION.scene}>{children}</motion.div>;
}
const NICKNAME_ENTER_MS = 560;
type SettingsRoute = 'settings' | 'notifications' | 'deletion';
type ProfileTheme = 'system' | 'light' | 'dark';
const NOTIFICATION_PREFERENCES = ['Нашёлся собеседник', 'Новые сообщения', 'Заявки в друзья', 'Премиум и оплата', 'Новости сервиса', 'Персональные предложения'];
function ProfileSettingsScene({ kind, active = true, children }: {kind:SettingsRoute;active?:boolean;children:ReactNode}) {
  const reduced=useReducedMotion();const present=useIsPresent();
  return <motion.div className="profile-motion-scene profile-settings-scene" data-profile-scene={kind} inert={!present||!active} style={{zIndex:kind==='settings'?3:4}}
    initial={{x:reduced?0:402}} animate={{x:reduced||active||kind==='deletion'?0:-402*.28,scale:reduced||active||kind==='deletion'?1:.985}} exit={{x:reduced?0:402,scale:1}}
    transition={reduced?{duration:0}:UI_MOTION.scene}>{children}</motion.div>;
}
function ProfileSettingsHeader({ title, onBack }: {title:string;onBack:()=>void}) {
  const reduced=useReducedMotion();
  return <motion.header className="profile-editor-header profile-settings-header" initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:reduced?0:.25}}><button className="profile-editor-back" aria-label={title==='Настройки'?'Вернуться в профиль':'Вернуться в настройки'} onClick={onBack}><img src="/assets/settings/back.svg" alt=""/></button><div className="profile-editor-title"><h1>{title}</h1></div><span className="profile-header-spacer"/></motion.header>;
}
function ProfileSettingsSheet({open,kind,scale,screenHeight,theme,draftTheme,onThemeChange,onSave,onClose,onLogout}: {open:boolean;kind:'appearance'|'logout';scale:number;screenHeight:number;theme:ProfileTheme;draftTheme:ProfileTheme;onThemeChange:(theme:ProfileTheme)=>void;onSave:()=>void;onClose:()=>void;onLogout:()=>void}) {
  const reduced=useReducedMotion();const selectionId=useId();const sheetHeight=kind==='appearance'?383:325;
  return <><style>{`.bottom-sheet:has(.profile-settings-sheet){height:${sheetHeight*scale}px;min-height:${sheetHeight*scale}px;max-height:none!important}`}</style>
    <BottomSheet open={open} onOpenChange={next=>{if(!next)onClose();}} title={kind==='appearance'?'Оформление':'Выйти из аккаунта?'} description={kind==='appearance'?'Выбор оформления приложения':'Профиль, друзья и чаты сохранятся.'} snap={sheetHeight*scale/screenHeight}>
      <div className="profile-settings-sheet" data-kind={kind} style={{height:sheetHeight,transform:`scale(${scale})`,clipPath:`path('M0 64C0 41.5979 0 30.3968 4.35974 21.8404C8.19467 14.3139 14.3139 8.19467 21.8404 4.35974C30.3968 0 41.5979 0 64 0H338C360.402 0 371.603 0 380.16 4.35974C387.686 8.19467 393.805 14.3139 397.64 21.8404C402 30.3968 402 41.5979 402 64V${sheetHeight}H0Z')`}}>
        {kind==='appearance'?<><h2>Оформление</h2><button className="profile-settings-close" onClick={onClose} aria-label="Закрыть без сохранения"><img src="/assets/auth/notification-close.svg" alt=""/></button>
          <div className="profile-theme-options" role="group" aria-label="Тема оформления">{([['system','Система'],['light','Светлое'],['dark','Темное']] as const).map(([id,label])=><button key={id} className="profile-theme-option" aria-pressed={draftTheme===id} onClick={()=>onThemeChange(id)}>
            <span className="profile-theme-preview"><img src={`/assets/settings/theme-${id}-preview-3x.png`} alt="" draggable={false}/>{draftTheme===id&&<motion.span className="profile-theme-selection" layoutId={selectionId} initial={false} transition={reduced?{duration:0}:UI_MOTION.scene}><img src="/assets/settings/theme-selection-smooth.svg" alt=""/></motion.span>}</span><span>{label}</span>
          </button>)}</div><div className="profile-settings-actions"><button className="profile-settings-primary" disabled={draftTheme===theme} onClick={onSave}>Сохранить</button></div>
        </>:<><div className="profile-logout-copy"><h2>ВЫЙТИ ИЗ АККАУНТА?</h2><p>Профиль, друзья и чаты сохранятся.<br/>Войти снова можно тем же способом</p></div><div className="profile-settings-actions"><button className="profile-settings-primary" onClick={onLogout}>Выйти</button><button className="profile-settings-cancel" onClick={onClose}>Отмена</button></div></>}
      </div>
    </BottomSheet></>;
}
const DELETION_REASONS = ['Нет интересных собеседников', 'Неудобно пользоваться', 'Проблемы с безопасностью', 'Не хочу отвечать', 'Другая причина'];
const DELETION_PERIOD = 14 * 24 * 60 * 60 * 1000;
const DELETION_DEMO_KEY = 'chatus.profile-deletion-demo.deadline';
function savedDeletionDeadline() {
  try { const value = Number(localStorage.getItem(DELETION_DEMO_KEY)); return Number.isFinite(value) && value > 0 ? value : null; } catch { return null; }
}
function storeDeletionDeadline(value: number | null) {
  try { if (value === null) localStorage.removeItem(DELETION_DEMO_KEY); else localStorage.setItem(DELETION_DEMO_KEY, String(value)); } catch { /* The demo also works without persistent browser storage. */ }
}
function ProfileDeletionReasons({ reason, note, onReason, onNote, onContinue }: { reason: number | null; note: string; onReason: (reason: number) => void; onNote: (note: string) => void; onContinue: () => void }) {
  const reduced = useReducedMotion(); const keyboard = useKeyboard(); const [focused, setFocused] = useState(false);
  const other = reason === DELETION_REASONS.length - 1;
  const ready = reason !== null && (!other || !!note.trim());
  return <>
    <MobileScroll className="profile-delete-scroll"><motion.div className="profile-delete-content" animate={{ y: focused ? -61 : 0 }} transition={reduced ? { duration: 0 } : UI_MOTION.scene}>
      <div className="profile-settings-group profile-delete-reasons" role="radiogroup" aria-label="Причина удаления">{DELETION_REASONS.map((label, index) => <button key={label} className="profile-settings-row" role="radio" aria-checked={reason === index} onClick={() => { keyboard.hide(); setFocused(false); onReason(index); }}><span>{label}</span><span className="profile-delete-choice" aria-hidden="true"><img src="/assets/deletion/reason-ring.svg" alt=""/><motion.svg viewBox="0 0 20 20" initial={false} animate={{ opacity: reason === index ? 1 : 0 }} transition={{ duration: reduced ? 0 : .26 }}><rect width="20" height="20" rx="10" fill="#FDAB1B"/><motion.path d="M6.66666 10.614L9.09614 13.0435C9.34616 13.2935 9.76911 13.2157 9.91374 12.8931L12.8072 6.43848" fill="none" stroke="#FCF8EC" strokeWidth="2" strokeLinecap="round" initial={false} animate={{ pathLength: reason === index ? 1 : 0 }} transition={{ duration: reduced ? 0 : .24 }}/></motion.svg></span></button>)}</div>
      <AnimatePresence initial={false}>{other && <motion.label className={`profile-delete-note ${focused || note ? 'is-floating' : ''} ${focused ? 'is-focused' : ''}`} initial={{ opacity: 0, y: reduced ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 4 }} transition={{ duration: reduced ? 0 : .3, ease: [.22, 1, .36, 1] }}><span>Напишите причину удаления</span><KeyboardTextarea aria-label="Напишите причину удаления" rows={5} maxLength={1000} autoComplete="off" inputMode="text" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} value={note} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); keyboard.hide(); }} onChange={event => onNote(event.target.value)} onKeyDown={event => { if (event.key === 'Escape' || event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); event.currentTarget.blur(); } }}/></motion.label>}</AnimatePresence>
    </motion.div></MobileScroll>
    <div className="profile-top-mask profile-delete-top-mask" style={{ opacity: focused ? 1 : 0 }} aria-hidden="true"/>
    <div className="profile-delete-footer"><p>Выберите причину удаления аккаунта</p><button className="profile-delete-primary" disabled={!ready} onPointerDown={event => event.preventDefault()} onClick={() => { if (ready) { keyboard.hide(); onContinue(); } }}>Продолжить</button></div>
    <div className="profile-bottom-mask profile-settings-bottom-mask" aria-hidden="true"><img src="/assets/profile/bottom-fade.svg" alt=""/></div><div className="profile-bottom-glass" aria-hidden="true"/>
  </>;
}
function ProfileDeleteSlider({ active, onConfirm }: { active: boolean; onConfirm: () => void }) {
  const reduced = useReducedMotion(); const x = useMotionValue(0); const maxTravel = 298;
  const labelOpacity = useTransform(x, [0, maxTravel * .25, maxTravel * .7], [1, .65, 0]);
  const [progress, setProgress] = useState(0); const [finishing, setFinishing] = useState(false);
  const drag = useRef<{ pointerId: number; startX: number; value: number; scale: number } | null>(null); const confirmed = useRef(false); const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => x.on('change', value => setProgress(Math.round(value / maxTravel * 100))), [x]);
  useEffect(() => () => { activeRef.current = false; x.stop(); }, [x]);
  const returnToStart = () => { x.stop(); if (reduced) x.set(0); else animate(x, 0, UI_MOTION.scene); };
  const confirm = async () => {
    if (confirmed.current || !activeRef.current) return;
    confirmed.current = true; setFinishing(true);
    await animate(x, maxTravel, { duration: reduced || maxTravel - x.get() < .5 ? 0 : .18, ease: [.22, 1, .36, 1] });
    if (activeRef.current) onConfirm();
  };
  return <div className="profile-delete-slider" data-finishing={finishing}>
    <motion.span className="profile-delete-shimmer" style={{ opacity: labelOpacity }}>Проведи для удаления</motion.span>
    <motion.button className="profile-delete-thumb" style={{ x }} role="slider" aria-label="Проведи для удаления" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${progress}%`} disabled={!active || finishing} data-scroll-drag="ignore"
      onPointerDown={event => { if (event.button !== 0 || finishing) return; event.preventDefault(); x.stop(); drag.current = { pointerId: event.pointerId, startX: event.clientX, value: x.get(), scale: event.currentTarget.getBoundingClientRect().width / 48 }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={event => { const session = drag.current; if (!session || session.pointerId !== event.pointerId) return; x.set(Math.max(0, Math.min(maxTravel, session.value + (event.clientX - session.startX) / session.scale))); }}
      onPointerUp={event => { if (drag.current?.pointerId !== event.pointerId) return; drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); if (x.get() >= maxTravel * .94) void confirm(); else returnToStart(); }}
      onPointerCancel={event => { if (drag.current?.pointerId !== event.pointerId) return; drag.current = null; returnToStart(); }}
      onKeyDown={event => { if (finishing) return; if (['ArrowRight', 'ArrowLeft', 'Home', 'End', 'Enter', ' '].includes(event.key)) event.preventDefault(); if (event.key === 'Home') returnToStart(); if (event.key === 'End') x.set(maxTravel); if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') x.set(Math.max(0, Math.min(maxTravel, x.get() + (event.key === 'ArrowRight' ? 1 : -1) * maxTravel / 10))); if ((event.key === 'Enter' || event.key === ' ') && x.get() >= maxTravel * .94) void confirm(); }}>
      <img className="profile-delete-thumb-glass" src="/assets/deletion/slider-glass.png" alt="" draggable={false}/><img className="profile-delete-thumb-arrow" src="/assets/deletion/slider-arrow.svg" alt="" draggable={false}/>
    </motion.button>
  </div>;
}
function ProfileDeleteConfirmation({ open, scale, screenHeight, onClose, onConfirm }: { open: boolean; scale: number; screenHeight: number; onClose: () => void; onConfirm: () => void }) {
  const reduced = useReducedMotion(); const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const update = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
  return <><style>{`.bottom-sheet:has(.profile-delete-confirm){height:${324 * scale}px;min-height:${324 * scale}px;max-height:none!important}`}</style>
    <BottomSheet open={open} onOpenChange={next => { if (!next) onClose(); }} title="Удалить аккаунт?" description="Можно отменить в течение 14 дней. Потом всё удалится навсегда" snap={324 * scale / screenHeight}>
      <div className="profile-settings-sheet profile-delete-confirm" data-motion={open && visible && !reduced} style={{ height: 324, transform: scale === 1 ? undefined : `scale(${scale})`, clipPath: "path('M0 64C0 41.5979 0 30.3968 4.35974 21.8404C8.19467 14.3139 14.3139 8.19467 21.8404 4.35974C30.3968 0 41.5979 0 64 0H338C360.402 0 371.603 0 380.16 4.35974C387.686 8.19467 393.805 14.3139 397.64 21.8404C402 30.3968 402 41.5979 402 64V324H0Z')" }}>
        <div className="profile-delete-confirm-copy"><h2>УДАЛИТЬ АККАУНТ?</h2><p>Можно отменить в течение 14 дней.<br/>Потом всё удалится навсегда</p></div>
        <div className="profile-settings-actions"><ProfileDeleteSlider active={open} onConfirm={onConfirm}/><button className="profile-settings-cancel" onClick={onClose}>Отмена</button></div>
      </div>
    </BottomSheet></>;
}
function ProfileDeletionPending({ deadline, onRestore }: { deadline: number; onRestore: () => void }) {
  const reduced = useReducedMotion(); const present = useIsPresent(); const [now, setNow] = useState(Date.now); const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); const update = () => { setNow(Date.now()); setVisible(!document.hidden); }; document.addEventListener('visibilitychange', update); return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); }; }, []);
  const remaining = Math.max(0, Math.floor((deadline - now) / 1000)); const expired = remaining === 0;
  const countdown = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60].map(value => String(value).padStart(2, '0')).join(':');
  return <motion.div className="profile-motion-scene profile-deletion-pending" data-profile-scene="deleting" data-motion={!reduced && visible && present} inert={!present} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .35 }}>
    <header className="profile-editor-header"><div className="profile-deletion-countdown"><h1>До удаления</h1><span role="timer" aria-label={`Осталось: ${countdown}`}><span>{countdown}</span></span></div></header>
    <div className="profile-deletion-pending-copy"><h2>{expired ? 'УДАЛЕНО' : 'УДАЛЕНИЕ   '}</h2><p>{expired ? 'Профиль, друзья, чаты и премиум удалены навсегда' : <>Через 14 дней профиль, друзья, чаты<br/>и премиум удалятся навсегда</>}</p></div>
    <div className="profile-deletion-pending-actions"><button className="profile-delete-primary" disabled={expired} onClick={onRestore}>Отменить удаление</button><button className="profile-delete-mail" aria-disabled="true"><span><img src="/assets/deletion/support-email.svg" alt=""/></span>Написать на почту</button></div>
  </motion.div>;
}
function ProfilePrototype({ demo, reset, preview, onLogout, onDialog, fromOnboarding = false, active = true, onDataChange }: { demo: number; reset: number; preview: ProfilePreview; onLogout:()=>void; onDialog:()=>void; fromOnboarding?:boolean; active?:boolean; onDataChange:(data:ProfileData)=>void }) {
  const { device } = useMobileDevice(); const keyboard = useKeyboard(); const { keyboardHeight, isKeyboardVisible } = useChatusKeyboardLayout();
  const scale = device.geometry.screen.width / 402;
  const appViewport = useChatusViewportLayout();
  const height = ((appViewport.native ? appViewport.height : device.geometry.screen.height) - (!appViewport.native && device.platform === 'android' ? device.geometry.safeArea.bottom : 0)) / scale;
  const [data, setData] = useState<ProfileData>(()=>preview==='basic'?onboardingProfile()??emptyProfile():emptyProfile()); const [draft, setDraft] = useState<ProfileData>(emptyProfile);
  const [field, setField] = useState<Exclude<ProfileField, 'bio'> | null>(null); const [editing, setEditing] = useState(false);
  const [bioFocused, setBioFocused] = useState(false); const [bioDraft, setBioDraft] = useState(''); const bioInput = useRef<HTMLLabelElement>(null); const nickInput = useRef<HTMLInputElement>(null);
  const bioEntry=useBioInput(bioDraft.replace(/[\r\n]+/g,' '),setBioDraft);
  const [presetVersion, setPresetVersion] = useState(0);
  const cancelBio = useRef(false);
  const [nicknameDirty, setNicknameDirty] = useState(false);
  const [nicknameCheck,setNicknameCheck]=useState<{value:string;status:'checking'|'taken'|'valid'}>({value:'',status:'checking'});
  const [nicknameEntering,setNicknameEntering]=useState(false);
  const [nicknameExit,setNicknameExit]=useState<{keyboardHeight:number;sheetY:number;keyboardY:number}|null>(null);
  const reduced=useReducedMotion();
  // Keep the sheet's actual content and dimensions until its runtime exit finishes.
  const [sheetField,setSheetField]=useState<Exclude<ProfileField,'bio'>>('avatar');
  const [nicknameSwap,setNicknameSwap]=useState<{previous:string;next:string;id:number}|null>(null);
  const nicknameSwapId=useRef(0);
  const overviewScroll=useMotionValue(0),editorScroll=useMotionValue(0);
  const setOverviewScroll=(value:number)=>overviewScroll.set(value),setEditorScroll=(value:number)=>editorScroll.set(value);
  const overviewMask=useTransform(overviewScroll,value=>value*value*(3-2*value));
  const editorMask=useTransform(editorScroll,value=>value*value*(3-2*value));
  const [settingsRoute,setSettingsRoute]=useState<SettingsRoute|null>(null);
  const [settingsSheet,setSettingsSheet]=useState<'appearance'|'logout'>('appearance');
  const [settingsSheetOpen,setSettingsSheetOpen]=useState(false);
  const [notifications,setNotifications]=useState(()=>NOTIFICATION_PREFERENCES.map(()=>true));
  const [mediaBlur,setMediaBlur]=useState(true);
  const [theme,setTheme]=useState<ProfileTheme>('system');const [draftTheme,setDraftTheme]=useState<ProfileTheme>('system');
  const [pendingLogout,setPendingLogout]=useState(false);
  const [deletionReason,setDeletionReason]=useState<number|null>(null); const [deletionNote,setDeletionNote]=useState('');
  const [deletionConfirmOpen,setDeletionConfirmOpen]=useState(false);
  const [deletionDeadline,setDeletionDeadline]=useState<number|null>(savedDeletionDeadline); const [deletionActive,setDeletionActive]=useState(()=>savedDeletionDeadline()!==null);
  useEffect(()=>{onDataChange(data);},[data,onDataChange]);
  useEffect(()=>{if(!active){keyboard.hide();setField(null);setSettingsSheetOpen(false);setDeletionConfirmOpen(false);setBioFocused(false);}},[active]);
  const previousReset=useRef(reset);
  const previousPreview=useRef(preview);
  const confirmDeletion=()=>{const deadline=Date.now()+DELETION_PERIOD;setDeletionDeadline(deadline);storeDeletionDeadline(deadline);setDeletionActive(true);setDeletionConfirmOpen(false);};
  const restoreAccount=()=>{if(!deletionDeadline||deletionDeadline<=Date.now())return;storeDeletionDeadline(null);setDeletionDeadline(null);setDeletionActive(false);setSettingsRoute(null);setEditing(false);setDeletionReason(null);setDeletionNote('');};
  useEffect(()=>{
    if(!pendingLogout)return;
    let frame=0;const finish=()=>{if(document.querySelector('.profile-settings-sheet')){frame=requestAnimationFrame(finish);return;}setPendingLogout(false);onLogout();};
    frame=requestAnimationFrame(finish);return()=>cancelAnimationFrame(frame);
  },[pendingLogout,onLogout]);
  const openSettingsSheet=(kind:'appearance'|'logout')=>{keyboard.hide();setDraftTheme(theme);setSettingsSheet(kind);setSettingsSheetOpen(true);};
  useEffect(() => {document.title='Chatus — профиль';return () => keyboard.hide();}, []);
  useEffect(() => {
    keyboard.hide(); setField(null); setNicknameExit(null);setBioFocused(false);setNicknameSwap(null);setOverviewScroll(0);setEditorScroll(0);
    const home = ['basic','premium','compact','empty'].includes(preview);
    const deletionPreview=['deletion','deletion-other','deletion-confirm','deleting'].includes(preview);
    const settingsPreview=['settings','notification-settings','appearance','logout'].includes(preview)||deletionPreview;
    setSettingsRoute(settingsPreview?deletionPreview?'deletion':preview==='notification-settings'?'notifications':'settings':null);
    setSettingsSheetOpen(preview==='appearance'||preview==='logout');setSettingsSheet(preview==='logout'?'logout':'appearance');setDraftTheme(theme);setPendingLogout(false);
    setDeletionReason(preview==='deletion-other'?4:preview==='deletion-confirm'?1:null);setDeletionNote('');setDeletionConfirmOpen(preview==='deletion-confirm');
    const resetChanged=reset!==previousReset.current;const previewChanged=preview!==previousPreview.current;
    previousReset.current=reset;previousPreview.current=preview;
    if(resetChanged||previewChanged)storeDeletionDeadline(null);
    const deadline=resetChanged?null:preview==='deleting'?Date.now()+DELETION_PERIOD:previewChanged?null:savedDeletionDeadline();
    setDeletionDeadline(deadline);setDeletionActive(deadline!==null);
    const restored = preview === 'basic' && !resetChanged ? onboardingProfile() : null;
    const next = restored ?? (fromOnboarding && preview === 'basic' ? emptyProfile() : settingsPreview || home && preview !== 'empty' || preview === 'complete' || preview === 'bio' ? completedProfile() : emptyProfile());
    if (preview === 'avatar') next.gender='Мужской';
    if (preview === 'bio') next.bio='';
    setData(next); setDraft(preview==='nickname'?{...next,nickname:'ЛунныйКот482'}:next); setNicknameDirty(false); setBioDraft(next.bio); setEditing(!home&&!settingsPreview); setPresetVersion(v=>v+1);
    if (['avatar','interests','age','gender','nickname'].includes(preview)){setSheetField(preview as Exclude<ProfileField,'bio'>);setField(preview as Exclude<ProfileField,'bio'>);}
  }, [preview, reset, fromOnboarding]);
  useEffect(() => {
    if (field !== 'nickname'||appViewport.native){setNicknameEntering(false);return;}
    setNicknameEntering(true);
    // Run after Radix has mounted its focus scope and BottomSheet has dismissed
    // the previous keyboard session. Both surfaces then start in one paint.
    let frame=requestAnimationFrame(function focusNickname(){
      if(!nickInput.current){frame=requestAnimationFrame(focusNickname);return;}
      nickInput.current.focus({preventScroll:true});
      keyboard.show(nickInput.current);
    });
    return()=>cancelAnimationFrame(frame);
  }, [field,appViewport.native]);
  useEffect(()=>{
    if(!nicknameEntering||field!=='nickname'||!isKeyboardVisible)return;
    const start=performance.now();let frame=0;
    const settle=()=>{
      const sheet=nickInput.current?.closest<HTMLElement>('.bottom-sheet');
      const transform=sheet?.style.transform;
      const y=transform&&transform!=='none'?new DOMMatrixReadOnly(transform).m42:0;
      // Release the temporary coupled entrance once the protected spring rests,
      // so the runtime still owns dragging and dismissal afterward.
      if(performance.now()-start>=(reduced?0:NICKNAME_ENTER_MS)&&Math.abs(y)<.25){setNicknameEntering(false);return;}
      frame=requestAnimationFrame(settle);
    };
    frame=requestAnimationFrame(settle);return()=>cancelAnimationFrame(frame);
  },[field,isKeyboardVisible,nicknameEntering,reduced]);
  useEffect(()=>{
    if(!nicknameExit)return;
    let frame=0;
    const settle=()=>{
      if(!nickInput.current?.isConnected){setNicknameExit(null);return;}
      frame=requestAnimationFrame(settle);
    };
    frame=requestAnimationFrame(settle);return()=>cancelAnimationFrame(frame);
  },[nicknameExit]);
  useEffect(()=>{
    if(field!=='nickname'||!nicknameDirty)return;
    const nickname=draft.nickname;
    if(!/^[\p{L}\p{N}]{3,20}$/u.test(nickname))return;
    setNicknameCheck({value:nickname,status:'checking'});
    const timer=window.setTimeout(()=>setNicknameCheck({value:nickname,status:['педик41см','admin','chatus','test'].includes(nickname.toLowerCase())?'taken':'valid'}),450);
    return()=>clearTimeout(timer);
  },[field,draft.nickname,nicknameDirty]);
  useEffect(() => {
    if (preview !== 'bio') return;
    const timer=window.setTimeout(()=>bioInput.current?.querySelector('input')?.focus({preventScroll:true}),400);return()=>clearTimeout(timer);
  }, [preview, presetVersion]);
  useEffect(() => {
    if (!demo) return;
    keyboard.hide();setField(null);setSettingsRoute(null);setSettingsSheetOpen(false);setEditing(true);setBioFocused(false);
    const next={...completedProfile(),bio:''};setData(next);setBioDraft('');
    const timer=window.setTimeout(()=>{setData(completedProfile());setBioDraft(completedProfile().bio);},1100);return()=>clearTimeout(timer);
  }, [demo]);
  const open = (key: Exclude<ProfileField,'bio'>) => {
    if(key==='avatar'&&!data.gender)return;
    keyboard.hide();
    const mount=()=>{setNicknameExit(null);setSheetField(key);setNicknameSwap(null);setNicknameDirty(false);setDraft({...data,age:key==='age'&&!data.age?'18':data.age,interests:[...data.interests]});setField(key);};
    // iOS accepts keyboard focus in the original tap, not a later animation frame.
    if(key==='nickname'&&appViewport.native){flushSync(mount);nickInput.current?.focus({preventScroll:true});}
    else mount();
  };
  const close = () => {
    if(field==='nickname'&&!appViewport.native){
      const sheet=nickInput.current?.closest<HTMLElement>('.bottom-sheet');
      const dock=sheet?.closest('.device-screen')?.querySelector<HTMLElement>('.keyboard-dock');
      const translateY=(element?:HTMLElement|null)=>{const transform=element?getComputedStyle(element).transform:'none';return transform==='none'?0:new DOMMatrixReadOnly(transform).m42;};
      // Hold the open geometry while both surfaces slide out together.
      setNicknameExit({keyboardHeight,sheetY:translateY(sheet),keyboardY:translateY(dock)});
      setNicknameEntering(false);
    }
    keyboard.hide();setField(null);
  };
  const save = () => {
    if(!changed||sheetField==='avatar'&&!data.gender)return;
    const next={...draft,nickname:draft.nickname.trim()};
    if(sheetField==='gender'&&draft.gender&&!data.gender){next.character=Math.floor(Math.random()*8);next.background=Math.floor(Math.random()*AVATAR_BACKGROUNDS.length);}
    persistProfile(next);setData(next);close();
  };
  const saveBio = (event:React.FocusEvent<HTMLInputElement>) => {const value=cancelBio.current?data.bio:bioEntry.finish(event.currentTarget);keyboard.hide();setBioFocused(false);if(cancelBio.current){cancelBio.current=false;return;}const next={...data,bio:value.trim()};persistProfile(next);setData(next);};
  const percent = profilePercent(data);
  const sheetHeight=sheetField==='avatar'?749:sheetField==='interests'?703:sheetField==='age'?547:sheetField==='gender'?431:632;
  const sheetKeyboardHeight=nicknameExit?.keyboardHeight??keyboardHeight;
  const visibleSheetHeight=sheetField==='nickname'?Math.max(260,sheetHeight-sheetKeyboardHeight/scale):sheetHeight;
  const nativeNicknameHeight=`max(260px,calc(${sheetHeight*scale}px - var(--chatus-native-keyboard)))`;
  const paintedSheetHeight=appViewport.native&&sheetField==='nickname'?nativeNicknameHeight:`${visibleSheetHeight*scale}px`;
  const value = (key: 'nickname'|'age'|'interests'|'gender') => key==='age'?data.age?ageRange(Number(data.age)):'' : key==='interests'?data.interests.length?`${PROFILE_INTERESTS.find(item=>item[0]===data.interests[0])?.[1].replace('Технологии и ИИ','Технологии')}${data.interests.length>1?`, +${data.interests.length-1}`:''}`:'' : data[key];
  const nicknameStatus=!nicknameDirty?'unchanged':!draft.nickname?'empty':!/^[\p{L}\p{N}]+$/u.test(draft.nickname)?'invalid':draft.nickname.length<3||draft.nickname.length>20?'length':nicknameCheck.value===draft.nickname?nicknameCheck.status:'checking';
  const nicknameError=['invalid','length','taken'].includes(nicknameStatus);
  const nicknameCaption=nicknameStatus==='invalid'?'Можно только буквы и цифры':nicknameStatus==='taken'?'Ник занят':nicknameStatus==='valid'?'Ник свободен':nicknameStatus==='checking'?'Проверяем ник…':'3–20 символов, без пробелов';
  const changed=sheetField==='nickname'?nicknameStatus==='valid'&&draft.nickname!==data.nickname&&nicknameDirty:sheetField==='gender'?!!draft.gender: true;
  return <>
    <main className="profile-editor-root" data-field={field || ''} data-nickname-enter={nicknameEntering} data-nickname-exit={nicknameExit!==null} data-editing={editing} onScrollCapture={event=>{if(event.target instanceof HTMLElement&&event.target.classList.contains('mobile-scroll')){const progress=Math.min(1,event.target.scrollTop/96);if(event.target.closest('[data-profile-scene="edit"]'))setEditorScroll(progress);else setOverviewScroll(progress);}}} aria-label={deletionActive?'Аккаунт удаляется':settingsRoute==='deletion'?'Удаление аккаунта':settingsRoute==='notifications'?'Уведомления':settingsRoute?'Настройки':editing?'Редактирование анкеты':'Профиль'}>
      <div className="profile-editor-canvas" style={{height,transform:`scale(${scale})`}}>
        <AnimatePresence initial={false}>{editing&&<ProfileScene key="edit" editing active={!settingsRoute&&!deletionActive}>
          <motion.header className="profile-editor-header" initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:reduced?0:.25}}><button className="profile-editor-back" aria-label="Вернуться в профиль" onClick={()=>{keyboard.hide();setEditing(false);}}><img src="/assets/auth/back.svg" alt=""/></button><div className="profile-editor-title"><h1>Анкета</h1><CompletionBadge key={presetVersion} percent={percent} persistent={preview==='complete'&&!demo}/></div><span className="profile-header-spacer"/></motion.header>
          <MobileScroll className="profile-editor-scroll"><div className="profile-editor-content">
            <div className="profile-editor-avatar"><div className="profile-avatar-box"><ProfileAvatar data={data}/></div><motion.button {...getPressProps(reduced)} className="profile-avatar-action profile-avatar-change" disabled={!data.gender} aria-expanded={field==='avatar'} onClick={()=>open('avatar')}><img className="profile-avatar-glass" src="/assets/profile/avatar-button-glass-3x.png" alt="" aria-hidden="true"/><span className="profile-avatar-change-icon" aria-hidden="true"><ProfileIcon name="avatar-edit"/></span><span>Изменить аватар</span></motion.button></div>
            <section className="profile-editor-form" aria-label="Поля анкеты">
              <label ref={bioInput} className={`profile-about-inline ${bioFocused?'is-focused':''} ${data.bio||bioFocused?'is-floating':''}`}><span>О себе</span><KeyboardInput aria-label="О себе" enterKeyHint="done" aria-description="До 50 символов" autoComplete="off" inputMode="text" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} value={(bioFocused?bioDraft:data.bio).replace(/[\r\n]+/g,' ')} onFocus={()=>{setBioDraft(data.bio);setBioFocused(true);}} onChange={bioEntry.onChange} onCompositionStart={bioEntry.onCompositionStart} onCompositionEnd={bioEntry.onCompositionEnd} onBlur={saveBio} onKeyDown={event=>{if(event.key==='Enter'&&!bioEntry.composing.current&&!event.nativeEvent.isComposing&&event.nativeEvent.keyCode!==229){event.preventDefault();event.currentTarget.blur();}if(event.key==='Escape'){cancelBio.current=true;setBioDraft(data.bio);event.currentTarget.blur();}}}/></label>
              <div className="profile-editor-rows">{(['nickname','age','interests','gender'] as const).map(key=><button className="profile-editor-row" key={key} onClick={()=>open(key)} aria-label={`Изменить: ${profileLabels[key]}`}><ProfileIcon name={key}/><span>{key==='interests'?'Интересы':profileLabels[key]}</span><span className="profile-row-value">{key==='gender'&&data.gender&&<img className="profile-gender-value-icon" src={`/assets/auth/profile-${data.gender==='Мужской'?'male':'female'}.svg`} alt=""/>}{value(key)}</span><ProfileChevron/></button>)}</div>
            </section>
          </div></MobileScroll>
          <motion.div className="profile-top-mask" style={{opacity:editorMask}} aria-hidden="true"/>
        </ProfileScene>}
        <ProfileScene key="overview" editing={false} active={!editing&&!settingsRoute&&!deletionActive}>
          <MobileScroll key={presetVersion} className="profile-overview-scroll"><div className={`profile-overview-content ${preview==='premium'?'has-premium':''}`}>
            <div className="profile-overview-header"><div className="profile-avatar-box"><ProfileAvatar data={data}/>{preview==='premium'&&<><ProfileIcon name="premium-ring"/><span className="profile-overview-diamond"><ProfileIcon name="diamond-white"/></span></>}</div>
              <div className="profile-overview-identity"><h1>{data.nickname}</h1>{data.age&&<div className="profile-overview-facts"><span className="profile-overview-gender"><img src={`/assets/auth/profile-${data.gender==='Женский'?'female':'male'}.svg`} alt=""/></span><span className="profile-overview-age">{ageRange(Number(data.age))}</span></div>}</div>
              <motion.button {...getPressProps(reduced)} className={`profile-avatar-action ${percent<100?'profile-complete-action':'profile-edit-action'}`} onClick={()=>{keyboard.hide();setEditorScroll(0);setEditing(true);}}><img className={percent<100?'profile-complete-glass':'profile-edit-glass'} src={`/assets/profile/${percent<100?'complete':'edit'}-profile-glass-3x.png`} alt="" aria-hidden="true"/><span className="profile-action-label"><ProfileIcon name="complete-profile-edit"/><span>{percent<100?'Заполнить профиль':'Редактировать'}</span></span>{percent<100&&<CompletionBadge percent={percent} persistent compact/>}</motion.button>
            </div>
            <div className="profile-overview-settings">
              {preview==='premium'?<button className="profile-premium-active" aria-disabled="true"><ProfileIcon name="diamond"/><span>Премиум активен</span><ProfileChevron/></button>:<ProfilePremiumPanel active={active&&!editing&&!settingsRoute&&!deletionActive}/>}
              <div className="profile-editor-rows">{[['evaluation','Мои оценки'],['download','Установить приложение'],['invite','Пригласить друга'],['preferences','Настройки']].map(([icon,label])=><button className="profile-editor-row" key={icon} aria-disabled={icon==='preferences'?undefined:true} onClick={icon==='preferences'?()=>{keyboard.hide();setSettingsRoute('settings');}:undefined}><ProfileIcon name={icon}/><span>{label}</span>{icon==='evaluation'&&<div className="profile-ratings"><span><i><ProfileIcon name="like"/></i><b>0</b></span><span><i><ProfileIcon name="dislike"/></i><b>0</b></span></div>}<span className="profile-row-value"/><ProfileChevron/></button>)}</div>
              <div className="profile-editor-rows"><button className="profile-editor-row" aria-disabled="true"><ProfileIcon name="support"/><span>Поддержка</span><span className="profile-row-value"/><ProfileChevron/></button></div>
            </div>
          </div></MobileScroll><div className="profile-bottom-mask" aria-hidden="true"><img src="/assets/profile/bottom-fade.svg" alt=""/></div><div className="profile-bottom-glass" aria-hidden="true"/>
          <motion.div className="profile-top-mask" style={{opacity:overviewMask}} aria-hidden="true"/>
        </ProfileScene>
        {settingsRoute&&<ProfileSettingsScene key="settings" kind="settings" active={settingsRoute==='settings'&&!deletionActive}>
          <ProfileSettingsHeader title="Настройки" onBack={()=>{keyboard.hide();setSettingsRoute(null);}}/>
          <MobileScroll className="profile-settings-scroll"><div className="profile-settings-content">
            <div className="profile-settings-group">{([['notification','Уведомления'],['appearance','Оформление']] as const).map(([icon,label])=><button className="profile-settings-row" key={icon} onClick={()=>icon==='notification'?setSettingsRoute('notifications'):openSettingsSheet('appearance')}><img src={`/assets/settings/${icon}.svg`} alt=""/><span>{label}</span><ProfileChevron/></button>)}<button className="profile-settings-row" role="switch" aria-checked={mediaBlur} onClick={()=>setMediaBlur(value=>!value)}><img src="/assets/settings/media-blur.svg" alt=""/><span>Блюр медиа</span><span className="profile-settings-toggle" aria-hidden="true" data-on={mediaBlur}><motion.i initial={false} animate={{x:mediaBlur?20:0}} transition={reduced?{duration:0}:UI_MOTION.surface}/></span></button></div>
            <div className="profile-settings-group"><button className="profile-settings-row" onClick={()=>openSettingsSheet('logout')}><img src="/assets/settings/logout-source.svg" alt=""/><span>Выйти из аккаунта</span><ProfileChevron/></button><button className="profile-settings-row is-destructive" onClick={()=>{keyboard.hide();setSettingsRoute('deletion');}}><img src="/assets/settings/delete-source.svg" alt=""/><span>Удалить аккаунт</span><ProfileChevron/></button></div>
          </div></MobileScroll><div className="profile-bottom-mask profile-settings-bottom-mask" aria-hidden="true"><img src="/assets/profile/bottom-fade.svg" alt=""/></div><div className="profile-bottom-glass" aria-hidden="true"/>
        </ProfileSettingsScene>}
        {settingsRoute==='notifications'&&<ProfileSettingsScene key="notification-settings" kind="notifications">
          <ProfileSettingsHeader title="Уведомления" onBack={()=>setSettingsRoute('settings')}/>
          <MobileScroll className="profile-settings-scroll"><div className="profile-settings-content"><div className="profile-settings-group profile-notifications-group">{NOTIFICATION_PREFERENCES.map((label,index)=><button key={label} className="profile-settings-row" role="switch" aria-checked={notifications[index]} onClick={()=>setNotifications(current=>current.map((value,i)=>i===index?!value:value))}><span>{label}</span><span className="profile-settings-toggle" aria-hidden="true" data-on={notifications[index]}><motion.i initial={false} animate={{x:notifications[index]?20:0}} transition={reduced?{duration:0}:UI_MOTION.scene}/></span></button>)}</div></div></MobileScroll><div className="profile-bottom-mask profile-settings-bottom-mask" aria-hidden="true"><img src="/assets/profile/bottom-fade.svg" alt=""/></div><div className="profile-bottom-glass" aria-hidden="true"/>
        </ProfileSettingsScene>}
        {settingsRoute==='deletion'&&<ProfileSettingsScene key="deletion-reasons" kind="deletion" active={!deletionActive}>
          <ProfileSettingsHeader title="Удаление аккаунта" onBack={()=>{keyboard.hide();setSettingsRoute('settings');}}/>
          <ProfileDeletionReasons reason={deletionReason} note={deletionNote} onReason={setDeletionReason} onNote={setDeletionNote} onContinue={()=>{keyboard.hide();setDeletionConfirmOpen(true);}}/>
        </ProfileSettingsScene>}
        {deletionActive&&deletionDeadline!==null&&<ProfileDeletionPending key="deleting" deadline={deletionDeadline} onRestore={restoreAccount}/>}
        </AnimatePresence>
        {!deletionActive&&(settingsRoute||!editing||percent!==100&&!bioFocused)&&<ProfileNavigation onDialog={onDialog}/>}
      </div>
    </main>
      <style>{`.bottom-sheet:has(.profile-source-sheet){height:${paintedSheetHeight};min-height:${paintedSheetHeight};max-height:none!important;--profile-keyboard-cover:${sheetKeyboardHeight}px}.device-screen:has(.profile-editor-root){--profile-nickname-enter-duration:${NICKNAME_ENTER_MS}ms;--profile-nickname-travel:${632*scale}px;--profile-nickname-exit-travel:${632*scale+36}px;--profile-nickname-sheet-exit-start:${nicknameExit?.sheetY??0}px;--profile-nickname-keyboard-exit-start:${nicknameExit?.keyboardY??0}px}.device-screen:has(.profile-editor-root[data-nickname-exit="true"]) .bottom-sheet:has(.profile-source-sheet[data-field="nickname"]){bottom:calc(${sheetKeyboardHeight}px - var(--chatus-sheet-overlap,0px))!important}`}</style>
    <BottomSheet open={field!==null} onOpenChange={value=>{if(!value)close();}} title={profileLabels[sheetField]} initialFocus={sheetField==='nickname'?nickInput:undefined} snap={sheetHeight*scale/device.geometry.screen.height}>
      <div className="profile-source-sheet" data-field={sheetField} style={{height:appViewport.native&&sheetField==='nickname'?`max(${260/scale}px,calc(${sheetHeight}px - var(--chatus-native-keyboard) / ${scale}))`:visibleSheetHeight,transform:`scale(${scale})`,clipPath:`path('M0 64C0 41.5979 0 30.3968 4.35974 21.8404C8.19467 14.3139 14.3139 8.19467 21.8404 4.35974C30.3968 0 41.5979 0 64 0H338C360.402 0 371.603 0 380.16 4.35974C387.686 8.19467 393.805 14.3139 397.64 21.8404C402 30.3968 402 41.5979 402 64V${visibleSheetHeight}H0Z')`}}>
        <h2>{profileLabels[sheetField]}</h2><motion.button {...getPressProps(reduced)} className="profile-source-close" onPointerDown={event=>event.preventDefault()} onClick={close} aria-label="Закрыть без сохранения"><img src="/assets/auth/notification-close.svg" alt=""/></motion.button>
        {sheetField==='avatar'&&<div className="profile-source-avatar-editor"><div className="profile-source-avatar-preview"><ProfileAvatar data={draft}/></div><div className="profile-source-color-controls"><p>Цвет фона</p><div className="profile-source-swatches">{AVATAR_BACKGROUNDS.map(([label],index)=><button key={label} aria-label={label} aria-pressed={draft.background===index} className={draft.background===index?'is-selected':''} onClick={()=>setDraft({...draft,background:index})}><span style={{background:avatarBackground(index)}}/></button>)}</div></div><div className="profile-source-character-controls"><p>Выбери персонажа</p><div className="profile-source-characters">{Array.from({length:8},(_,index)=><button key={index} aria-label={`Персонаж ${index+1}`} aria-pressed={draft.character===index} className={draft.character===index?'is-selected':''} onClick={()=>setDraft({...draft,character:index})}><span className="profile-source-character-art" style={{clipPath:`path('${PROFILE_AVATAR_CONTOUR}')`}}><ProfileAvatar data={{...draft,character:index}}/></span><svg viewBox="0 0 89 89" aria-hidden="true"><path d={PROFILE_AVATAR_CONTOUR} transform="translate(1 1) scale(1.12987013)" fill="none" stroke="#1c1407" strokeWidth="2"/></svg></button>)}</div></div></div>}
        {sheetField==='interests'&&<MobileScroll className="profile-source-interest-scroll"><div className="profile-source-interest-options">{PROFILE_INTERESTS.map(([id,label,width])=><button key={id} className={`auth-interest ${draft.interests.includes(id)?'is-selected':''}`} style={{width:id==='music'||id==='books'?94:width}} aria-pressed={draft.interests.includes(id)} onClick={()=>setDraft({...draft,interests:draft.interests.includes(id)?draft.interests.filter(value=>value!==id):[...draft.interests,id]})}><img src={`/assets/auth/interest-${id}.svg`} alt=""/><span>{label}</span></button>)}</div></MobileScroll>}
        {sheetField==='age'&&<ProfileAgeWheel age={Number(draft.age)||18} onChange={age=>setDraft({...draft,age:String(age)})}/>}
        {sheetField==='gender'&&<div className="profile-source-genders">{['Мужской','Женский'].map((gender,index)=><button key={gender} className={draft.gender===gender?'is-selected':''} aria-pressed={draft.gender===gender} onClick={()=>setDraft({...draft,gender})}><img src={`/assets/auth/gender-${index?'female':'male'}.png`} alt=""/><span>{gender}</span><span className="profile-gender-selection" aria-hidden="true"/><i><motion.svg width="12" height="12" viewBox="0 0 12 12" initial={false} animate={{opacity:draft.gender===gender?1:0,scale:draft.gender===gender?1:.8}} transition={{duration:reduced?0:.24}}><motion.path d="M2 6l2.5 2.5L10 3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{pathLength:draft.gender===gender?1:0}} transition={{duration:reduced?0:.24}}/></motion.svg></i></button>)}</div>}
        {sheetField==='nickname'&&<div className={`profile-source-nickname is-${nicknameStatus}`}><label className={nicknameSwap?'is-swapping':''}><span>Никнейм</span><KeyboardInput ref={nickInput} aria-label="Никнейм" aria-invalid={nicknameError} aria-describedby="profile-nickname-caption" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={20} value={draft.nickname} onBlur={()=>keyboard.hide()} onChange={event=>{nicknameSwapId.current++;setNicknameSwap(null);setNicknameDirty(true);setDraft({...draft,nickname:event.target.value});}} onKeyDown={event=>{if(event.key==='Enter'&&changed&&!event.nativeEvent.isComposing&&event.nativeEvent.keyCode!==229){event.preventDefault();save();}}}/>{nicknameSwap&&<div className="profile-nickname-swap" aria-hidden="true"><AnimatePresence><motion.span key={nicknameSwap.previous} initial={{y:0}} animate={{y:-22}} exit={{y:-22}} transition={UI_MOTION.surface}>{nicknameSwap.previous}</motion.span><motion.span key={nicknameSwap.next} initial={{y:22}} animate={{y:0}} exit={{y:-22}} transition={UI_MOTION.surface} onAnimationComplete={()=>{setNicknameSwap(current=>current?.id===nicknameSwap.id?null:current);if(nicknameSwapId.current===nicknameSwap.id&&document.activeElement===nickInput.current)nickInput.current?.setSelectionRange(nicknameSwap.next.length,nicknameSwap.next.length);}}>{nicknameSwap.next}</motion.span></AnimatePresence></div>}<button aria-label="Случайный никнейм" onPointerDown={event=>event.preventDefault()} onClick={()=>{const names=['ЛунныйКот482','ДобрыйЛис19','ТихийВолк75'].filter(name=>name!==draft.nickname);const next=names[Math.floor(Math.random()*names.length)];if(!reduced)setNicknameSwap({previous:draft.nickname,next,id:++nicknameSwapId.current});setNicknameDirty(true);setDraft({...draft,nickname:next});}}><img src="/assets/profile/nickname-dice.svg" alt=""/></button></label><p id="profile-nickname-caption" role="status">{nicknameStatus==='valid'?<img src="/assets/auth/check.svg" alt=""/>:nicknameStatus==='taken'?<span aria-hidden="true">×</span>:nicknameStatus==='checking'?<i className="profile-nickname-checking" aria-hidden="true"/>:null}{nicknameCaption}</p></div>}
        <div className="profile-source-actions"><motion.button {...getPressProps(reduced)} className="profile-source-save" disabled={!changed} onPointerDown={event=>event.preventDefault()} onClick={save}>Сохранить</motion.button>{sheetField==='avatar'&&<motion.button {...getPressProps(reduced)} className="profile-source-random" onClick={()=>setDraft({...draft,character:Math.floor(Math.random()*8),background:Math.floor(Math.random()*7)})}><span className="profile-source-random-icon"><img src="/assets/auth/dice.svg" alt=""/></span><span className="profile-source-random-label">Случайный аватар</span></motion.button>}</div>
      </div>
    </BottomSheet>
    <ProfileSettingsSheet open={settingsSheetOpen} kind={settingsSheet} scale={scale} screenHeight={device.geometry.screen.height} theme={theme} draftTheme={draftTheme} onThemeChange={setDraftTheme} onSave={()=>{setTheme(draftTheme);setSettingsSheetOpen(false);}} onClose={()=>setSettingsSheetOpen(false)} onLogout={()=>{setSettingsSheetOpen(false);setPendingLogout(true);}}/>
    <ProfileDeleteConfirmation open={deletionConfirmOpen} scale={scale} screenHeight={device.geometry.screen.height} onClose={()=>setDeletionConfirmOpen(false)} onConfirm={confirmDeletion}/>
  </>;
}

const DIALOG_FADE_TRANSITION = UI_MOTION.fade;

function DialogIcon({ name, className = '' }: { name: string; className?: string }) {
  return <img className={className} src={`/assets/dialog/${name}.svg`} alt="" draggable={false}/>;
}
function DialogSpoiler({ active = true, onPremium }: { active?: boolean; onPremium:(trigger:HTMLButtonElement)=>void }) {
  const reduced = useReducedMotion(); const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => { const update = () => setVisible(!document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
  const shader = useMemo(() => ({ setup: setupDialogSpoiler, render: renderDialogSpoiler, manifest: { ...dialogSpoilerManifest, isAnimated: visible && active && !reduced }, params: {
    particleSize: 1.399999976158142, particleColor: { r: .10980392247438431, g: .0784313753247261, b: .027450980618596077, a: .5600000023841858 },
    reveal: 0, animationSpeed: reduced ? 0 : 1.0500000715255737, bubbleColor: { r: .9764705896377563, g: .9764705896377563, b: .9764705896377563, a: 1 }, particleDensity: .25999999046325684,
  } }), [visible, active, reduced]);
  return <button type="button" className="dialog-spoiler" aria-label="Пол и возраст скрыты — открыть премиум" aria-haspopup="dialog" onPointerDown={event=>{if(document.activeElement?.matches('input,textarea,[contenteditable=true]'))event.preventDefault();}} onClick={event=>onPremium(event.currentTarget)}><img src="/assets/dialog/spoiler-fallback.png" alt=""/><ShaderFill width={56} height={24} shader={shader}/></button>;
}
function DialogProfileCard({active=true,onPremium}:{active?:boolean;onPremium:(trigger:HTMLButtonElement)=>void}){
 const tilt=useCardTilt(),card=useRef<HTMLElement>(null),inView=useInView(card);
 return <motion.article ref={card} className="dialog-profile-card" aria-label="Карточка собеседника" data-held={tilt.held} data-scroll-drag={tilt.held?'ignore':undefined} style={tilt.style} {...tilt.handlers}>
 <motion.div className="dialog-card-reflection" aria-hidden="true" style={{background:tilt.reflection,opacity:tilt.reflectionOpacity}}/>
    <p className="dialog-bio">Люблю тихие вечера и длинные разговоры ни о чём</p>
    <div className="dialog-hidden-fact"><p className="dialog-caption">Пол и возраст</p><DialogSpoiler active={active&&inView} onPremium={onPremium}/></div>
    <div className="dialog-interests"><p className="dialog-caption">Интересы</p><div className="dialog-tags">{([['music','Музыка',57],['technology','Технологии и ИИ',123],['meme','Мемы',45],['fashion','Мода',41],['pets','Питомцы',68]] as const).map(([id,label,width])=><span className="dialog-tag" key={id}><span><DialogIcon name={`interest-${id}`}/></span><span className="dialog-tag-label" style={{width}}>{label}</span></span>)}</div></div>
    <div className="dialog-reactions" aria-label="Оценки собеседника"><span className="dialog-reaction is-positive" aria-label="Положительные оценки: 24"><span><DialogIcon name="like"/></span><b>24</b></span><span className="dialog-reaction is-negative" aria-label="Отрицательные оценки: 7"><span><DialogIcon name="dislike"/></span><b>7</b></span></div>
 </motion.article>;
}
function DialogPresence({ ended, preview }: { ended: boolean; preview: ChatPreview }) {
  const presence=chatPresence(preview);
  const reduced = useReducedMotion();
  return <span className="dialog-presence" style={{width:ended?113:presence.width}} role="status" aria-live="polite" aria-label={ended ? 'Диалог завершён' : presence.label}>
    {[presence.label, 'Диалог завершён'].map((label,index)=><motion.span key={label} aria-hidden="true" initial={false} style={{color:index===1?'rgb(28 20 7/.56)':undefined}}
      animate={{ opacity: ended === Boolean(index) ? 1 : 0 }} transition={reduced ? { duration: 0 } : DIALOG_FADE_TRANSITION}>{label}</motion.span>)}
  </span>;
}
type HistoryBubbleProps = {message:ChatMessage;groupEnd:boolean;active:boolean;selected?:boolean;onReply:(message:ChatMessage)=>void;onQuote:(id:string)=>void;onActions:(message:ChatMessage,element:HTMLElement)=>void;onReact:(id:string,emoji:string)=>void};
const HistoryBubble=memo(function HistoryBubble({message,groupEnd,active,selected,onReply,onQuote,onActions,onReact}:HistoryBubbleProps){
  return <ChatBubble message={message} groupEnd={groupEnd} active={active} selected={selected} onReply={onReply} onQuote={onQuote} onActions={onActions} onReact={emoji=>onReact(message.id,emoji)}/>;
});
const StablePeerProfile=memo(PeerProfile);
const StableDialogCard=memo(DialogProfileCard);
const StableFriendshipCard=memo(ChatFriendshipCard);
function DialogPrototype({ onProfile, onHome, active = true, peerPreview, peerRequest, chatPreview }: { onProfile: () => void; onHome: () => void; active?:boolean; peerPreview: PeerPreview; peerRequest: number; chatPreview: ChatPreview }) {
  const { device } = useMobileDevice(); const keyboard = useKeyboard(); const { bottomInset, keyboardHeight, isKeyboardVisible, keyboardDragging } = useChatusKeyboardLayout(); const reduced = useReducedMotion();
  const appViewport = useChatusViewportLayout();
  const scale = device.geometry.screen.width / 402; const androidInset = !appViewport.native && device.platform === 'android' ? device.geometry.safeArea.bottom : 0;
  const height = ((appViewport.native ? appViewport.height : device.geometry.screen.height) - androidInset) / scale;
  const keyboardInset = Math.max(0, keyboardHeight - androidInset) / scale;
  const [stickersOpen,setStickersOpen]=useState(chatPreview==='stickers');
  const [circleRecorder,setCircleRecorder]=useState<CircleRecorderMode|undefined>(()=>chatScenario(chatPreview).circleRecorder);
  const [menuMode, setMenuMode] = useState(!chatScenario(chatPreview).actions); const [actionsOpen, setActionsOpen] = useState(()=>chatScenario(chatPreview).actions); const draftStore = useMemo(()=>createChatDraft(chatScenario(chatPreview).draft),[]); const setDraft=draftStore.set;
  const [reply, setReply] = useState<ChatMessage | null>(()=>chatScenario(chatPreview).reply); const [composerHeight, setComposerHeight] = useState(64);
  const pendingSendLayout=useRef<{id:string;from:number;target:number;progress:number;clearanceFrom?:number;clearanceRow?:string}|null>(null);
  const autoScroll=useRef<{stop:()=>void}|null>(null);
  const scrollGap=useMotionValue(0),recordingClearance=useMotionValue(0);
  const [scrollRequest, setScrollRequest] = useState(0); const pinBottom = useRef(true); const previewApplied=useRef<ChatPreview>(chatPreview);
  const [messages, setMessages] = useState<ChatMessage[]>(()=>chatScenario(chatPreview).messages);
  const messageTails=useMemo(()=>messageTailFlags(messages),[messages]);
  const latestFriendshipMessage=messages.filter(message=>message.friendship).at(-1);
  const friendship = latestFriendshipMessage?.friendship ?? null;
  const friend = friendship?.state === 'accepted';
  const peerKnown = messages.some(message=>message.friendship?.direction==='incoming'||message.friendship?.state==='accepted');
  const incomingFriendAction = friendship?.direction==='incoming'&&friendship.state!=='declined';
  const changeFriendship = (state:Friendship['state'])=>setMessages(current=>setFriendshipState(current,state));
  const [ended, setEnded] = useState(chatPreview==='ended'||chatPreview==='rated'); const [rating, setRating] = useState<'like' | 'dislike' | null>(chatPreview==='rated'?'like':null);
  const [endConfirmation, setEndConfirmation] = useState(chatPreview==='end-confirm');
  const [nextConfirm,setNextConfirm]=useState(false),nextDeadline=useRef(0),nextTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const clearNextConfirmation=()=>{clearTimeout(nextTimer.current);nextDeadline.current=0;setNextConfirm(false);};
  useEffect(()=>{clearNextConfirmation();return()=>clearTimeout(nextTimer.current);},[active,chatPreview]);
  const [premiumOpen,setPremiumOpen]=useState(false);
  const premiumTrigger=useRef<HTMLElement|null>(null);
  const openPremium=useStableEvent((trigger:HTMLButtonElement)=>{premiumTrigger.current=trigger;keyboard.hide();setMessageMenu(null);setPremiumOpen(true);});
  const [messageMenu, setMessageMenu] = useState<MessageMenu | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const editRestore = useRef<{draft:string;reply:ChatMessage|null}|null>(null);
  const menuTarget = useRef<HTMLElement | null>(null);
  const [toast,setToast] = useState('');
  const attachmentsRef=useRef<ChatAttachmentsHandle>(null);
  const [attachmentOpen,setAttachmentOpen]=useState(false),[mediaBusy,setMediaBusy]=useState(false),[mediaReset,setMediaReset]=useState(0);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2600);return()=>clearTimeout(timer);},[toast]);
  const [peerOpen, setPeerOpen] = useState(() => new URLSearchParams(location.search).has('peer'));
  const recording = useVoiceRecording(message=>{
    const pending=pendingSendLayout.current;
    if(pending?.clearanceFrom!==undefined&&pending.id==='')pending.id='chat-'+message.id;
    setMessages(current=>[...current,{...message,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'})}]);setReply(null);setScrollRequest(value=>value+1);
  });
  const peerTrigger = useRef<HTMLButtonElement>(null);
  const openPeer = () => { setCircleRecorder(undefined);recording.cancel(); keyboard.hide(); setMessageMenu(null); setPeerOpen(true); };
  const closePeer = () => { keyboard.hide(); setPeerOpen(false); };
  useEffect(() => { if (peerRequest) { setCircleRecorder(undefined);recording.cancel(); keyboard.hide(); setPeerOpen(true); } }, [peerRequest]);
  const root = useRef<HTMLElement>(null);
  const followBottom=useRef<()=>void>(()=>{});
  const geometry=useRef<{bottom:number;composer:number;actions:number;travel:number;mask:number}|null>(null);
  const nativeActions=useMotionValue(ended?140:stickersOpen?249:actionsOpen?140:0);
  const nativeActionHandoff=useRef<{budget:number}|null>(null);
  const trailingFriendship=Boolean(messages.at(-1)?.friendship);
  useLayoutEffect(()=>{
    const pending=pendingSendLayout.current;
    if(pending?.clearanceFrom!==undefined&&!recording.error&&active&&!ended)return;
    if(pending?.clearanceFrom!==undefined)pendingSendLayout.current=null;
    // The source auxiliary strip is60px above the bar. Keep a trailing event
    // clear of it; ordinary authored message/recording screens are unaffected.
    const target=recording.mode!=='idle'&&trailingFriendship?60:0;
    if(reduced||!active){recordingClearance.jump(target);return;}
    const control=animate(recordingClearance,target,UI_MOTION.surface);
    return()=>control.stop();
  },[recording.mode,recording.error,trailingFriendship,active,ended,reduced,recordingClearance]);
  const sendRecording=()=>{
    const clearance=recordingClearance.get();
    if(clearance>0&&latestFriendshipMessage){
      recordingClearance.jump(clearance);
      pendingSendLayout.current={id:'',from:geometry.current?.composer??composerHeight,target:64,progress:0,clearanceFrom:clearance,clearanceRow:'chat-'+latestFriendshipMessage.id};
    }
    recording.finish();
  };
  const measureComposer=useStableEvent((height:number)=>{
    const pending=pendingSendLayout.current;
    if(pending){pending.target=height;pending.from=Math.max(pending.from,height);}
    setComposerHeight(height);
  });
  const focusInput = () => root.current?.querySelector<HTMLTextAreaElement>('.chat-text-entry')?.focus({preventScroll:true});
  const openKeyboard = () => { if (ended) return; setStickersOpen(false);setMenuMode(true); setActionsOpen(false); focusInput(); };
  const showMenuIcon = menuMode && !actionsOpen;
  const toggleMenu = () => {setStickersOpen(false); if (actionsOpen || !menuMode) { openKeyboard(); return; } keyboard.hide(); setActionsOpen(true); };
  const cancelEdit = () => { setEditing(null); if(editRestore.current){setDraft(editRestore.current.draft);setReply(editRestore.current.reply);} editRestore.current=null; };
  const send = () => {
    const value=draftStore.get().trim();if(!value||ended)return;
    if(editing){setMessages(current=>editMessage(current,editing.id,value));cancelEdit();return;}
    const id='text-'+crypto.randomUUID();
    if(appViewport.native)pendingSendLayout.current={id:'chat-'+id,from:geometry.current?.composer??composerHeight,target:64,progress:0};
    setMessages(current=>[...current,{id,outgoing:true,text:value,reply:reply?{id:reply.id,text:reply.duration!==undefined?'Голосовое сообщение':reply.text??''}:undefined,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'}),fresh:true}]);
    setDraft('');setReply(null);setScrollRequest(value=>value+1);
  };
  const next = () => { clearNextConfirmation();pendingSendLayout.current=null;setCircleRecorder(undefined);setStickersOpen(false);setAttachmentOpen(false);setMediaBusy(false);setMediaReset(value=>value+1);recording.reset();keyboard.hide(); setDraft('');setReply(null); setMessages([]); setEnded(false); setRating(null); setEndConfirmation(false); setMessageMenu(null); setEditing(null); editRestore.current=null; setActionsOpen(true);setScrollRequest(value=>value+1); };
  const chooseReply = (message:ChatMessage) => {if(ended)return;if(editing){setEditing(null);setDraft(editRestore.current?.draft??'');editRestore.current=null;}setMessageMenu(null);setReply(message);openKeyboard();};
  const openMessageActions = (message:ChatMessage, element:HTMLElement) => {
    if(!active)return;recording.cancel();keyboard.hide();menuTarget.current=element;
    const canvas=root.current?.querySelector<HTMLElement>('.dialog-canvas');if(!canvas)return;
    const rect=canvas.getBoundingClientRect();setMessageMenu({message,top:(element.getBoundingClientRect().top-rect.top)/(rect.width/402)});
  };
  const dismissMessageActions = () => {setMessageMenu(null);menuTarget.current?.focus({preventScroll:true});};
  const selectReaction = (id:string,emoji:string) => {setMessages(current=>reactToMessage(current,id,emoji));setMessageMenu(null);};
  const editSelected = (message:ChatMessage) => {if(!message.outgoing||!message.text||ended)return;if(!editing)editRestore.current={draft:draftStore.get(),reply};setEditing(message);setReply(null);setDraft(message.text);setMessageMenu(null);openKeyboard();};
  const messageAction = (action:'reply'|'copy'|'edit'|'report'|'delete') => {
    const message=messageMenu?.message;if(!message)return;setMessageMenu(null);
    if(action==='reply')chooseReply(message);
    else if(action==='edit')editSelected(message);
    else if(action==='delete'){if(editing?.id===message.id)cancelEdit();setMessages(current=>current.filter(item=>item.id!==message.id));}
    else if(action==='report')setToast('В прототипе жалоба не отправляется');
    else if(action==='copy')void navigator.clipboard.writeText(message.text??'').then(()=>setToast('Текст скопирован')).catch(()=>setToast('Не удалось скопировать текст'));
  };
  const friendAction = () => {
    if(ended)return;
    if(friendship?.direction==='incoming'&&friendship.state==='pending'){changeFriendship('accepted');return;}
    if(friendship&&friendship.state!=='declined')return;setMessages(current=>[...current,{id:'friendship-'+crypto.randomUUID(),outgoing:true,friendship:{direction:'outgoing',state:'pending'},fresh:true}]);setScrollRequest(value=>value+1);
  };
  const requestNext=()=>{
    if(Date.now()<nextDeadline.current){next();closePeer();return;}
    nextDeadline.current=Date.now()+5000;setNextConfirm(true);clearTimeout(nextTimer.current);
    nextTimer.current=setTimeout(clearNextConfirmation,5000);
  };
  const finishDialog = () => {clearNextConfirmation();setCircleRecorder(undefined);recording.cancel();keyboard.hide();setEnded(true);setEndConfirmation(false);setMessageMenu(null);setEditing(null);editRestore.current=null;setReply(null);setDraft('');setActionsOpen(false);pinBottom.current=true;setScrollRequest(value=>value+1);};
  const requestEnd = () => {clearNextConfirmation();recording.cancel();keyboard.hide();setMessageMenu(null);if(requiresEndConfirmation(messages.filter(message=>!message.friendship).length))setEndConfirmation(true);else finishDialog();};
  useEffect(()=>{if(active)document.title='Chatus — диалог';else{setCircleRecorder(undefined);recording.cancel();keyboard.hide();setMessageMenu(null);} },[active]);
  useEffect(()=>{const hide=()=>{if(document.hidden)recording.cancel();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
  const goToQuote = (id:string) => { const scroll=root.current?.querySelector<HTMLElement>('.dialog-scroll .mobile-scroll'), target=root.current?.querySelector<HTMLElement>(`#chat-${id}`);if(!scroll||!target)return;pinBottom.current=false;const scaleY=scroll.getBoundingClientRect().height/scroll.clientHeight;scroll.scrollTo({top:scroll.scrollTop+(target.getBoundingClientRect().top-scroll.getBoundingClientRect().top)/scaleY-156,behavior:reduced?'instant':'smooth'});target.animate([{filter:'brightness(1)'},{filter:'brightness(.94)'},{filter:'brightness(1)'}],{duration:reduced?0:650});};

  useLayoutEffect(() => {
    const scroll = root.current?.querySelector<HTMLElement>('.dialog-scroll .mobile-scroll'); const content = scroll?.querySelector<HTMLElement>('.mobile-scroll-content'); const history=root.current?.querySelector<HTMLElement>('.dialog-history');
    if (!scroll || !content || !history) return;
    let paintedTop=scroll.scrollTop;
    const follow=()=>{
      if(!pinBottom.current&&!autoScroll.current)return;
      const max=Math.max(0,scroll.scrollHeight-scroll.clientHeight);
      paintedTop=Math.max(0,max-(pinBottom.current?0:scrollGap.get()));
      scroll.scrollTop=paintedTop;
      paintedTop=scroll.scrollTop;
    };
    const onScroll=()=>{
      if(Math.abs(scroll.scrollTop-paintedTop)<=.5)return;
      // Native momentum/accessibility scrolling can arrive without a new
      // pointerdown or wheel. Its actual position cancels our pending follow.
      autoScroll.current?.stop();autoScroll.current=null;
      pinBottom.current=scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop<=2;
      paintedTop=scroll.scrollTop;
    };
    const stopAuto=()=>{if(autoScroll.current){autoScroll.current.stop();autoScroll.current=null;pinBottom.current=false;}};
    const commit=(row?:HTMLElement)=>{
      follow();
      history.dispatchEvent(new CustomEvent(HISTORY_PAINT,{detail:row}));
    };
    const layout=(event:Event)=>{
      const {row,progress,complete}=(event as CustomEvent<HistoryRowLayout>).detail;
      const pending=pendingSendLayout.current;
      if(pending&&row.querySelector('.chat-bubble')?.id===pending.id){
        pending.progress=progress;
        if(pending.clearanceFrom!==undefined){
          const clearance=pending.clearanceFrom*(1-progress);
          recordingClearance.jump(clearance);
          // Publish the flow change synchronously before bottom-follow/mask paint.
          const eventRow=pending.clearanceRow&&document.getElementById(pending.clearanceRow);
          if(eventRow)eventRow.style.paddingBottom=clearance+'px';
        }
        const composer=pending.from+(pending.target-pending.from)*progress;
        root.current?.style.setProperty('--chat-composer-height',composer+'px');
        if(geometry.current)geometry.current.composer=composer;
        if(complete)pendingSendLayout.current=null;
      }
      commit(row);
    };
    followBottom.current=()=>commit();
    const unsubscribe=scrollGap.on('change',()=>commit());
    const observer=new ResizeObserver(()=>commit());observer.observe(content);observer.observe(scroll);
    history.addEventListener(HISTORY_LAYOUT,layout);
    scroll.addEventListener('pointerdown',stopAuto);scroll.addEventListener('wheel',stopAuto,{passive:true});scroll.addEventListener('scroll',onScroll,{passive:true});commit();
    return ()=>{followBottom.current=()=>{};unsubscribe();observer.disconnect();history.removeEventListener(HISTORY_LAYOUT,layout);scroll.removeEventListener('scroll',onScroll);scroll.removeEventListener('pointerdown',stopAuto);scroll.removeEventListener('wheel',stopAuto);autoScroll.current?.stop();};
  }, [scrollGap,recordingClearance]);
  useLayoutEffect(()=>{
    const scroll=root.current?.querySelector<HTMLElement>('.dialog-scroll .mobile-scroll');if(!scroll)return;
    if(messages.at(-1)?.fresh&&!pinBottom.current&&!reduced){
      // A second send retains the current position and velocity of the ongoing spring.
      if(autoScroll.current){followBottom.current();return;}
      scrollGap.set(Math.max(0,scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop));
      autoScroll.current=animate(scrollGap,0,{...UI_MOTION.send,onComplete:()=>{autoScroll.current=null;pinBottom.current=true;followBottom.current();}});
      return;
    }
    autoScroll.current?.stop();autoScroll.current=null;scrollGap.set(0);
    pinBottom.current=true;followBottom.current();
  },[scrollRequest,chatPreview,reduced,scrollGap]);
  useEffect(()=>{
    pendingSendLayout.current=null;const scenario=chatScenario(chatPreview);setCircleRecorder(scenario.circleRecorder);setStickersOpen(chatPreview==='stickers');keyboard.hide();setMessages(scenario.messages);setDraft(scenario.draft);setReply(scenario.reply);setActionsOpen(scenario.actions);setMenuMode(!scenario.actions);setEnded(chatPreview==='ended'||chatPreview==='rated');setRating(chatPreview==='rated'?'like':null);setEndConfirmation(chatPreview==='end-confirm');setEditing(null);setMessageMenu(null);editRestore.current=null;if(previewApplied.current!==chatPreview)setPeerOpen(false);previewApplied.current=chatPreview;pinBottom.current=true;
    recording.preview(chatPreview==='recording'?'recording':chatPreview==='locked'?'locked':'idle');
    const frame=requestAnimationFrame(()=>{
      if(scenario.keyboard){focusInput();const input=root.current?.querySelector<HTMLTextAreaElement>('.chat-text-entry');input?.setSelectionRange(input.value.length,input.value.length);}
      const selected=[...scenario.messages].reverse().find(message=>message.outgoing&&message.text);
      if(chatPreview==='edit-message'&&selected)editSelected(selected);
      if(chatPreview==='message-actions'&&selected){const element=root.current?.querySelector<HTMLElement>('#chat-'+selected.id);if(element)openMessageActions(selected,element);}
      setScrollRequest(value=>value+1);
    });return ()=>cancelAnimationFrame(frame);
  },[chatPreview]);
  useLayoutEffect(()=>{
    if(!appViewport.native)return;
    const target=ended?140:stickersOpen?249:actionsOpen?140:0;
    const vp=getViewportSnapshot(),restingBottom=actionsOpen&&!messages.length?116:110;
    if(active&&!ended&&(keyboard.visible&&matchMedia('(pointer:coarse)').matches||vp.keyboardInset>1)){
      // Safari owns the keyboard timeline. Exchange the menu's existing space
      // with that keyboard instead of running a second spring against it.
      const closedCorrection=vp.keyboardInset<=1?Math.max(0,(geometry.current?.bottom??restingBottom)-restingBottom):0;
      const budget=Math.max(target,nativeActionHandoff.current?.budget??0,nativeActions.get()+closedCorrection);
      if(budget>0){nativeActionHandoff.current={budget};nativeActions.jump(target);return;}
    }
    // An interrupted focus may end before Safari opens its keyboard. Resume
    // from the menu's actual painted height, not the former logical target.
    if(nativeActionHandoff.current){nativeActions.jump(geometry.current?.actions??nativeActions.get());nativeActionHandoff.current=null;}
    if(reduced||!active){nativeActions.jump(target);return;}
    const controls=animate(nativeActions,target,UI_MOTION.surface);
    return()=>controls.stop();
  },[appViewport.native,appViewport.keyboardVisible,nativeActions,ended,stickersOpen,actionsOpen,reduced,active,keyboard.visible]);
  const transition = reduced || keyboardDragging || appViewport.native ? { duration: 0 } : { ...CHAT_LAYOUT };
  const softTransition = reduced || keyboardDragging ? { duration: 0 } : DIALOG_FADE_TRANSITION;
  const inset = isKeyboardVisible ? (bottomInset-androidInset)/scale : actionsOpen&&!messages.length?116:110;
  useLayoutEffect(()=>{
    const node=root.current,screen=node?.closest<HTMLElement>('.device-screen');if(!node||!screen)return;
    if(!active){delete screen.dataset.chatKeyboard;screen.style.removeProperty('--chat-keyboard-travel');return;}
    screen.dataset.chatKeyboard='true';
    const target={bottom:ended?110:inset,composer:ended?0:composerHeight,actions:appViewport.native?nativeActions.get():ended?140:stickersOpen?249:actionsOpen?140:0,travel:keyboard.visible?keyboard.dragOffset:keyboard.fullHeight,mask:isKeyboardVisible?-36:-32};
    const paint=(next:typeof target)=>{
      const pending=pendingSendLayout.current;
      if(pending&&(appViewport.native||pending.clearanceFrom!==undefined))next={...next,composer:pending.from+(pending.target-pending.from)*pending.progress};
      geometry.current=next;
      node.style.setProperty('--chat-footer-bottom',`${next.bottom}px`);
      node.style.setProperty('--chat-composer-height',`${next.composer}px`);
      node.style.setProperty('--chat-actions-height',`${next.actions}px`);
      node.style.setProperty('--chat-mask-top',`${next.mask}px`);
      screen.style.setProperty('--chat-keyboard-travel',`${next.travel}px`);
      followBottom.current();
    };
    const from=geometry.current;
    if(appViewport.native){
      const paintNative=()=>{
        const vp=getViewportSnapshot();
        const restingBottom=actionsOpen&&!messages.length?116:110;
        const nativeBottom=(vp.keyboardInset+vp.bottomTrim+(restingBottom*scale-vp.bottomTrim)*(1-vp.keyboardProgress)-vp.safeBottom*vp.keyboardProgress)/scale;
        const handoff=nativeActionHandoff.current;
        const actions=handoff?Math.max(0,handoff.budget-Math.max(0,nativeBottom-restingBottom)):nativeActions.get();
        if(handoff&&actions===0&&nativeActions.get()===0)nativeActionHandoff.current=null;
        node.style.setProperty('--dialog-keyboard-inset',vp.keyboardInset/scale+'px');
        paint({...target,bottom:ended?110:nativeBottom,actions,mask:vp.keyboardInset>1?-36:-32});
      };
      // Both sources share one complete footer/history/mask commit. A separate
      // actions-only paint would reflow history using the previous keyboard edge.
      const unsubscribe=subscribeViewport(paintNative),unsubscribeActions=nativeActions.on('change',paintNative);
      paintNative();return()=>{unsubscribe();unsubscribeActions();};
    }
    if(!from||reduced||keyboardDragging){paint(target);return;}
    const controls=animate(0,1,{...CHAT_LAYOUT,onUpdate:progress=>paint({bottom:from.bottom+(target.bottom-from.bottom)*progress,composer:from.composer+(target.composer-from.composer)*progress,actions:from.actions+(target.actions-from.actions)*progress,travel:from.travel+(target.travel-from.travel)*progress,mask:from.mask+(target.mask-from.mask)*progress})});
    return()=>controls.stop();
  },[active,inset,composerHeight,actionsOpen,stickersOpen,keyboard.visible,keyboard.dragOffset,keyboard.fullHeight,keyboardDragging,reduced,appViewport.native,appViewport.height,appViewport.width,ended]);
  useEffect(()=>{const screen=root.current?.closest<HTMLElement>('.device-screen');return()=>{if(screen){delete screen.dataset.chatKeyboard;screen.style.removeProperty('--chat-keyboard-travel');}};},[]);
  const replyTo=useStableEvent(chooseReply),quoteTo=useStableEvent(goToQuote),actionsFor=useStableEvent(openMessageActions),reactTo=useStableEvent(selectReaction);
  const peerBack=useStableEvent(closePeer),peerFriend=useStableEvent(friendAction);
  const peerEnd=useStableEvent(()=>{closePeer();requestEnd();}),peerNext=useStableEvent(requestNext);
  const acceptFriendship=useStableEvent(()=>changeFriendship('accepted')),declineFriendship=useStableEvent(()=>changeFriendship('declined'));
  const sharedMessage=useStableEvent((kind:'voice'|'circle'|'link'|'gif',index:number)=>{
    closePeer();
    const candidates=messages.filter(message=>kind==='voice'?message.duration!==undefined:kind==='link'?!!message.text?.match(/https?:\/\//):kind==='gif'?message.id.startsWith('gif-preview-')||message.media?.some(item=>/\.gif(?:$|\?)/i.test(item.name)):!!message.circle);
    const target=candidates[Math.min(kind==='voice'||kind==='circle'?Math.floor(index/2):index,candidates.length-1)];
    if(target)goToQuote(target.id);else setToast('В этой демо-переписке такого сообщения пока нет');
  });
  const margin=chatScenario(chatPreview).margin;
  const routeTransition = reduced ? { duration: 0 } : UI_MOTION.scene;
  return <main ref={root} className="dialog-root" aria-label="Диалог с новым собеседником" data-keyboard={isKeyboardVisible} data-recording={recording.mode!=='idle'} style={{ '--dialog-height': `${height}px`, '--dialog-keyboard-inset': appViewport.native ? undefined : `${keyboardInset}px` } as CSSProperties}>
    <div className="dialog-canvas" style={{ height, transform: scale === 1 ? undefined : `scale(${scale})` }}>
      <motion.div className="dialog-session-scene" inert={peerOpen||mediaBusy||!!circleRecorder} aria-hidden={peerOpen||mediaBusy||!!circleRecorder} initial={false} animate={{ x: peerOpen ? -112.56 : 0, scale: peerOpen ? .985 : 1 }} transition={routeTransition}>
      <MobileScroll className="dialog-scroll"><div className="dialog-history" style={{ paddingLeft:margin,paddingRight:margin,'--chat-row-gutter':margin+'px' } as CSSProperties} onClick={event=>{if(!(event.target as Element).closest('button,textarea,.chat-bubble,.dialog-profile-card'))keyboard.hide();}}>
        <ChatOutgoingMask active={active&&!peerOpen&&!mediaBusy}/><StableDialogCard active={active&&!peerOpen&&!mediaBusy&&!premiumOpen} onPremium={openPremium}/>
        <div className="dialog-start-marker"><span>Чат начался</span></div>
        {messages.map((message,index)=>message.friendship?<motion.div key={message.id} id={'chat-'+message.id} className="chat-friendship-row" initial={false} style={{paddingBottom:message.id===latestFriendshipMessage?.id?recordingClearance:0}}><StableFriendshipCard value={message.friendship} active={active&&!peerOpen&&!mediaBusy} onAccept={acceptFriendship} onDecline={declineFriendship}/></motion.div>:<HistoryBubble key={message.id} message={message} groupEnd={messageTails[index]} active={active&&!peerOpen&&!mediaBusy&&!messageMenu&&!circleRecorder} selected={messageMenu?.message.id===message.id} onReply={replyTo} onQuote={quoteTo} onActions={actionsFor} onReact={reactTo}/>)}
        {ended&&<><div className="dialog-start-marker chat-end-marker"><span>Диалог был завершён</span></div><div className="chat-rating-row"><ChatRatingCard value={rating} onChange={setRating}/></div></>}
        
      </div></MobileScroll>
      <img className="dialog-top-mask" src="/assets/dialog/scroll-header-fade.svg" alt="" aria-hidden="true"/>


      <div className="dialog-composer-panel chat-footer">
        <img className="chat-composer-mask" src="/assets/dialog/scroll-footer-fade.svg" alt="" aria-hidden="true"/>
        {recording.error?<div className="chat-record-error" role="alert">{recording.error}</div>:null}
        {ended?<ChatEndActions onNext={requestNext} onHome={onHome} nextLabel={nextConfirm?'Точно?':'Дальше'}/>:<>
        <DraftComposer draft={draftStore} recordKind={chatScenario(chatPreview).circleReady?'circle':'voice'} stickers={stickersOpen} onStickers={()=>{keyboard.hide();setActionsOpen(false);setMenuMode(true);setStickersOpen(value=>!value);}} onAttachment={()=>{recording.cancel();keyboard.hide();setMessageMenu(null);attachmentsRef.current?.openSource();}} editing={!!editing} reply={editing??reply} ended={ended} menu={showMenuIcon} keyboard={isKeyboardVisible} mode={recording.mode} seconds={recording.seconds} recordEnergy={recording.energy} recordingOnce={recording.once} onOnce={recording.toggleOnce} onFocus={()=>{const scroll=root.current?.querySelector<HTMLElement>('.dialog-scroll .mobile-scroll');if(scroll)pinBottom.current=scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop<=2;setMenuMode(true);setActionsOpen(false);}} onBlur={()=>keyboard.hide()} onSend={send} onMenu={toggleMenu} onClearReply={()=>{if(editing)cancelEdit();else setReply(null);}} onHeight={measureComposer} onRecord={()=>{keyboard.hide();setActionsOpen(false);setMenuMode(true);if(chatScenario(chatPreview).circleReady){recording.cancel();setCircleRecorder('holding');}else void recording.start();}} onCancelRecord={recording.cancel} onLockRecord={recording.lock} onSendRecord={sendRecording}/>
        <motion.div className="dialog-actions-clip" id="dialog-discovery-actions" inert={!actionsOpen||stickersOpen} aria-hidden={!actionsOpen||stickersOpen} animate={{ opacity: actionsOpen&&!stickersOpen ? 1 : 0 }} transition={softTransition} initial={false}><motion.div className="dialog-actions" initial={false} animate={{opacity:friendship?.direction==='incoming'&&friendship.state==='accepted'?.2:1}} transition={softTransition}><img className="dialog-actions-glass" src="/assets/dialog/actions-glass.png" alt=""/><motion.button {...getPressProps(reduced)} className="dialog-add-friend" data-source-incoming={friendship?.direction==='incoming'} disabled={ended||friend||friendship?.direction==='outgoing'&&friendship.state==='pending'} onClick={friendAction}><img className="dialog-gold-surface" src="/assets/dialog/gold-action-7a28b6ad9c.webp" alt=""/><span style={{width:incomingFriendAction?111:132}}>{incomingFriendAction?'Принять заявку':'Добавить в друзья'}</span><i className="dialog-add-friend-icon" aria-hidden="true"><img src="/assets/dialog/add-friend-source.svg" alt=""/></i></motion.button><div><motion.button {...getPressProps(reduced)} disabled={ended} onClick={requestEnd}>Завершить</motion.button><motion.button {...getPressProps(reduced)} onClick={requestNext}>{nextConfirm?'Точно?':'Дальше'}</motion.button></div></motion.div></motion.div>
        {stickersOpen&&<ChatStickers onSendGif={item=>{setMessages(current=>[...current,{id:'gif-preview-'+crypto.randomUUID(),outgoing:true,media:[item],fresh:true,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'})}]);setScrollRequest(value=>value+1);}} onSend={index=>{setMessages(current=>[...current,{id:'sticker-'+crypto.randomUUID(),outgoing:true,sticker:index,width:192,height:192,fresh:true,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'})}]);setScrollRequest(value=>value+1);}}/>}
        </>}
      </div>
      </motion.div>
      <motion.header className="dialog-header" inert={peerOpen||mediaBusy||!!circleRecorder} aria-hidden={peerOpen||mediaBusy||!!circleRecorder} initial={false} animate={{x:peerOpen?-112.56:0,scale:peerOpen?.985:1}} style={{zIndex:mediaBusy?38:1}} transition={routeTransition}><button ref={peerTrigger} className="dialog-identity" aria-label="Открыть профиль собеседника" onClick={openPeer}><div className={`dialog-avatar ${peerKnown?'is-known':''}`}><img className="dialog-avatar-composite" src={peerKnown?'/assets/dialog/avatar-cap-2x.png':'/assets/dialog/avatar-hood-2x.png'} alt="Аватар собеседника"/><motion.i aria-hidden="true" initial={false} animate={{ opacity: ended ? 0 : 1 }} transition={softTransition}/></div><div className="dialog-name-status"><p><span style={{width:peerKnown?71:138}}>{peerKnown?'ТихийЛис':'Новый собеседник'}</span><DialogIcon name="premium-badge"/></p><DialogPresence ended={ended} preview={chatPreview}/></div></button><button className="dialog-round-action dialog-report" aria-label="Пожаловаться" onClick={()=>{keyboard.hide();setToast('В прототипе жалоба не отправляется');}}><img className="dialog-round-glass" src="/assets/dialog/round-glass.png" alt=""/><DialogIcon name="report"/></button></motion.header>
      <AnimatePresence>{active&&circleRecorder&&<ChatCircleRecorder mode={circleRecorder} demoSrc={DEMO_CIRCLE.src} active={active} onCancel={()=>setCircleRecorder(undefined)} onSend={circle=>{setMessages(current=>[...current,{id:'circle-'+crypto.randomUUID(),outgoing:true,circle,reply:reply?{id:reply.id,text:reply.duration!==undefined?'Голосовое сообщение':reply.circle?'Видеосообщение':reply.text??''}:undefined,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'}),fresh:true}]);setReply(null);setCircleRecorder(undefined);setScrollRequest(value=>value+1);}}/>}</AnimatePresence>
      <ChatAttachments ref={attachmentsRef} onOpen={()=>setAttachmentOpen(true)} key={mediaReset+':'+chatPreview} example={chatPreview==='media-preview'||chatPreview==='media-once'||chatPreview==='caption-focus'||chatPreview==='caption-text'?chatPreview:undefined} open={attachmentOpen} height={height} keyboardInset={keyboardInset} onClose={()=>setAttachmentOpen(false)} onBusyChange={setMediaBusy} onNotice={setToast} onSend={(media,caption,once)=>{keyboard.hide();setMessages(current=>[...current,{id:'media-'+crypto.randomUUID(),outgoing:true,media,once,text:caption||undefined,time:new Date().toLocaleTimeString('ru-RU',{hour:'numeric',minute:'2-digit'}),fresh:true}]);setScrollRequest(value=>value+1);}}/>
      <AnimatePresence>{messageMenu&&<MessageActionMenu menu={messageMenu} canReply={!ended} height={height} onAction={messageAction} onReact={emoji=>selectReaction(messageMenu.message.id,emoji)} onDismiss={dismissMessageActions}/>}</AnimatePresence>
      <AnimatePresence>{toast&&<motion.div key={toast} className="chat-system-toast" role="status" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>{toast}</motion.div>}</AnimatePresence>
      <PremiumSheet open={active&&premiumOpen} onOpenChange={setPremiumOpen} returnFocus={premiumTrigger}/>
      <ChatEndConfirmation open={endConfirmation} onOpenChange={setEndConfirmation} onConfirm={finishDialog}/>
      <motion.div className="dialog-peer-scene" inert={!peerOpen} aria-hidden={!peerOpen} initial={false} animate={{ x: peerOpen ? 0 : 402 }} transition={routeTransition} onAnimationComplete={()=>{ if (!peerOpen&&!endConfirmation&&!premiumOpen) {const focused=document.activeElement;if(!focused||focused===document.body||focused===document.documentElement||focused.closest('.dialog-peer-scene'))peerTrigger.current?.focus({ preventScroll: true });} }}>
        <AnimatePresence initial={false} mode="wait"><motion.div key={peerPreview} className="peer-variant-scene" initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduced ? 1 : 0 }} transition={softTransition}>
          <StablePeerProfile preview={peerPreview} height={height} active={active&&peerOpen&&!premiumOpen} friend={friend} pending={!!friendship&&friendship.state!=='accepted'} ended={ended} onBack={peerBack} onFriend={peerFriend} onEnd={peerEnd} onNext={peerNext} nextLabel={nextConfirm?'Точно?':'Дальше'} onOpenMessage={sharedMessage} onPremium={openPremium}/>
        </motion.div></AnimatePresence>
      </motion.div>
      <div className="dialog-nav-material" aria-hidden="true"/>
      <motion.nav className="dialog-bottom-nav" style={{zIndex:mediaBusy?38:5}} aria-label="Навигация" inert={isKeyboardVisible||mediaBusy||!!circleRecorder} aria-hidden={mediaBusy||!!circleRecorder} animate={{ opacity: isKeyboardVisible ? 0 : 1, y: isKeyboardVisible ? 12 : 0 }} transition={{ y: transition, opacity: softTransition }}><span className="is-active" aria-label="Чаты" aria-current="page"><DialogIcon name="nav-chats-selected"/></span><button aria-label="Профиль" onClick={()=>{ keyboard.hide(); onProfile(); }}><DialogIcon name="nav-profile"/></button></motion.nav>
    </div>
  </main>;
}

function AppSectionScene({ children }: { children: ReactNode }) {
  const present=useIsPresent(),reduced=useReducedMotion();
  return <motion.div className="prototype-section-scene" style={{zIndex:1}} inert={!present} aria-hidden={!present} initial={{opacity:reduced?1:0}} animate={{opacity:1}} exit={{opacity:1,transition:{duration:0}}} transition={{duration:reduced?0:.25}}>{children}</motion.div>;
}
function ViewportSetup(){useChatusViewportLayout();return null;}
export default function Prototype(){
  const reduced=useReducedMotion();
  const [section,setSection]=useState<'auth' | 'profile' | 'dialog'>(() => { const requested = new URLSearchParams(location.search).get('section'); return requested==='profile'?'profile':requested==='dialog'||requested==='search'||new URLSearchParams(location.search).get('screen')==='search'?'dialog':'auth'; });
  useEffect(()=>{document.title='Chatus — '+({auth:'знакомство',profile:'профиль',dialog:'диалог'}[section]);},[section]);
  const [profileReady,setProfileReady]=useState(section==='profile');
  const [viewerProfile,setViewerProfile]=useState<ProfileData|null>(null);
  const [dialogReady,setDialogReady]=useState(section==='dialog');
  const [dialogReset,setDialogReset]=useState(0);
  const [chatPreview,setChatPreview]=useState<ChatPreview>(()=>{const q=new URLSearchParams(location.search).get('chat');return CHAT_PREVIEWS.some(([id])=>id===q)?q as ChatPreview:'start';});
  const [peerPreview,setPeerPreview]=useState<PeerPreview>(()=>{const requested=new URLSearchParams(location.search).get('peer');return PEER_PREVIEWS.some(([id])=>id===requested)?requested as PeerPreview:'media-bio-interests';});
  const [peerRequest,setPeerRequest]=useState(0);
  const [profilePreview,setProfilePreview]=useState<ProfilePreview>(()=>{const requested=new URLSearchParams(location.search).get('profile');return PROFILE_PREVIEWS.some(([id])=>id===requested)?requested as ProfilePreview:'basic';});
  const [profileDemo,setProfileDemo]=useState(0);
  const [profileReset,setProfileReset]=useState(0);
  const [replay,setReplay]=useState(0);
  const [authScenario,setAuthScenario]=useState<AuthScenario>("new");
  const [fromOnboarding,setFromOnboarding]=useState(false);
  const [pendingProfile,setPendingProfile]=useState(false);
  const [notificationsOpen,setNotificationsOpen]=useState(()=>new URLSearchParams(location.search).get('notifications')==='1');
  const [authStart,setAuthStart]=useState<AuthRoute>(()=>{
    const requested=new URLSearchParams(location.search).get("auth");
    return AUTH_PREVIEWS.some(([id])=>id===requested)?requested as AuthRoute:"welcome";
  });
  const keyboard=useKeyboard();
  const changeSection=(next: 'auth' | 'profile' | 'dialog')=>{if(next==='profile')setProfileReady(true);if(next==='dialog')setDialogReady(true);keyboard.hide();setNotificationsOpen(false);setProfileDemo(0);setSection(next);const url=new URL(location.href);url.searchParams.set('section',next);history.replaceState(null,'',url);};
  const startNewDialog=()=>{keyboard.hide();setChatPreview('start');setPeerRequest(0);setDialogReset(value=>value+1);changeSection('dialog');const url=new URL(location.href);url.searchParams.delete('chat');url.searchParams.delete('peer');history.replaceState(null,'',url);};
  const restart=()=>{keyboard.hide();setAuthStart("welcome");setReplay(value=>value+1);};
  return <>
    <ViewportSetup/>
    {dialogReady&&<motion.div className="prototype-section-scene" style={{zIndex:0,pointerEvents:section==='dialog'?'auto':'none'}} inert={section!=='dialog'} aria-hidden={section!=='dialog'} initial={false} animate={{opacity:section==='dialog'?1:0}} transition={{duration:reduced?0:.25}}>
      <DialogPrototype key={dialogReset} active={section==='dialog'} chatPreview={chatPreview} peerPreview={peerPreview} peerRequest={peerRequest} onProfile={()=>changeSection('profile')} onHome={()=>changeSection('profile')}/>
    </motion.div>}
    <AnimatePresence initial={false} mode="wait">{section!=='dialog'&&section!=='profile'&&<AppSectionScene key={section}>
      {section==='auth'?<AuthFlow key={`${replay}-${authStart}`} replay={replay>0} start={authStart} scenario={authScenario} onConfirmed={()=>{setPendingProfile(true);setNotificationsOpen(true);}} onLater={()=>{keyboard.hide();setPendingProfile(true);setNotificationsOpen(true);}}/>:null}
    </AppSectionScene>}</AnimatePresence>
    {profileReady&&<motion.div className="prototype-section-scene" style={{zIndex:0,pointerEvents:section==='profile'?'auto':'none'}} inert={section!=='profile'} aria-hidden={section!=='profile'} initial={false} animate={{opacity:section==='profile'?1:0}} transition={{duration:reduced?0:.25}}>
      <ProfilePrototype active={section==='profile'} onDataChange={setViewerProfile} onDialog={()=>changeSection('dialog')} fromOnboarding={fromOnboarding} demo={profileDemo} reset={profileReset} preview={profilePreview} onLogout={()=>{setDialogReady(false);setProfileReady(false);setViewerProfile(null);setFromOnboarding(false);setAuthStart('welcome');setReplay(value=>value+1);changeSection('auth');}}/>
    </motion.div>}
    <NotificationSheet open={notificationsOpen} onOpenChange={open=>{setNotificationsOpen(open);if(!open&&pendingProfile){setPendingProfile(false);setFromOnboarding(true);setProfilePreview('basic');changeSection('profile');}}} />
    <PreviewControls>
      <div className="chatus-section-switch" role="group" aria-label="Раздел прототипа"><button aria-pressed={section === 'auth'} onClick={() => changeSection('auth')}>Авторизация</button><button aria-pressed={section === 'profile'} onClick={() => changeSection('profile')}>Профиль</button><button aria-pressed={section === 'dialog'} onClick={() => changeSection('dialog')}>Диалог</button></div>
      {section === 'dialog' ? <div className="profile-preview-actions"><button onClick={()=>{ keyboard.hide(); setPeerRequest(0); const url=new URL(location.href);url.searchParams.delete('peer');url.searchParams.delete('chat');setChatPreview('start');history.replaceState(null,'',url);setDialogReset(value=>value+1); }}>Начать диалог заново</button><select className="auth-preview-select" aria-label="Состояние переписки" value={chatPreview} onChange={event=>{keyboard.hide();setChatPreview(event.target.value as ChatPreview);const url=new URL(location.href);url.searchParams.set('chat',event.target.value);url.searchParams.delete('peer');history.replaceState(null,'',url);}}>{CHAT_PREVIEWS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><button onClick={()=>{keyboard.hide();setPeerRequest(value=>value+1);}}>Профиль собеседника</button><select className="auth-preview-select" aria-label="Состояние профиля собеседника" value={peerPreview} onChange={event=>{keyboard.hide();setPeerPreview(event.target.value as PeerPreview);setPeerRequest(value=>value+1);const url=new URL(location.href);url.searchParams.set('peer',event.target.value);history.replaceState(null,'',url);}}>{PEER_PREVIEWS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div> : section === 'profile' ? <div className="profile-preview-actions"><select className="auth-preview-select" aria-label="Экран профиля" value={profilePreview} onChange={event=>{keyboard.hide();setProfileDemo(0);setProfilePreview(event.target.value as ProfilePreview);const url=new URL(location.href);url.searchParams.set('profile',event.target.value);history.replaceState(null,'',url);}}>{PROFILE_PREVIEWS.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><button onClick={() => setProfileDemo(value => value + 1)}>Показать 80 → 100%</button><button onClick={() => {setProfileDemo(0);setProfilePreview('edit');setProfileReset(value => value + 1);}}>Сбросить до 20%</button></div> : <>
      <button onClick={restart}><span aria-hidden="true">↻</span>Повторить сплеш</button>
      <button className="notification-preview-trigger" onClick={()=>{keyboard.hide();setNotificationsOpen(true);}}>Шторка уведомлений</button>
      <select className="auth-preview-select" aria-label="Состояние флоу" value={authStart} onChange={event=>{keyboard.hide();setAuthStart(event.target.value as AuthRoute);}}>
        {AUTH_PREVIEWS.map(([id,label])=><option value={id} key={id}>{label}</option>)}
      </select>
      <select className="auth-preview-select" aria-label="Сценарий входа" value={authScenario} onChange={event=>setAuthScenario(event.target.value as AuthScenario)}>
        <option value="new">Новый аккаунт</option><option value="existing">Аккаунт уже существует</option><option value="provider-error">Ошибка Apple/Google</option>
      </select><span className="auth-preview-code">Код для проверки: 411111</span></>}
    </PreviewControls>
  </>;
}
