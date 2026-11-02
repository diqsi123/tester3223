export type ViewportSample={width:number;visibleHeight:number;offsetTop:number;native:boolean;focused:boolean;time:number;safeTop:number;safeBottom:number;deviceWidth:number;deviceHeight:number;viewportScale?:number;documentScrollTop?:number;layoutHeight?:number};
export type ViewportState={native:boolean;width:number;baseHeight:number;visibleHeight:number;height:number;screenHeight:number;keyboardInset:number;keyboardProgress:number;zoom:number;topTrim:number;bottomTrim:number;safeTop:number;safeBottom:number;offsetTop:number;pageTop:number;lastFocus:number;focused:boolean;keyboardClosing?:boolean;browserChromeInset?:number};
export function measureViewport(previous:ViewportState|undefined,s:ViewportSample):ViewportState{
  const zoom=s.native?s.width/s.deviceWidth:Math.max(.42,Math.min((s.width-48)/s.deviceWidth,(s.visibleHeight-120)/s.deviceHeight,1));
  const sourceScale=s.deviceWidth/402;
  const lastFocus=s.focused||previous?.focused?s.time:previous?.lastFocus??-Infinity;
  const same=previous?.native===s.native&&previous.width===s.width;
  // Learn the closed browser's layout/visual gap before focus. Safari chrome
  // must not become a permanent keyboard inset after the soft keyboard closes.
  const preserveChrome=same&&(s.focused||previous.keyboardInset>1||s.time-lastFocus<750);
  const browserChromeInset=s.native&&s.layoutHeight!==undefined
    ?preserveChrome?previous.browserChromeInset??0:Math.max(0,s.layoutHeight-s.visibleHeight):0;
  const layoutHeight=s.layoutHeight===undefined?undefined:s.layoutHeight-browserChromeInset;
  const layoutOccluded=s.native&&Math.abs((s.viewportScale??1)-1)<.01&&
    layoutHeight!==undefined&&layoutHeight>s.visibleHeight+1;
  // Safari toolbar occlusion alone is not a keyboard. Continue an actual
  // keyboard through late blur, but never create one during ordinary page scroll.
  const keyboardSession=s.native&&(s.focused||same&&(s.time-lastFocus<750||layoutOccluded&&previous.keyboardInset>1));
  // Keep the pre-focus baseline through keyboard/blur animation. A viewport pan
  // changes its origin, not its height; stale offsetTop on close must not grow the canvas.
  // Layout viewport stays intact while an on-screen keyboard occludes VisualViewport.
  // This survives a delayed dismissal after focusout without a750ms height collapse.
  const baseHeight=keyboardSession?Math.max(same?previous.baseHeight:0,s.visibleHeight,layoutOccluded?layoutHeight!:0):s.visibleHeight;
  // The document is locked; only VisualViewport pan moves the app shell.
  // Adding scrollY here feeds focus-induced page scroll back into its own layout.
  const keyboardInset=keyboardSession?Math.max(0,baseHeight-s.visibleHeight)/zoom:0;
  // WebKit can retain the focus pan after the keyboard starts closing. Bound
  // that settling pan, without constraining a live keyboard pan or user pinch.
  const keyboardClosing=!!(keyboardSession&&(!s.focused||
    previous?.keyboardClosing&&s.visibleHeight>=previous.visibleHeight||
    (previous?.keyboardInset??0)>1&&s.visibleHeight>(previous?.visibleHeight??s.visibleHeight)+1));
  const settlePan=Math.abs((s.viewportScale??1)-1)<.01&&(keyboardClosing||keyboardInset<=1);
  const offsetTop=s.native&&settlePan?Math.min(Math.max(0,s.offsetTop),Math.max(0,baseHeight-s.visibleHeight)):s.offsetTop;
  const topTrim=s.native?60*sourceScale:0,bottomTrim=s.native?34*sourceScale:0;
  const safeTop=s.native?s.safeTop/zoom:0,safeBottom=s.native?s.safeBottom/zoom:0;
  return {native:s.native,width:s.width,baseHeight,visibleHeight:s.visibleHeight,
    height:s.native?baseHeight/zoom-safeTop-safeBottom+topTrim+bottomTrim:s.deviceHeight,
    screenHeight:s.native?baseHeight/zoom:s.deviceHeight,keyboardInset,keyboardProgress:Math.min(1,keyboardInset/(120*sourceScale)),zoom,topTrim,bottomTrim,safeTop,safeBottom,offsetTop,pageTop:s.native?offsetTop:0,lastFocus,focused:s.focused,keyboardClosing,browserChromeInset};
}

/** Focus bookkeeping stays internal; consumers subscribe only to painted geometry. */
export type ViewportGeometry = Omit<ViewportState, 'lastFocus' | 'focused' | 'keyboardClosing' | 'browserChromeInset'>;
export function viewportGeometry(state: ViewportState): ViewportGeometry {
  const {lastFocus: _lastFocus, focused: _focused, keyboardClosing: _closing, browserChromeInset: _chrome, ...geometry} = state;
  return geometry;
}
export function sameViewportGeometry(previous: ViewportGeometry, next: ViewportGeometry) {
  return (Object.keys(next) as (keyof ViewportGeometry)[]).every(key => previous[key] === next[key]);
}

/** Resize/scroll bursts share one measurement and publication per display frame. */
export function createViewportFrameBatch(run: () => void,
  request: (callback: () => void) => number, cancel: (id: number) => void) {
  let pending: number | null = null;
  const cancelPending = () => { if (pending !== null) { cancel(pending); pending = null; } };
  return {
    schedule() {
      if (pending === null) pending = request(() => { pending = null; run(); });
    },
    flush() { cancelPending(); run(); },
    cancel: cancelPending,
  };
}

/** A component that only lays out the fixed canvas must not follow every OS pixel. */
export function viewportLayout(state: ViewportGeometry) {
  const {visibleHeight: _visible, keyboardInset, keyboardProgress: _progress,
    offsetTop: _offset, pageTop: _page, ...layout} = state;
  return {...layout,keyboardVisible:keyboardInset>1};
}
export function createViewportSelection<T extends object>(select:(state:ViewportGeometry)=>T) {
  let previous:T|undefined;
  return (state:ViewportGeometry) => {
    const next=select(state);
    if(previous&&(Object.keys(next) as (keyof T)[]).every(key=>previous![key]===next[key]))return previous;
    return previous=next;
  };
}
