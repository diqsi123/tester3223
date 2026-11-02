if(new URLSearchParams(location.search).has('bio-ime'))void import('./bio-ime-probe');
import './send-motion-probe';
import { StrictMode,Profiler,useState } from 'react';
import {recordAuthCommit} from './auth-flow-probe';
import { createRoot } from 'react-dom/client';
import '@fontsource/roboto/latin-500.css';
import App from '../src/App';
import {UI_MOTION} from '../src/ui/motion';
// Collision regression only: keep entry in flight long enough for external UI actions.
if(new URLSearchParams(location.search).has('slow-entry'))Object.assign(UI_MOTION.send,{stiffness:4,damping:4});
import '../src/styles.css';
import '../src/prototype.css';

// Private-browser regression: no storage, no app-side preset substitution.
if(new URLSearchParams(location.search).has('blocked-storage'))Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('Test storage blocked','SecurityError');}});

/** Test-owned viewport. The production App and its CSS mount unchanged below. */
class FixtureVisualViewport extends EventTarget {
  height = Number(new URLSearchParams(location.search).get('fixture-height')) || 780;
  offsetTop = 0;
  offsetLeft = 0;
  scale = 1;
  get width() { return document.documentElement.clientWidth; }
  get pageTop() { return window.scrollY + this.offsetTop; }
  get pageLeft() { return window.scrollX + this.offsetLeft; }
  update(next: Partial<Pick<FixtureVisualViewport, 'height' | 'offsetTop'>>) {
    Object.assign(this, next);
    // Both native events can describe one viewport change; app updates should coalesce.
    this.dispatchEvent(new Event('resize'));
    this.dispatchEvent(new Event('scroll'));
  }
}

const viewport = new FixtureVisualViewport();
const fixtureBaseHeight=viewport.height;
Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });

// Continuous native events reproduce the work of an iOS keyboard animation.
// The earlier instant buttons exercise final geometry only.
let keyboardRun = 0;
async function animateKeyboardCycles(handoff=false) {
  const run = ++keyboardRun;
  const rapid=handoff&&new URLSearchParams(location.search).has("rapid-handoff");
  let phase="start";
  const trace:Record<string,unknown>[]=[];
  const sample=()=>{
    const canvas=document.querySelector('.dialog-canvas,[data-flow-current="true"] .auth-canvas,.profile-editor-canvas')?.getBoundingClientRect();
    const composer=document.querySelector('.chat-media-caption')?.getBoundingClientRect()??document.querySelector('.chat-composer,[data-flow-current="true"] .auth-questionnaire-continue,[data-flow-current="true"] .auth-email-controls .auth-primary,[data-flow-current="true"] .auth-bottom,.profile-source-save')?.getBoundingClientRect();
    if(canvas&&composer)trace.push({time:performance.now(),phase,height:viewport.height,pan:viewport.offsetTop,canvasHeight:canvas.height,composerBottom:composer.bottom,actionsHeight:document.querySelector(".dialog-root")?parseFloat(getComputedStyle(document.querySelector(".dialog-root")!).getPropertyValue("--chat-actions-height"))||0:0,scrollY:window.scrollY,keyboardInset:parseFloat(document.documentElement.style.getPropertyValue('--chatus-native-keyboard'))||0,focused:document.activeElement instanceof HTMLInputElement||document.activeElement instanceof HTMLTextAreaElement});
  };
  const input = document.querySelector<HTMLTextAreaElement>('.chat-media-caption textarea')??document.querySelector<HTMLInputElement|HTMLTextAreaElement>('.profile-source-nickname input,[data-flow-current="true"] .auth-email-field input,[data-flow-current="true"] .auth-code-cell input,[data-flow-current="true"] .auth-nickname-field input,[data-flow-current="true"] .auth-bio-field textarea,textarea.chat-text-entry:not(:disabled)');
  const tween = (height: number, offsetTop: number) => new Promise<void>(resolve => {
    const from = {height: viewport.height, offsetTop: viewport.offsetTop}, start = performance.now();
    const frame = (now: number) => {
      sample();
      if (run !== keyboardRun) { resolve(); return; }
      const progress = Math.max(0,Math.min(1, (now-start)/(rapid?180:360))), eased = 1-(1-progress)**3;
      viewport.update({height: from.height+(height-from.height)*eased, offsetTop: from.offsetTop+(offsetTop-from.offsetTop)*eased});
      if (progress<1) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });
  for (let cycle=0;cycle<6&&run===keyboardRun;cycle++) {
    phase='opening';input?.focus({preventScroll:true});
    await tween(fixtureBaseHeight-(rapid?160:317),cycle%2?100:0);
    phase=handoff?'to-menu':'closing';
    if(handoff)document.querySelector<HTMLButtonElement>('.dialog-input-mode')?.click();else input?.blur();
    await tween(fixtureBaseHeight-(rapid?60:0),0);
    if(handoff){
      phase='from-menu';document.querySelector<HTMLButtonElement>('.dialog-input-mode')?.click();
      await tween(fixtureBaseHeight-317,0);
      phase='closing';input?.blur();await tween(fixtureBaseHeight,0);
    }
  }
  await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{sample();resolve();})));
  let output=document.querySelector('output[data-keyboard-trace]');
  if(!output){output=document.createElement('output');output.setAttribute('data-keyboard-trace','');output.setAttribute('hidden','');document.body.append(output);}
  output.textContent=JSON.stringify(trace);
  document.querySelector('[data-keyboard-cycles]')?.setAttribute('data-complete','true');
}

function ViewportControls() {
  const [snapshot, setSnapshot] = useState({ height: viewport.height, offsetTop: viewport.offsetTop });
  const update = (next: Partial<Pick<FixtureVisualViewport, 'height' | 'offsetTop'>>) => {
    viewport.update(next);
    setSnapshot({ height: viewport.height, offsetTop: viewport.offsetTop });
  };
  const keyboard = (height = 450) => {
    const caption = document.querySelector<HTMLTextAreaElement>('.chat-media-caption textarea');
    (caption ?? document.querySelector<HTMLInputElement|HTMLTextAreaElement>('[data-flow-current="true"] .auth-bio-field textarea,[data-flow-current="true"] .auth-nickname-field input,[data-flow-current="true"] .auth-email-field input,[data-flow-current="true"] .auth-code-digits input,textarea.chat-text-entry:not(:disabled)'))?.focus({ preventScroll: true });
    update({ height });
  };
  const close = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    // Safari can restore height before it releases the visual viewport's pan.
    update({ height: fixtureBaseHeight });
  };
  return <>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => keyboard()}>Клавиатура</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => keyboard(350)}>Высокая клавиатура</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => keyboard(497)}>Figma · 317</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => update({ offsetTop: 20 })}>Сдвиг 20</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => update({ offsetTop: 100 })}>Сдвиг 100</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={close}>Закрыть</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => update({ offsetTop: 0 })}>Сброс сдвига</button>
    <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => {
      window.scrollTo(0, 430);
      let owner = document.querySelector('textarea.chat-text-entry')?.parentElement;
      while (owner) { owner.scrollTop = 430; owner = owner.parentElement; }
    }}>Проверка прокрутки фокуса</button>
    <button type="button" data-keyboard-cycles onPointerDown={event=>event.preventDefault()} onClick={()=>void animateKeyboardCycles()}>6 циклов клавиатуры</button>
    <button type="button" data-keyboard-handoff onPointerDown={event=>event.preventDefault()} onClick={()=>void animateKeyboardCycles(true)}>Меню ↔ клавиатура</button>
    <button type="button" data-start-scroll-trace>Записать прокрутку</button>
    <button type="button" onPointerDown={event=>event.preventDefault()} onClick={()=>{document.getElementById('safari-viewport-controls')!.style.display='none';}}>Скрыть тестовую панель</button>
    <output data-testid="safari-vv-state">{`VisualViewport: height=${snapshot.height}, offsetTop=${snapshot.offsetTop}, scale=1`}</output>
  </>;
}

const fixtureAppRoot=createRoot(document.getElementById('root')!);
fixtureAppRoot.render(new URLSearchParams(location.search).has('strict')?<StrictMode><Profiler id="auth" onRender={recordAuthCommit}><App /></Profiler></StrictMode>:<Profiler id="auth" onRender={recordAuthCommit}><App /></Profiler>);
if(new URLSearchParams(location.search).get('controls')==='0')document.getElementById('safari-viewport-controls')?.remove();
else {
 const fixtureControlsRoot=createRoot(document.getElementById('safari-viewport-controls')!);fixtureControlsRoot.render(<ViewportControls />);
 if(import.meta.hot)import.meta.hot.dispose(()=>fixtureControlsRoot.unmount());
}
if(import.meta.hot)import.meta.hot.dispose(()=>fixtureAppRoot.unmount());

// Optional keyboard model for opening a premium sheet from a focused chat.
// F8 changes only the test-owned VisualViewport; no production code uses this.
if(new URLSearchParams(location.search).has('premium-keyboard')){
 document.addEventListener('keydown',event=>{if(event.key==='F8'){event.preventDefault();viewport.update({height:350,offsetTop:100});}});
 document.addEventListener('focusout',()=>requestAnimationFrame(()=>{
  if(!document.activeElement?.matches('input,textarea,[contenteditable=true]'))viewport.update({height:fixtureBaseHeight,offsetTop:0});
 }));
}

// Modal-safe, test-owned native keyboard controls; never shipped to production.
const fixtureKeys=(event:KeyboardEvent)=>{
 if(!event.altKey)return;
 if(event.code==='KeyK'){event.preventDefault();viewport.update({height:fixtureBaseHeight-317,offsetTop:0});}
 if(event.code==='KeyO'){event.preventDefault();(document.activeElement as HTMLElement)?.blur();viewport.update({height:fixtureBaseHeight,offsetTop:0});}
 if(event.code==='KeyY'){event.preventDefault();void animateKeyboardCycles();}
};
document.addEventListener('keydown',fixtureKeys);
if(import.meta.hot)import.meta.hot.dispose(()=>document.removeEventListener('keydown',fixtureKeys));

if(import.meta.hot)import.meta.hot.dispose(()=>{keyboardRun++;fixtureAppRoot.unmount();});
