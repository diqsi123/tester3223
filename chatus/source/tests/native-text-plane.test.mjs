import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeTextPlane} from '../src/ui/native-text-plane.ts';
test('native focus font remains at least16 after every supported layout zoom, with15px source text',()=>{
  for(const width of [320,360,375,390,402,414,430]){
    const zoom=width/402,{fontSize,scale}=nativeTextPlane(15,true,zoom);
    assert.ok(fontSize*zoom>=16,`focus font at width${width}`);
    assert.ok(Math.abs(fontSize*scale-15)<1e-10);
    for(const source of [15,19.5,48,79,100,166,308])assert.ok(Math.abs(source/scale*scale-source)<1e-10);
  }
});
test('desktop source font and dimensions are unscaled',()=>assert.deepEqual(nativeTextPlane(15,false,.6),{fontSize:15,scale:1}));
