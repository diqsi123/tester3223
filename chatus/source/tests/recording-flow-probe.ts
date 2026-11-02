// Local QA only: prerecorded WAV and bounded geometry trace.
const audioBytes=fetch('/assets/chat/voice-long-demo.wav').then(response=>response.arrayBuffer());
const testGetUserMedia=async(constraints:MediaStreamConstraints)=>{
 if(!constraints.audio||constraints.video)throw new Error('QA only supports the prerecorded audio stream.');
 const context=new AudioContext();await context.resume();
 const delay=Math.min(2000,Math.max(0,Number(new URLSearchParams(location.search).get('audio-delay'))||0));if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
 const source=context.createBufferSource(),destination=context.createMediaStreamDestination();
 source.buffer=await context.decodeAudioData((await audioBytes).slice(0));source.loop=true;source.connect(destination);source.start();
 let disposed=false;
 for(const track of destination.stream.getTracks()){
  const stop=track.stop.bind(track);track.stop=()=>{stop();if(!disposed){disposed=true;source.stop();void context.close();}};
 }
 return destination.stream;
};
Object.defineProperty(navigator.mediaDevices,'getUserMedia',{configurable:true,value:testGetUserMedia});

// Bounded flow trace: no ongoing polling and no production import.
document.addEventListener('pointerdown',event=>{
 const button=(event.target as Element).closest('button');
 const action=button?.getAttribute('aria-label')??button?.textContent?.trim();
 if(!['Отправить голосовое','Удалить запись','Записать голосовое'].includes(action??''))return;
 let output=document.getElementById('recording-motion-trace');if(!output){output=document.createElement('pre');output.id='recording-motion-trace';output.hidden=true;document.body.append(output);}
 delete output.dataset.complete;const start=performance.now(),frames:unknown[]=[];
 const sample=()=>{
  const card=document.querySelector('.chat-friend-card')?.getBoundingClientRect(),composer=document.querySelector('.chat-composer')?.getBoundingClientRect();
  const bubble=document.querySelector('.chat-message-row:last-child .chat-bubble') as HTMLElement|null;const r=bubble?.getBoundingClientRect(),style=bubble&&getComputedStyle(bubble);const canvas=document.querySelector('.dialog-canvas')!.getBoundingClientRect(),scale=canvas.width/402;
  frames.push({t:performance.now()-start,cardTop:card?.top,cardBottom:card?.bottom,composerBottom:composer?.bottom,onceTop:document.querySelector('.chat-record-once')?.getBoundingClientRect().top,body:scrollY,bubbleHeight:r?.height,expectedField:canvas.top-15*scale,field:r&&style?r.top+(parseFloat(style.getPropertyValue('--chat-color-top'))-parseFloat(style.getPropertyValue('--chat-bubble-top')))*scale:null});
  if(performance.now()-start<1400)requestAnimationFrame(sample);else{output!.textContent=JSON.stringify({action,frames});output!.dataset.complete='true';}
 };requestAnimationFrame(sample);
},true);
