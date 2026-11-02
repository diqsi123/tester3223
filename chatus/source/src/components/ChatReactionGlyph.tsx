import type {CSSProperties} from 'react';
export const CHAT_REACTIONS = ['🙂','❤️','👀','😂','🤝','👋'] as const;
/** Original4349:69914…69919 art; the already cached bar is a lossless sprite. */
export function ChatReactionGlyph({emoji,size=16}:{emoji:string;size?:number}){
 const index=CHAT_REACTIONS.indexOf(emoji as typeof CHAT_REACTIONS[number]);
 if(index<0)return <span aria-hidden="true">{emoji}</span>;
 const ratio=size/32;
 return <span className="chat-reaction-glyph" aria-hidden="true" style={{width:size,height:size,backgroundSize:`${276*ratio}px ${46*ratio}px`,backgroundPosition:`${-(12+44*index)*ratio}px ${-7*ratio}px`} as CSSProperties}/>;
}
