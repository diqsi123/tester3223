import {useKeyboard,useMobileDevice} from '../mobile';
import {useViewportState,useViewportSelection} from '../ui/viewport';
import {viewportLayout} from '../ui/viewport-model';
export function useChatusViewport(){const {device}=useMobileDevice();return useViewportState(device.geometry.screen.width,device.geometry.screen.height);}
export function useChatusViewportLayout(){const {device}=useMobileDevice();return useViewportSelection(device.geometry.screen.width,device.geometry.screen.height,viewportLayout);}
function runtimeInsets(keyboard:ReturnType<typeof useKeyboard>,device:ReturnType<typeof useMobileDevice>['device']){
 const android=device.platform==='android';
 return {keyboardHeight:keyboard.height,keyboardFullHeight:keyboard.fullHeight,keyboardDragging:keyboard.isDragging,
  bottomInset:android&&!keyboard.visible?0:android?keyboard.height:Math.max(device.geometry.safeArea.bottom,keyboard.height),
  availableHeight:device.geometry.screen.height-keyboard.height-(android&&!keyboard.visible?device.geometry.safeArea.bottom:0),isKeyboardVisible:keyboard.visible};
}
export function useChatusKeyboardInsets(){
 const keyboard=useKeyboard(),{device}=useMobileDevice(),vp=useChatusViewport();
 const runtime=runtimeInsets(keyboard,device);
 if(!vp.native)return runtime;
 return {...runtime,keyboardHeight:vp.keyboardInset,keyboardFullHeight:vp.keyboardInset,keyboardDragging:false,isKeyboardVisible:vp.keyboardInset>1,
 bottomInset:vp.keyboardInset+vp.bottomTrim-vp.safeBottom*vp.keyboardProgress,availableHeight:vp.height-vp.keyboardInset};
}
/** Native pixel movement is painted by the layout owner, not through the full chat tree. */
export function useChatusKeyboardLayout(){
 const keyboard=useKeyboard(),{device}=useMobileDevice(),vp=useChatusViewportLayout();
 const runtime=runtimeInsets(keyboard,device);
 return vp.native?{...runtime,keyboardHeight:0,keyboardFullHeight:0,keyboardDragging:false,isKeyboardVisible:vp.keyboardVisible}:runtime;
}
