import {test} from 'node:test';
import assert from 'node:assert/strict';
import {limitBioEdit} from '../src/components/AuthFlow/onboarding-bio.ts';
test('long bio paste accepts50 code points without splitting emoji',()=>{
 assert.equal(limitBioEdit('','а'.repeat(70),70).value,'а'.repeat(50));
 const emoji=limitBioEdit('','🙂'.repeat(51),102);
 assert.equal(emoji.value,'🙂'.repeat(50));
 assert.equal(emoji.caret,100);
});
test('typing at the limit preserves the rest of the text and the insertion caret',()=>{
 const before='а'.repeat(25)+'б'.repeat(25);
 assert.deepEqual(limitBioEdit(before,'а'.repeat(25)+'X'+'б'.repeat(25),26),{value:before,caret:25});
});
test('paste over a selection uses its freed capacity and preserves the suffix',()=>{
 const before='а'.repeat(20)+'б'.repeat(10)+'в'.repeat(20);
 const next='а'.repeat(20)+'Г'.repeat(30)+'в'.repeat(20);
 assert.deepEqual(limitBioEdit(before,next,50),{value:'а'.repeat(20)+'Г'.repeat(10)+'в'.repeat(20),caret:30});
});
test('ordinary edits and deletion keep the browser caret unchanged',()=>{
 assert.deepEqual(limitBioEdit('Привет','ПриXвет',4),{value:'ПриXвет',caret:4});
 assert.deepEqual(limitBioEdit('🙂'.repeat(50),'🙂'.repeat(49),98),{value:'🙂'.repeat(49),caret:98});
});
