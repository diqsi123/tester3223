import {useEffect,useMemo,useRef,useState,type CSSProperties,type RefObject} from 'react';
import {motion,useInView,useReducedMotion} from 'motion/react';
import {BottomSheet} from '../AppSheet';
import {Carousel,MobileScroll,useMobileDevice} from '../../mobile';
import {useChatusViewportLayout} from '../ChatusViewport';
import {getPressProps} from '../../ui/press';
import {UI_MOTION,STILL} from '../../ui/motion';
import {ShaderEffect} from '../../isolated-onboarding/lib/custom-effect-runtime';
import {setup,render,manifest} from './Bokeh';
import {PremiumPrice,type PremiumPriceValue} from './PremiumPrice';
import './premium-sheet.css';

const A='/assets/premium/';
// Original24px exports have different internal glyph origins; centre their ink,
// not just their viewboxes. Rows and the75px comparison columns stay source-sized.
const features=[
 ['2c308.svg','Данные собеседника',.2305,0],
 ['e8352.svg','Различные фильтры',.9175,1.7925],
 ['d199b.svg','Приоритет в поиске',.6129,.7144],
 ['7a2ff.svg','Без рекламы',.4248,.4248],
 ['70bf4.svg','Персонализация',.4258,.4219],
] as const;
// Polygon coordinates are the seven actual faces of73cc2.svg, never a new gem.
const diamondFacets=[
 ['table','22.8763px 2.92286px,36.2208px 6.73042px,66.7226px 6.73042px,80.0671px 2.92286px,51.4717px 0px',0,.78,90],
 ['crown-left','22.8763px 2.92286px,0px 30.5276px,22.8763px 39.0946px,36.2208px 6.73042px',.12,.70,130],
 ['crown-centre','36.2208px 6.73042px,22.8763px 39.0946px,80.0671px 39.0946px,66.7226px 6.73042px',.32,.54,110],
 ['crown-right','102.943px 30.5276px,91.5052px 16.7253px,80.0671px 2.92286px,66.7226px 6.73042px,80.0671px 39.0946px',.60,.64,225],
 ['pavilion-left','0px 30.5276px,51.4717px 87.641px,22.8763px 39.0946px',.68,.62,145],
 ['pavilion-centre','22.8763px 39.0946px,51.4717px 87.641px,80.0671px 39.0946px',.94,.40,115],
 ['pavilion-right','51.4717px 87.641px,102.943px 30.5276px,80.0671px 39.0946px',1.20,.72,235],
] as const;
const plans=[['1 день',99],['3 дня',149],['7 дней',259],['Месяц',499]] as const;
function BokehMaterial(){
 const shaders=useMemo(()=>[{setup,render,manifest,params:{radius:443,density:10.800000190734863}}],[]);
 // Safari has no HTML-in-Canvas. Retain the authored shader and its original
 // static render there, without allocating a GPU surface or running a frame loop.
 const queue=(globalThis as unknown as {GPUQueue?:{prototype:object}}).GPUQueue?.prototype;
 const supportsCapture=!!queue&&('drawElementImageToTexture'in queue||'copyElementImageToTexture'in queue);
 return <div className="premium-bokeh" aria-hidden="true">
  {!supportsCapture&&<img className="premium-bokeh-fallback" src={A+'bokeh-fallback.png'} alt=""/>}
  {supportsCapture&&<ShaderEffect className="premium-bokeh-effect" shaders={shaders}><div className="premium-bokeh-input">
   <div className="premium-bokeh-dark is-first"><img src={A+'3bf50.svg'} alt=""/></div>
   <div className="premium-bokeh-dark is-second"><img src={A+'3bf50.svg'} alt=""/></div>
   <div className="premium-bokeh-light is-first"><img src={A+'c1226.svg'} alt=""/></div>
   <div className="premium-bokeh-light is-second"><img src={A+'c1226.svg'} alt=""/></div>
   <div className="premium-bokeh-light is-third"><img src={A+'6e16b.svg'} alt=""/></div>
  </div></ShaderEffect>}
 </div>;
}
/** Original vectors: one visibility gate, a chrome reflection and seven quiet face glints. */
function PremiumHeroArt({active}:{active:boolean}){
 const ref=useRef<HTMLDivElement>(null),inView=useInView(ref),reduced=useReducedMotion();
 const [visible,setVisible]=useState(!document.hidden);
 useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return <div ref={ref} className="premium-hero-art" aria-hidden="true" data-shimmer={active&&inView&&visible&&!reduced}>
  <span className="premium-diamond"><img src={A+'73cc2.svg'} alt=""/>{!reduced&&<span className="premium-diamond-facets">{diamondFacets.map(([name,polygon,delay,peak,angle])=><i key={name} data-facet={name} style={{clipPath:`polygon(${polygon})`,'--facet-delay':delay+'s','--facet-peak':peak,'--facet-angle':angle+'deg'} as CSSProperties}/>)}</span>}</span>
  <span className="premium-wordmark"><img src={A+'2eb1f.svg'} alt=""/>{!reduced&&<span className="premium-wordmark-mask"><i/></span>}</span>
 </div>;
}
function PremiumPlan({label,price,selected,reduced,onSelect}:{label:string;price:PremiumPriceValue;selected:boolean;reduced:boolean|null;onSelect:(button:HTMLButtonElement)=>void}){
 const transition=reduced?STILL:UI_MOTION.surface;
 return <motion.button className="premium-plan" data-chatus-press aria-pressed={selected} aria-label={label+', '+price+' рублей'} whileTap={reduced?{opacity:.9}:{scale:.975}} transition={transition} onClick={event=>onSelect(event.currentTarget)}>
  <motion.span className="premium-plan-surface" aria-hidden="true" initial={false} animate={{opacity:selected?0:1}} transition={reduced?STILL:UI_MOTION.fade}/>
  <motion.span className="premium-plan-selection" aria-hidden="true" initial={false} animate={{opacity:selected?1:0}} transition={reduced?STILL:UI_MOTION.fade}/>
  <motion.span className="premium-plan-copy" initial={false} animate={{x:selected?1.5:0,y:selected?-.5:0}} transition={transition}><span>{label}</span><PremiumPrice value={price}/></motion.span>
  <motion.img className="premium-plan-check" src={A+'e9f2f.svg'} alt="" aria-hidden="true" initial={false} animate={{opacity:selected?1:0,scale:reduced?1:selected?1:.86}} transition={transition}/>
 </motion.button>;
}
/** Reveal only this horizontal rail; never scroll the page or the chat. */
function revealPlan(button:HTMLButtonElement,reduced:boolean|null){
 const rail=button.closest<HTMLDivElement>('.premium-plans');if(!rail)return;
 const left=button.offsetLeft,right=left+button.offsetWidth,current=rail.scrollLeft;
 const desired=left<current+20?left-20:right>current+rail.clientWidth-20?right+20-rail.clientWidth:current;
 rail.scrollTo({left:Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,desired)),behavior:reduced?'instant':'smooth'});
}
/** Actual dialogue source4162:220431, including its authored copy and existing plans. */
export function PremiumSheet({open,onOpenChange,returnFocus}:{open:boolean;onOpenChange:(open:boolean)=>void;returnFocus?:RefObject<HTMLElement|null>}){
 const {device}=useMobileDevice(),vp=useChatusViewportLayout(),reduced=useReducedMotion();
 const scale=vp.native?device.geometry.screen.width/402:1;
 const removed=vp.native?vp.bottomTrim:0,safe=vp.native?vp.safeBottom:0;
 const fullHeight=788*scale-removed+safe;
 const height=Math.min(fullHeight,(vp.native?vp.screenHeight:device.geometry.screen.height)-64);
 const sourceHeight=height/scale,footerHeight=233-(removed-safe)/scale;
 const [selected,setSelected]=useState(1),[notice,setNotice]=useState(false);
 const changeOpen=(next:boolean)=>{if(!next)setNotice(false);onOpenChange(next);};
 const close=()=>changeOpen(false);
 return <BottomSheet open={open} onOpenChange={changeOpen} title="Премиум" description="Возможности премиума и сроки подписки" trimHomeArea={false} returnFocus={returnFocus} snap={height/device.geometry.screen.height}>
  <style>{`.bottom-sheet:has(.premium-sheet){--premium-sheet-height:${height}px;--premium-scale:${scale}}`}</style>
  <div className="premium-sheet" data-node-id="4162:220431" style={{height:sourceHeight,transform:`scale(${scale})`,'--premium-footer-height':footerHeight+'px'} as CSSProperties}>
   <BokehMaterial/>
   <div className="premium-pattern" aria-hidden="true">{[72,278.1953125,490.546875].map(top=><img key={top} src={A+'d90fe.webp'} style={{top}} alt=""/>)}<img className="premium-pattern-bottom" src={A+'0a8ab.webp'} alt=""/></div>
   <MobileScroll className="premium-overview-scroll"><div className="premium-overview-content">
    <img className="premium-laurel" src={A+'571a7.svg'} alt=""/>
    <div className="premium-hero"><PremiumHeroArt active={open}/><p>Фильтры выбора пола и возраста доступны с премиумом</p></div>
    <div className="premium-benefits" role="table" aria-label="Сравнение Free и Plus">
     <div className="premium-plus-surface" aria-hidden="true"/>
     <div className="premium-benefit-head" role="row">
      <span role="columnheader" aria-label="Возможность"/>
      <span role="columnheader"><img src={A+'9be4f.svg'} alt="Free"/></span>
      <span role="columnheader"><img src={A+'355cd.svg'} alt="Plus"/></span>
     </div>
     <div className="premium-benefit-rows" role="rowgroup">{features.map(([icon,label,x,y])=><div className="premium-benefit-row" role="row" key={label}>
      <span className="premium-benefit-title" role="rowheader"><img src={A+icon} alt="" style={{transform:`translate(${x}px,${y}px)`}}/><span>{label}</span></span>
      <span className="premium-benefit-mark" role="cell" aria-label="Недоступно"><svg width="12.4" height="4" viewBox="0 0 12.4 4" fill="none" aria-hidden="true"><path d="M1.2 2H11.2" stroke="#1C1407" strokeOpacity=".56" strokeWidth="2.4" strokeLinecap="round"/></svg></span>
      <span className="premium-benefit-mark" role="cell" aria-label="Доступно"><svg width="15.9" height="11.4" viewBox="0 0 15.9 11.4" fill="none" aria-hidden="true"><path d="M1.2 5.7L5.7 10.2L14.7 1.2" stroke="#FF088E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
     </div>)}</div>
    </div>
   </div></MobileScroll>
   <motion.button {...getPressProps(reduced)} className="premium-close" aria-label="Закрыть премиум" onClick={close}><img src={A+'748dd.svg'} alt=""/></motion.button>
   <div className="premium-footer">
    <div className="premium-plans-slot" onPointerDownCapture={event=>{const rail=(event.target as Element).closest<HTMLDivElement>('.premium-plans');rail?.scrollTo({left:rail.scrollLeft,behavior:'instant'});}}>
     <Carousel ariaLabel="Срок подписки" className="premium-plans" contentClassName="premium-plans-track">{plans.map(([label,price],i)=><PremiumPlan key={label} label={label} price={price} selected={selected===i} reduced={reduced} onSelect={button=>{setSelected(i);setNotice(false);revealPlan(button,reduced);}}/>)}</Carousel>
    </div>
    <motion.button {...getPressProps(reduced)} className="premium-subscribe" aria-label="Оформить подписку" onClick={()=>setNotice(true)}><img className="premium-subscribe-material" src={A+'subscribe-material-264dc4af75.webp'} alt=""/><img className="premium-subscribe-label" src={A+'subscribe-label-c4b2120baf.svg'} alt="" aria-hidden="true"/></motion.button>
    {notice&&<div className="premium-demo-notice" role="status">Оплата в прототипе не подключена</div>}
   </div>
  </div>
 </BottomSheet>;
}
