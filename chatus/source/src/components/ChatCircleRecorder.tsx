import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {motion,useReducedMotion,useIsPresent} from 'motion/react';
import {CIRCLE_ASSETS,circleTime,createCircleReleaseGuard,type CircleMessageData,type CircleRecorderMode} from './circle-geometry';
import {getPressProps} from '../ui/press';
import {UI_MOTION,STILL} from '../ui/motion';
import './chat-circle.css';
export type {CircleRecorderMode} from './circle-geometry';

/** Visual testing controller only: never opens camera/microphone or fabricates a camera stream. */
export function ChatCircleRecorder({mode:initialMode,poster=CIRCLE_ASSETS+'poster.webp',demoSrc,active=true,onCancel,onSend,onSwitchCamera}:{
  mode:CircleRecorderMode;poster?:string;demoSrc?:string;active?:boolean;
  onCancel:()=>void;onSend:(value:CircleMessageData)=>void;onSwitchCamera?:()=>void;
}) {
  const [mode,setMode]=useState(initialMode),[once,setOnce]=useState(initialMode==='once');
  const [hint,setHint]=useState(initialMode==='once');
  const [releaseGuard]=useState(createCircleReleaseGuard);
  const action=useRef<HTMLButtonElement>(null);
  const root=useRef<HTMLDivElement>(null),gesture=useRef<{id:number;x:number;y:number}|null>(null);
  const present=useIsPresent();
  const reduced=useReducedMotion(),press=getPressProps(reduced);
  const locked=mode!=='holding',seconds=locked?2:1;
  useEffect(()=>{setMode(initialMode);setOnce(initialMode==='once');setHint(initialMode==='once');},[initialMode]);
  useEffect(()=>{if(!hint)return;const timer=window.setTimeout(()=>setHint(false),3000);return()=>clearTimeout(timer);},[hint]);
  useEffect(()=>{
    if(!active)return;
    const panel=root.current;
    const origin=document.activeElement instanceof HTMLElement?document.activeElement:null;
    action.current?.focus({preventScroll:true});
    return()=>{
      const focused=document.activeElement;
      if((focused===document.body||focused===document.documentElement||panel?.contains(focused))&&
        origin?.isConnected&&origin!==document.body&&!origin.closest('[inert]'))origin.focus({preventScroll:true});
    };
  },[active]);
  const send=()=>{if(active)onSend({poster,src:demoSrc,duration:2,once});};
  const down=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    if(!active||event.button!==0||event.isPrimary===false||gesture.current)return;
    releaseGuard.begin();if(locked)return;
    event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  };
  const move=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const session=gesture.current;if(!session||session.id!==event.pointerId)return;
    if(event.clientX-session.x< -64){gesture.current=null;onCancel();}
    else if(event.clientY-session.y< -64){gesture.current=null;releaseGuard.lock();setMode('locked');}
  };
  const up=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const session=gesture.current;if(!session||session.id!==event.pointerId)return;gesture.current=null;
    if(event.type==='pointercancel')return;
    send();
  };
  return <motion.div ref={root} className="chat-circle-recorder" inert={!present} aria-hidden={!present} style={{pointerEvents:present?'auto':'none'}} role="dialog" aria-modal="true" aria-label="Кружок" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={reduced?STILL:UI_MOTION.fade}
    onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onCancel();}if(event.key==='Tab'){const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button')??[]);const index=buttons.indexOf(document.activeElement as HTMLButtonElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus({preventScroll:true});}}}>
    <div className="chat-circle-recorder-preview"><img className="chat-circle-poster" src={poster} alt="Предпросмотр кружка" draggable={false} decoding="async"/></div>
    <div className="chat-circle-recorder-footer">
      <div className="chat-circle-recorder-actions">
        <motion.button {...press} className="chat-circle-glass" aria-label="Переключить камеру" aria-disabled={!onSwitchCamera} onClick={onSwitchCamera}><img src={CIRCLE_ASSETS+'switch-camera.svg'} width="17" height="18.1953" alt=""/></motion.button>
        <motion.button {...press} className="chat-circle-glass" aria-label="Разовый просмотр" aria-pressed={once} onClick={()=>{setOnce(value=>!value);setHint(!once);}}><img src={CIRCLE_ASSETS+(once?'once-filled.svg':'once-outline.svg')} width="24" height="24" alt=""/></motion.button>
      </div>
      {hint&&<span className="chat-circle-recorder-hint" role="tooltip"><span>Исчезнет после просмотра</span><img src="/assets/chat-media/tooltip-nose.svg" width="12" height="8" alt=""/></span>}
      <div className="chat-circle-recorder-bar"><span className="chat-circle-recorder-timer"><img src={CIRCLE_ASSETS+'recording-dot.svg'} width="10" height="10" alt=""/><span>{circleTime(seconds)}</span></span>
        {locked?<button className="chat-circle-delete" onClick={onCancel}><span>Удалить запись</span><img src="/assets/chat/trash.svg" width="18" height="18" alt=""/></button>:<span className="chat-circle-cancel">‹ Смахните для отмены</span>}
      </div>
      <button className={`chat-circle-lock ${locked?'is-locked':''}`} aria-label="Закрепить запись" onClick={()=>setMode('locked')}><img src={CIRCLE_ASSETS+(locked?'lock.svg':'lock-open.svg')} width={locked?13.333:20} height={locked?16.667:20} alt=""/>{!locked&&<img src={CIRCLE_ASSETS+'chevron-up.svg'} width="16" height="8" alt=""/>}</button>
      <img className="chat-circle-recorder-glow" src="/assets/chat/record-glow.svg" width="96" height="94" alt=""/>
      <motion.button ref={action} {...press} className="chat-circle-record-action" aria-label={locked?'Отправить кружок':'Отправить кружок при отпускании'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={event=>{if(releaseGuard.shouldSend(event.detail,locked))send();}}>
        <img src={CIRCLE_ASSETS+(locked?'send.svg':'video.svg')} width={locked?32:26} height={locked?33.7987:24} alt=""/>
      </motion.button>
    </div>
  </motion.div>;
}
