import { ChatQuoteMaterial } from './ChatQuoteMaterial';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {motion,useInView,useReducedMotion} from 'motion/react';
import {CIRCLE_ASSETS,circleGeometry,circleTime,type CircleMessageData} from './circle-geometry';
import {UI_MOTION,STILL} from '../ui/motion';
import './chat-circle.css';
export type {CircleMessageData} from './circle-geometry';

/** Source poster is real Figma media. Optional src is explicitly supplied demo/user media. */
export function ChatVideoCircle({value,outgoing,time='9:41',active,reply,onQuote}:{
  value:CircleMessageData;outgoing:boolean;time?:string;active:boolean;
  reply?:{id:string;text:string};onQuote:(id:string)=>void;
}) {
  const root=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null);
  const reduced=useReducedMotion(),inView=useInView(root);
  const [expanded,setExpanded]=useState(Boolean(value.expanded));
  const [playing,setPlaying]=useState(false),[started,setStarted]=useState(false);
  const [elapsed,setElapsed]=useState(value.elapsed??0),[consumed,setConsumed]=useState(Boolean(value.viewed));
  const [dismissed,setDismissed]=useState(false);
  const geometry=circleGeometry(outgoing,expanded&&!consumed);
  const finish=()=>{video.current?.pause();setPlaying(false);setExpanded(false);if(value.once)setConsumed(true);};
  useEffect(()=>{
    if(!active||!inView)video.current?.pause();
  },[active,inView]);
  useEffect(()=>{
    if(!playing)return;
    const stopOther=()=>video.current?.pause();
    window.dispatchEvent(new Event('chatus-voice-play'));
    window.addEventListener('chatus-voice-play',stopOther);
    return()=>window.removeEventListener('chatus-voice-play',stopOther);
  },[playing]);
  useEffect(()=>{
    const pause=()=>{if(document.hidden)video.current?.pause();};
    document.addEventListener('visibilitychange',pause);
    return()=>{document.removeEventListener('visibilitychange',pause);video.current?.pause();};
  },[]);
  useEffect(()=>{
    // The explicit viewed preview holds the source end-frame; real demo consumption removes it.
    if(!consumed||value.viewed)return;
    const timer=window.setTimeout(()=>setDismissed(true),reduced?0:650);
    return()=>clearTimeout(timer);
  },[consumed,value.viewed,reduced]);
  const toggle=()=>{
    if(!active||consumed||!value.src)return;
    const node=video.current;if(!node)return;
    if(playing){node.pause();return;}
    if(node.currentTime>=value.duration-.05||node.ended)node.currentTime=0;
    setStarted(true);setExpanded(true);
    void node.play().catch(()=>{setPlaying(false);setStarted(false);});
  };
  if(dismissed)return <span className="chat-circle-finished" hidden/>;
  return <motion.div ref={root} className={`chat-circle-content ${outgoing?'is-outgoing':'is-incoming'} ${expanded&&!consumed?'is-expanded':''} ${consumed?'is-consumed':''}`}
    style={{'--circle-size':`${geometry.size}px`,'--circle-inset':`${geometry.inset}px`} as CSSProperties}
    initial={false} animate={{width:geometry.size,height:geometry.size,opacity:consumed&&!value.viewed?0:1}}
    transition={reduced?STILL:UI_MOTION.surface}>
    {consumed?<img className="chat-circle-viewed" src={CIRCLE_ASSETS+'viewed.png'} width="386" height="236" alt="Кружок просмотрен"/>:<>
      <button className="chat-circle-surface" aria-label={playing?'Приостановить кружок':'Воспроизвести кружок'} aria-pressed={playing}
        aria-disabled={!value.src||!active} onClick={toggle}>
        <span className="chat-circle-picture">
          <img className="chat-circle-poster" src={value.poster??CIRCLE_ASSETS+'poster.webp'} alt="" draggable={false} loading="lazy" decoding="async" style={{opacity:started?0:1}}/>
          {value.src&&<video ref={video} className="chat-circle-video" src={value.src} muted playsInline preload="none" style={{opacity:started?1:0}}
            onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={finish}
            onTimeUpdate={event=>{const current=Math.min(value.duration,event.currentTarget.currentTime);setElapsed(previous=>Math.floor(previous*5)===Math.floor(current*5)?previous:current);if(current>=value.duration)finish();}}/>}
          {value.once&&!started&&!expanded&&<span className="chat-circle-once"><img src={CIRCLE_ASSETS+'once-cover.svg'} width="48" height="48" alt=""/></span>}
          {!outgoing&&!expanded&&!started&&<span className="chat-circle-mute"><img src={CIRCLE_ASSETS+'mute.svg'} width="16" height="16" alt=""/></span>}
        </span>
        {expanded&&<span className="chat-circle-progress" aria-hidden="true"><img src={CIRCLE_ASSETS+'progress.svg'} width="171.117" height="132.939" alt=""/></span>}
      </button>
      <span className="chat-circle-time is-leading"><span>{circleTime(started?elapsed:value.elapsed??value.duration)}</span></span>
      <span className="chat-circle-time is-trailing"><span style={{width:time?.length===4?(outgoing?22:23):undefined}}>{time}</span>{outgoing&&!expanded&&<img src={CIRCLE_ASSETS+'checks.svg'} width="12.7949" height="10.5645" alt=""/>}</span>
      {reply&&!expanded&&<button className="chat-circle-reply" aria-label="Перейти к сообщению, на которое ответили" onClick={()=>onQuote(reply.id)}><ChatQuoteMaterial circle/><strong>В ответ</strong><span>{reply.text}</span></button>}
    </>}
  </motion.div>;
}
