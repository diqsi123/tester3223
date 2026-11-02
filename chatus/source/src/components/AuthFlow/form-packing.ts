/** Keep source typography/control sizes; give up empty vertical space first. */
export function packAuthForm(questionnaire:boolean,room:number,controlHeight:number,compact:boolean){
 const headingTop=questionnaire?32:12,headingHeight=questionnaire?99.5:142.5,controlTop=questionnaire?171:186;
 if(!compact)return {headingTop,controlTop,cut:0};
 const shortfall=Math.max(0,controlTop+controlHeight-room);
 const gapCut=Math.min(controlTop-headingTop-headingHeight-6,shortfall);
 const topCut=Math.min(headingTop,Math.max(0,shortfall-gapCut));
 return {headingTop:headingTop-topCut,controlTop:controlTop-gapCut-topCut,cut:gapCut+topCut};
}

/** Reclaim secondary-action space continuously, using the OS keyboard clock. */
export function entryKeyboardLayout(height:number,bottomInset:number,scale:number,keyboard:boolean,native:boolean){
 const edge=height-bottomInset/scale;
 const reclaim=native&&keyboard?Math.min(73,Math.max(0,278.5-(edge-72-125-16))):0;
 return {top:125-Math.max(0,reclaim-64),bottom:keyboard?edge-72+Math.min(64,reclaim):height-192,occlusion:Math.min(1,reclaim/16)};
}
