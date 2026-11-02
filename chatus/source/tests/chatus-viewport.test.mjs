import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createViewportSelection,viewportLayout,createViewportFrameBatch,measureViewport,sameViewportGeometry,viewportGeometry} from '../src/ui/viewport-model.ts';
const sample={width:402,visibleHeight:780,offsetTop:0,native:true,focused:false,time:0,safeTop:0,safeBottom:0,deviceWidth:402,deviceHeight:874};
test('source chrome is trimmed once; native screen remains actual viewport',()=>{const v=measureViewport(undefined,sample);assert.equal(v.screenHeight,780);assert.equal(v.height,874);assert.equal(v.topTrim,60);assert.equal(v.bottomTrim,34);assert.equal(v.keyboardInset,0);});
test('keyboard shrink keeps stage-relative inset independent of pan',()=>{const v=measureViewport(undefined,sample),f=measureViewport(v,{...sample,focused:true,time:10}),k=measureViewport(f,{...sample,focused:true,visibleHeight:450,offsetTop:20,time:50});assert.equal(k.keyboardInset,330);assert.equal(k.height,874);assert.equal(k.screenHeight,780);});
test('long focused session keeps keyboard baseline during blur animation',()=>{let v=measureViewport(undefined,sample);v=measureViewport(v,{...sample,focused:true,visibleHeight:450,time:100});v=measureViewport(v,{...sample,focused:false,visibleHeight:470,time:10000});assert.equal(v.keyboardInset,310);v=measureViewport(v,{...sample,time:10300});assert.equal(v.keyboardInset,0);assert.equal(v.height,874);});
test('toolbar resize without focus and rotation are not a keyboard',()=>{let v=measureViewport(undefined,sample);v=measureViewport(v,{...sample,visibleHeight:700,time:100});assert.equal(v.keyboardInset,0);assert.equal(v.height,794);v=measureViewport(v,{...sample,width:780,visibleHeight:402,time:200});assert.equal(v.keyboardInset,0);assert.equal(v.screenHeight,402/(780/402));});
test('Android scale and actual safe areas are applied once',()=>{const z=427/402;const v=measureViewport(undefined,{...sample,width:427,visibleHeight:900,deviceWidth:427,deviceHeight:952,safeTop:24,safeBottom:16});assert.equal(v.zoom,1);assert.equal(v.height,860+94*z);});
test('desktop device geometries remain calibrated',()=>{const v=measureViewport(undefined,{...sample,native:false,width:1400,visibleHeight:1000});assert.equal(v.height,874);assert.equal(v.keyboardInset,0);assert.equal(v.topTrim,0);assert.equal(v.zoom,1);});


// Compose the actual native stage/content/footer formulas, rather than checking inset in isolation.
const composerBottom = viewport => {
  const sourceScale = viewport.topTrim / 60;
  const dialogHeight = viewport.height / sourceScale;
  const inset = (viewport.keyboardInset + viewport.bottomTrim +
    (110 * sourceScale - viewport.bottomTrim) * (1 - viewport.keyboardProgress) -
    viewport.safeBottom * viewport.keyboardProgress) / sourceScale;
  return viewport.offsetTop + (-viewport.topTrim + viewport.safeTop) * viewport.zoom +
    (dialogHeight - inset) * sourceScale * viewport.zoom;
};
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .00001, `${actual} != ${expected}`);

test('the open-keyboard composer ends at the visual viewport boundary at each pan offset', () => {
  for (const width of [360, 390, 402]) {
    for (const [safeTop,safeBottom] of [[0,0],[47,34]]) {
      const viewportSample = {...sample,width,safeTop,safeBottom};
      const initial = measureViewport(undefined, viewportSample);
      const focused = measureViewport(initial, {...viewportSample,focused:true,time:10});
      for (const offsetTop of [0, 20, 100]) {
        const keyboard = measureViewport(focused, {...viewportSample,focused:true,time:50,
          visibleHeight:450,offsetTop});
        assert.equal(keyboard.baseHeight, 780);
        near(composerBottom(keyboard), keyboard.visibleHeight + offsetTop);
      }
    }
  }
});

test('focus, keyboard pan, and close with stale pan never enlarge the baseline or leave extra canvas', () => {
  let viewport = measureViewport(undefined, sample);
  const steps = [
    {focused:true,time:10},
    {focused:true,time:50,visibleHeight:450,offsetTop:20},
    {focused:true,time:100,visibleHeight:450,offsetTop:100},
    {focused:true,time:500,visibleHeight:780,offsetTop:100},
    {focused:true,time:650,visibleHeight:780,offsetTop:0},
    {focused:false,time:700,visibleHeight:780,offsetTop:0},
    {focused:false,time:1500,visibleHeight:780,offsetTop:0},
  ];
  for (const step of steps) {
    viewport = measureViewport(viewport, {...sample,...step});
    assert.equal(viewport.baseHeight, 780);
    assert.equal(viewport.height, 874);
    if (viewport.visibleHeight === 780) {
      assert.equal(viewport.keyboardInset, 0);
      near(viewport.offsetTop + viewport.screenHeight * viewport.zoom,
        viewport.offsetTop + viewport.visibleHeight);
    } else near(composerBottom(viewport), viewport.offsetTop + viewport.visibleHeight);
  }
});

test('a genuinely larger visible viewport may grow the focused baseline, but pan alone cannot', () => {
  let viewport = measureViewport(undefined, sample);
  viewport = measureViewport(viewport, {...sample,focused:true,time:10});
  viewport = measureViewport(viewport, {...sample,focused:true,time:20,offsetTop:100});
  assert.equal(viewport.baseHeight, 780);
  viewport = measureViewport(viewport, {...sample,focused:true,time:30,visibleHeight:820,offsetTop:100});
  assert.equal(viewport.baseHeight, 820);
  assert.equal(viewport.keyboardInset, 0);
  viewport = measureViewport(viewport, {...sample,focused:false,time:50,visibleHeight:760});
  assert.equal(viewport.baseHeight, 820);
  viewport = measureViewport(viewport, {...sample,focused:false,time:850,visibleHeight:760});
  assert.equal(viewport.baseHeight, 760);
});

test('focus bookkeeping updates internally without changing the public geometry snapshot', () => {
  const initial = measureViewport(undefined, sample);
  const focused = measureViewport(initial, {...sample,focused:true,time:10});
  const later = measureViewport(focused, {...sample,focused:true,time:1000});
  assert.equal(later.lastFocus, 1000);
  assert.equal(sameViewportGeometry(viewportGeometry(initial),viewportGeometry(focused)), true);
  assert.equal(sameViewportGeometry(viewportGeometry(focused),viewportGeometry(later)), true);
  assert.equal('lastFocus' in viewportGeometry(later), false);
  assert.equal('focused' in viewportGeometry(later), false);
  const moved = measureViewport(later, {...sample,focused:true,time:1001,visibleHeight:450,offsetTop:20});
  assert.equal(sameViewportGeometry(viewportGeometry(later),viewportGeometry(moved)), false);
  // The fresh internal timestamp still keeps the baseline throughout a late blur.
  const blurred = measureViewport(later, {...sample,focused:false,time:2000,visibleHeight:450});
  assert.equal(blurred.keyboardInset, 330);
});

test('resize, visual resize, scroll and focus bursts measure only once per display frame', () => {
  let id=0, runs=0;
  const queue=new Map();
  const batch=createViewportFrameBatch(()=>{runs++;},callback=>{queue.set(++id,callback);return id;},key=>queue.delete(key));
  batch.schedule();batch.schedule();batch.schedule();batch.schedule();
  assert.equal(queue.size,1);assert.equal(runs,0);
  const callback=queue.values().next().value;queue.clear();callback();
  assert.equal(runs,1);
  batch.schedule();assert.equal(queue.size,1);
  batch.cancel();assert.equal(queue.size,0);
  batch.schedule();batch.flush();
  assert.equal(queue.size,0);assert.equal(runs,2);
});


test('stale Safari pan is bounded throughout keyboard dismissal and cleared at full height', () => {
  let viewport=measureViewport(undefined,sample);
  viewport=measureViewport(viewport,{...sample,focused:true,time:10,visibleHeight:450,offsetTop:300});
  assert.equal(viewport.offsetTop,300);
  for (const [visibleHeight,expectedTop,time] of [[650,130,30],[750,30,40],[780,0,50]]) {
    viewport=measureViewport(viewport,{...sample,focused:false,visibleHeight,offsetTop:300,time});
    assert.equal(viewport.offsetTop,expectedTop);
    assert.ok(viewport.offsetTop+viewport.visibleHeight<=viewport.baseHeight);
    assert.equal(viewport.baseHeight,780);
  }
});

test('unfocused toolbar resize and stale pan cannot displace the whole app', () => {
  let viewport=measureViewport(undefined,sample);
  viewport=measureViewport(viewport,{...sample,visibleHeight:700,offsetTop:300,time:1000});
  assert.equal(viewport.offsetTop,0);
  assert.equal(viewport.keyboardInset,0);
  assert.equal(viewport.screenHeight,700);
});


test('a live keyboard may pan beyond the pre-focus visual height; pinch is not corrected as stale pan', () => {
  const initial=measureViewport(undefined,sample);
  const opened=measureViewport(initial,{...sample,focused:true,time:10,visibleHeight:450,offsetTop:400});
  assert.equal(opened.offsetTop,400);
  const pinched=measureViewport(opened,{...sample,focused:false,time:20,visibleHeight:650,offsetTop:300,viewportScale:1.25});
  assert.equal(pinched.offsetTop,300);
});

test('repeated events during dismissal do not reapply a rejected stale pan', () => {
  let state=measureViewport(undefined,sample);
  state=measureViewport(state,{...sample,focused:true,time:10,visibleHeight:450,offsetTop:300});
  state=measureViewport(state,{...sample,focused:true,time:20,visibleHeight:650,offsetTop:300});
  assert.equal(state.offsetTop,130);
  for(let time=21;time<100;time++) {
    state=measureViewport(state,{...sample,focused:true,time,visibleHeight:650,offsetTop:300});
    assert.equal(state.offsetTop,130);
  }
});

test('a locked document never feeds focus scroll back into the visual shell', () => {
  for (const width of [360,390,402,430]) {
    const initial=measureViewport(undefined,{...sample,width});
    const baseline=measureViewport(initial,{...sample,width,focused:true,time:10,visibleHeight:450,offsetTop:100});
    for (const documentScrollTop of [0,24,200,430,860,1720]) {
      const next=measureViewport(baseline,{...sample,width,focused:true,time:20,visibleHeight:450,offsetTop:100,documentScrollTop});
      assert.equal(next.pageTop,100);
      assert.equal(sameViewportGeometry(viewportGeometry(baseline),viewportGeometry(next)),true);
      near(composerBottom(next),550);
    }
  }
});
test('document-only focus scroll does not publish a new geometry snapshot', () => {
  const base=measureViewport(undefined,sample);
  const next=measureViewport(base,{...sample,documentScrollTop:430});
  assert.equal(next.pageTop,0);
  assert.equal(next.keyboardInset,0);
  assert.equal(sameViewportGeometry(viewportGeometry(base),viewportGeometry(next)),true);
});

test('a keyboard still occluding the layout viewport survives focus loss beyond the old timer',()=>{
  let state=measureViewport(undefined,{...sample,layoutHeight:780});
  state=measureViewport(state,{...sample,layoutHeight:780,focused:true,time:10,visibleHeight:497});
  for(const time of [30,1000,3000,10000]){
    state=measureViewport(state,{...sample,layoutHeight:780,focused:false,time,visibleHeight:497});
    assert.equal(state.baseHeight,780);
    assert.equal(state.height,874);
    assert.equal(state.keyboardInset,283);
  }
  state=measureViewport(state,{...sample,layoutHeight:780,time:11000});
  assert.equal(state.height,874);assert.equal(state.keyboardInset,0);
});
test('late occlusion measurement recovers the baseline of an actual focused input',()=>{
  let state=measureViewport(undefined,{...sample,visibleHeight:497});
  state=measureViewport(state,{...sample,layoutHeight:780,visibleHeight:497,focused:true,time:3000});
  assert.equal(state.baseHeight,780);assert.equal(state.keyboardInset,283);assert.equal(state.height,874);
});
test('pinch and genuine closed-toolbar resize are not inferred as keyboard occlusion',()=>{
  let state=measureViewport(undefined,{...sample,layoutHeight:780});
  state=measureViewport(state,{...sample,layoutHeight:700,visibleHeight:700,time:3000});
  assert.equal(state.height,794);assert.equal(state.keyboardInset,0);
  state=measureViewport(state,{...sample,layoutHeight:780,visibleHeight:400,viewportScale:1.5,time:4000});
  assert.equal(state.keyboardInset,0);assert.equal(state.baseHeight,400);
});


test('browser chrome occlusion without any input focus never creates a keyboard',()=>{
  let state=measureViewport(undefined,{...sample,layoutHeight:780,visibleHeight:700});
  assert.equal(state.keyboardInset,0);assert.equal(state.baseHeight,700);
  for(const visibleHeight of [680,740,700,780,700]){
    state=measureViewport(state,{...sample,layoutHeight:780,visibleHeight,time:3000});
    assert.equal(state.keyboardInset,0);assert.equal(state.baseHeight,visibleHeight);
  }
});
test('a completed keyboard session cannot reappear when Safari toolbars change later',()=>{
  let state=measureViewport(undefined,{...sample,layoutHeight:780});
  state=measureViewport(state,{...sample,layoutHeight:780,focused:true,visibleHeight:450,time:10});
  state=measureViewport(state,{...sample,layoutHeight:780,time:20});
  state=measureViewport(state,{...sample,layoutHeight:780,visibleHeight:700,time:2000});
  assert.equal(state.keyboardInset,0);assert.equal(state.baseHeight,700);
});


test('fixed-canvas consumers publish keyboard visibility edges, not every native keyboard pixel',()=>{
 const select=createViewportSelection(viewportLayout);
 let state=measureViewport(undefined,sample),closed=select(viewportGeometry(state));
 let opened;
 for(const [index,visibleHeight] of [778,760,720,650,530,450].entries()){
   state=measureViewport(state,{...sample,focused:true,time:10+index,visibleHeight,offsetTop:index*20});
   const next=select(viewportGeometry(state));
   assert.equal(next.height,closed.height);
   assert.equal(next.keyboardVisible,true);
   if(opened)assert.equal(next,opened);else opened=next;
 }
 for(const visibleHeight of [500,600,700,778]){
   state=measureViewport(state,{...sample,focused:false,time:100,visibleHeight,offsetTop:100});
   assert.equal(select(viewportGeometry(state)),opened);
 }
 state=measureViewport(state,{...sample,time:200});
 const restored=select(viewportGeometry(state));
 assert.notEqual(restored,opened);assert.deepEqual(restored,closed);
 state=measureViewport(state,{...sample,width:430,time:300});
 assert.notEqual(select(viewportGeometry(state)),restored);
});
test('precise viewport subscribers retain every keyboard/pan sample for synchronous painting',()=>{
 const select=createViewportSelection(value=>value);
 let state=measureViewport(undefined,sample),previous=select(viewportGeometry(state));
 for(const visibleHeight of [770,740,600,450,500,720,780]){
  state=measureViewport(state,{...sample,focused:true,time:20,visibleHeight,offsetTop:30});
  const geometry=viewportGeometry(state),next=select(geometry);
  assert.notEqual(next,previous);assert.equal(next.keyboardInset,geometry.keyboardInset);
  assert.equal(next.pageTop,geometry.pageTop);previous=next;
 }
});

test('Safari toolbar gap is not carried as a permanent keyboard after dismissal',()=>{
 for(const gap of [44,64,90]){
  const toolbarSample={...sample,layoutHeight:sample.visibleHeight+gap};
  let state=measureViewport(undefined,toolbarSample);
  assert.equal(state.keyboardInset,0);assert.equal(state.browserChromeInset,gap);
  state=measureViewport(state,{...toolbarSample,focused:true,time:10});
  assert.equal(state.keyboardInset,0);assert.equal(state.baseHeight,780);
  for(let cycle=0;cycle<6;cycle++){
   state=measureViewport(state,{...toolbarSample,focused:true,time:100+cycle*3000,visibleHeight:450,offsetTop:100});
   assert.equal(state.baseHeight,780);assert.equal(state.keyboardInset,330);
   state=measureViewport(state,{...toolbarSample,focused:false,time:200+cycle*3000,offsetTop:100});
   assert.equal(state.keyboardInset,0);assert.equal(state.offsetTop,0);
   state=measureViewport(state,{...toolbarSample,time:2000+cycle*3000});
   assert.equal(state.keyboardInset,0);assert.equal(state.height,874);
  }
 }
});
test('a closed toolbar resize updates its baseline without creating a keyboard session',()=>{
 let state=measureViewport(undefined,{...sample,layoutHeight:844});
 state=measureViewport(state,{...sample,layoutHeight:844,visibleHeight:730,time:2000});
 assert.equal(state.keyboardInset,0);assert.equal(state.browserChromeInset,114);
 state=measureViewport(state,{...sample,layoutHeight:844,visibleHeight:400,focused:true,time:2100});
 assert.equal(state.baseHeight,730);assert.equal(state.keyboardInset,330);
});
