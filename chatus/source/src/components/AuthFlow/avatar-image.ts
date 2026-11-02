/** Original Figma PNG stays the fallback; mobile bitmap keeps the same artwork and alpha. */
const ORIGINAL_WIDTHS=[2000, 2000, 2000, 2000, 4000, 2000, 2000, 2000];
export function avatarImage(character:number){
 const src=`/assets/auth/avatar-character-${character}.png`;
 return {src,srcSet:`/assets/auth/avatar-character-${character}-mobile.webp 768w, ${src} ${ORIGINAL_WIDTHS[character]??2000}w`,sizes:'240px'};
}
