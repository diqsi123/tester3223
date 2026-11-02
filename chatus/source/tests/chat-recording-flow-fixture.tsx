// Local-only full App integration: real MediaRecorder receives the existing neutral WAV.
// Never opens physical microphone/camera; this module is not imported by production.
import {Profiler} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/roboto/latin-500.css';
import App from '../src/App';
import '../src/styles.css';
import '../src/prototype.css';

import './recording-flow-probe';

let measurement:{start:number;frames:{t:number;duration:number}[]}|null=null;
const button=document.getElementById('measure-recording')!,output=document.getElementById('recording-result')!,trace=document.getElementById('recording-trace')!;
button.addEventListener('click',()=>{
 const run={start:performance.now(),frames:[] as {t:number;duration:number}[]};measurement=run;delete trace.dataset.complete;
 output.textContent='измерение';
 window.setTimeout(()=>{if(measurement!==run)return;measurement=null;trace.textContent=JSON.stringify({elapsed:performance.now()-run.start,commits:run.frames.length,frames:run.frames,recording:document.querySelector('.dialog-root')?.getAttribute('data-recording')});trace.dataset.complete='true';output.textContent=String(run.frames.length)+' обновлений / 2.2с';},2200);
});
createRoot(document.getElementById('root')!).render(<Profiler id="recording-app" onRender={(_id,phase,duration)=>{if(measurement&&phase!=='mount')measurement.frames.push({t:performance.now()-measurement.start,duration});}}><App/></Profiler>);

