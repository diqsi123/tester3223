import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
// Execute the real pure scenario module while adapting Vite's extensionless TS import for Node.
const source=stripTypeScriptTypes(readFileSync(new URL('../src/components/chat-scenarios.ts',import.meta.url),'utf8')).replace("'./circle-geometry'",JSON.stringify(new URL('../src/components/circle-geometry.ts',import.meta.url).href));
const {CHAT_PREVIEWS,chatScenario}=await import('data:text/javascript,'+encodeURIComponent(source));
const kind=message=>message.circle?'circle':message.sticker!==undefined?'sticker':message.media?message.once?'once':message.media[0].source??(message.media.length>1?'album':'photo'):message.duration!==undefined?'voice':message.reply?'reply':'text';
test('ending and friendship source conversations preserve the complete ordered18-message history',()=>{
 const expected=['text','text','voice','text','text','text','reply','reply','voice','text','circle','album','video-poster','sticker','once','taken-now','text','text'];
 for(const preview of ['ended','rated','end-confirm','friend-outgoing','friend-outgoing-declined','friend-incoming','menu']){
  const messages=chatScenario(preview).messages.filter(message=>!message.friendship);assert.equal(messages.length,18,preview);assert.deepEqual(messages.map(kind),expected,preview);
  assert.equal(messages.at(-2).edited,true);assert.equal(messages.at(-2).width,290);assert.equal(messages.at(-2).height,56);
  assert.equal(messages.at(-2).reactions[0].emoji,'🙂');assert.equal(messages.at(-1).reactions[0].emoji,'❤️');
 }
});
test('all source preview assets are local non-empty available paths and each history has unique IDs',()=>{
 for(const [preview]of CHAT_PREVIEWS){const scenario=chatScenario(preview),ids=scenario.messages.map(message=>message.id);assert.equal(new Set(ids).size,ids.length,preview);
  for(const message of scenario.messages){const paths=[message.stickerAsset,message.circle?.poster,message.circle?.src,...(message.media??[]).map(item=>item.url),...(message.reactions??[]).map(reaction=>reaction.asset)].filter(Boolean);
   for(const path of paths){assert.ok(path.startsWith('/assets/'),path);assert.ok(existsSync(new URL('../public'+path,import.meta.url)),path);}
  }
 }
});
test('recorder preview cases are explicit testing scenes without fake camera streams',()=>{
 assert.equal(chatScenario('circle-recording').circleRecorder,'holding');assert.equal(chatScenario('circle-locked').circleRecorder,'locked');assert.equal(chatScenario('circle-once').circleRecorder,'once');
 for(const [preview,label]of CHAT_PREVIEWS.filter(([name])=>name.startsWith('circle-')))assert.ok(label.includes('testing'),preview);
 assert.equal(chatScenario('circle-incoming-playing').messages.at(-1).circle.expanded,true);
 assert.equal(chatScenario('circle-viewed').messages.at(-1).circle.viewed,true);
});

test('menu/edit source states end before the later incoming message, edit marker and reactions',()=>{
 for(const preview of ['message-actions','edit-message']){
  const messages=chatScenario(preview).messages,last=messages.at(-1);
  assert.equal(messages.length,17,preview);assert.equal(last.id,'outgoing-actions');
  assert.equal(last.width,274);assert.equal(last.height,52);
  assert.equal(last.edited,false);assert.equal(last.reactions,undefined);
 }
 const edited=chatScenario('edited-saved').messages;
 assert.equal(edited.length,17);assert.equal(edited.at(-1).edited,true);assert.equal(edited.at(-1).reactions,undefined);
 const reaction=chatScenario('reactions').messages;
 assert.equal(reaction.length,17);assert.equal(reaction.at(-1).reactions[0].count,1);assert.equal(reaction.at(-1).reactions[0].selected,true);
 const other=chatScenario('reaction-other').messages;
 assert.equal(other.length,18);assert.equal(other.at(-1).reactions[0].emoji,'❤️');assert.equal(other.at(-1).reactions[0].count,1);
});

// Confirmation and incoming requests retain their source action panel on first paint.
test('source action-panel states start with the final panel extent',()=>{
 for(const preview of ['start','menu','end-confirm','friend-outgoing','friend-outgoing-accepted','friend-incoming','friend-accepted','friend-declined'])assert.equal(chatScenario(preview).actions,true,preview);
 for(const preview of ['history','multiline','reply-compose','caption-text','ended','rated'])assert.equal(chatScenario(preview).actions,false,preview);
});

test('all six source friendship states have their identity/card before first paint',()=>{
 for(const [preview,direction,state]of [
  ['friend-outgoing','outgoing','pending'],['friend-outgoing-accepted','outgoing','accepted'],['friend-outgoing-declined','outgoing','declined'],
  ['friend-incoming','incoming','pending'],['friend-accepted','incoming','accepted'],['friend-declined','incoming','declined']
 ]){const messages=chatScenario(preview).messages;assert.equal(messages.length,19,preview);assert.deepEqual(messages.at(-1).friendship,{direction,state});assert.equal(messages.filter(message=>message.friendship).length,1);}
});


//3949:78084/78139 author different pink presence labels, not a generic online label.
test('source presence labels retain their authored content and Hug widths',()=>{
 assert.deepEqual(chatScenario('keyboard').presence,{label:'Печатает…',width:86});
 assert.deepEqual(chatScenario('exchange').presence,{label:'Записывает голосовое…',width:172});
 assert.deepEqual(chatScenario('history').presence,{label:'В чате',width:40});
});
