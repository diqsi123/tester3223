import {AnimatePresence,useIsPresent} from 'motion/react';
import {UI_MOTION} from '../ui/motion';
import {BottomSheet} from './AppSheet';
import { useEffect, useRef, useState } from 'react';
import {getPressProps} from '../ui/press';
import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'motion/react';
import { useMobileDevice } from '../mobile';
import { useChatusViewportLayout } from './ChatusViewport';
import type { ChatMessage } from './ChatConversation';
import './chat-actions.css';

const A = '/assets/chat/mobile/';
const FEEDBACK = '/assets/chat/feedback/';
import {CHAT_REACTIONS} from './ChatReactionGlyph';
export {CHAT_REACTIONS} from './ChatReactionGlyph';
export type Friendship = { direction: 'outgoing' | 'incoming'; state: 'pending' | 'accepted' | 'declined' };
export type MessageMenu = { message: ChatMessage; top: number };

export function MessageActionMenu({ menu, canReply, height, onAction, onReact, onDismiss }: {
  menu: MessageMenu; canReply: boolean; height: number;
  onAction: (action: 'reply' | 'copy' | 'edit' | 'report' | 'delete') => void;
  onReact: (emoji: string) => void; onDismiss: () => void;
}) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const present=useIsPresent();
  const rows = [
    ...(canReply ? [{ id: 'reply' as const, label: 'Ответить' }] : []),
    ...(menu.message.text ? [{ id: 'copy' as const, label: 'Копировать текст' }] : []),
    ...(canReply && menu.message.outgoing && menu.message.text ? [{ id: 'edit' as const, label: 'Редактировать' }] : []),
    { id: 'report' as const, label: 'Пожаловаться' },
    { id: 'delete' as const, label: 'Удалить только у себя' },
  ];
  const top = Math.max(132, Math.min(menu.top - rows.length * 56 - 20, height - rows.length * 56 - 190));
  useEffect(() => { root.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }); }, [menu.message.id]);
  return <div className="chat-message-menu-layer" inert={!present} aria-hidden={!present} style={{pointerEvents:present?'auto':'none'}}>
    <button className="chat-menu-dismiss" aria-label="Закрыть действия сообщения" onClick={onDismiss}/>
    <motion.div ref={root} className="chat-message-menu" style={{ top }} role="menu" aria-label="Действия с сообщением"
      initial={{ opacity: 0, scale: reduced ? 1 : .96, y: reduced ? 0 : 6 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={reduced ? { duration: .12 } : UI_MOTION.surface}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); onDismiss(); return; }
        if (!['ArrowDown', 'ArrowUp', 'Tab'].includes(event.key)) return;
        event.preventDefault();
        const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const delta = event.key === 'ArrowUp' || event.key === 'Tab' && event.shiftKey ? -1 : 1;
        buttons[(index + delta + buttons.length) % buttons.length]?.focus();
      }}>
      <div className="chat-message-menu-rows">{rows.map(row => <button key={row.id} role="menuitem" className={row.id === 'delete' || row.id === 'report' ? 'is-destructive' : ''} onClick={() => onAction(row.id)}>
        <span className="chat-menu-icon"><img src={A + row.id + '.svg'} alt=""/></span><span>{row.label}</span>
      </button>)}</div>
      <div className="chat-reaction-picker" role="group" aria-label="Добавить реакцию">
        <img src={A + 'reaction-bar.svg'} alt="" aria-hidden="true" draggable={false}/>
        {CHAT_REACTIONS.map(emoji => <button key={emoji} aria-label={'Реакция ' + emoji} onClick={() => onReact(emoji)}/>)}
      </div>
    </motion.div>
  </div>;
}
function FriendshipStatus({state,active}:{state:Friendship['state'];active:boolean}) {
  const reduced=useReducedMotion();
  const [visible,setVisible]=useState(()=>!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  const rotation=useMotionValue(0),ring=useMotionValue(state==='pending'?.72:1);
  const fill=useMotionValue(state==='accepted'?1:0),check=useMotionValue(state==='accepted'?1:0);
  const previous=useRef(state);
  useEffect(()=>{
    const controls:{stop:()=>void}[]=[];let alive=true;
    if(reduced||!active||!visible){ring.set(state==='pending'?.72:1);fill.set(state==='accepted'?1:0);check.set(state==='accepted'?1:0);previous.current=state;return;}
    if(state==='pending'){
      controls.push(animate(rotation,rotation.get()+360,{duration:.9,ease:'linear',repeat:Infinity}));
      controls.push(animate(ring,.72,UI_MOTION.surface),animate(fill,0,UI_MOTION.fade),animate(check,0,UI_MOTION.fade));
    }else if(state==='accepted'&&previous.current==='pending'){
      // Complete the existing loader, fill it, then draw the same check in place.
      controls.push(animate(ring,1,{...UI_MOTION.fade,onComplete:()=>{
        if(!alive)return;
        controls.push(animate(fill,1,{...UI_MOTION.fade,onComplete:()=>{
          if(alive)controls.push(animate(check,1,UI_MOTION.fade));
        }}));
      }}));
    }else{ring.set(1);fill.set(state==='accepted'?1:0);check.set(state==='accepted'?1:0);}
    previous.current=state;
    return()=>{alive=false;controls.forEach(control=>control.stop());};
  },[state,active,visible,reduced,rotation,ring,fill,check]);
  return <motion.span className={'chat-friend-status is-'+state} initial={false} animate={{backgroundColor:state==='accepted'?'rgba(45,174,78,.08)':state==='declined'?'rgba(245,68,97,.08)':'rgba(255,8,142,.08)',color:state==='accepted'?'#2dae4e':state==='declined'?'#f54461':'#ff088e'}} transition={reduced?{duration:0}:UI_MOTION.fade}>
    <span className="chat-status-morph" aria-hidden="true">{state==='pending'?<motion.span className="chat-status-pending" style={{rotate:rotation}}/>:state==='declined'?<img src={A+'status-declined.svg'} alt=""/>:<svg viewBox="0 0 14 14" width="14" height="14">
      <circle cx="7" cy="7" r="5.833" fill="none" stroke="currentColor" strokeOpacity=".16" strokeWidth="2.333"/>
      <motion.g style={{rotate:rotation,transformOrigin:'7px 7px'}}><motion.circle cx="7" cy="7" r="5.833" fill="none" stroke="currentColor" strokeWidth="2.333" pathLength="1" style={{pathLength:ring}} transform="rotate(-90 7 7)"/></motion.g>
      <motion.circle cx="7" cy="7" r="7" fill="currentColor" style={{opacity:fill}}/>
      <motion.path d="M9.5 4L6.25 10L3.5 6.73882" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{pathLength:check}}/>
    </svg>}</span><span className="chat-status-label">{state==='pending'?'Ожидание':state==='accepted'?'Принята':'Отклонена'}</span>
  </motion.span>;
}
export function ChatFriendshipCard({ value, active=true, onAccept, onDecline }: { value: Friendship; active?:boolean; onAccept: () => void; onDecline: () => void }) {
  const reduced = useReducedMotion(),card=useRef<HTMLElement>(null),inView=useInView(card);
  return <motion.section ref={card} data-state={value.state} className={'chat-friend-card is-' + value.direction} aria-label="Заявка в друзья"
    initial={{ opacity: 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0, height: value.direction==='outgoing'?186:value.state==='pending'?271:182 }} transition={reduced ? { duration: 0 } : UI_MOTION.surface}>
    <FriendshipStatus state={value.state} active={active&&inView}/>
    {value.direction === 'outgoing' ? <>
      <img className="chat-friend-illustration" src={A + 'friend-request.png'} width="56" height="56" alt=""/>
      <h2>Заявка отправлена</h2>
      <p>{value.state==='declined'?<>Собеседник отклонил заявку.<br/>Диалог остаётся открытым</>:<>Собеседник видит твой ник и аватар. Если<br/>он примет заявку, чат сохранится</>}</p>
    </> : <>
      <span className="chat-friend-avatar"><img src={FEEDBACK+'avatar-source-2x.png'} width="106" height="106" alt="Аватар ТихийЛис" draggable={false}/></span>
      <div className="chat-friend-name"><h2>ТихийЛис<span className="chat-friend-name-spacer" aria-hidden="true">.</span></h2><span><i><img src="/assets/auth/profile-male.svg" alt="Мужской"/></i><b>25–34</b></span></div>
      {value.state === 'pending' && <div className="chat-friend-decisions">
        <motion.button {...getPressProps(reduced)} className="chat-gold" onClick={onAccept}><img src="/assets/chat/mobile/friend-accept.svg" alt=""/><span>{'Принять '}</span></motion.button>
        <motion.button {...getPressProps(reduced)} onClick={onDecline}><img src="/assets/chat/mobile/friend-decline.svg" alt=""/><span>Отклонить</span></motion.button>
      </div>}
    </>}
  </motion.section>;
}
export function ChatRatingCard({ value, onChange }: { value: 'like' | 'dislike' | null; onChange: (next: 'like' | 'dislike' | null) => void }) {
  const reduced=useReducedMotion();
  return <section className="chat-rating-card" aria-label="Оценка собеседника">
    <h2>Оцени собеседника</h2><p>Твоя оценка поможет нам точнее<br/>подбирать тебе людей</p>
    <div className="chat-rating-choices">{(['like', 'dislike'] as const).map(type => <motion.button {...getPressProps(reduced)} key={type} className={'is-' + type} aria-label={type === 'like' ? 'Положительная оценка' : 'Отрицательная оценка'} aria-pressed={value === type} onClick={() => onChange(value === type ? null : type)}>
      <span className="chat-rating-icon"><img src={FEEDBACK+'rating-'+type+(value===type?'-selected':'')+'.svg'} alt=""/></span><span style={{width:type==='like'?(value===type?17:16):(value===type?9:8)}}>{(type === 'like' ? 24 : 7) + (value === type ? 1 : 0)}</span>
    </motion.button>)}</div>
  </section>;
}
export function ChatEndActions({ onNext, onHome,nextLabel='Дальше' }: { onNext: () => void; onHome: () => void;nextLabel?:string }) {
  const reduced=useReducedMotion();
  return <div className="chat-end-actions"><motion.button {...getPressProps(reduced)} className="chat-gold" onClick={onNext}><img className="chat-end-gold-surface" src="/assets/dialog/gold-action-7a28b6ad9c.webp" alt=""/><span>{nextLabel}</span><i className="chat-end-next-icon" aria-hidden="true"><img src="/assets/chat/mobile/next-white-source.svg" alt=""/></i></motion.button><motion.button {...getPressProps(reduced)} onClick={onHome}>На главный</motion.button></div>;
}
/** Source345 includes34px of mock home area; safeBottom is already in portal units. */
function endConfirmationLayout(native:boolean,deviceWidth:number,bottomTrim:number,safeBottom:number){
  const scale=native?deviceWidth/402:1;
  const removed=native?bottomTrim:0,safe=native?safeBottom:0;
  const height=345*scale-removed+safe;
  return {scale,height,sourceHeight:height/scale,bottomPadding:(34*scale-removed+safe)/scale};
}
export function ChatEndConfirmation({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  const reduced=useReducedMotion();
  const { device } = useMobileDevice(),vp=useChatusViewportLayout();
  const layout=endConfirmationLayout(vp.native,device.geometry.screen.width,vp.bottomTrim,vp.safeBottom);
  return <BottomSheet open={open} onOpenChange={onOpenChange} title="Завершить диалог?" trimHomeArea={false} snap={layout.height/device.geometry.screen.height}>
    <style>{`.bottom-sheet:has(.chat-session-sheet){--chat-end-sheet-height:${layout.height}px;--chat-end-source-height:${layout.sourceHeight}px;--chat-end-bottom-padding:${layout.bottomPadding}px;--chat-end-source-scale:${layout.scale}}`}</style>
    <div className="chat-session-sheet" data-node-id="4162:235090"><h2>Завершить диалог?</h2>
      <p>После завершения восстановить<br/>диалог не получится</p>
      <div><motion.button {...getPressProps(reduced)} className="is-destructive" onClick={onConfirm}>Завершить диалог</motion.button><motion.button {...getPressProps(reduced)} onClick={() => onOpenChange(false)}><span className="chat-end-stay-label">{'Остаться '}</span></motion.button></div>
    </div>
  </BottomSheet>;
}
