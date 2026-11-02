export const QUESTIONNAIRE_KEY='chatus-prototype-questionnaire';
export type QuestionnaireData={nickname:string;age:number|null;gender:'male'|'female'|null;interests:string[];character:number;background:number;bio:string};
export type SessionStore=Pick<Storage,'getItem'|'setItem'>;
function readStoredQuestionnaire(storage:SessionStore):QuestionnaireData|null{
 try{
  const saved:unknown=JSON.parse(storage.getItem(QUESTIONNAIRE_KEY)??'null');
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return null;
  const data=saved as Record<string,unknown>;
  return {nickname:typeof data.nickname==='string'?data.nickname:'ТихийЛис',age:typeof data.age==='number'&&Number.isInteger(data.age)&&data.age>=18&&data.age<=99?data.age:null,gender:data.gender==='male'||data.gender==='female'?data.gender:null,interests:Array.isArray(data.interests)?data.interests.filter((v):v is string=>typeof v==='string'):[],character:typeof data.character==='number'&&Number.isInteger(data.character)&&data.character>=0&&data.character<8?data.character:0,background:typeof data.background==='number'&&Number.isInteger(data.background)&&data.background>=0&&data.background<7?data.background:0,bio:typeof data.bio==='string'?data.bio:''};
 }catch{return null;}
}
const copyQuestionnaire=(data:QuestionnaireData):QuestionnaireData=>({...data,interests:[...data.interests]});
/** Browser storage may be unavailable; the confirmed in-page session stays usable. */
export function createQuestionnaireSession(getStorage:()=>SessionStore){
 let latest:QuestionnaireData|null=null;
 return {
  read():QuestionnaireData|null{if(latest)return copyQuestionnaire(latest);try{return readStoredQuestionnaire(getStorage());}catch{return null;}},
  store(data:QuestionnaireData){latest=copyQuestionnaire(data);try{getStorage().setItem(QUESTIONNAIRE_KEY,JSON.stringify(data));}catch{/* Keep the confirmed in-page session. */}}
 };
}
const session=createQuestionnaireSession(()=>sessionStorage);
export function readQuestionnaire(storage?:SessionStore){return storage?readStoredQuestionnaire(storage):session.read();}
export function storeQuestionnaire(data:QuestionnaireData,storage?:SessionStore){
 if(!storage){session.store(data);return;}
 try{storage.setItem(QUESTIONNAIRE_KEY,JSON.stringify(data));}catch{/* Explicit stores may be read-only. */}
}
