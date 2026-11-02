import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readQuestionnaire,storeQuestionnaire,QUESTIONNAIRE_KEY,createQuestionnaireSession} from '../src/components/AuthFlow/questionnaire-storage.ts';
const profile={nickname:'ЛунныйЛис52',age:21,gender:'female',interests:['music','cinema'],character:3,background:3,bio:'Люблю джаз\nи хорошие разговоры'};
function memory(){const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
test('confirmed questionnaire and later profile saves restore every field after remount',()=>{
 const storage=memory();assert.equal(readQuestionnaire(storage),null);
 storeQuestionnaire(profile,storage);assert.deepEqual(readQuestionnaire(storage),profile);
 const edited={...readQuestionnaire(storage),age:30,bio:'Новое био'};
 storeQuestionnaire(edited,storage);assert.deepEqual(readQuestionnaire(storage),edited);
});
test('missing optional fields and corrupt session storage cannot break entry',()=>{
 const storage=memory();storage.setItem(QUESTIONNAIRE_KEY,'broken');assert.equal(readQuestionnaire(storage),null);
 storage.setItem(QUESTIONNAIRE_KEY,'[]');assert.equal(readQuestionnaire(storage),null);
 storage.setItem(QUESTIONNAIRE_KEY,JSON.stringify({nickname:'Лис',age:400,gender:'x',character:99,background:-1,interests:['music',null,7]}));
 assert.deepEqual(readQuestionnaire(storage),{nickname:'Лис',age:null,gender:null,character:0,background:0,interests:['music'],bio:''});
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(readQuestionnaire(blocked),null);assert.doesNotThrow(()=>storeQuestionnaire(profile,blocked));
});

test('private browser storage denial retains the newly confirmed profile across component remounts',()=>{
 const session=createQuestionnaireSession(()=>{throw new DOMException('blocked','SecurityError');});
 assert.equal(session.read(),null);session.store(profile);assert.deepEqual(session.read(),profile);
 const edited={...session.read(),nickname:'НовоеИмя75',background:5};session.store(edited);assert.deepEqual(session.read(),edited);
});
test('failed write cannot substitute an older stored profile for the newly confirmed one',()=>{
 const session=createQuestionnaireSession(()=>({getItem:()=>JSON.stringify({...profile,nickname:'СтарыйНик'}),setItem(){throw Error('quota');}}));
 assert.equal(session.read().nickname,'СтарыйНик');session.store(profile);assert.deepEqual(session.read(),profile);
 const returned=session.read();returned.interests.push('travel');assert.deepEqual(session.read().interests,profile.interests);
});
