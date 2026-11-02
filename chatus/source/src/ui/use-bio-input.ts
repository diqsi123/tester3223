import {useLayoutEffect,useRef,useState,type ChangeEvent,type CompositionEvent} from 'react';
import {limitBioEdit} from '../components/AuthFlow/onboarding-bio';

type BioElement=HTMLInputElement|HTMLTextAreaElement;
/** Leave normal input and IME composition under native keyboard ownership. */
export function useBioInput(value:string,onValue:(value:string)=>void){
 const committed=useRef(value),composing=useRef(false);
 const [isComposing,setComposing]=useState(false);
 const [selection,setSelection]=useState<{element:BioElement;caret:number}|null>(null);
 if(!composing.current)committed.current=value;
 const finish=(element:BioElement)=>{
  const next=limitBioEdit(committed.current,element.value,element.selectionStart??element.value.length);
  committed.current=next.value;
  onValue(next.value);
  if(next.value!==element.value)setSelection({element,caret:next.caret});
  return next.value;
 };
 useLayoutEffect(()=>{
  if(!selection)return;
  if(document.activeElement===selection.element)selection.element.setSelectionRange(selection.caret,selection.caret);
 },[selection]);
 return {isComposing,composing,finish,
  onChange:(event:ChangeEvent<BioElement>)=>{
   if(composing.current||(event.nativeEvent as InputEvent).isComposing)onValue(event.currentTarget.value);
   else finish(event.currentTarget);
  },
  onCompositionStart:()=>{composing.current=true;setComposing(true);},
  onCompositionEnd:(event:CompositionEvent<BioElement>)=>{composing.current=false;setComposing(false);finish(event.currentTarget);}
 };
}
