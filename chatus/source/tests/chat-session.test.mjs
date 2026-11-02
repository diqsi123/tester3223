import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const code=stripTypeScriptTypes(readFileSync(new URL('../src/components/chat-session.ts',import.meta.url),'utf8'));
const {editMessage,reactToMessage,requiresEndConfirmation}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('short dialogs require confirmation, ten messages and longer finish directly',()=>{for(const count of [0,1,9])assert.equal(requiresEndConfirmation(count),true);for(const count of [10,11,100])assert.equal(requiresEndConfirmation(count),false);});
test('editing preserves identity, time and quote, and leaves incoming messages alone',()=>{
 const quote={id:'voice',text:'Голосовое сообщение'},own={id:'a',outgoing:true,text:'old',time:'9:41',reply:quote,width:290,height:70,fresh:true},incoming={id:'b',outgoing:false,text:'peer'};
 const result=editMessage([own,incoming],'a',' new ');
 assert.equal(result[0].text,'new');assert.equal(result[0].id,'a');assert.equal(result[0].reply,quote);assert.equal(result[0].time,'9:41');assert.equal(result[0].height,undefined);assert.equal(result[0].edited,true);assert.equal(result[1],incoming);assert.equal(own.text,'old');
 assert.equal(editMessage([incoming],'b','rewrite')[0],incoming);
});
test('empty and unchanged edits do not mark a message edited',()=>{const a={id:'a',outgoing:true,text:'old'};const all=[a];assert.equal(editMessage(all,'a','  '),all);assert.equal(editMessage(all,'a','old')[0],a);});
test('switching a reaction preserves other people counts without mutating source',()=>{
 const a={id:'a',outgoing:false,reactions:[{emoji:'🙂',count:3,selected:true},{emoji:'❤️',count:2,selected:false}]};
 const b=reactToMessage([a],'a','❤️')[0];
 assert.deepEqual(b.reactions,[{emoji:'🙂',count:2,selected:false},{emoji:'❤️',count:3,selected:true}]);assert.equal(a.reactions[0].count,3);
 assert.deepEqual(reactToMessage([b],'a','❤️')[0].reactions,[{emoji:'🙂',count:2,selected:false},{emoji:'❤️',count:2,selected:false}]);
});
test('toggling a sole reaction removes its empty chip',()=>{const a={id:'a',outgoing:true};const b=reactToMessage([a],'a','🙂');assert.deepEqual(reactToMessage(b,'a','🙂')[0].reactions,[]);});


test('friendship resolves in its original chronological position, with later text and media after it', async () => {
  const {setFriendshipState}=await import('../src/components/chat-session.ts');
  const before={id:'before',outgoing:false,text:'before'};
  const card={id:'request',outgoing:true,friendship:{direction:'outgoing',state:'pending'}};
  const after={id:'after',outgoing:true,text:'after'};
  const media={id:'media',outgoing:true,media:[{url:'test',type:'image',name:'sample'}]};
  const timeline=[before,card,after,media];
  const resolved=setFriendshipState(timeline,'accepted');
  assert.deepEqual(resolved.map(message=>message.id),['before','request','after','media']);
  assert.equal(resolved[1].friendship.state,'accepted');
  assert.equal(card.friendship.state,'pending');
  assert.equal(resolved[0],before);assert.equal(resolved[2],after);assert.equal(resolved[3],media);
  const removedAnchor=setFriendshipState([card,after,media],'declined');
  assert.deepEqual(removedAnchor.map(message=>message.id),['request','after','media']);
});
