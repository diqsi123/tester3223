import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyCode,editCode,eraseCode} from '../src/components/AuthFlow/code-input.ts';
test('a full autofill code replaces all cells even when a later cell is focused',()=>{
 const old=['9','8','','7','',''];
 for(let index=0;index<6;index++){
  const result=editCode(old,'411111',index);
  assert.deepEqual(result,{digits:['4','1','1','1','1','1'],focus:5});
  assert.deepEqual(old,['9','8','','7','','']);
 }
});
test('deleting and replacing a middle code digit keeps every other cell in place',()=>{
 const old=['4','1','2','1','1','1'];
 const erased=eraseCode(old,2);
 assert.deepEqual(erased,{digits:['4','1','','1','1','1'],focus:2});
 assert.deepEqual(editCode(erased.digits,'1',2).digits,['4','1','1','1','1','1']);
 assert.deepEqual(eraseCode(erased.digits,2),{digits:['4','','','1','1','1'],focus:1});
});
test('partial paste respects its origin; nonnumeric paste does not erase a digit',()=>{
 assert.deepEqual(editCode(emptyCode(),'12',2),{digits:['','','1','2','',''],focus:4});
 const old=['4','','','','',''];
 assert.deepEqual(editCode(old,'words',0),{digits:old,focus:0});
 assert.deepEqual(editCode(old,'',0),{digits:emptyCode(),focus:0});
});
