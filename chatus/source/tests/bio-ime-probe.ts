/** QA-only composition event sequence against the actual rendered field. */
const panel=document.createElement('aside');
panel.style.cssText='position:fixed;bottom:28px;left:0;right:0;z-index:2147483501;background:white;font:11px system-ui';
panel.innerHTML='<button data-bio-ime="start">IME начало</button><button data-bio-ime="input">IME ввод</button><button data-bio-ime="enter">IME Enter</button><button data-bio-ime="end">IME конец</button><output data-bio-ime-result></output>';
document.body.append(panel);
let field:HTMLInputElement|HTMLTextAreaElement|null=null,base='';
for(const button of panel.querySelectorAll<HTMLButtonElement>('button')){
 button.addEventListener('pointerdown',event=>event.preventDefault());
 button.addEventListener('click',()=>{
  if(button.dataset.bioIme==='start'){
   field=document.querySelector('[data-flow-current="true"] .auth-bio-field textarea,.profile-about-inline input');
   if(!field)return;
   field.focus({preventScroll:true});base=field.value;
   field.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:''}));
  }else if(field&&button.dataset.bioIme==='input'){
   const prototype=field instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
   Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(field,base+'あい');
   field.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'あい',isComposing:true}));
  }else if(field&&button.dataset.bioIme==='enter'){
   field.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:229,isComposing:true,bubbles:true,cancelable:true}));
  }else if(field&&button.dataset.bioIme==='end'){
   field.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'あい'}));
  }
  requestAnimationFrame(()=>{
   panel.querySelector('output')!.textContent=JSON.stringify({length:Array.from(field?.value??'').length,focused:field===document.activeElement,caret:field?.selectionStart,stageScroll:document.querySelector('.phone-stage')?.scrollTop,pageScroll:scrollY});
  });
 });
}
if(import.meta.hot)import.meta.hot.dispose(()=>panel.remove());
