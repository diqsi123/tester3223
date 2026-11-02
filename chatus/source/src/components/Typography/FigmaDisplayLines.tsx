import './figma-display.css';

/** Preserve Figma's optical spaces, including spaces at the end of a line. */
export function FigmaDisplayLines({ text }: { text: string }) {
  return <>{text.split(/[\n\u2028]/).map((line, index) => <span className="figma-display-line" key={index}>{line}</span>)}</>;
}
