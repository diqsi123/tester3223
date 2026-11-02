import { useEffect, useRef, useState } from "react";
import { Carousel, MobileScroll, useKeyboard, useMobileDevice } from "../../mobile";
import { BottomSheet } from "../AppSheet";
import { mountSplash } from "./splash";
import {useChatusViewport} from '../ChatusViewport';
import { FigmaDisplayLines } from "../Typography/FigmaDisplayLines";
import "./launch.css";

const ASSETS = "/assets/welcome/";
const AVATARS = ["avatar-far-left.png", "avatar-left.png", "avatar-center.png", "avatar-right.png", "avatar-far-right.png"];
const welcomeAvatar=(name:string)=>({src:ASSETS+name,srcSet:`${ASSETS+name.replace('.png','-mobile.webp')} 1024w, ${ASSETS+name} 2000w`,sizes:'320px'});
const HOLD_MS = 1100;
const SHIFT_MS = 1450;
const CYCLE_MS = HOLD_MS + SHIFT_MS;
const SLOT_X = [-213.33, -38.8, 201, 440.8, 615.4, 790];
const SLOT_SIZE = [151.349, 171.005, 283.697, 171.005, 151.349, 151.349];
const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress;
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function AvatarRoulette({ active }: { active: boolean }) {
  const images = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, elapsed = 0, previous = 0;
    const frozen = new URLSearchParams(location.search).get("motion") === "off";
    const draw = () => {
      const cycle = Math.floor(elapsed / CYCLE_MS);
      const phase = Math.max(0, Math.min(1, (elapsed % CYCLE_MS - HOLD_MS) / SHIFT_MS));
      // One continuous glide: speed and acceleration reach zero at both ends.
      const progress = smoother(phase);
      images.current.forEach((node, index) => {
        if (!node) return;
        let from = (index - cycle % AVATARS.length + AVATARS.length) % AVATARS.length;
        // Recycling happens beyond the visible screen, never across the centre.
        if (from === 0 && progress > 0) from = 5;
        const to = from === 5 ? 4 : Math.max(0, from - 1);
        const x = lerp(SLOT_X[from], SLOT_X[to], progress);
        const size = lerp(SLOT_SIZE[from], SLOT_SIZE[to], progress);
        const y = 264.45 + lerp(from === 1 ? .33 : 0, to === 1 ? .33 : 0, progress);
        node.style.transform = `translate(${x - 141.8485}px,${y - 141.8485}px) scale(${size / 283.697})`;
      });
    };
    draw();
    function tick(now: number) {
      if (!active || media.matches || frozen || document.hidden) return;
      elapsed += previous ? Math.min(48, now - previous) : 0;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame); previous = 0;
      if (!document.hidden && active && !media.matches && !frozen) frame = requestAnimationFrame(tick);
      if (media.matches) { elapsed = 0; draw(); }
    }
    resume();
    document.addEventListener("visibilitychange", resume);
    media.addEventListener("change", resume);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", resume); media.removeEventListener("change", resume); };
  }, [active]);

  return <div className="welcome-illustration" aria-hidden="true" data-node-id="2913:9094">
    <div className="welcome-union"><img src={ASSETS + "illustration-union.svg"} alt="" draggable={false} /></div>
    <img className="welcome-reflection" src={ASSETS + "reflection.png"} alt="" draggable={false} />
    <Carousel className="welcome-avatar-carousel" contentClassName="welcome-avatar-track" draggingEnabled={false}>
      {AVATARS.map((src, index) => <div key={src} ref={node => { images.current[index] = node; }} className="welcome-avatar">
        <img {...welcomeAvatar(src)} alt="" draggable={false} />
      </div>)}
    </Carousel>
    <div className="welcome-focus-ring" data-node-id="2913:9110">
      <img className="welcome-ring" src={ASSETS + "ring.svg"} alt="" draggable={false} />
      <img className="welcome-ring-soft" src={ASSETS + "ring-soft.svg"} alt="" draggable={false} />
    </div>
  </div>;
}

export function Launch({ onEnter, replay = false, skipSplash = false, active = true }: { active?:boolean; onEnter: (method: "email" | "google" | "apple") => void; replay?: boolean; skipSplash?: boolean }) {
  const { device } = useMobileDevice();
  const keyboard = useKeyboard();
  const params = new URLSearchParams(location.search);
  const [ready, setReady] = useState(!replay && (skipSplash || params.get("screen") === "welcome"));
  const [settled, setSettled] = useState(!replay && (skipSplash || params.get("screen") === "welcome"));
  const [privacy, setPrivacy] = useState(false);
  const splash = useRef<HTMLDivElement>(null);
  const welcome = useRef<HTMLDivElement>(null);
  const scale = device.geometry.screen.width / 402;
  const viewport=useChatusViewport();
  const availableHeight=(viewport.native?viewport.height:device.geometry.screen.height-(device.platform==='android'?device.geometry.safeArea.bottom:0))/scale;
  const height=Math.max(650,availableHeight),heroScale=Math.min(1,(height-442)/432),headingTop=Math.min(448,height-426);

  useEffect(() => { document.title = "Chatus — начнём с привета"; }, []);
  useEffect(() => {
    if (settled) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    // Decode the original welcome artwork before reveal.
    const assets = [...AVATARS, "reflection.png", "mail.svg", "google.svg", "apple.svg", "ring.svg", "ring-soft.svg", "illustration-union.svg"];
    Promise.all(assets.map(src => {
      const image = new Image(); if(AVATARS.includes(src)){const source=welcomeAvatar(src);image.sizes=source.sizes;image.srcset=source.srcSet;} image.src = ASSETS + src;
      return image.decode().catch(() => undefined);
    })).then(() => {
      if (!cancelled && splash.current && welcome.current) {
        dispose = mountSplash(splash.current, welcome.current, () => {
          setReady(true);
          setSettled(true);
        });
      }
    });
    return () => { cancelled = true; dispose?.(); };
  }, [settled]);

  const content=(        <div className="welcome-canvas" style={{ height, transform: `scale(${scale})` }}>
          <div className="welcome-responsive-art" style={{transform:`scale(${heroScale})`}}><AvatarRoulette active={settled && active} /></div>
          <h1 className="welcome-heading" style={{top:headingTop}} data-node-id="2913:9512"><FigmaDisplayLines text={"НАЧНЁМ \nС ПРИВЕТА?"} /></h1>
          <div className="welcome-auth" style={{top:height-268}} data-node-id="2913:9075">
            <div className="welcome-buttons">
              <button className="welcome-email" onClick={() => enter("email")}><span className="welcome-email-warm" aria-hidden="true" /><img src={ASSETS + "mail.svg"} alt="" draggable={false} /><span className="welcome-email-label">Войти по почте</span></button>
              <div className="welcome-providers">
                <button onClick={() => enter("google")} aria-label="Войти с Google"><img src={ASSETS + "google.svg"} alt="" draggable={false} /></button>
                <button onClick={() => enter("apple")} aria-label="Войти с Apple"><img src={ASSETS + "apple.svg"} alt="" draggable={false} /></button>
              </div>
            </div>
            <p className="welcome-terms">Продолжая, принимаешь правила сервиса и <button onClick={() => setPrivacy(true)}>политику конфиденциальности</button></p>
          </div>
          <div className="welcome-bottom-glass" style={{top:height-50}} aria-hidden="true" data-node-id="2913:9071" />
        </div>);

  const enter = (method: "email" | "google" | "apple") => { keyboard.hide(); onEnter(method); };
  return <>
    <main className={`launch-root ${ready ? "is-ready" : ""} ${settled ? "is-settled" : ""}`} aria-label="Добро пожаловать в Chatus">
      {!settled && <div className="launch-splash" ref={splash} aria-label="Загрузка Chatus" />}
      <div className="welcome-screen" ref={welcome} inert={!ready} aria-hidden={!ready}>
        {viewport.native&&availableHeight<650?<MobileScroll className="welcome-small-scroll"><div style={{height:height*scale}}>{content}</div></MobileScroll>:content}
      </div>
    </main>
    <BottomSheet open={privacy} onOpenChange={setPrivacy} title="Политика конфиденциальности" description="Документ будет доступен перед запуском сервиса." snap={0.3}>
      <div className="welcome-document"><button onClick={() => setPrivacy(false)}>Понятно</button></div>
    </BottomSheet>
  </>;
}
