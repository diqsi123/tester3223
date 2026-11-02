/** Six independent cells retain their positions while editing or autofilling. */
export const emptyCode=()=>Array<string>(6).fill('');
export function editCode(current:string[],value:string,index:number){
 const clean=value.replace(/\D/g,'').slice(0,6);
 if(value&&!clean)return {digits:current,focus:index};
 const start=clean.length===6?0:index,next=[...current];
 if(!clean)next[index]='';
 else for(let i=0;i<clean.length&&start+i<6;i++)next[start+i]=clean[i];
 return {digits:next,focus:Math.min(start+clean.length,5)};
}
export function eraseCode(current:string[],index:number){
 const focus=current[index]?index:Math.max(0,index-1),next=[...current];
 next[focus]='';return {digits:next,focus};
}
