import { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MobileScroll } from '../mobile';
import { UI_MOTION, STILL } from '../ui/motion';
import { getPressProps } from '../ui/press';
import type { ChatMediaItem } from './ChatConversation';
import './chat-stickers.css';

const TABS = ['stickers', 'gif'] as const;
const TAB_WIDTHS = [89, 52];
const STICKER_LABELS = ['Привет', 'Ты откуда?', 'Хаха', 'Как настроение?', 'Чем занимаешься?', 'Серьёзно?', 'Мужчина или женщина?', 'Круто!'];
// Figma 4162:224059 contains JPEG fills, not animated GIF files. Reuse the
// exact existing source crops; these remain static, explicitly named previews.
const GIF_PHOTOS = [0, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 6, 6, 6, 7, 8];

type Props = { onSend: (index: number) => void; onSendGif?: (item: ChatMediaItem) => void };

export function ChatStickers({ onSend, onSendGif }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]>('stickers');
  const [gifOpened, setGifOpened] = useState(false);
  const reduced = useReducedMotion();
  const id = useId();
  const index = TABS.indexOf(tab);
  const selectTab = (next: typeof TABS[number]) => { if (next === 'gif') setGifOpened(true); setTab(next); };
  return <div className={`chat-sticker-picker chatus-media-picker is-${tab}`} data-node-id={tab === 'stickers' ? '4162:210582' : '4162:223328'}>
    <div role="tablist" aria-label="Стикеры и GIF" className="chat-sticker-tabs">
      <motion.span className="chat-sticker-tab-pill" aria-hidden="true" initial={false} animate={{ x: index === 0 ? 0 : 89, width: TAB_WIDTHS[index] }} transition={reduced ? STILL : UI_MOTION.surface}/>
      {TABS.map((value, i) => <motion.button {...getPressProps(reduced)} key={value} role="tab" aria-label={value === 'stickers' ? 'Стикеры' : 'GIF'} aria-selected={tab === value} aria-controls={`${id}-picker-${value}`} tabIndex={tab === value ? 0 : -1} id={`${id}-picker-tab-${value}`} style={{ width: TAB_WIDTHS[i] }} onClick={() => selectTab(value)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : i === 0 ? 1 : 0;
        selectTab(TABS[next]);
        (event.currentTarget.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
      }}><span className="chat-sticker-tab-label" style={{ width: TAB_WIDTHS[i] - 32 }} aria-hidden="true"><img src={i === 0 ? '/assets/chat-picker/stickers-label.svg' : '/assets/peer/tab-label-4.svg'} alt="" draggable={false}/></span></motion.button>)}
    </div>
    <motion.div className="chat-picker-panel is-stickers" role="tabpanel" id={`${id}-picker-stickers`} aria-labelledby={`${id}-picker-tab-stickers`} aria-hidden={tab !== 'stickers'} inert={tab !== 'stickers'} initial={false} animate={{ opacity: tab === 'stickers' ? 1 : 0 }} transition={reduced ? STILL : UI_MOTION.fade} style={{ pointerEvents: tab === 'stickers' ? 'auto' : 'none' }}>
      <div className="chat-sticker-grid">{STICKER_LABELS.map((label, i) => <motion.button {...getPressProps(reduced)} key={i} aria-label={`Отправить стикер «${label}»`} onClick={() => onSend(i)}><img src={`/assets/chat-picker/sticker-${i}.png`} alt="" draggable={false} decoding="async" width={224} height={224}/></motion.button>)}</div>
    </motion.div>
    {gifOpened ? <motion.div className="chat-picker-panel is-gif" role="tabpanel" id={`${id}-picker-gif`} aria-label="Статичные превью GIF из макета" aria-labelledby={`${id}-picker-tab-gif`} aria-hidden={tab !== 'gif'} inert={tab !== 'gif'} initial={{ opacity: 0 }} animate={{ opacity: tab === 'gif' ? 1 : 0 }} transition={reduced ? STILL : UI_MOTION.fade} style={{ pointerEvents: tab === 'gif' ? 'auto' : 'none' }}>
      <MobileScroll className="chat-picker-scroll"><div className="chat-picker-gif-grid">{GIF_PHOTOS.map((photo, i) => <motion.button {...getPressProps(reduced)} key={i} disabled={!onSendGif} aria-label={`Отправить превью GIF ${i + 1} из макета`} onClick={() => onSendGif?.({ url: `/assets/peer/photo-${photo}.jpg`, type: 'image', name: `Превью GIF из Figma ${i + 1}` })}><img src={`/assets/peer/photo-${photo}.jpg`} alt="" draggable={false} decoding="async" loading={i < 6 ? 'eager' : 'lazy'}/></motion.button>)}</div></MobileScroll>
      <div className="chat-picker-gif-edge" aria-hidden="true"/>
    </motion.div> : null}
  </div>;
}
