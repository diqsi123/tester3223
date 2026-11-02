export const BIO_LIMIT=50;
export function bioValidation(value:string){
  const length=Array.from(value).length;
  return {length,tooLong:length>BIO_LIMIT,valid:value.trim().length>0&&length<=BIO_LIMIT};
}
/** Figma4722:16162:56px single line,118px four-line surface. */
export function bioLineMetrics(measuredHeight:number,textScale:number){
  const lines=Math.max(1,Math.round(measuredHeight/(20.25/textScale)));
  const visibleLines=Math.min(4,lines);
  const textHeight=visibleLines===1?18:Math.round(visibleLines*20.25)-1;
  // The editable viewport must hold complete line boxes. Rounding the source
  // surface down is fine; rounding the textarea down makes native caret-follow
  // scroll even when all four lines fit on that surface.
  const lineHeight=lines===1?18:20.25;
  return {lines,lineHeight,textHeight,inputHeight:Math.max(textHeight,visibleLines*lineHeight),height:38+textHeight};
}

/** Count Unicode code points, keeping an emoji's surrogate pair intact. */
export function limitBioEdit(previous:string,next:string,caret:number){
 const before=Array.from(previous),after=Array.from(next);
 if(after.length<=BIO_LIMIT)return {value:next,caret};
 let start=0,end=0;
 while(start<before.length&&start<after.length&&before[start]===after[start])start++;
 while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;
 const prefix=after.slice(0,start),suffix=end?after.slice(-end):[];
 if(prefix.length+suffix.length>BIO_LIMIT){
  const value=after.slice(0,BIO_LIMIT).join('');
  return {value,caret:Math.min(caret,value.length)};
 }
 const insertion=after.slice(start,after.length-end).slice(0,BIO_LIMIT-prefix.length-suffix.length);
 return {value:[...prefix,...insertion,...suffix].join(''),caret:[...prefix,...insertion].join('').length};
}
