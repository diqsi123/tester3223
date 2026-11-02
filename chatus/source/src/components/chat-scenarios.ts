import type {ChatMessage} from './ChatConversation';
import {CIRCLE_ASSETS,type CircleMessageData,type CircleRecorderMode} from './circle-geometry';

export const CHAT_PREVIEWS = [
  ['start', 'Начало диалога'], ['keyboard', 'Пустое поле · клавиатура'], ['incoming', 'Входящее сообщение'],
  ['typing', 'Набор текста'], ['multiline', 'Многострочный ввод'], ['exchange', 'Текстовая переписка'],
  ['voice', 'Входящее голосовое'], ['once-voice','Разовое голосовое · демо'], ['stickers','Стикеры'], ['history', 'Длинная переписка'], ['reply-compose', 'Ответ в поле ввода'],
  ['reply-text', 'Ответ на голосовое'], ['reply-incoming', 'Входящий ответ'],
  ['recording', 'Запись · отмена свайпом'], ['locked', 'Запись · закреплена'], ['sent-voice', 'Голосовое отправлено'],
  ['menu', 'Переписка · меню действий'], ['message-actions', 'Действия сообщения'], ['edit-message', 'Редактирование сообщения'], ['edited-saved','Изменения сохранены'],
  ['reactions', 'Реакция выбрана'], ['reaction-other','Реакция на другое сообщение'], ['friend-outgoing', 'Наша заявка · ожидание'], ['friend-outgoing-accepted', 'Наша заявка · принята'],
  ['friend-incoming', 'Входящая заявка'], ['friend-accepted', 'Входящая заявка · принята'], ['friend-declined', 'Входящая заявка · отклонена'],
  ['friend-outgoing-declined','Наша заявка · отклонена'],
  ['circle-ready','Кружок · режим готов · testing'], ['circle-recording','Кружок · удержание · testing'],
  ['circle-locked','Кружок · закреплена · testing'], ['circle-once','Кружок · разовый режим · testing'],
  ['circle-sent','Разовый кружок · отправлен · testing'], ['circle-playing','Свой кружок · воспроизведение · testing'],
  ['circle-viewed','Разовый кружок · просмотрен · testing'], ['circle-incoming','Входящий кружок · ответ · testing'],
  ['circle-incoming-playing','Входящий кружок · воспроизведение · testing'],
  ['album-incoming','Входящий альбом'], ['video-incoming','Входящее видео · source poster'],
  ['sticker-incoming','Входящий стикер'], ['photo-once','Разовое фото с подписью'], ['photo-taken','Снятое фото'],
  ['media-preview','Фото · предпросмотр'], ['media-once','Фото · разовый режим'], ['caption-focus','Подпись · пустое поле'], ['caption-text','Подпись · текст введён'],
  ['end-confirm', 'Подтверждение завершения'], ['ended', 'Диалог завершён'], ['rated', 'Оценка выбрана'],
] as const;
export type ChatPreview = typeof CHAT_PREVIEWS[number][0];
const LONG = 'Какой кайф я, просто невероятно обожаю геев и люблю, трахать!';
const REPLY = 'не, тут ты неправ, рил хуету сказал. сорь';
const FIXTURES: ChatMessage[] = [
  { id: 'incoming-1', outgoing: false, text: 'я педик =)', width: 141, height: 36 },
  { id: 'outgoing-1', outgoing: true, text: LONG, width: 290, height: 70 },
  { id: 'voice-1', outgoing: false, duration: 1, width: 290, height: 69 },
  { id: 'outgoing-2', outgoing: true, text: 'Хех) Ну да, соглы', width: 215, height: 36 },
  { id: 'outgoing-3', outgoing: true, text: 'Ну так-то не стоит так эксперементировать, однажды в ФСБ завербуют и какашечки.', width: 290, height: 88 },
  { id: 'outgoing-4', outgoing: true, text: LONG, width: 290, height: 70 },
  { id: 'outgoing-reply', outgoing: true, text: REPLY, reply: { id: 'voice-1', text: 'Голосовое сообщение' }, width: 290, height: 106 },
  { id: 'incoming-reply', outgoing: false, text: 'хуйло, съебись с чата', reply: { id: 'outgoing-reply', text: REPLY }, width: 234, height: 88 },
  { id: 'voice-2', outgoing: true, duration: 5, width: 290, height: 69 },
  { id: 'outgoing-actions', outgoing: true, text: 'Ну а как мне экшены показать? Хуесос', width: 275 },
  { id: 'incoming-deleted', outgoing: false, text: 'бля. а куда сообщение делось?', width: 259 },
];

const DELETED_MESSAGE:ChatMessage={id:'incoming-deleted',outgoing:false,text:'блэ. а куда сообщение делось?',width:259,height:52,time:'9:41'};
export const DEMO_CIRCLE:CircleMessageData={poster:CIRCLE_ASSETS+'poster.webp',src:CIRCLE_ASSETS+'flower-demo.mp4',duration:2};
const FULL_CONVERSATION:ChatMessage[]=[
  ...FIXTURES.slice(0,9),DELETED_MESSAGE,
  {id:'incoming-circle',outgoing:false,time:'9:41',circle:{...DEMO_CIRCLE,duration:1},reply:{id:'outgoing-reply',text:REPLY}},
  {id:'incoming-album',outgoing:false,time:'9:41',media:[
    {url:'/assets/chat-media/source-album-1.webp',type:'image',name:'Фото 1'},
    {url:'/assets/chat-media/source-album-2.webp',type:'image',name:'Фото 2'}]},
  {id:'incoming-video',outgoing:false,time:'9:41',media:[{url:'/assets/chat-media/source-video-poster.webp',type:'image',name:'Видео',source:'video-poster',height:256.82849,duration:24}]},
  {id:'incoming-sticker',outgoing:false,time:'9:41',sticker:0,stickerAsset:'/assets/chat-media/source-sticker.webp'},
  {id:'outgoing-once',outgoing:true,time:'9:41',text:'Я кстати, гей!',once:true,media:[{url:'/assets/chat-media/source-once.webp',type:'image',name:'Разовое фото',height:256.82849}]},
  {id:'outgoing-taken',outgoing:true,time:'9:41',media:[{url:'/assets/chat-media/source-taken-background.webp',type:'image',name:'Снятое фото',source:'taken-now',height:256}]},
  {...FIXTURES[9],edited:true,width:290,height:56,reactions:[{emoji:'🙂',count:1,selected:false,asset:CIRCLE_ASSETS+'reaction-smile.svg',sourcePill:true}]},
  {...DELETED_MESSAGE,id:'incoming-after-actions',reactions:[{emoji:'❤️',count:1,selected:false,asset:CIRCLE_ASSETS+'reaction-heart.png'}]},
];
const MEDIA_PREVIEWS:Partial<Record<ChatPreview,number>>={'album-incoming':11,'video-incoming':12,'sticker-incoming':13,'photo-once':14,'photo-taken':15};

export function chatPresence(preview: ChatPreview) {
  return preview==='keyboard'?{label:'Печатает…',width:86}:preview==='exchange'?{label:'Записывает голосовое…',width:172}:{label:'В чате',width:40};
}

export function chatScenario(preview: ChatPreview) {
  const counts: Partial<Record<ChatPreview, number>> = { incoming: 1, typing: 1, multiline: 1, exchange: 2, voice: 3, history: 6, 'reply-compose': 6, 'reply-text': 7, 'reply-incoming': 8, recording: 8, locked: 8, 'sent-voice': 9, menu: 9, 'message-actions': 11, 'edit-message': 11, reactions: 11, 'friend-outgoing': 11, 'friend-outgoing-accepted': 11, 'friend-outgoing-declined':11, 'friend-incoming': 11, 'friend-accepted': 11, 'friend-declined': 11, 'end-confirm': 11, ended: 11, rated: 11 };
  const full = ['menu','message-actions','edit-message','edited-saved','reactions','reaction-other','end-confirm','ended','rated'].includes(preview)||preview.startsWith('friend-');
  let messages:ChatMessage[] = full ? FULL_CONVERSATION.map(message=>({...message})) :
    preview==='once-voice'?FIXTURES.slice(0,9).map((message,index)=>({...message,once:index===8,demoOnly:index===8})):
    FIXTURES.slice(0,preview==='stickers'?6:counts[preview]??0).map(message=>({...message}));
  // Exact screen chronology:120625/129204 precede the edited/reaction states.
  if(['message-actions','edit-message','edited-saved','reactions'].includes(preview)){
    messages=FULL_CONVERSATION.slice(0,17).map(message=>({...message}));
    messages=messages.map(message=>message.id!=='outgoing-actions'?message:
      preview==='message-actions'||preview==='edit-message'
        ?{...message,edited:false,width:274,height:52,reactions:undefined}
        :preview==='edited-saved'?{...message,reactions:undefined}
        :{...message,reactions:message.reactions?.map(reaction=>({...reaction,count:1,selected:true}))});
  }
  if(preview==='reaction-other')messages=messages.map(message=>({...message,
    reactions:message.reactions?.map(reaction=>({...reaction,count:1,selected:true}))}));
  let circleRecorder:CircleRecorderMode|undefined;
  if(preview.startsWith('circle-')){
    messages=FIXTURES.slice(0,9).map(message=>({...message}));
    if(preview==='circle-recording')circleRecorder='holding';
    else if(preview==='circle-locked')circleRecorder='locked';
    else if(preview==='circle-once')circleRecorder='once';
    else if(preview!=='circle-ready'){
      const incoming=preview.startsWith('circle-incoming');
      if(incoming)messages.push({...DELETED_MESSAGE});
      messages.push({id:'circle-preview',outgoing:!incoming,time:'9:41',circle:{...DEMO_CIRCLE,
        once:!incoming,expanded:preview==='circle-playing'||preview==='circle-incoming-playing',
        elapsed:preview.includes('playing')?1:undefined,viewed:preview==='circle-viewed'},
        reply:preview==='circle-incoming'?{id:'outgoing-reply',text:REPLY}:undefined});
    }
  }
  const mediaIndex=MEDIA_PREVIEWS[preview];
  if(['media-preview','media-once','caption-focus','caption-text'].includes(preview))messages=FULL_CONVERSATION.slice(0,13).map(message=>({...message}));
  if(mediaIndex!==undefined)messages=FULL_CONVERSATION.slice(0,mediaIndex+1).map(message=>({...message}));
  if(preview.startsWith('friend-'))messages.push({id:'friendship-preview',outgoing:preview.startsWith('friend-outgoing'),friendship:{direction:preview.startsWith('friend-outgoing')?'outgoing':'incoming',state:preview.includes('accepted')?'accepted':preview.includes('declined')?'declined':'pending'}});
  return {presence:chatPresence(preview),messages,circleRecorder,circleReady:preview.startsWith('circle-'),draft:preview==='typing'?'Какой кайф я,':preview==='multiline'?LONG:preview==='reply-compose'?REPLY:'',
    reply:preview==='reply-compose'?FIXTURES[2]:null,keyboard:['keyboard','typing','multiline','reply-compose'].includes(preview),
    actions:preview==='start'||preview==='menu'||preview==='end-confirm'||preview.startsWith('friend-'),margin:['start','keyboard','typing','multiline','incoming','exchange'].includes(preview)?8:16};
}
