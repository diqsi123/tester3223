import {BottomSheet} from '../AppSheet';
import { useEffect, useState } from 'react';
import { useMobileDevice } from '../../mobile';
import './notification-sheet.css';

/** Figma2996:16335: phone-scoped, dismissible584px notification invitation. */
export function NotificationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { device } = useMobileDevice();
  const scale = device.geometry.screen.width / 402;
  const [playing, setPlaying] = useState(!document.hidden);
  useEffect(() => {
    const update = () => setPlaying(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  function enable() {
    // This prototype records the choice locally, without requesting OS access.
    try { sessionStorage.setItem('chatus-prototype-notifications', 'enabled'); } catch {}
    onOpenChange(false);
  }
  return <BottomSheet open={open} onOpenChange={onOpenChange} title="Не пропусти ответ" description="Включи уведомления, и мы сразу напишем, когда тебе ответят" snap={584 * scale / device.geometry.screen.height}>
    <style>{`.bottom-sheet:has(.notification-sheet-body){height:${584 * scale}px;min-height:${584 * scale}px}`}</style>
    <div className="notification-sheet-body" data-node-id="2996:16347" data-playing={playing && open} style={{ transform: `scale(${scale})` }}>
      <button className="notification-close" aria-label="Закрыть уведомления" onClick={() => onOpenChange(false)}><img src="/assets/auth/notification-close.svg" alt="" /></button>
      <div className="notification-illustration" aria-hidden="true" data-node-id="2996:16469">
        <img className="notification-bubble-white" src="/assets/auth/notification-white-source.svg" alt="" draggable={false} />
        <img className="notification-bubble-green" src="/assets/auth/notification-green-source.svg" alt="" draggable={false} />
      </div>
      <div className="notification-copy">
        <h1>НЕ ПРОПУСТИ ОТВЕТ</h1>
        <p>Включи уведомления, и мы сразу<br />{' напишем, когда тебе ответят'}</p>
      </div>
      <div className="notification-actions">
        <button className="notification-enable" onClick={enable}>Включить уведомления</button>
        <button className="notification-later" onClick={() => onOpenChange(false)}>Не сейчас</button>
      </div>
    </div>
  </BottomSheet>;
}
