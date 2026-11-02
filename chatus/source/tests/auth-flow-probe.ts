import type {ProfilerOnRenderCallback} from 'react';
let commits:{duration:number;phase:string}[]=[],gaps:number[]=[],last=0,frame=0,until=0;
export const recordAuthCommit:ProfilerOnRenderCallback=(_id,phase,duration)=>{if(until>performance.now())commits.push({duration,phase});};
function finish(){cancelAnimationFrame(frame);until=0;const sorted=gaps.toSorted((a,b)=>a-b);const output=document.querySelector('output[data-auth-report]');if(output)output.textContent=JSON.stringify({commits:commits.length,totalReactMs:commits.reduce((sum,c)=>sum+c.duration,0),maxReactMs:Math.max(0,...commits.map(c=>c.duration)),frames:gaps.length,p95FrameMs:sorted[Math.floor(sorted.length*.95)]??0,maxFrameMs:Math.max(0,...gaps),framesOver34ms:gaps.filter(n=>n>34).length,pageScroll:window.scrollY,activeGlow:[...document.querySelectorAll('[data-flow-current="false"] .questionnaire-glow')].map(n=>n.getAttribute('data-active'))});}
function start(){commits=[];gaps=[];last=0;until=performance.now()+12000;const tick=(now:number)=>{if(now>until){finish();return;}if(last)gaps.push(now-last);last=now;frame=requestAnimationFrame(tick);};cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}
const panel=document.createElement('aside');panel.style.cssText='position:fixed;right:0;bottom:0;z-index:2147483500;max-width:100%;background:white;font:10px monospace';panel.innerHTML='<button type="button" data-auth-start>Замерить ввод</button><button type="button" data-auth-stop>Завершить замер</button><output data-auth-report></output>';document.body.append(panel);panel.querySelector('[data-auth-start]')!.addEventListener('click',start);panel.querySelector('[data-auth-stop]')!.addEventListener('click',finish);

if(import.meta.hot)import.meta.hot.dispose(()=>{cancelAnimationFrame(frame);panel.remove();});

// A modal owns keyboard focus; do not click the inert toolbar behind it.
if(new URLSearchParams(location.search).has('age-probe'))document.addEventListener('keydown',event=>{
 if(!(event.target instanceof Element)||!event.target.closest('[role="spinbutton"]')||until>performance.now())return;
 start();window.setTimeout(finish,1500);
},true);
