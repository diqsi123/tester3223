import {UI_MOTION} from '../ui/motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useKeyboard } from '../mobile';

export function PreviewControls({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const keyboard = useKeyboard();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    document.documentElement.toggleAttribute('data-chatus-preview-open', open);
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!root.current?.contains(target) && !target.closest('.device-menu-bar,.device-picker-menu')) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  useEffect(() => () => document.documentElement.removeAttribute('data-chatus-preview-open'), []);
  return createPortal(<div ref={root} className="chatus-preview-tools">
    <button ref={trigger} className="chatus-preview-trigger" aria-label="Управление прототипом" aria-expanded={open} aria-controls="chatus-preview-panel"
      onClick={() => { keyboard.hide(); setOpen(value => !value); }}><span aria-hidden="true">⋯</span></button>
    <AnimatePresence>{open && <motion.aside id="chatus-preview-panel" className="chatus-preview-panel" aria-label="Управление прототипом"
      initial={{ opacity: 0, y: reduced ? 0 : 8, scale: reduced ? 1 : .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : 8, scale: reduced ? 1 : .98 }} transition={reduced ? { duration: .12 } : UI_MOTION.surface}>
      <header><strong>Прототип Chatus</strong><button aria-label="Закрыть управление прототипом" onClick={() => setOpen(false)}>×</button></header>
      <div className="chatus-preview-controls">{children}</div>
    </motion.aside>}</AnimatePresence>
  </div>, document.body);
}
