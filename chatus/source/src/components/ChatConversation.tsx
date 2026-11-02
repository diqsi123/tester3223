import {ChatReactionGlyph} from './ChatReactionGlyph';
import { notifyHistoryLayout } from './chat-history-layout';
import { ChatQuoteMaterial } from './ChatQuoteMaterial';
import {ChatHint} from './ChatHint';
import {ChatVideoCircle} from './ChatVideoCircle';
import type {CircleMessageData} from './circle-geometry';
import {UI_MOTION} from '../ui/motion';
import { CHAT_CARET, composerLineMetrics, textareaCaretGeometry } from '../ui/caret';
import './chat-entry.css';
import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentProps, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useSpring, useIsPresent, useTransform, type MotionValue } from 'motion/react';
import { KeyboardTextarea } from '../mobile';
import {useChatusViewportLayout} from './ChatusViewport';
import {nativeTextPlane} from '../ui/native-text-plane';
export { messageTailFlags } from './chat-message-groups';

export const CHAT_LAYOUT = UI_MOTION.surface;
export const CHAT_FADE = UI_MOTION.fade;
export {CHAT_PREVIEWS,chatScenario,chatPresence,DEMO_CIRCLE} from './chat-scenarios';
export type {ChatPreview} from './chat-scenarios';
import { ChatMediaContent } from './ChatMedia';
export type ChatMediaItem = { url: string; type: 'image' | 'video'; name: string; source?: 'video-poster' | 'taken-now'; height?: number; duration?: number };
export type ChatMessage = { circle?:CircleMessageData; friendship?: import('./ChatActions').Friendship; media?: ChatMediaItem[]; once?: boolean; demoOnly?:boolean; sticker?:number; stickerAsset?:string; id: string; outgoing: boolean; text?: string; duration?: number; audio?: string; reply?: { id: string; text: string }; width?: number; height?: number; time?: string; fresh?: boolean; edited?: boolean; reactions?: { emoji: string; count: number; selected: boolean; asset?:string; sourcePill?:boolean }[] };
export const voiceTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const WAVE = [7,19,23,23,15,9,3,9,7,15,9,3,9,7,15,11,15,13,7,19,3,9,7,11,15,13,7,19,25,23,13,15,11,15,13,7,19];

function Wave({progress,levels,playing,reduced}:{progress:MotionValue<number>;levels:MotionValue<number[]>;playing:boolean;reduced:boolean}){
  const root=useRef<HTMLDivElement>(null);
  const clip=useTransform(progress,value=>`inset(0 ${100-value*100}% 0 0)`);
  useEffect(()=>{
    const bars=root.current?.querySelectorAll<HTMLElement>('i');if(!bars)return;
    const reset=()=>bars.forEach(bar=>{bar.style.transform='scaleY(1)';});
    if(!playing||reduced){reset();return;}
    const update=(values:number[])=>bars.forEach((bar,index)=>{const i=index%WAVE.length;const scale=.45+(values[i]??0)*1.25;bar.style.transform=`scaleY(${Math.min(29/WAVE[i],Math.max(.35,scale))})`;});
    const unsubscribe=levels.on('change',update);return()=>{unsubscribe();reset();};
  },[levels,playing,reduced]);
  return <div ref={root} className="chat-wave" aria-hidden="true"><div>{WAVE.map((height,i)=><i key={i} style={{height}}/>)}</div><motion.div className="chat-wave-progress" style={{clipPath:clip}}>{WAVE.map((height,i)=><i key={i} style={{height}}/>)}</motion.div></div>;
}
function VoicePlayer({message,active}:{message:ChatMessage;active:boolean}){
  const reduced=useReducedMotion();
  const reducedRef=useRef(reduced);reducedRef.current=reduced;
  const [playing,setPlaying]=useState(false);const [consumed,setConsumed]=useState(false);const once=message.once&&message.demoOnly;const [elapsed,setElapsed]=useState(0);const [transcript,setTranscript]=useState(false);
  const audio=useRef<HTMLAudioElement|null>(null);const elapsedRef=useRef(0);
  const graph=useRef<{context:AudioContext;analyser:AnalyserNode;data:Uint8Array<ArrayBuffer>}|null>(null);
  const duration=message.duration??1;const progress=useMotionValue(0);const levels=useMotionValue<number[]>([]);
  useEffect(()=>{if(!active)setPlaying(false);},[active]);
  useEffect(()=>{const pause=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause);},[]);
  useEffect(()=>{
    if(!playing)return;
    const stopOther=()=>setPlaying(false);window.dispatchEvent(new Event('chatus-voice-play'));window.addEventListener('chatus-voice-play',stopOther);
    const from=elapsedRef.current>=duration?0:elapsedRef.current;
    const node=audio.current??new Audio(message.audio??`/assets/chat/voice-${duration<=1?'short':'long'}-demo.wav`);audio.current=node;node.currentTime=Number.isFinite(node.duration)&&from>=node.duration-.05?0:from;
    if(!graph.current){try{const context=new AudioContext();const analyser=context.createAnalyser();analyser.fftSize=256;analyser.smoothingTimeConstant=.65;context.createMediaElementSource(node).connect(analyser);analyser.connect(context.destination);graph.current={context,analyser,data:new Uint8Array(analyser.frequencyBinCount)};}catch{/* Playback remains available if the browser cannot analyse audio. */}}
    if(graph.current)void graph.current.context.resume();void node.play().catch(()=>setPlaying(false));
    let frame=0;
    const tick=()=>{
      const value=audio.current?.currentTime??0;
      elapsedRef.current=Math.min(duration,value);progress.set(Math.min(1,value/duration));
      if(!reducedRef.current&&graph.current){const {analyser,data}=graph.current;analyser.getByteFrequencyData(data);levels.set(WAVE.map((_,i)=>Math.min(1,data[Math.min(data.length-1,2+Math.floor(i*1.7))]/180)));}
      setElapsed(previous=>Math.floor(previous*5)===Math.floor(value*5)?previous:Math.min(duration,value));
      if(value>=duration||audio.current?.ended){setPlaying(false);if(once)setConsumed(true);return;}frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('chatus-voice-play',stopOther);audio.current?.pause();const context=graph.current?.context;if(context&&context.state!=='closed')void context.suspend().catch(()=>{});};
  },[playing,message.audio,duration,progress,levels,once]);
  useEffect(()=>()=>{audio.current?.pause();void graph.current?.context.close();},[]);
  const kind=message.outgoing?'out':'in';const fade=reduced?{duration:0}:CHAT_FADE;
  return <><div className="chat-voice-content">
    <button className="chat-voice-play" aria-label={playing?'Приостановить голосовое':'Воспроизвести голосовое'} aria-pressed={playing} disabled={consumed} onClick={()=>setPlaying(value=>!value)}>
      <motion.img src={`/assets/chat/voice-bg-${kind}.svg`} alt="" initial={false} animate={{opacity:playing?1:0}} transition={fade}/>
      <motion.img src={`/assets/chat/voice-play-${kind}.svg`} alt="" initial={false} animate={{opacity:playing?0:1}} transition={fade}/>
      <motion.span className="chat-pause" initial={false} animate={{opacity:playing?1:0}} transition={fade}/>
    </button>
    <div className="chat-voice-info"><Wave progress={progress} levels={levels} playing={playing} reduced={Boolean(reduced)}/><span className="chat-voice-duration">{consumed?'Прослушано':voiceTime(playing||elapsed>0&&elapsed<duration?elapsed:duration)}</span></div>
    {once?<ChatHint text="Демо: исчезнет после просмотра"><button className="chat-once-demo" aria-label="Разовое голосовое · демо" onClick={()=>setTranscript(value=>!value)}>1</button></ChatHint>:<button className="chat-transcribe" aria-label="Расшифровать голосовое" aria-expanded={transcript} onClick={()=>setTranscript(value=>!value)}><img src={`/assets/chat/${message.outgoing?'transcribe-out':'transcribe'}.svg`} alt=""/></button>}
  </div><AnimatePresence initial={false}>{transcript?<motion.p className="chat-transcript" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={fade}>{once?'Демо на тестовом аудио. Удаление на сервере не реализовано.':message.audio?'Расшифровка записи недоступна в прототипе.':'Привет. Это пример голосового сообщения.'}</motion.p>:null}</AnimatePresence></>;
}

function ChatMessageRow({fresh,reduced,children,reactions,circle=false}:{fresh?:boolean;reduced:boolean;children:React.ReactNode;reactions?:boolean;circle?:boolean}){
 const root=useRef<HTMLDivElement>(null),settled=useRef(false),generation=useRef(0);
 const reactionPadding=useRef(reactions?22:0),previousReactions=useRef(reactions);
 const entry=useRef({running:false,height:0,progress:1});
 // Entry and reaction spacing compose into one presented height. Adding a
 // reaction while a send is still entering must never restart that send at0.
 const paintLayout=()=>{
  const row=root.current;if(!row)return;
  row.style.paddingBottom=((circle?8:0)+reactionPadding.current)+'px';
  if(entry.current.running)row.style.height=(entry.current.height+reactionPadding.current)+'px';
  notifyHistoryLayout(row,entry.current.progress,!entry.current.running);
 };
 useLayoutEffect(()=>{
  if(!root.current||previousReactions.current===reactions)return;
  previousReactions.current=reactions;
  const target=reactions?22:0;
  const paint=(value:number)=>{reactionPadding.current=value;paintLayout();};
  if(reduced){paint(target);return;}
  const control=animate(reactionPadding.current,target,{...UI_MOTION.surface,onUpdate:paint});
  return()=>control.stop();
 },[reactions,reduced,circle]);
 useLayoutEffect(()=>{
  const row=root.current,bubble=row?.querySelector<HTMLElement>('.chat-bubble,.chat-circle-message');
  if(!row||!bubble||!fresh||settled.current)return;
  if(reduced){settled.current=true;notifyHistoryLayout(row);return;}
  const version=++generation.current;
  let controls:ReturnType<typeof animate>|undefined;
  const gap=Number.parseFloat(getComputedStyle(row.parentElement!).rowGap)||0;
  entry.current={running:true,height:0,progress:0};
  row.style.height=reactionPadding.current+'px';row.style.marginTop=-gap+'px';row.style.opacity='0';
  // Measure after the parent resolves its real single-line padding.
  queueMicrotask(()=>{
   if(generation.current!==version)return;
   const target=bubble.offsetHeight+(circle?16:0)+gap;
   const paint=(height:number)=>{
    entry.current.height=height;entry.current.progress=Math.min(1,height/Math.max(1,target));
    row.style.opacity=String(entry.current.progress);paintLayout();
   };
   paint(0);
   controls=animate(0,target,{...UI_MOTION.send,onUpdate:paint,onComplete:()=>{
    settled.current=true;entry.current.running=false;entry.current.progress=1;
    row.style.height='auto';row.style.marginTop='';row.style.opacity='';paintLayout();
   }});
  });
  return()=>{generation.current++;controls?.stop();entry.current.running=false;entry.current.progress=1;row.style.height='auto';row.style.marginTop='';row.style.opacity='';};
 },[fresh,reduced,circle]);
 return <div ref={root} className={`chat-message-row ${reactions?'has-reactions':''}`} style={{paddingBottom:(circle?8:0)+reactionPadding.current}}>{children}</div>;
}

export const ChatBubble = memo(function ChatBubble({ message, groupEnd, active, selected, onReply, onQuote, onActions, onReact }: { message: ChatMessage; groupEnd: boolean; active: boolean; selected?:boolean; onReply: (message: ChatMessage) => void; onQuote: (id: string) => void; onActions?: (message: ChatMessage, element: HTMLElement) => void; onReact?: (emoji: string) => void }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const settle = useRef<ReturnType<typeof animate> | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuOpened = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; offset: number; claimed: boolean; distance: number; velocity: number; lastX: number; time: number } | null>(null);
  const stopHold = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; };
  useEffect(() => () => { stopHold(); settle.current?.stop(); }, []);
  const gestureDown = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as Element).closest('button') || event.button !== 0 || event.isPrimary === false || drag.current && drag.current.id !== event.pointerId || !active) return;
    settle.current?.stop(); stopHold(); menuOpened.current = false;
    const element = event.currentTarget;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: x.get(), claimed: false, distance: 0, velocity: 0, lastX: event.clientX, time: performance.now() };
    if (onActions) hold.current = setTimeout(() => { menuOpened.current = true; drag.current = null; onActions(message, element); }, 450);
  };
  const gestureMove = (event: ReactPointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (!session || session.id !== event.pointerId) return;
    const dx = event.clientX - session.x, dy = event.clientY - session.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 8) stopHold();
    if (!session.claimed) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
      if (Math.abs(dy) >= Math.abs(dx) || dx < 0) { drag.current = null; return; }
      session.claimed = true; event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault(); event.stopPropagation();
    const now = performance.now();
    session.velocity = (event.clientX - session.lastX) / Math.max(1, now - session.time) * 1000;
    session.lastX = event.clientX; session.time = now; session.distance = dx;
    const travel = session.offset + Math.max(0, dx);
    x.set(reduced ? 0 : travel <= 56 ? travel : 56 + 24 * (1 - Math.exp(-(travel - 56) / 48)));
  };
  const finish = (event: ReactPointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (session && session.id !== event.pointerId) return;
    stopHold(); drag.current = null;
    settle.current?.stop();
    if (reduced) x.set(0);
    else settle.current = animate(x, 0, { ...UI_MOTION.gesture, velocity: event.type === 'pointercancel' ? 0 : session?.velocity ?? 0 });
    if (!session?.claimed || menuOpened.current) return;
    event.preventDefault(); event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (session.distance > 44 && event.type !== 'pointercancel') onReply(message);
  };
  const voice = message.duration !== undefined;const article=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{const node=article.current,text=node?.querySelector<HTMLElement>('.chat-bubble-text');if(node&&text&&!message.height&&!message.reply)node.dataset.singleLine=String(text.offsetHeight<=20);},[message.text,message.height,message.reply]);
  return <ChatMessageRow fresh={message.fresh} reduced={Boolean(reduced)} reactions={!!message.reactions?.length} circle={Boolean(message.circle)}><motion.article ref={article} id={`chat-${message.id}`} data-group-end={groupEnd} data-menu-selected={selected} className={`${message.circle?'chat-circle-message':'chat-bubble'} ${message.outgoing ? 'is-outgoing' : 'is-incoming'} ${voice ? 'is-voice' : ''} ${message.sticker!==undefined?'is-sticker':''} ${message.media?.length ? 'is-media' : ''} ${message.reply ? 'has-reply' : ''} ${message.height === 36 ? 'is-short' : ''} ${message.edited ? 'is-edited' : ''}`} aria-label={voice ? `${message.outgoing ? 'Ваше' : 'Входящее'} голосовое, ${voiceTime(message.duration!)}` : `${message.outgoing ? 'Вы' : 'Собеседник'}: ${message.media?.length ? 'Медиа, ' : ''}${message.text??''}`} tabIndex={0}
    style={{ width: message.circle?undefined:message.width, minHeight: message.circle?undefined:message.height, height: message.circle?undefined:message.duration === undefined ? message.height : undefined, x }} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .26, ease: [.22, 1, .36, 1] }}
    onPointerDown={gestureDown} onPointerMove={gestureMove} onPointerUp={finish} onPointerCancel={finish} onDoubleClick={event => {stopHold();if(!menuOpened.current&&!(event.target as Element).closest('button'))onReply(message);}} onContextMenu={event => { event.preventDefault(); stopHold(); onActions?.(message, event.currentTarget); }} onKeyDown={event => { if((event.target as Element).closest('button,video'))return; if (event.key.toLowerCase() === 'r') { event.preventDefault(); onReply(message); } else if (event.key === 'ContextMenu' || event.key === 'F10' && event.shiftKey || event.key === 'Enter') { event.preventDefault(); onActions?.(message, event.currentTarget); } }}>
    {message.reply&&!message.circle ? <button className="chat-quote" aria-label="Перейти к сообщению, на которое ответили" onClick={() => onQuote(message.reply!.id)}><ChatQuoteMaterial outgoing={message.outgoing}/><strong>В ответ</strong><span>{message.reply.text}</span></button> : null}
    {message.circle?<ChatVideoCircle value={message.circle} outgoing={message.outgoing} time={message.time} active={active} reply={message.reply} onQuote={onQuote}/>:message.sticker!==undefined?<img className="chat-sent-sticker" src={message.stickerAsset??'/assets/chat/correction/sticker-'+message.sticker+'.png'} alt={'Стикер '+(message.sticker+1)}/>:message.media?.length ? <><ChatMediaContent items={message.media} once={message.once} timeLabel={`Сегодня, в ${message.time??'9:41'}`}/>{message.text&&<p className="chat-bubble-text">{message.text}<span className="chat-time-spacer" aria-hidden="true"/></p>}</> : voice ? <VoicePlayer message={message} active={active}/> : <p className="chat-bubble-text">{message.text}{!message.height ? <span className="chat-time-spacer" aria-hidden="true"/> : null}</p>}
    {!message.circle&&<span className="chat-message-time" aria-label={`${message.time ?? '9:41'}${message.outgoing ? ', прочитано' : ''}`}><span>{message.edited ? 'Изменено ' : ''}{message.time ?? '9:41'}</span>{message.outgoing ? <img src="/assets/chat/checks.svg" alt=""/> : null}</span>}
    {message.reactions?.length ? <div className="chat-reactions is-source" aria-label="Реакции на сообщение">{message.reactions.map(reaction => <motion.button key={reaction.emoji} className="has-source-asset" aria-label={`Реакция ${reaction.emoji}, ${reaction.count}`} aria-pressed={reaction.selected} onClick={() => onReact?.(reaction.emoji)} initial={{opacity:0}} animate={{opacity:1}} transition={reduced?{duration:0}:UI_MOTION.fade}><ChatReactionGlyph emoji={reaction.emoji} size={message.outgoing?16:14}/>{reaction.count > 1 && <span className="chat-reaction-count">{reaction.count}</span>}</motion.button>)}</div> : null}
  </motion.article></ChatMessageRow>;
});

export type RecordingMode = 'idle' | 'recording' | 'locked';
export function useVoiceRecording(onSend: (message: ChatMessage) => void) {
  const [mode, setMode] = useState<RecordingMode>('idle');const [once,setOnce]=useState(false); const [seconds, setSeconds] = useState(0); const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null); const stream = useRef<MediaStream | null>(null); const chunks = useRef<Blob[]>([]); const generation = useRef(0); const started = useRef(0); const elapsed = useRef(0); const urls = useRef<string[]>([]); const simulated = useRef(false);const energy=useMotionValue(0);const live=useRef<{context:AudioContext;frame:number}|null>(null);
  const stopTracks = () => {stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(live.current){cancelAnimationFrame(live.current.frame);void live.current.context.close();live.current=null;}energy.set(0);};
  useEffect(() => { if (mode === 'idle') return; let displayedSecond=Math.floor(elapsed.current); const tick = () => { elapsed.current = (performance.now() - started.current) / 1000; const next=Math.floor(elapsed.current); if(next!==displayedSecond){displayedSecond=next;setSeconds(next);} }; const interval = window.setInterval(tick, 100); return () => clearInterval(interval); }, [mode]);
  useEffect(() => () => { generation.current++; if (recorder.current?.state === 'recording') recorder.current.stop(); stopTracks(); urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const cancel = () => { setOnce(false);generation.current++; if (recorder.current?.state === 'recording') recorder.current.stop(); recorder.current = null; stopTracks(); setMode('idle'); setSeconds(0); };
  const start = async () => {
    const version = ++generation.current; simulated.current=false; setError(''); started.current = performance.now(); elapsed.current = 0; setSeconds(0); setMode('recording');
    try { const media = await navigator.mediaDevices.getUserMedia({ audio: true }); if (version !== generation.current) { media.getTracks().forEach(track => track.stop()); return; } stream.current = media; chunks.current = []; const node = new MediaRecorder(media); recorder.current = node; node.ondataavailable = event => { if (event.data.size) chunks.current.push(event.data); }; node.start();
      try{const context=new AudioContext(),analyser=context.createAnalyser();analyser.fftSize=256;context.createMediaStreamSource(media).connect(analyser);await context.resume();if(version!==generation.current){void context.close();return;}const data=new Uint8Array(analyser.fftSize);const graph={context,frame:0};live.current=graph;
        const tick=()=>{analyser.getByteTimeDomainData(data);let sum=0;for(const sample of data){const value=(sample-128)/128;sum+=value*value;}energy.set(Math.min(1,Math.sqrt(sum/data.length)*6));graph.frame=requestAnimationFrame(tick);};tick();
      }catch{/* Recording works even if this browser cannot expose a live level. */}
    }
    catch { if (version === generation.current) { cancel(); setError('Для записи разреши доступ к микрофону.'); } }
  };
  const finish = () => {
    const duration = Math.max(1, Math.round(elapsed.current)); const node = recorder.current; const version = generation.current;
    if (node?.state === 'recording') { node.onstop = () => { if (version !== generation.current) return; const url = URL.createObjectURL(new Blob(chunks.current, { type: node.mimeType })); urls.current.push(url); stopTracks(); onSend({ id: `voice-${Date.now()}`, outgoing: true, duration, audio: url, fresh: true }); }; node.stop(); }
    else if(simulated.current) { generation.current++; stopTracks(); onSend({ id: `voice-${Date.now()}`, outgoing: true, duration:Math.min(5,duration),once,demoOnly:once,fresh: true }); }
    else {cancel();setError('Запись ещё не началась. Попробуй ещё раз.');return;}
    recorder.current = null; setMode('idle'); setSeconds(0);
  };
  const preview = (state: RecordingMode) => { cancel(); setError(''); simulated.current=true; if (state !== 'idle') { started.current = performance.now() - (state === 'locked' ? 5000 : 1000); elapsed.current = state === 'locked' ? 5 : 1; setSeconds(elapsed.current); setMode(state); } };
  return { mode, seconds, error, energy, once, toggleOnce:()=>{if(simulated.current)setOnce(v=>!v);else setError('Разовый режим в прототипе доступен только на тестовом аудио.');}, start, cancel, finish, lock: () => setMode('locked'), preview, reset:()=>{cancel();urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current=[];} };
}

/** A fading recording must release hit testing as soon as the idle composer returns. */
function RecordingSurface(props:ComponentProps<typeof motion.div>){
 const present=useIsPresent();
 return <motion.div {...props} inert={!present} aria-hidden={!present} style={{...props.style,pointerEvents:present?'auto':'none'}}/>;
}

type ComposerProps = { recordKind?: 'voice'|'circle'; editing?: boolean; onAttachment?: () => void; onStickers?:()=>void; stickers?:boolean; value: string; reply: ChatMessage | null; ended: boolean; menu: boolean; keyboard: boolean; mode: RecordingMode; seconds: number; recordEnergy:MotionValue<number>;recordingOnce:boolean;onOnce:()=>void; onChange: (value: string) => void; onFocus: () => void; onBlur: () => void; onSend: () => void; onMenu: () => void; onClearReply: () => void; onHeight: (height: number) => void; onRecord: () => void; onCancelRecord: () => void; onLockRecord: () => void; onSendRecord: () => void };
export function ChatComposer(props: ComposerProps) {
  const reduced = useReducedMotion();
  const {native,zoom:layoutZoom}=useChatusViewportLayout();
  // CSS zoom also shrinks WebKit's focus font; transform only the text plane instead.
  const {fontSize,scale:textZoom}=nativeTextPlane(15,native,layoutZoom);
  // The >=16px native font plane paints Gerbera 1px above its 15px Figma baseline.
  // Redistribute padding without moving the source caret or changing field height.
  const textBaselineOffset=native?1:0;
  const textPlane={transform:textZoom===1?undefined:`scale(${textZoom})`,transformOrigin:'0 0'};
  const composer = useRef<HTMLDivElement>(null), mirror = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const [lineCount, setLineCount] = useState(1);
  const gesture = useRef<{ id: number; x: number; y: number; down: number } | null>(null);
  const [focused,setFocused]=useState(false);
  const [selection,setSelection]=useState({start:0,end:0});
  const [caret,setCaret]=useState({x:0,y:0,visible:false});
  const { lines, lineHeight, measuringLineHeight, barHeight, paddingTop, paddingBottom } =
    composerLineMetrics(lineCount, Boolean(props.reply));
  const replyHeight = props.reply ? 52 : 0;
  const height = props.mode === 'idle' ? barHeight + replyHeight + 16 : 64;
  const measure = useRef<() => void>(() => {});
  measure.current = () => {
    const node = mirror.current, input = field.current, text = node?.firstChild;
    if (!node || !input || !(text instanceof Text)) return;
    const count = Math.max(1, Math.round(node.offsetHeight / (measuringLineHeight/textZoom)));
    setLineCount(previous => previous === count ? previous : count);
    // Safari owns IME composition, selection and caret scrolling. Native typing
    // only measures line count; no Range/style/rect reads or synthetic caret commit.
    if (native) return;
    // Reading selection must not fight native IME's internal textarea scrolling.
    const range = document.createRange(), first = document.createRange();
    range.setStart(text, Math.min(input.selectionStart, text.length)); range.collapse(true);
    first.setStart(text, 0); first.collapse(true);
    const cursorRect = range.getClientRects()[0], firstRect = first.getClientRects()[0];
    const mirrorRect = node.getBoundingClientRect();
    if (!cursorRect || !firstRect || !mirrorRect.width) {
      // The native yellow caret remains available if this browser exposes no collapsed Range box.
      setCaret(previous => previous.visible ? {...previous,visible:false} : previous);
      return;
    }
    const outerZoom=mirrorRect.width/(parseFloat(getComputedStyle(node).width)*textZoom);
    const entryRect=input.parentElement!.getBoundingClientRect(),inputRect=input.getBoundingClientRect();
    const position = textareaCaretGeometry({ caret: cursorRect, first: firstRect, mirror: mirrorRect,
      zoom: outerZoom, fieldLeft:(inputRect.left-entryRect.left)/outerZoom, paddingTop,
      lineHeight, measuringLineHeight, lineCount: count, scrollTop: input.scrollTop*textZoom, scrollLeft: input.scrollLeft*textZoom });
    const visible = focused && input.selectionStart === input.selectionEnd;
    setCaret(previous => previous.x === position.x && previous.y === position.y && previous.visible === visible
      ? previous : {...position,visible});
  };
  const syncSelection = (input: HTMLTextAreaElement) => {
    if (native) return;
    const start=input.selectionStart,end=input.selectionEnd;
    setSelection(previous => previous.start===start&&previous.end===end ? previous : {start,end});
  };
  useLayoutEffect(() => {
    const node=mirror.current, input=composer.current?.querySelector<HTMLTextAreaElement>('textarea.chat-text-entry');
    if (!node || !input) return;
    field.current=input;
    let disposed=false;
    const update=()=>{if(!disposed)measure.current();};
    const observer=new ResizeObserver(update); observer.observe(node); observer.observe(input);
    const selected=()=>{if(document.activeElement===input)syncSelection(input);};
    document.addEventListener('selectionchange',selected);
    document.fonts.addEventListener('loadingdone',update);
    void document.fonts.ready.then(update);
    update();
    return()=>{disposed=true;observer.disconnect();document.removeEventListener('selectionchange',selected);
      document.fonts.removeEventListener('loadingdone',update);field.current=null;};
  }, []);
  useLayoutEffect(()=>measure.current(),[props.value,selection.start,selection.end,focused,lineCount,Boolean(props.reply),textZoom]);
  useLayoutEffect(() => props.onHeight(height), [height, props.onHeight]);
  const glowRotor=useRef<HTMLImageElement>(null);
  const recordingVisible=props.mode!=='idle';
  useEffect(()=>{
    const rotor=glowRotor.current;if(!rotor||!recordingVisible)return;
    const update=()=>{rotor.style.animationPlayState=document.hidden||reduced?'paused':'running';};
    update();document.addEventListener('visibilitychange',update);
    return()=>{document.removeEventListener('visibilitychange',update);rotor.style.animationPlayState='paused';};
  },[recordingVisible,reduced]);
  const smoothEnergy=useSpring(props.recordEnergy,{stiffness:180,damping:22,mass:.6});
  const glowScale=useTransform(smoothEnergy,value=>reduced?1:1+value*.12);
  const glowOpacity=useTransform(smoothEnergy,value=>reduced?1:.7+value*.3);
  const lockProgress=useMotionValue(props.mode==='locked'?1:0);
  const lockY=useTransform(lockProgress,[0,1],[0,29]);
  const lockOpenOpacity=useTransform(lockProgress,[0,.6,1],[1,.4,0]);
  const lockClosedOpacity=useTransform(lockProgress,[0,.6,1],[0,.4,1]);
  useEffect(()=>{const controls=animate(lockProgress,props.mode==='locked'?1:0,reduced?{duration:0}:UI_MOTION.gesture);return()=>controls.stop();},[props.mode,reduced,lockProgress]);
  const transition = reduced ? { duration: 0 } : CHAT_FADE;
  const startGesture = (event: ReactPointerEvent<HTMLElement>) => { if (props.ended || event.button !== 0) return; event.preventDefault(); composer.current?.setPointerCapture(event.pointerId); gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, down: performance.now() }; if(props.mode==='idle')props.onRecord(); };
  const moveGesture = (event: ReactPointerEvent<HTMLElement>) => { const g = gesture.current; if (!g || g.id !== event.pointerId) return; if (event.clientX - g.x < -64) { gesture.current = null; props.onCancelRecord(); } else { const progress=Math.max(0,Math.min(1,(g.y-event.clientY)/64));lockProgress.set(progress);if(progress>=1){gesture.current = null; props.onLockRecord();} } };
  const endGesture = (event: ReactPointerEvent<HTMLElement>) => { const g = gesture.current; gesture.current = null; if (!g || g.id !== event.pointerId) return; if (event.type === 'pointercancel') props.onCancelRecord(); else if (performance.now() - g.down < 220) props.onLockRecord(); else props.onSendRecord(); };
  return <motion.div ref={composer} className="chat-composer" onPointerMove={moveGesture} onPointerUp={endGesture} onPointerCancel={endGesture} style={{ '--chat-bar-height': `${barHeight}px`, '--chat-reply-height': `${replyHeight}px` } as CSSProperties} initial={false}>
    <div className="chat-input-measure" ref={mirror} style={{fontSize,width:166/textZoom,lineHeight:`${measuringLineHeight/textZoom}px`,letterSpacing:-.3/textZoom,...textPlane}} aria-hidden="true">{props.value + '\u200b'}</div>
    <motion.div className="chat-idle-composer" inert={props.mode !== 'idle'} aria-hidden={props.mode !== 'idle'} initial={false} animate={{opacity:props.mode === 'idle'?1:0}} transition={transition}>
      <button className="dialog-round-action chat-camera" aria-label="Прикрепить медиа" disabled={props.ended || !props.onAttachment} onPointerDown={event=>event.preventDefault()} onClick={props.onAttachment}><img className="dialog-round-glass" src="/assets/dialog/round-glass.png" alt=""/><img src="/assets/dialog/camera.svg" alt=""/></button>
      <motion.div className="chat-input-surface" data-multiline={lines>1} data-has-reply={Boolean(props.reply)} initial={false} animate={{borderRadius:lines===1&&!props.reply?24:20}} transition={reduced?{duration:0}:CHAT_LAYOUT}>
        <AnimatePresence initial={false}>{props.reply ? <motion.div className="chat-composer-reply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}><div><strong>{props.editing ? 'Редактирование' : 'В ответ'}</strong><span>{props.reply.duration !== undefined ? 'Голосовое сообщение' : props.reply.text}</span></div><button aria-label={props.editing?'Отменить редактирование':'Отменить ответ'} onPointerDown={event => event.preventDefault()} onClick={props.onClearReply}><img src="/assets/chat/reply-close.svg" alt=""/></button></motion.div> : null}</AnimatePresence>
        <div className="chat-entry-layer">
        <KeyboardTextarea className="chat-text-entry" aria-label="Сообщение" placeholder="Сообщение" rows={1} autoComplete="off" inputMode="text" autoCorrect="on" autoCapitalize="sentences" spellCheck={true} disabled={props.ended} value={props.value} style={{fontSize,left:14,width:166/textZoom,lineHeight:`${lineHeight/textZoom}px`,height:barHeight/textZoom,paddingTop:(paddingTop+textBaselineOffset)/textZoom,paddingBottom:(paddingBottom-textBaselineOffset)/textZoom,letterSpacing:-.3/textZoom,...textPlane}} onFocus={event=>{setFocused(true);syncSelection(event.currentTarget);props.onFocus();}} onBlur={()=>{setFocused(false);props.onBlur();}} onSelect={event=>syncSelection(event.currentTarget)} onScroll={()=>measure.current()} onChange={event=>{syncSelection(event.currentTarget);props.onChange(event.target.value);}} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); props.onBlur(); event.currentTarget.blur(); } if (!native && event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); props.onSend(); } }}/>
        {native?<span className="chat-empty-caret" aria-hidden="true"/>:null}
        {!native&&focused&&caret.visible?<span key={`${selection.start}-${props.value}`} className="chat-custom-caret" aria-hidden="true" style={{left:caret.x,top:caret.y,width:CHAT_CARET.width,height:CHAT_CARET.height,borderRadius:2}}/>:null}
        </div>
        <div className="dialog-composer-symbols"><button aria-label="Стикеры" aria-expanded={props.stickers} onClick={props.onStickers} onPointerDown={event => event.preventDefault()}><img src="/assets/dialog/timer.svg" alt=""/></button><button className="dialog-input-mode" aria-label={props.menu ? 'Меню действий' : 'Открыть клавиатуру'} aria-expanded={props.menu ? false : props.keyboard} onPointerDown={event => event.preventDefault()} onClick={props.onMenu}>{(['keyboard-source', 'menu'] as const).map((name, index) => <motion.span key={name} aria-hidden="true" initial={false} animate={{ opacity: props.menu === Boolean(index) ? 1 : 0, scale: props.menu === Boolean(index) ? 1 : .9 }} transition={transition}><img src={`/assets/dialog/${name}.svg`} alt=""/></motion.span>)}</button></div>
      </motion.div>
      <div className="chat-trailing">
        <motion.button className={`chat-send-action ${props.editing ? 'is-editing' : ''}`} aria-label={props.editing ? 'Сохранить изменения' : 'Отправить сообщение'} aria-hidden={!props.value.trim() && !props.editing} inert={!props.value.trim() && !props.editing} disabled={props.ended || !!props.editing && !props.value.trim()} initial={false} animate={{opacity:props.value.trim()||props.editing?1:0}} transition={transition} onPointerDown={event=>{event.preventDefault();field.current?.focus({preventScroll:true});}} onMouseDown={event=>event.preventDefault()} onClick={()=>{field.current?.focus({preventScroll:true});props.onSend();}}>{props.editing ? <img src="/assets/chat/mobile/edit-check.svg" alt=""/> : <img className="chat-send-vector" src="/assets/chat/send-vector-a0a31a2ac9.svg" alt=""/>}</motion.button>
        <motion.button className="dialog-round-action dialog-mic" aria-label={props.recordKind==='circle'?'Записать тестовый кружок':'Записать голосовое'} aria-hidden={!!props.value.trim() || props.editing} inert={!!props.value.trim() || props.editing} disabled={props.ended} initial={false} animate={{opacity:props.value.trim()||props.editing?0:1}} transition={transition} onPointerDown={props.recordKind==='circle'?undefined:startGesture} onClick={props.recordKind==='circle'?props.onRecord:undefined} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();props.onRecord();}}}><img className="dialog-round-glass" src="/assets/dialog/round-glass.png" alt=""/><img src={props.recordKind==='circle'?'/assets/chat-circle/video.svg':'/assets/dialog/microphone.svg'} alt=""/></motion.button>
      </div>
    </motion.div><AnimatePresence initial={false}>{props.mode !== 'idle' ? <RecordingSurface className="chat-recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{opacity:0}} transition={transition}><span className="chat-record-duration"><i/><span className="chat-record-time">{voiceTime(props.seconds)}</span></span>{props.mode === 'locked' ? <button className="chat-record-delete" onClick={props.onCancelRecord}><span>Удалить запись</span><img src="/assets/chat/trash.svg" alt=""/></button> : <span className="chat-record-cancel"><span aria-hidden="true">‹</span> Смахните для отмены</span>}
      {props.mode==='locked'&&<ChatHint><button className="chat-record-once" aria-label="Разовое голосовое" aria-pressed={props.recordingOnce} onClick={props.onOnce}><img src="/assets/chat/correction/record-once.svg" alt=""/></button></ChatHint>}<motion.div className="chat-record-lock-stack" style={{y:lockY}} aria-label={props.mode==='locked'?'Запись закреплена':'Смахни вверх, чтобы закрепить запись'}><motion.img src="/assets/chat/lock.svg" alt="" style={{opacity:lockOpenOpacity}}/><motion.img className="is-closed" src="/assets/chat/lock-locked.svg" alt="" style={{opacity:lockClosedOpacity}}/></motion.div><motion.div className="chat-record-glow" aria-hidden="true" style={{scale:glowScale,opacity:glowOpacity}}><img ref={glowRotor} src="/assets/chat/record-glow.svg" alt=""/></motion.div>
      <motion.button className="chat-record-action" onPointerDown={props.mode==='recording'?startGesture:undefined} aria-label={props.mode === 'locked' ? 'Отправить голосовое' : 'Закрепить запись'} onClick={props.mode === 'locked' ? props.onSendRecord : props.onLockRecord}><img src={props.mode === 'locked' ? '/assets/chat-circle/send-glyph-2988cc9bfc.svg' : '/assets/dialog/microphone.svg'} alt=""/></motion.button>
    </RecordingSurface>:null}</AnimatePresence>
  </motion.div>;
}
