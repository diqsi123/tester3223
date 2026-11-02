import { useState } from 'react';
import { MobileRuntime } from '../mobile';
import { OnboardingScreen } from './OnboardingScreen';

export function OnboardingPreview() {
  const [appleDesign, setAppleDesign] = useState(() => new URLSearchParams(location.search).get('apple-design') === '1');
  const [replay, setReplay] = useState(0);

  function selectMode(next: boolean) {
    const url = new URL(location.href);
    if (next) url.searchParams.set('apple-design', '1');
    else url.searchParams.delete('apple-design');
    history.replaceState(null, '', url);
    setAppleDesign(next);
  }

  return <>
    <aside className="onboarding-experiment-controls" aria-label="Сравнение онбординга">
      <h2>Онбординг · сравнение</h2>
      <div className="onboarding-experiment-modes" role="group" aria-label="Вариант движения">
        <button type="button" aria-pressed={!appleDesign} onClick={() => selectMode(false)}>Текущий</button>
        <button type="button" aria-pressed={appleDesign} onClick={() => selectMode(true)}>Apple design</button>
      </div>
      <p>Потяни карточку, отпусти и перехвати её во время возврата.</p>
      <button className="onboarding-experiment-replay" type="button" onClick={() => setReplay(value => value + 1)}>Повторить вход</button>
    </aside>
    <MobileRuntime presentation="design">
      <OnboardingScreen key={`${appleDesign}-${replay}`} appleDesign={appleDesign} />
    </MobileRuntime>
  </>;
}
