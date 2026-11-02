import {type PropsWithChildren,type ComponentProps,type RefObject,useEffect,useRef} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {AnimatePresence,animate,motion,useMotionValue,useReducedMotion,useIsPresent,type PanInfo} from 'motion/react';
import {useKeyboard,useMobileDevice,useScreenPortal} from '../mobile';
import {useChatusViewportLayout,useChatusKeyboardLayout} from './ChatusViewport';
import {UI_MOTION,STILL} from '../ui/motion';
type Props=PropsWithChildren<{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;snap?:number;trimHomeArea?:boolean;returnFocus?:RefObject<HTMLElement|null>;initialFocus?:RefObject<HTMLElement|null>}>;
/** Exit paint may linger; its full-screen hit target must release immediately. */
function SheetSurface(props:ComponentProps<typeof motion.div>){
 const present=useIsPresent();
 return <motion.div {...props} inert={!present} aria-hidden={!present||undefined} style={{...props.style,pointerEvents:present?props.style?.pointerEvents:'none'}}/>;
}
/** One interruptible presentation/drag timeline for every app sheet. */
export function BottomSheet({open,onOpenChange,title,description,snap=.72,trimHomeArea=true,returnFocus,initialFocus,children}:Props){
 const {device}=useMobileDevice(),{screenRef}=useScreenPortal(),keyboard=useKeyboard(),vp=useChatusViewportLayout(),insets=useChatusKeyboardLayout(),reduced=useReducedMotion();
 const height=Math.max(260,Math.round(device.geometry.screen.height*snap));
 const y=useMotionValue(height+36),animation=useRef<ReturnType<typeof animate>|null>(null),grab=useRef(0),started=useRef(false);
 const overlap=vp.native&&trimHomeArea?Math.max(0,vp.bottomTrim-vp.safeBottom):0;
 const travel=vp.native?-overlap:device.platform==='android'?Math.max(device.geometry.safeArea.bottom,insets.keyboardHeight):insets.keyboardHeight;
 const transition=reduced?STILL:UI_MOTION.surface;
 useEffect(()=>{if(open&&!initialFocus)keyboard.hide();},[open,initialFocus]);
 useEffect(()=>{animation.current?.stop();if(open){if(!started.current){y.set(height+36);started.current=true;}animation.current=animate(y,0,transition);}return()=>animation.current?.stop();},[open,height,reduced]);
 const dragStart=()=>{animation.current?.stop();grab.current=y.get();};
 const drag=(_:PointerEvent,info:PanInfo)=>{y.set(Math.max(0,grab.current+info.offset.y));};
 const dragEnd=(_:PointerEvent,info:PanInfo)=>{const projected=y.get()+info.velocity.y*.2;if(projected>Math.min(160,height*.34)){onOpenChange(false);}else animation.current=animate(y,0,{...transition,velocity:info.velocity.y});};
 return <Dialog.Root open={open} onOpenChange={next=>{keyboard.hide();onOpenChange(next);}}>
  <Dialog.Portal container={screenRef.current??undefined} forceMount><AnimatePresence onExitComplete={()=>{started.current=false;}}>
   {open&&<><Dialog.Overlay asChild forceMount><SheetSurface className="sheet-overlay" data-testid="sheet-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={reduced?STILL:UI_MOTION.fade}/></Dialog.Overlay>
    <Dialog.Content asChild forceMount onOpenAutoFocus={initialFocus?event=>{event.preventDefault();initialFocus.current?.focus({preventScroll:true});}:undefined} onCloseAutoFocus={returnFocus?event=>{event.preventDefault();const target=returnFocus.current;if(target?.isConnected&&!target.closest('[inert]'))target.focus({preventScroll:true});}:undefined}><SheetSurface className="bottom-sheet" data-testid="bottom-sheet" style={{'--chatus-sheet-overlap':overlap+'px',bottom:travel,maxHeight:vp.native?'calc(var(--chatus-native-height) - var(--chatus-native-keyboard) - 64px + var(--chatus-sheet-overlap,0px))':vp.height-insets.keyboardHeight-64+overlap,y} as ComponentProps<typeof motion.div>['style']} initial={false} exit={{y:height+36,transition}} transition={transition}>
     <motion.div className="sheet-handle-zone" data-testid="sheet-handle" onPanStart={dragStart} onPan={drag} onPanEnd={dragEnd} style={{touchAction:'none'}}><div className="sheet-handle"/></motion.div>
     <div className="sheet-header"><Dialog.Title className="sheet-title">{title}</Dialog.Title>{description&&<Dialog.Description className="sheet-description">{description}</Dialog.Description>}</div><div className="sheet-content">{children}</div>
    </SheetSurface></Dialog.Content></>}
  </AnimatePresence></Dialog.Portal>
 </Dialog.Root>;
}
