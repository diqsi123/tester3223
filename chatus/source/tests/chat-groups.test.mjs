import {test} from 'node:test';
import assert from 'node:assert/strict';
import {messageTailFlags} from '../src/components/chat-message-groups.ts';

test('source incoming text, media, voice and reply retain their left tail',()=>{
 assert.deepEqual(messageTailFlags([{outgoing:false,text:'Text'},{outgoing:false,media:{}},{outgoing:false,duration:5},{outgoing:false,reply:{}}]),[true,true,true,true]);
});
test('outgoing mixed content leaves only the latest outgoing tail',()=>{
 assert.deepEqual(messageTailFlags([{outgoing:true,text:'Text'},{outgoing:true,media:{}},{outgoing:true,duration:5},{outgoing:true,reply:{}}]),[false,false,false,true]);
});
test('source3949:78205 keeps the first outgoing round across the incoming voice',()=>{
 assert.deepEqual(messageTailFlags([false,true,false,true,true,true].map(outgoing=>({outgoing}))),[true,false,true,false,false,true]);
});
test('source3949:78391 keeps the latest outgoing reply tail when an incoming reply follows',()=>{
 assert.deepEqual(messageTailFlags([false,true,false,true,true,true,true,false].map(outgoing=>({outgoing}))),[true,false,true,false,false,false,true,true]);
});
test('a new outgoing message rounds the previous outgoing even across an incoming message',()=>{
 const messages=[{outgoing:true,text:'First'},{outgoing:false,text:'Reply'}];
 assert.deepEqual(messageTailFlags(messages),[true,true]);
 messages.push({outgoing:true,duration:3});
 assert.deepEqual(messageTailFlags(messages),[false,true,true]);
});
test('friendship timeline cards separate outgoing tail segments',()=>{
 assert.deepEqual(messageTailFlags([{outgoing:true},{outgoing:true,friendship:{}},{outgoing:true},{outgoing:false},{outgoing:true}]),[true,true,false,true,true]);
});
