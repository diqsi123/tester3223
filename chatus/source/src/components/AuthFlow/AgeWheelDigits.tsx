import {useLayoutEffect,useRef} from 'react';
import type {MotionValue} from 'motion/react';

/** Source glyph slots: paint only the nine numbers, without rendering the form per frame. */
export function AgeWheelDigits({position}:{position:MotionValue<number>}){
 const slots=useRef<(HTMLSpanElement|null)[]>([]);
 useLayoutEffect(()=>{
  const interpolate=(distance:number,points:number[])=>{const a=Math.min(Math.floor(distance),points.length-2),t=Math.min(1,distance-a);return points[a]+(points[a+1]-points[a])*t;};
  const paint=(value:number)=>slots.current.forEach((node,index)=>{
   if(!node)return;const n=Math.round(value)+index-4;
   node.hidden=n<14||n>99;if(node.hidden)return;
   if(node.textContent!==String(n))node.textContent=String(n);
   const offset=n-value,distance=Math.abs(offset);
   node.style.top=(173+Math.sign(offset)*interpolate(distance,[0,60.5,115.5,161,202]))+'px';
   node.style.fontSize=interpolate(distance,[46,32,26,18,14])+'px';
   node.style.lineHeight=distance<.01?'46px':'1.34375';
   node.style.opacity=String(distance<1?1-distance*.65:.35);
   node.style.letterSpacing=distance<.01?'-.92px':'0';
  });
  paint(position.get());return position.on('change',paint);
 },[position]);
 return <>{Array.from({length:9},(_,index)=><span key={index} ref={node=>{slots.current[index]=node;}} aria-hidden="true"/>)}</>;
}
