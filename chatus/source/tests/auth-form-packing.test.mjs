import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packAuthForm,entryKeyboardLayout} from '../src/components/AuthFlow/form-packing.ts';
test('closed keyboard retains the original source positions even in a short viewport',()=>{
 assert.deepEqual(packAuthForm(false,180,128,false),{headingTop:12,controlTop:186,cut:0});
 assert.deepEqual(packAuthForm(true,180,80,false),{headingTop:32,controlTop:171,cut:0});
});
test('email and questionnaire fit full source text and controls before resorting to scroll',()=>{
 for(const [questionnaire,headingHeight,controlHeight,minRoom] of [[false,142.5,128,278.5],[true,99.5,80,187.5],[true,99.5,104,211.5]]){
  for(let room=minRoom;room<400;room+=.5){const packed=packAuthForm(questionnaire,room,controlHeight,true);
   assert.ok(packed.headingTop>=0);assert.ok(packed.controlTop>=packed.headingTop+headingHeight+6);
   assert.ok(packed.controlTop+controlHeight<=room+.00001);
  }
 }
});
test('an impossibly short viewport keeps text/control sizes and leaves content scrollable',()=>{
 const packed=packAuthForm(false,150,128,true);assert.equal(packed.headingTop,0);assert.equal(packed.controlTop,148.5);assert.ok(packed.controlTop+128>150);
});

test('secondary action space is reclaimed continuously through keyboard opening and closing',()=>{
 for(const scale of [.8955,.9701,1,1.0697]){
  let previous;
  for(let edge=850;edge>=300;edge-=.5){const current=entryKeyboardLayout(900,(900-edge)*scale,scale,true,true);
   if(previous){assert.ok(Math.abs(current.top-previous.top)<=.500001);assert.ok(Math.abs(current.bottom-previous.bottom)<=.500001);}
   assert.ok(current.occlusion>=0&&current.occlusion<=1);previous=current;
  }
 }
});
