import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bioValidation,bioLineMetrics} from '../src/components/AuthFlow/onboarding-bio.ts';
test('bio accepts useful text through50 code points, including emoji, and rejects empty/over limit',()=>{
 for(const value of ['', ' \n\t'])assert.equal(bioValidation(value).valid,false);
 assert.deepEqual(bioValidation('🙂'.repeat(50)),{length:50,tooLong:false,valid:true});
 assert.equal(bioValidation('🙂'.repeat(51)).tooLong,true);
 assert.equal(bioValidation('а'.repeat(50)).valid,true);
 assert.equal(bioValidation('а'.repeat(51)).valid,false);
});
test('bio stays56px for one line and caps at118px; more lines scroll inside the field',()=>{
 assert.equal(bioLineMetrics(20.25,1).height,56);
 assert.equal(bioLineMetrics(81,1).height,118);
 assert.equal(bioLineMetrics(162,1).height,118);
 assert.equal(bioLineMetrics(81/.9375,.9375).height,118);
});

test('four visible bio lines do not force native caret scrolling inside a short textarea',()=>{
 const metrics=bioLineMetrics(81/.839160839,.839160839);
 assert.equal(metrics.height,118);
 assert.equal(metrics.inputHeight,81);
 assert.ok(metrics.inputHeight>=4*metrics.lineHeight);
 assert.equal(bioLineMetrics(20.25,1).inputHeight,18);
});
