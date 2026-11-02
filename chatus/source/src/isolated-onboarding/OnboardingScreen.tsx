import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useMobileDevice } from "../mobile";
import { useChatusViewport } from '../components/ChatusViewport';
import { Glass } from "./Glass";
import { FigmaDisplayLines } from "../components/Typography/FigmaDisplayLines";
import { QuestionnaireGlow } from '../components/AuthFlow/QuestionnaireGlow';
import { softTilt, tiltReleaseVelocity, type TiltSample } from './apple-card-motion';
import { getPressProps } from '../ui/press';
import { UI_MOTION } from '../ui/motion';

const ASSETS = "/assets/onboarding/";

function OnboardingCompletionBadge({ percent }: { percent: 20 | 100 }) {
  const reduced = useReducedMotion();
  const badge = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ring' | 'fill' | 'check'>(reduced && percent === 100 ? 'check' : 'ring');
  useEffect(() => {
    if (percent !== 100) { setPhase('ring'); return; }
    if (reduced) { setPhase('check'); return; }
    setPhase('ring');
    const scene = badge.current?.closest<HTMLElement>('.flow-screen');
    const started = performance.now();
    const timers: number[] = [];
    let frame = 0, stableFrames = 0;
    const check = () => {
      const matrix = new DOMMatrixReadOnly(scene ? getComputedStyle(scene).transform : 'none');
      stableFrames = Math.abs(matrix.m41) < .5 && Math.abs(matrix.m11 - 1) < .001 ? stableFrames + 1 : 0;
      if (stableFrames < 2) { frame = requestAnimationFrame(check); return; }
      // Let the card finish its entrance before completing the status icon.
      const delay = Math.max(0, 1000 - (performance.now() - started));
      timers.push(window.setTimeout(() => setPhase('fill'), delay));
      timers.push(window.setTimeout(() => setPhase('check'), delay + 420));
    };
    frame = requestAnimationFrame(check);
    return () => { cancelAnimationFrame(frame); timers.forEach(clearTimeout); };
  }, [percent, reduced]);
  return <div ref={badge} className={`onboarding-completion-badge ${percent === 100 ? 'is-complete' : ''}`} data-phase={phase} role="status" aria-label={`Анкета заполнена на ${percent}%`}>
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle className="onboarding-completion-track" cx="6" cy="6" r="5"/>
      <circle className="onboarding-completion-ring" cx="6" cy="6" r="5" pathLength="1" strokeDasharray={percent === 100 ? '1 0' : '.2 1'} transform="rotate(-90 6 6)"/>
      <circle className="onboarding-completion-fill" cx="6" cy="6" r="6"/>
      <path className="onboarding-completion-check" d="M3.15 6.05 5.15 7.9 8.85 4.25" pathLength="1"/>
    </svg>
    <span>{percent}%</span>
  </div>;
}

export function ProfileCard({ children, className = '', height = 190, nodeId = '3087:31958', hint = true, celebrate = false, completion = 20, appleDesign = false }: { children?: ReactNode; className?: string; height?: number; nodeId?: string; hint?: boolean; celebrate?: boolean; completion?: 20 | 100; appleDesign?: boolean } = {}) {
  const reducedMotion = useReducedMotion();
  const appearanceY = useMotionValue(reducedMotion ? 0 : celebrate ? 24 : 12);
  const appearanceOpacity = useMotionValue(reducedMotion ? 1 : 0);
  const appearanceScale = useMotionValue(reducedMotion || !celebrate ? 1 : .97);
  const pitch = useMotionValue(0);
  const yaw = useMotionValue(0);
  const springX = useSpring(pitch, { stiffness: 260, damping: 28, mass: .65 });
  const springY = useSpring(yaw, { stiffness: 260, damping: 28, mass: .65 });
  // In the experiment, the gesture owns the presentation values directly.
  const rotateX = appleDesign ? pitch : springX;
  const rotateY = appleDesign ? yaw : springY;
  const intro = useRef<{ stop: () => void }[]>([]);
  const settling = useRef<{ stop: () => void }[]>([]);
  const hintDismissed = useRef(false);
  useEffect(() => () => settling.current.forEach(animation => animation.stop()), []);
  useEffect(() => {
    if (reducedMotion) {
      appearanceY.set(0);
      appearanceOpacity.set(1);
      appearanceScale.set(1);
      return;
    }
    intro.current = [
      animate(appearanceY, 0, UI_MOTION.surface),
      animate(appearanceOpacity, 1, UI_MOTION.fade),
      ...(celebrate ? [
        animate(appearanceScale, 1, UI_MOTION.surface),
      ] : []),
    ];
    const timer = window.setTimeout(() => {
      if (!hint || hintDismissed.current) return;
      intro.current = [
        animate(pitch, [0, -4.4, 2.2, 0], { duration: 1.5, times: [0, .3, .65, 1], ease: 'easeInOut' }),
        animate(yaw, [0, 7.2, -4.4, 0], { duration: 1.5, times: [0, .3, .65, 1], ease: 'easeInOut' }),
      ];
    }, 850);
    return () => {
      window.clearTimeout(timer);
      intro.current.forEach(animation => animation.stop());
    };
  }, [pitch, yaw, appearanceY, appearanceOpacity, appearanceScale, reducedMotion, hint, celebrate]);
  const reflection = useTransform(() => {
    const x = 50 + rotateY.get() * 2.5;
    const y = 50 - rotateX.get() * 2.5;
    return `radial-gradient(ellipse at ${x}% ${y}%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.5) 24%, rgba(255,255,255,0) 65%)`;
  });
  const reflectionOpacity = useTransform(() => Math.min(.75, Math.hypot(rotateX.get(), rotateY.get()) / 20));
  const reflectionX = useTransform(rotateY, value => value * 1.4);
  const reflectionY = useTransform(rotateX, value => -value * 1.4);
  const gesture = useRef<{ id: number; x: number; y: number; width: number; height: number; pitch: number; yaw: number; samples: TiltSample[] } | null>(null);
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!appleDesign || !reducedMotion) return;
    settling.current.forEach(animation => animation.stop());
    settling.current = [];
    gesture.current = null;
    pitch.set(0);
    yaw.set(0);
    setHeld(false);
  }, [appleDesign, reducedMotion, pitch, yaw]);
  function begin(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0 || (appleDesign && reducedMotion)) return;
    event.preventDefault();
    hintDismissed.current = true;
    intro.current.forEach(animation => animation.stop());
    settling.current.forEach(animation => animation.stop());
    // Taking hold also cancels a hint that has not started yet.
    intro.current = [];
    if (appleDesign) {
      // Finish an interrupted entrance from its current presentation, without a snap.
      settling.current = [
        animate(appearanceY, 0, { type: 'spring', bounce: 0, duration: .22 }),
        animate(appearanceOpacity, 1, { duration: .12 }),
        animate(appearanceScale, 1, { type: 'spring', bounce: 0, duration: .22 }),
      ];
    } else {
      appearanceY.set(0);
      appearanceOpacity.set(1);
      appearanceScale.set(1);
    }
    const initialPitch = rotateX.get(), initialYaw = rotateY.get();
    pitch.set(initialPitch);
    yaw.set(initialYaw);
    const bounds = event.currentTarget.getBoundingClientRect();
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height, pitch: initialPitch, yaw: initialYaw, samples: [{ time: event.timeStamp, pitch: initialPitch, yaw: initialYaw }] };
    event.currentTarget.setPointerCapture(event.pointerId);
    setHeld(true);
  }
  function tilt(event: PointerEvent<HTMLElement>) {
    const origin = gesture.current;
    if (!origin || origin.id !== event.pointerId) return;
    event.preventDefault();
    const bound = appleDesign ? softTilt : (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
    yaw.set(bound(origin.yaw + (event.clientX - origin.x) / origin.width * 44, 16));
    pitch.set(bound(origin.pitch - (event.clientY - origin.y) / origin.height * 36, 14));
    if (appleDesign) {
      origin.samples = [...origin.samples.filter(sample => event.timeStamp - sample.time <= 100), { time: event.timeStamp, pitch: pitch.get(), yaw: yaw.get() }];
    }
  }
  function release(event: PointerEvent<HTMLElement>, cancelled = false) {
    const origin = gesture.current;
    if (!origin || origin.id !== event.pointerId) return;
    gesture.current = null;
    setHeld(false);
    if (appleDesign && !reducedMotion) {
      const velocity = cancelled ? { pitch: 0, yaw: 0 } : tiltReleaseVelocity(origin.samples, event.timeStamp);
      settling.current.push(
        animate(pitch, 0, { type: 'spring', stiffness: 280, damping: 26, mass: .7, velocity: velocity.pitch }),
        animate(yaw, 0, { type: 'spring', stiffness: 280, damping: 26, mass: .7, velocity: velocity.yaw }),
      );
    } else {
      pitch.set(0);
      yaw.set(0);
    }
  }
  return <motion.article className={`onboarding-card ${className}`} data-node-id={nodeId} data-held={held} aria-label={children ? 'Твой профиль' : 'Карточка собеседника'} tabIndex={0}
    style={{ height, rotateX, rotateY, y: appearanceY, opacity: appearanceOpacity, scale: appearanceScale, transformPerspective: 700 }}
    onPointerDown={begin} onPointerMove={tilt} onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)} onLostPointerCapture={event => release(event, true)}>
    <Glass height={height} id={children ? 'profile-glass' : 'onboarding-glass'} />
    <motion.div className="onboarding-card-reflection" aria-hidden="true" style={appleDesign ? { opacity: reflectionOpacity } : { background: reflection, opacity: reflectionOpacity }}>
      {appleDesign && <motion.div className="onboarding-card-highlight" style={{ x: reflectionX, y: reflectionY }} />}
    </motion.div>
    <div className="onboarding-card-content">
      {children ?? <>
      <div className="onboarding-identity" data-node-id="2941:16865">
        <img className="onboarding-avatar" src={ASSETS + "avatar.png"} alt="" draggable={false} data-node-id="2941:16866" />
        <h2 data-node-id="2941:16868">КрутойВолк75</h2>
      </div>
      <div className="onboarding-facts" data-node-id="2941:16869">
        <div className="onboarding-fact" data-node-id="2941:16870">
          <p data-node-id="2941:16871">ПОЛ И ВОЗРАСТ</p>
          <span className="onboarding-fact-empty" data-node-id="3087:31966">—</span>
        </div>
        <div className="onboarding-fact" data-node-id="2941:16873">
          <p data-node-id="2941:16874">ТВОИ ИНТЕРЕСЫ</p>
          <span className="onboarding-fact-empty" data-node-id="3087:31969">—</span>
        </div>
      </div>
      </>}
      <OnboardingCompletionBadge percent={completion}/>
    </div>
  </motion.article>;
}

export function OnboardingScreen({ onStart, onLater, runtimeChrome = false, appleDesign = false, active = true }: { active?:boolean; onStart?: () => void; onLater?: () => void; runtimeChrome?: boolean; appleDesign?: boolean } = {}) {
  const { device } = useMobileDevice();
  const scale = device.geometry.screen.width / 402;
  const viewport = useChatusViewport();
  const height = (runtimeChrome && viewport.native ? viewport.height : device.geometry.screen.height) / scale;
  const screen = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [settled, setSettled] = useState(!runtimeChrome || !!reducedMotion);
  useEffect(() => {
    const scene = screen.current?.closest<HTMLElement>('.flow-screen');
    if (!runtimeChrome || reducedMotion || !scene) { setSettled(true); return; }
    let frame = 0, stableFrames = 0, cancelled = false;
    const check = () => {
      if (cancelled) return;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(scene).transform);
      stableFrames = Math.abs(matrix.m41) < .5 && Math.abs(matrix.m11 - 1) < .001 ? stableFrames + 1 : 0;
      if (stableFrames >= 2) setSettled(true);
      else frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [runtimeChrome, reducedMotion]);
  const pressProps = appleDesign ? getPressProps(reducedMotion) : {};
  return <main className="onboarding-screen" ref={screen} aria-label="Давай познакомимся" data-apple-design={appleDesign || undefined} data-entry-settled={settled} data-node-id="2995:14601">
    <div className="onboarding-canvas" style={{ height, transform: `scale(${scale})` }}>
      <QuestionnaireGlow active={settled && active} />
      <header className="onboarding-intro" data-node-id="2941:16760">
        <h1 data-node-id="2941:16761"><FigmaDisplayLines text={" Давай \nпознакомимся"} /></h1>
        <p data-node-id="2941:16762">Расскажи о себе, это поможет быстрее подобрать собеседника</p>
      </header>
      {settled && <ProfileCard hint={active} appleDesign={appleDesign} />}
      <div className="onboarding-actions" data-node-id="2995:14618" style={{ top: height - 188 }}>
        <motion.button className="onboarding-primary" type="button" data-node-id="2995:14619" onClick={onStart} {...pressProps}>
          <span className="onboarding-primary-label">Заполнить анкету</span>
        </motion.button>
        <motion.button className="onboarding-later" type="button" data-node-id="2995:14620" onClick={onLater} style={{ color: '#fff' }} {...pressProps}>Позже</motion.button>
      </div>
      {!runtimeChrome && <div className="onboarding-source-status" aria-label="Статус устройства" data-node-id="2938:16638">
        <time>9:41</time>
        <img className="onboarding-cellular" src={ASSETS + "cellular.svg"} alt="" draggable={false} />
        <img className="onboarding-wifi" src={ASSETS + "wifi.svg"} alt="" draggable={false} />
        <img className="onboarding-battery" src={ASSETS + "battery.svg"} alt="" draggable={false} />
        <div className="onboarding-island"><img src={ASSETS + "island.png"} alt="" draggable={false} /></div>
      </div>}
      <div className="onboarding-bottom-glass" style={{ top: height - 50 }} aria-hidden="true" data-node-id="2938:16288">{!runtimeChrome && <span />}</div>
    </div>
  </main>;
}
