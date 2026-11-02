/** Checked circle sources3949:78577 /78924 /79073 /88549. */
export const CIRCLE_ASSETS = '/assets/chat-circle/';
export type CircleMessageData = {
  poster?: string;
  src?: string;
  duration: number;
  once?: boolean;
  expanded?: boolean;
  viewed?: boolean;
  elapsed?: number;
};
export type CircleRecorderMode = 'holding' | 'locked' | 'once';
export function circleGeometry(outgoing: boolean, expanded: boolean) {
  const size = expanded ? 370 : 220;
  const inset = outgoing ? 2 : 3;
  return {size,inset,mediaSize:size-inset*2,rowHeight:size+16};
}
export function circleTime(seconds: number) {
  return `${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
}

/** A swipe-to-lock release must not activate the newly displayed send action. */
export function createCircleReleaseGuard() {
  let suppressClick=false;
  return {
    begin(){suppressClick=false;},
    lock(){suppressClick=true;},
    shouldSend(detail:number,locked:boolean){
      if(detail!==0&&suppressClick){suppressClick=false;return false;}
      return locked||detail===0;
    },
  };
}
