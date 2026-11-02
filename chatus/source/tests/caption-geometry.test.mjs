import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captionHeightFromMeasure} from '../src/components/caption-geometry.ts';

test('caption preserves the48px source field and whole15px lines across native font planes',()=>{
  for(const textScale of [15/17.875,15/16.5,15/16,1]){
    for(let lines=1;lines<=6;lines++){
      const measured=Math.round(lines*15/textScale);
      assert.equal(captionHeightFromMeasure(measured,textScale),33+lines*15);
    }
  }
});
test('long captions cap their external surface while text remains internally scrollable',()=>{
  for(const textScale of [15/17.875,15/16.5,15/16,1])
    for(const lines of [7,8,20,1000])
      assert.equal(captionHeightFromMeasure(Math.round(lines*15/textScale),textScale),132);
});
test('deleting text shrinks directly from a capped field to the newly measured line count',()=>{
  const sizes=[40,6,3,1,0].map(lines=>captionHeightFromMeasure(Math.round(lines*16),15/16));
  assert.deepEqual(sizes,[132,123,78,48,48]);
});
