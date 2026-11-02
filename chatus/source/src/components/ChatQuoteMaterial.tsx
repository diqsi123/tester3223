/** Render-equivalent sRGB material from actual3949:78323/78356 screens.
 * Native wide-gamut blending of ten DOM planes changes the source tint.
 * One opaque paint keeps the checked colour and needs no per-quote compositor stack.
 */
export function ChatQuoteMaterial({ outgoing = false, circle = false }: { outgoing?: boolean; circle?: boolean }) {
  return <span className={`chat-quote-material is-${outgoing?'outgoing':'incoming'}${circle?' is-circle':''}`} aria-hidden="true"/>;
}
