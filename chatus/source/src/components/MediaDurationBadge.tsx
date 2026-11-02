import './media-duration-badge.css';

/** Source3995:100769 /4162:227304: fixed icon and text frames, not an anonymous line. */
export function MediaDurationBadge({label,className=''}:{label:string;className?:string}){
  return <span className={`chatus-media-duration ${className}`} aria-label={`Длительность видео ${label}`}>
    <img src="/assets/chat-media/source-video-mark.svg" alt="" aria-hidden="true"/>
    <span style={{width:label.length===5?31:undefined}}>{label}</span>
  </span>;
}
