import {useLayoutEffect,useMemo,useSyncExternalStore} from 'react';
import {createViewportSelection,createViewportFrameBatch,measureViewport,sameViewportGeometry,viewportGeometry,type ViewportState,type ViewportGeometry} from './viewport-model';
const initial:ViewportState={native:false,width:0,baseHeight:874,visibleHeight:874,height:874,screenHeight:874,keyboardInset:0,keyboardProgress:0,zoom:1,topTrim:0,bottomTrim:0,safeTop:0,safeBottom:0,offsetTop:0,pageTop:0,lastFocus:-Infinity,focused:false};
const initialGeometry=viewportGeometry(initial);
let measured=initial,value=initialGeometry,deviceWidth=402,deviceHeight=874,blurTimer=0;
const listeners=new Set<()=>void>();
const textFocused=()=>{const node=document.activeElement;return node instanceof HTMLTextAreaElement||node instanceof HTMLInputElement&&!node.disabled&&!node.readOnly&&!['checkbox','radio','range','file','button','submit'].includes(node.type);};
function update(){
  const native=(matchMedia('(pointer:coarse)').matches||new URLSearchParams(location.search).get('mobile')==='1')&&document.documentElement.clientWidth<=720;
  const viewport=window.visualViewport,root=document.documentElement,style=getComputedStyle(root);
  measured=measureViewport(measured,{native,width:root.clientWidth,visibleHeight:viewport?.height??innerHeight,offsetTop:viewport?.offsetTop??0,viewportScale:viewport?.scale??1,documentScrollTop:window.scrollY,layoutHeight:root.clientHeight,focused:textFocused(),time:performance.now(),safeTop:parseFloat(style.getPropertyValue('--native-safe-top'))||0,safeBottom:parseFloat(style.getPropertyValue('--native-safe-bottom'))||0,deviceWidth,deviceHeight});
  const next=viewportGeometry(measured);
  if(sameViewportGeometry(value,next))return;
  if(root.hasAttribute('data-chatus-native')!==native)root.toggleAttribute('data-chatus-native',native);
  const keyboard=native&&next.keyboardInset>1;
  if(root.hasAttribute('data-chatus-native-keyboard')!==keyboard)root.toggleAttribute('data-chatus-native-keyboard',keyboard);
  const focusFont=Math.ceil(16/Math.min(1,next.zoom)*1000)/1000;
  const vars={'--chatus-field-font':focusFont+'px','--chatus-field-scale':String(15/focusFont),'--chatus-preview-scale':String(next.zoom),'--chatus-native-height':next.screenHeight+'px','--chatus-content-height':next.height+'px','--chatus-content-top':(-next.topTrim+next.safeTop)+'px','--chatus-native-keyboard':next.keyboardInset+'px','--chatus-visible-height':next.visibleHeight+'px','--chatus-visible-top':next.pageTop+'px'};
  for(const [key,entry] of Object.entries(vars))if(root.style.getPropertyValue(key)!==entry)root.style.setProperty(key,entry);
  value=next;
  listeners.forEach(listener=>listener());
}
const frames=createViewportFrameBatch(update,callback=>requestAnimationFrame(callback),id=>cancelAnimationFrame(id));
function focusChanged(){frames.schedule();clearTimeout(blurTimer);blurTimer=window.setTimeout(frames.schedule,760);}
function subscribe(listener:()=>void){
  listeners.add(listener);
  if(listeners.size===1){window.addEventListener('resize',frames.schedule);window.addEventListener('scroll',frames.schedule,{passive:true});visualViewport?.addEventListener('resize',frames.schedule);visualViewport?.addEventListener('scroll',frames.schedule);document.addEventListener('focusin',focusChanged);document.addEventListener('focusout',focusChanged);frames.flush();}
  return()=>{listeners.delete(listener);if(!listeners.size){window.removeEventListener('resize',frames.schedule);window.removeEventListener('scroll',frames.schedule);visualViewport?.removeEventListener('resize',frames.schedule);visualViewport?.removeEventListener('scroll',frames.schedule);document.removeEventListener('focusin',focusChanged);document.removeEventListener('focusout',focusChanged);clearTimeout(blurTimer);frames.cancel();}};
}
export const getViewportSnapshot=()=>value;
/** Imperative subscribers share the exact measured frame with CSS and React. */
export const subscribeViewport=subscribe;
const identity=(state:ViewportGeometry)=>state;
export function useViewportSelection<T extends object>(width:number,height:number,select:(state:ViewportGeometry)=>T){
 const selection=useMemo(()=>createViewportSelection(select),[select]);
 const state=useSyncExternalStore(subscribe,()=>selection(value),()=>selection(initialGeometry));
 useLayoutEffect(()=>{if(deviceWidth!==width||deviceHeight!==height){deviceWidth=width;deviceHeight=height;frames.flush();}},[width,height]);
 return state;
}

export function useViewportState(width:number,height:number){return useViewportSelection(width,height,identity);}
