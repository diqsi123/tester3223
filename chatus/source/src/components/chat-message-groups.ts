type TimelineMessage={outgoing:boolean;friendship?:unknown};
/** Source3949:78205/78323/78391: incoming bubbles retain their left tail.
 * Outgoing bubbles stay round until the latest outgoing message, even when an
 * incoming voice/reply sits between them. Timeline cards start a new segment.
 * One backwards pass avoids rescanning a long chat separately for every bubble.
 */
export function messageTailFlags(messages:readonly TimelineMessage[]):boolean[]{
 const tails=new Array<boolean>(messages.length);let outgoingSeen=false;
 for(let index=messages.length-1;index>=0;index--){
  const message=messages[index];
  if(message.friendship){tails[index]=true;outgoingSeen=false;}
  else if(!message.outgoing)tails[index]=true;
  else {tails[index]=!outgoingSeen;outgoingSeen=true;}
 }
 return tails;
}
