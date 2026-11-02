import {useEffect,useState,type ReactNode} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {UI_MOTION,STILL} from '../ui/motion';
export function ChatHint({children,show=false,text='Исчезнет после просмотра'}:{children?:ReactNode;show?:boolean;text?:string}){
 const [hover,setHover]=useState(false),reduced=useReducedMotion();
 useEffect(()=>{if(!show&&!hover)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setHover(false);};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[show,hover]);
 return <span className="chat-hint-anchor" onPointerEnter={()=>setHover(true)} onPointerLeave={()=>setHover(false)} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)}>{children}<AnimatePresence>{(show||hover)&&<motion.span role="tooltip" className="chat-source-tooltip" data-node-id="4055:115218" initial={{opacity:0,y:reduced?0:3}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:3}} transition={reduced?STILL:UI_MOTION.fade}><span>{text}</span><img src="/assets/chat/correction/tooltip-nose.svg" alt=""/></motion.span>}</AnimatePresence></span>;
}
