import { useEffect, useRef,useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useMotionValue } from 'motion/react';
import { ChatComposer } from '../src/components/ChatConversation';
import { MobileRuntime } from '../src/mobile';
import '../src/styles.css';
import '../src/prototype.css';
import '../src/components/chat-actions.css';

// Isolated QA only: known speech feeds the real composer; no microphone access.
const reducedModel=new URLSearchParams(location.search).get('reduced')==='1';
if(reducedModel){
  const match=window.matchMedia.bind(window);
  window.matchMedia=query=>query==='(prefers-reduced-motion)'||query==='(prefers-reduced-motion: reduce)'
    ?Object.assign(new EventTarget(),{matches:true,media:query,onchange:null,addListener:()=>{},removeListener:()=>{}}) as MediaQueryList
    :match(query);
}
function RecordingFixture() {
  const energy = useMotionValue(0);
  const [mode,setMode]=useState<'idle'|'recording'|'locked'>('locked');
  const graph = useRef<{context: AudioContext; frame: number} | null>(null);
  const trace=useRef(0);
  const measure=()=>{
    cancelAnimationFrame(trace.current);
    const output=document.getElementById('glow-motion-result');if(output){output.dataset.complete='false';output.textContent='';}
    const rows:unknown[]=[];const started=performance.now();
    const sample=()=>{
      const glow=document.querySelector<HTMLElement>('.chat-record-glow');
      const rotor=glow?.querySelector('img'),button=document.querySelector<HTMLElement>('.chat-record-action');
      if(!glow||!rotor||!button)return;
      const g=getComputedStyle(glow),r=getComputedStyle(rotor),b=button.getBoundingClientRect();
      rows.push({ms:performance.now()-started,energy:energy.get(),glow:g.transform,opacity:g.opacity,rotation:r.transform,playState:r.animationPlayState,origin:r.transformOrigin,button:{x:b.x,y:b.y,w:b.width,h:b.height,transform:getComputedStyle(button).transform}});
      if(performance.now()-started<2200)trace.current=requestAnimationFrame(sample);
      else {const output=document.getElementById('glow-motion-result');if(output){output.textContent=JSON.stringify(rows);output.dataset.complete='true';}}
    };sample();
  };
  useEffect(()=>()=>cancelAnimationFrame(trace.current),[]);
  const stop = () => {
    if (graph.current) { cancelAnimationFrame(graph.current.frame); void graph.current.context.close(); }
    graph.current = null; energy.set(0);
  };
  useEffect(() => stop, []);
  const play = async () => {
    stop();
    const context = new AudioContext(); await context.resume();
    const source = context.createBufferSource();
    source.buffer = await context.decodeAudioData(await (await fetch('/assets/chat/voice-long-demo.wav')).arrayBuffer());
    const analyser = context.createAnalyser(); analyser.fftSize = 256;
    const silentOutput = context.createGain(); silentOutput.gain.value = 0;
    source.connect(analyser); analyser.connect(silentOutput); silentOutput.connect(context.destination);
    const data = new Uint8Array(analyser.fftSize), session = { context, frame: 0 }; graph.current = session;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0; for (const sample of data) { const value = (sample - 128) / 128; sum += value * value; }
      energy.set(Math.min(1, Math.sqrt(sum / data.length) * 6));
      session.frame = requestAnimationFrame(tick);
    };
    source.onended = stop; source.start(); tick(); measure();
  };
  const noop = () => {};
  return <>
    <button style={{position:'fixed',top:20,left:20,zIndex:100}} onClick={() => void play()}>Проверить реакцию на тестовое аудио</button>
    <button style={{position:'fixed',top:70,left:20,zIndex:100}} onClick={()=>setMode('recording')}>Проверить жест блокировки</button>
    <button style={{position:'fixed',top:110,left:20,zIndex:100}} onClick={measure}>Измерить тихое свечение</button>
    <button style={{position:'fixed',top:150,left:20,zIndex:100}} onClick={()=>{
      Object.defineProperty(document,'hidden',{configurable:true,value:!document.hidden});
      document.dispatchEvent(new Event('visibilitychange'));
    }}>Тест скрытия страницы</button>
    <pre id="glow-motion-result" hidden/>
    <MobileRuntime><main className="dialog-root"><div style={{position:'absolute',left:20,top:600}}>
      <ChatComposer value="" reply={null} ended={false} menu={true} keyboard={false} mode={mode} seconds={5} recordingOnce={false} onOnce={noop} recordEnergy={energy} onChange={noop} onFocus={noop} onBlur={noop} onSend={noop} onMenu={noop} onClearReply={noop} onHeight={noop} onRecord={()=>setMode('recording')} onCancelRecord={()=>{stop();setMode('idle');}} onLockRecord={()=>setMode('locked')} onSendRecord={()=>setMode('idle')}/>
    </div></main></MobileRuntime>
  </>;
}
createRoot(document.getElementById('root')!).render(<RecordingFixture/>);
