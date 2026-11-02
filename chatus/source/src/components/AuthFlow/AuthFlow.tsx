import {storeQuestionnaire} from './questionnaire-storage';
import {packAuthForm,entryKeyboardLayout} from './form-packing';
import {AgeWheelDigits} from './AgeWheelDigits';
import {useBioInput} from '../../ui/use-bio-input';
import {BottomSheet} from '../AppSheet';
import { memo,createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { animate, AnimatePresence, motion, useMotionValue, useTransform, useReducedMotion } from "motion/react";
import { FlowStack, KeyboardInput, KeyboardTextarea, MobileScroll, useFlow, useKeyboard, useMobileDevice, useScreenPortal, type FlowScreen } from "../../mobile";
import { Launch } from "../Launch/Launch";
import { OnboardingScreen, ProfileCard } from "../../isolated-onboarding/OnboardingScreen";
import { FigmaDisplayLines } from "../Typography/FigmaDisplayLines";
import { AVATAR_BACKGROUNDS, INTERESTS, SAMPLE_INTERESTS, ageRange, avatarBackground } from './questionnaire-data';
import { QuestionnaireGlow } from './QuestionnaireGlow';
import { getPressProps } from '../../ui/press';
import {nativeTextPlane} from '../../ui/native-text-plane';
import {bioValidation,bioLineMetrics} from './onboarding-bio';
import {avatarImage} from './avatar-image';
import { UI_MOTION, STILL } from '../../ui/motion';
import "../../isolated-onboarding/onboarding.css";
import "./auth-flow.css";

export type AuthRoute = "welcome" | "auth-error" | "offline" | "email" | "email-input" | "email-filled" | "code" | "code-input" | "code-error" | "code-success" | "code-resend" | "code-resent" | "apple" | "google" | "intro" | "gender" | "gender-selected" | "age" | "age-under18" | "nickname" | "nickname-input" | "nickname-invalid" | "nickname-taken" | "nickname-valid" | "avatar" | "interests" | "interests-selected" | "bio" | "bio-input" | "bio-invalid" | "bio-filled" | "profile";
export const AUTH_PREVIEWS: [AuthRoute, string][] = [
  ["welcome", "Авторизация"], ["offline", "Нет соединения"], ["auth-error", "Ошибка входа"], ["apple", "Apple"], ["google", "Google"],
  ["email", "Почта"], ["email-input", "Почта — ввод"], ["email-filled", "Почта — заполнено"],
  ["code", "Код"], ["code-input", "Код — ввод"], ["code-error", "Код — ошибка"], ["code-success", "Код — успех"],
  ["code-resend", "Код — повторно"], ["code-resent", "Код — отправлен повторно"], ["intro", "Знакомство"],
  ["gender", "Пол"], ["gender-selected", "Пол — выбран"],
  ["age", "Возраст"], ["age-under18", "Возраст — до 18"], ["nickname", "Ник"], ["nickname-input", "Ник — ввод"],
  ["nickname-invalid", "Ник — символы"], ["nickname-taken", "Ник — занят"], ["nickname-valid", "Ник — свободен"],
  ["bio", "Био"], ["bio-input", "Био — ввод"], ["bio-invalid", "Био — больше 50 символов"], ["bio-filled", "Био — заполнено"], ["avatar", "Аватар"], ["interests", "Интересы"], ["interests-selected", "Интересы — выбраны"], ["profile", "Твой профиль"],
];
import {emptyCode,editCode,eraseCode} from './code-input';
const SAMPLE_EMAIL = "achimov1nikita@gmail.com";
const DEMO_CODE = "411111";
export type AuthScenario = "new" | "existing" | "provider-error";
type AuthState = { email: string; setEmail: (email: string) => void; gender: "male" | "female" | null; setGender: (gender: "male" | "female") => void; age: number; setAge: (age: number) => void; nickname: string; setNickname: (nickname: string) => void; character: number; setCharacter: (character: number) => void; background: number; setBackground: (background: number) => void; bio:string;setBio:(bio:string)=>void;interests: string[]; setInterests: (interests: string[]) => void; replay: boolean; scenario: AuthScenario; onLater: () => void; onConfirmed?: () => void };
import { useChatusKeyboardInsets as useKeyboardInsets, useChatusViewportLayout,useChatusKeyboardLayout } from '../ChatusViewport';
import '../../isolated-onboarding/apple-design-preview.css';

const AuthContext = createContext<AuthState | null>(null);
function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthFlow provider missing"); return value; }

function useGeometry() {
  const { device } = useMobileDevice();
  const scale = device.geometry.screen.width / 402;
  const viewport = useChatusViewportLayout();
  const height = ((viewport.native ? viewport.height : device.geometry.screen.height) - (!viewport.native && device.platform === "android" ? device.geometry.safeArea.bottom : 0)) / scale;
  return { device, scale, height };
}

function AuthCanvas({ children, className = "", header = true, node, scroll = false }: { children: ReactNode; className?: string; header?: boolean; node?: string; scroll?: boolean }) {
  const { scale, height } = useGeometry();
  // Keep each scene in full-screen coordinates while fixed headers change.
  const content = <div className="auth-canvas" data-has-header={header} style={{ height, transform: `scale(${scale})`, top: 0 }}>{children}</div>;
  return <main className={`auth-page ${className}`} data-node-id={node}>
    {scroll ? <MobileScroll className="auth-provider-scroll"><div style={{ height: height * scale }}>{content}</div></MobileScroll> : content}
  </main>;
}

function AuthHeader({ questionnaire = false, step = 1 }: { questionnaire?: boolean; step?: number }) {
  const flow = useFlow();
  const reduced = useReducedMotion();
  const { scale, device } = useGeometry();
  const back = () => { if (flow.canGoBack) flow.pop(); else flow.replace(route(questionnaire ? "intro" : "welcome")); };
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reduced?STILL:UI_MOTION.fade} className={`auth-header ${questionnaire ? "auth-header-questionnaire" : ""}`}
    style={{ transform: `scale(${scale})`, top: (questionnaire ? 68 : 65) * scale - device.geometry.safeArea.top }}>
    <button className="auth-back" onPointerDown={event => event.preventDefault()} onClick={back} aria-label="Назад"><img src="/assets/auth/back.svg" alt="" /></button>
    <h2>{questionnaire ? "Анкета" : "Авторизация"}</h2><div className="auth-header-spacer" />
    {questionnaire && <div className="auth-progress" aria-label={`Шаг ${step} из 7`}>{Array.from({ length: 7 }, (_, i) => <span key={i}><motion.i initial={false} animate={{ scaleX: i < step ? 1 : 0 }} transition={{ duration: reduced ? 0 : .48, ease: [.22, 1, .36, 1] }} /></span>)}</div>}
  </motion.div>;
}

function Legal({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <p className={`auth-legal ${compact ? "auth-legal-provider" : ""}`}>Продолжая, принимаешь правила сервиса и <button onClick={() => setOpen(true)}>политику конфиденциальности</button></p>
    <BottomSheet open={open} onOpenChange={setOpen} title="Политика конфиденциальности" description="Документ будет доступен перед запуском сервиса." snap={.3}>
      <div className="welcome-document"><button onClick={() => setOpen(false)}>Понятно</button></div>
    </BottomSheet>
  </>;
}

function AuthBottom({ label, onClick, numeric = false, occlusion = 0 }: { label: string; onClick: () => void; numeric?: boolean; occlusion?: number }) {
  const { isKeyboardVisible, bottomInset } = useKeyboardInsets();
  const viewport = useChatusViewportLayout();
  const { scale, height } = useGeometry();
  // Match the source keyboard state: action at492; hide the legal copy under the keyboard.
  const top = viewport.native && isKeyboardVisible ? height - bottomInset / scale - 72 : isKeyboardVisible && numeric ? height - 310 - 72 : height - 192;
  return <div className="auth-bottom" inert={occlusion>0} aria-hidden={occlusion>=1} style={{ top,opacity:1-occlusion }}>
    <button className="auth-ghost" onPointerDown={event => event.preventDefault()} onClick={onClick}>{label}</button>
    {!isKeyboardVisible && <Legal />}
  </div>;
}

function WelcomeRoute({ error = false }: { error?: boolean }) {
  const flow = useFlow(); const { replay } = useAuth();
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => { const check = () => setOffline(!navigator.onLine); window.addEventListener("offline", check); window.addEventListener("online", check); return () => { window.removeEventListener("offline", check); window.removeEventListener("online", check); }; }, []);
  if (offline) return <OfflineRoute />;
  return <><Launch active={flow.current.id === (error ? "auth-error" : "welcome")} replay={error ? false : replay} skipSplash={error} onEnter={method => flow.push(route(method))} />
    {error && <div className="auth-error-notification" role="alert"><img src="/assets/auth/alarm.svg" alt="" /><span><strong>Ошибка входа</strong><span>Не удалось войти. Попробуй ещё<br />раз или выбери другой способ</span></span></div>}
  </>;
}

function OfflineRoute() {
  const flow = useFlow();
  useEffect(() => { const online = () => flow.replace(route("welcome")); window.addEventListener("online", online); return () => window.removeEventListener("online", online); }, [flow]);
  return <AuthCanvas header={false} node="2933:16209">
    <button className="auth-offline-toast" onClick={() => { if (navigator.onLine) flow.replace(route("welcome")); }} aria-label="Повторить подключение">
      <img className="auth-offline-icon" src="/assets/auth/no-internet.svg" alt="" /><span><strong>Нет соединения</strong><span>Проверь подключение к интернету<br />и попробуй снова</span></span>
    </button>
    <img className="auth-offline-wordmark" src="/assets/auth/offline-wordmark.svg" alt="Chatus" />
    <img className="auth-offline-heart" src="/assets/auth/offline-heart.svg" alt="" />
  </AuthCanvas>;
}

/** DOM rectangles are painted pixels; scrollTop remains in the402px source plane. */
function revealAuthControl(scroll:HTMLElement,target:HTMLElement){
 const bounds=scroll.getBoundingClientRect(),paintScale=bounds.width/scroll.offsetWidth;
 const overflow=target.getBoundingClientRect().bottom-bounds.bottom;
 if(overflow>.1&&paintScale>0)scroll.scrollTop+=Math.ceil(overflow/paintScale);
}

function AuthFormRegion({children,top,bottom,contentHeight,focused,questionnaire=false,controlHeight=128}:{children:ReactNode;top:number;bottom:number;contentHeight:number;focused:boolean;questionnaire?:boolean;controlHeight?:number}){
 const root=useRef<HTMLDivElement>(null),viewport=useChatusViewportLayout(),{isKeyboardVisible}=useChatusKeyboardLayout();
 const room=Math.max(0,bottom-top-16);
 const packed=packAuthForm(questionnaire,room,controlHeight,viewport.native&&isKeyboardVisible);
 useLayoutEffect(()=>{
  if(!viewport.native||!isKeyboardVisible||!focused)return;
  const scroll=root.current?.querySelector<HTMLElement>('.mobile-scroll'),target=root.current?.querySelector<HTMLElement>('[data-auth-focus-region]');
  if(!scroll||!target)return;
  revealAuthControl(scroll,target);
 },[viewport.native,isKeyboardVisible,focused,bottom,contentHeight,packed.cut]);
 const style={height:contentHeight-top-packed.cut,'--auth-form-heading-top':packed.headingTop+'px','--auth-form-control-top':packed.controlTop+'px'} as CSSProperties;
 return <div ref={root} className="auth-form-scroll-region" style={{top,height:room}}><MobileScroll className="auth-form-scroll"><div className="auth-form-content" style={style}>{children}</div></MobileScroll></div>;
}

/** Keep native keyboard pixel updates out of the text/code scene. */
function AuthEntryLayout({children,focused,error=false,numeric=false,label,onAlternative}:{children:ReactNode;focused:boolean;error?:boolean;numeric?:boolean;label:string;onAlternative:()=>void}){
 const {height,scale}=useGeometry(),{isKeyboardVisible,bottomInset}=useKeyboardInsets(),viewport=useChatusViewportLayout();
 const {top,bottom,occlusion}=entryKeyboardLayout(height,bottomInset,scale,isKeyboardVisible,viewport.native);
 return <><AuthFormRegion top={top} bottom={bottom} contentHeight={(error?483:455)-(125-top)} focused={focused} controlHeight={error?156:128}>{children}</AuthFormRegion><AuthBottom numeric={numeric} occlusion={occlusion} label={label} onClick={onAlternative}/></>;
}
function AuthQuestionnaireLayout({children,focused,contentHeight,controlHeight,disabled,onContinue,className=''}:{children:ReactNode;focused:boolean;contentHeight:number;controlHeight:number;disabled:boolean;onContinue:()=>void;className?:string}){
 const {height,scale}=useGeometry(),{isKeyboardVisible,bottomInset}=useKeyboardInsets(),reduced=useReducedMotion();
 const actionTop=isKeyboardVisible?height-bottomInset/scale-72:height-116;
 return <><AuthFormRegion questionnaire top={146} bottom={actionTop} contentHeight={contentHeight} focused={focused} controlHeight={controlHeight}>{children}</AuthFormRegion><motion.button {...getPressProps(reduced)} className={`auth-primary auth-questionnaire-continue ${className}`} onPointerDown={event=>event.preventDefault()} style={{top:actionTop}} disabled={disabled} onClick={onContinue}>Продолжить</motion.button></>;
}

function EmailRoute({ preview }: { preview: AuthRoute }) {
  const auth = useAuth(); const flow = useFlow(); const keyboard = useKeyboard();
  const [email,setEmail]=useState(auth.email);
  const input = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const [focused, setFocused] = useState(false); const [error, setError] = useState(false);
  useEffect(() => { if (preview === "email-input" || preview === "email-filled") input.current?.focus({ preventScroll: true }); }, [preview]);
  useEffect(() => { if (flow.current.id === preview) submitting.current = false; }, [flow.current.id, preview]);
  const submit = () => { if (submitting.current || flow.current.id !== preview) return; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(true); input.current?.focus({ preventScroll: true }); return; } submitting.current = true; auth.setEmail(email.trim()); flow.push(route("code")); };
  const floating = focused || Boolean(email);
  return <AuthCanvas node="2913:13512">
    <AuthEntryLayout focused={focused} error={error} label="Другой способ входа" onAlternative={() => flow.canGoBack ? flow.pop() : flow.replace(route("welcome"))}>
    <div className="auth-heading"><h1><FigmaDisplayLines text={"   Войдите, \nдля общения"} /></h1><p>Пришлём на твою<br />почту код из шести цифр</p></div>
    <div className="auth-email-controls" data-auth-focus-region>
      <label className={`auth-email-field ${floating ? "is-floating" : ""} ${focused ? "is-focused" : ""} ${error ? "is-error" : ""}`}>
        <span>Введи свою почту</span>
        <KeyboardInput ref={input} value={email} aria-label="Введи свою почту" aria-invalid={error} autoComplete="email" type="email" inputMode="email" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          onFocus={() => setFocused(true)} onBlur={event => { setFocused(false); auth.setEmail(email.trim()); if (!(event.relatedTarget instanceof HTMLInputElement)) keyboard.hide(); }}
          onChange={event => { setEmail(event.target.value); setError(false); }} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) { event.preventDefault(); submit(); } }} />
      </label>
      {error && <p className="auth-field-error" role="alert">Проверь адрес почты</p>}
      <button className="auth-primary" onPointerDown={event=>event.preventDefault()} onClick={submit}>Получить код</button>
    </div>
    </AuthEntryLayout>
  </AuthCanvas>;
}

function CodeRoute({ preview }: { preview: AuthRoute }) {
  const auth = useAuth(); const flow = useFlow(); const keyboard = useKeyboard();
  const reduced = useReducedMotion();
  const [focused,setFocused]=useState(false);
  const validation = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(validation.current), []);
  const previewSuccess = preview === "code-success";
  const [digits, setDigits] = useState(() => preview === "code-error" || previewSuccess ? DEMO_CODE.split("") : preview === "code-input" ? ["4",...emptyCode().slice(1)] : emptyCode());
  const [status, setStatus] = useState<"idle" | "error" | "success">(previewSuccess ? "success" : preview === "code-error" ? "error" : "idle");
  const [deadline, setDeadline] = useState(() => Date.now() + (preview === "code-resend" || preview === "code-resent" ? 0 : 59000));
  const [remaining, setRemaining] = useState(() => preview === "code-resend" || preview === "code-resent" ? 0 : 59);
  const [toast, setToast] = useState(preview === "code-resent");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const activeDigit = useRef(0);
  const current = useRef(false); current.current = flow.current.id === preview;
  useEffect(() => { if(flow.current.id!==preview)return; const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))); update(); const timer = window.setInterval(update, 250); return () => clearInterval(timer); }, [deadline,flow.current.id,preview]);
  useEffect(() => { if (["code-input", "code-error", "code-success"].includes(preview)) {const empty=digits.findIndex(digit=>!digit);refs.current[empty<0?5:empty]?.focus({ preventScroll: true });} }, [preview]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(false), 2500); return () => clearTimeout(timer); }, [toast]);
  const completion = useRef({ flow, keyboard, auth }); completion.current = { flow, keyboard, auth };
  useEffect(() => {
    if (status !== "success" || previewSuccess) return;
    let navigation: number | undefined;
    const timer = window.setTimeout(() => {
      if (!current.current) return;
      completion.current.keyboard.hide();
      navigation = window.setTimeout(() => {
        if (!current.current) return;
        const { flow: latestFlow } = completion.current;
        latestFlow.replace(route("intro"));
      }, 280);
    }, 900);
    return () => { clearTimeout(timer); clearTimeout(navigation); };
  }, [status, previewSuccess, auth.scenario]);
  function update(value: string, index: number) {
    const {digits:next,focus}=editCode(digits,value,index);
    clearTimeout(validation.current);
    setDigits(next); setStatus("idle");
    if (next.every(Boolean)) validation.current = window.setTimeout(() => {
      if (current.current) setStatus(next.join("") === DEMO_CODE ? "success" : "error");
    }, reduced ? 0 : 160);
    refs.current[focus]?.focus({ preventScroll: true });
  }
  function resend() { if (remaining) return; clearTimeout(validation.current); keyboard.hide(); setDigits(emptyCode()); setStatus("idle"); setDeadline(Date.now() + 59000); setToast(true); }
  return <AuthCanvas node={status === "success" ? "2941:17108" : status === "error" ? "2913:15639" : "2913:15148"}>
    <AuthEntryLayout focused={focused} numeric label="Изменить почту" onAlternative={() => flow.canGoBack ? flow.pop() : flow.replace(route("email"))}>
    <div className="auth-heading"><h1><FigmaDisplayLines text={"  введи Код \nиз письма"} /></h1><p>Отправили по адресу:<br />{auth.email || SAMPLE_EMAIL}</p></div>
    <div className={`auth-code-controls is-${status}`} data-auth-focus-region>
      <div className="auth-code-digits" role="group" aria-label="Код из шести цифр">
        {Array.from({ length: 6 }, (_, index) => <div className={`auth-code-cell ${digits[index] ? "has-digit" : ""}`} key={index}><KeyboardInput ref={node => { refs.current[index] = node; }}
          value={digits[index] || ""} inputMode="numeric" type="text" autoCorrect="off" autoCapitalize="off" spellCheck={false} autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Цифра ${index + 1}`} aria-invalid={status === "error"} placeholder="—"
          onChange={event => update(event.target.value, index)}
          onFocus={event => { setFocused(true); activeDigit.current = index; event.currentTarget.select(); }}
          onPaste={event => { event.preventDefault(); update(event.clipboardData.getData("text"), index); }}
          onBlur={event => { if (!(event.relatedTarget instanceof HTMLInputElement)) {setFocused(false);keyboard.hide();} }}
          onKeyDown={event => {
            if (event.key === "Backspace") { event.preventDefault(); clearTimeout(validation.current); const next=eraseCode(digits,index); setDigits(next.digits); setStatus("idle"); refs.current[next.focus]?.focus({ preventScroll: true }); }
            if (event.key === "ArrowLeft") refs.current[Math.max(0, index - 1)]?.focus({ preventScroll: true });
            if (event.key === "ArrowRight") refs.current[Math.min(5, index + 1)]?.focus({ preventScroll: true });
            if (event.key === "Enter") event.preventDefault();
          }} /><span className="auth-code-value" aria-hidden="true"><AnimatePresence initial={false}>{digits[index] && <motion.span key={digits[index]} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduced ? 0 : .18, ease: [.22, 1, .36, 1] }}>{digits[index]}</motion.span>}</AnimatePresence></span></div>)}
      </div>
      <button className="auth-ghost auth-resend" disabled={remaining > 0} onClick={resend}>{remaining ? `Отправить повторно через 0:${String(remaining).padStart(2, "0")}` : "Отправить повторно"}</button>
    </div>
    </AuthEntryLayout>
    <span className="auth-sr-only" role="status">{status === "error" ? "Неверный код. Попробуй ещё раз." : status === "success" ? "Код подтверждён" : ""}</span>
    {toast && <div className="auth-resent-toast" role="status"><span aria-hidden="true">✓</span>Отправили код повторно</div>}
    <NumberKeyboard active={current.current} onDigit={digit => update(digit, activeDigit.current)} onDelete={() => {
      clearTimeout(validation.current);
      const next=eraseCode(digits,activeDigit.current);
      setDigits(next.digits); setStatus("idle"); refs.current[next.focus]?.focus({ preventScroll: true });
    }} />
  </AuthCanvas>;
}

function NumberKeyboard({ active, onDigit, onDelete }: { active: boolean; onDigit: (digit: string) => void; onDelete: () => void }) {
  const keyboard = useKeyboard(); const { device, scale } = useGeometry();
  const { screenRef } = useScreenPortal();
  if (device.platform !== "ios" || !screenRef.current) return null;
  const labels = ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];
  return createPortal(<AnimatePresence>{active && keyboard.visible && <motion.div className="auth-number-keyboard"
    initial={{ y: 310 * scale }} animate={{ y: keyboard.dragOffset }} exit={{ y: 310 * scale }} transition={{ duration: .26, ease: [.2, .8, .2, 1] }}
    style={{ height: 310 * scale }} aria-label="Цифровая клавиатура" onPointerDown={event => event.preventDefault()}>
    <div className="auth-number-canvas" style={{ transform: `scale(${scale})` }}>
      <div className="auth-number-grid">{Array.from({ length: 9 }, (_, i) => <button key={i} onClick={() => onDigit(String(i + 1))} aria-label={`Ввести ${i + 1}`}><span>{i + 1}</span><small>{labels[i]}</small></button>)}
        <button className="auth-number-symbols" onClick={() => keyboard.hide()} aria-label="Скрыть клавиатуру">+＊#</button>
        <button onClick={() => onDigit("0")} aria-label="Ввести 0"><span>0</span></button>
        <button className="auth-number-delete" onClick={onDelete} aria-label="Удалить цифру"><img src="/assets/auth/delete.svg" alt="" /></button>
      </div>
    </div>
  </motion.div>}</AnimatePresence>, screenRef.current);
}

function ProviderRoute({ provider }: { provider: "apple" | "google" }) {
  const auth = useAuth(); const flow = useFlow(); const keyboard = useKeyboard();
  const [value, setValue] = useState(""); const [step, setStep] = useState<"identity" | "confirm">("identity");
  const apple = provider === "apple";
  const viewport=useChatusViewportLayout(),textPlane=nativeTextPlane(17,viewport.native,viewport.zoom);
  const inputStyle:CSSProperties|undefined=viewport.native?{position:'absolute',inset:0,width:`calc(100% / ${textPlane.scale})`,height:`calc(100% / ${textPlane.scale})`,padding:`0 ${16/textPlane.scale}px`,border:0,borderRadius:0,boxShadow:'none',fontSize:textPlane.fontSize,transform:`scale(${textPlane.scale})`,transformOrigin:'0 0'}:undefined;
  const complete = () => { keyboard.hide(); auth.setEmail(value.trim() || SAMPLE_EMAIL); flow.replace(route(auth.scenario === "provider-error" ? "auth-error" : "intro")); };
  return <AuthCanvas scroll header={false} className={`auth-provider auth-provider-${provider}`} node={apple ? "2913:9930" : "2913:9735"}>
    {apple ? <><header className="provider-apple-header"><strong>Аккаунт Apple</strong><button onClick={() => flow.canGoBack ? flow.pop() : flow.replace(route("welcome"))} aria-label="Закрыть вход Apple">⌄</button></header>
      <div className="provider-app-icon"><img src="/assets/chatus/diamond.svg" alt="" /></div>
      <p className="provider-apple-intro">Использовать Аккаунт Apple для входа<br />в приложение «TikTok»</p></> : <>
      <div className="provider-google-icon"><img src="/assets/chatus/diamond.svg" alt="" /></div><h1>Вход</h1><p className="provider-google-intro">Переход в приложение <strong>"TikTok"</strong></p>
    </>}
    <label className="provider-field"><span className="auth-sr-only">{step === "identity" ? "Почта или телефон" : "Пароль"}</span><KeyboardInput value={value} style={inputStyle} enterKeyHint="go" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off" type={step === "confirm" ? "password" : "text"} placeholder={step === "confirm" ? "Пароль" : apple ? "E-mail или номер телефона" : "Телефон или электронный адрес"}
      onChange={event => setValue(event.target.value)} onBlur={event => { if (!(event.relatedTarget instanceof HTMLInputElement)) keyboard.hide(); }}
      onKeyDown={event => { if (event.key === "Enter" && value && !event.nativeEvent.isComposing && event.nativeEvent.keyCode!==229) { event.preventDefault(); complete(); } }} /></label>
    {apple ? <><div className="provider-apple-copy"><span aria-hidden="true">♟</span><p>При настройке функции «Вход с Apple» информация о Вашем взаимодействии с Apple и с этим устройством может использоваться компанией Apple для предотвращения мошенничества. <button onClick={() => setStep("confirm")}>Как осуществляется управление данными…</button></p></div>
      <div className="provider-apple-actions"><button disabled={!value.trim()} onPointerDown={event => event.preventDefault()} onClick={complete}>Продолжить</button><button onPointerDown={event => event.preventDefault()} onClick={complete}>♟ Войти с ключом входа</button></div><p className="provider-passkey-note">Требуется устройство с iOS 17<br />или новее.</p>
      <footer>© Apple Inc., 2026 г. Все права защищены.<br />Политика конфиденциальности　|　Использование cookies</footer></> : <>
      <button className="provider-forgot" onClick={() => setStep("identity")}>Забыли адрес электронной почты?</button>
      <p className="provider-google-copy">Прежде чем начать работу с приложением "TikTok", вы можете ознакомиться с его <strong>политикой конфиденциальности и условиями использования.</strong></p>
      <div className="provider-google-actions"><button onClick={() => setStep("identity")}>Создать аккаунт</button><button disabled={!value.trim()} onPointerDown={event => event.preventDefault()} onClick={complete}>Далее</button></div>
      <button className="provider-language" onClick={() => flow.canGoBack ? flow.pop() : flow.replace(route("welcome"))}>Русский　⌄</button><footer><span>Справка</span><span>Конфиденциальность</span><span>Условия</span></footer>
    </>}
  </AuthCanvas>;
}

function IntroRoute() { const flow = useFlow(); const auth = useAuth(); return <OnboardingScreen active={flow.current.id === "intro"} appleDesign runtimeChrome onStart={() => flow.push(route("gender"))} onLater={auth.onLater} />; }

function GenderRoute() {
  const auth = useAuth(); const flow = useFlow(); const {height} = useGeometry();
  const reduced = useReducedMotion();
  return <AuthCanvas node={auth.gender ? "2952:25695" : "2952:25558"}>
    <div className="auth-gender-heading"><h1>ТВОЙ ПОЛ?</h1><p>Так мы точнее подберём твоих<br />собеседников</p></div>
    <div className="auth-gender-cards" role="group" aria-label="Твой пол">
      {(["male", "female"] as const).map(gender => <button key={gender} className={`auth-gender-card ${gender} ${auth.gender === gender ? "is-selected" : ""}`}
        aria-pressed={auth.gender === gender} onClick={() => { auth.setGender(gender); }}>
        <span className="auth-gender-glow" aria-hidden="true" />
        <span className="auth-gender-selection" aria-hidden="true" />
        <img src={`/assets/auth/gender-${gender}.png`} alt="" draggable={false} />
        <span className="auth-gender-label">{gender === "male" ? "Мужской" : "Женский"}</span>
        <span className="auth-gender-check" aria-hidden="true"><motion.svg width="12" height="12" viewBox="0 0 12 12" initial={false} animate={{ opacity: auth.gender === gender ? 1 : 0, scale: auth.gender === gender ? 1 : .8 }} transition={{ duration: reduced ? 0 : .24 }}><motion.path d="M2 6l2.5 2.5L10 3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: auth.gender === gender ? 1 : 0 }} transition={{ duration: reduced ? 0 : .24 }} /></motion.svg></span>
      </button>)}
    </div>
    <motion.button {...getPressProps(reduced)} className="auth-primary auth-gender-continue" style={{top:height-116}} disabled={!auth.gender} onClick={() => flow.push(route("age"))}>Продолжить</motion.button>
  </AuthCanvas>;
}

function AgeRoute() {
  const auth = useAuth(); const flow = useFlow(); const { height } = useGeometry();
  const reduced = useReducedMotion();
  const position = useMotionValue(auth.age);
  const drag = useRef<{ pointerId:number; scale:number; y: number; value: number; lastY: number; lastTime: number; velocity: number } | null>(null);
  const animation = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => () => animation.current?.stop(), []);
  function settle(target: number) {
    const next = Math.max(14, Math.min(99, Math.round(target))); auth.setAge(next);
    animation.current?.stop();
    if (reduced) position.set(next); else animation.current = animate(position, next, { type: "spring", stiffness: 260, damping: 30 });
  }
  return <AuthCanvas className="auth-age-page" node="2952:25964">
    <div className="auth-gender-heading"><h1>ТВОЙ ВОЗРАСТ?</h1><p>Подберём собеседников<br />близкого возраста</p></div>
    <div className="auth-age-highlight" aria-hidden="true"><span>Лет</span></div>
    <div className="auth-age-wheel" role="spinbutton" aria-label="Возраст" aria-valuemin={14} aria-valuemax={99} aria-valuenow={auth.age} tabIndex={0} data-scroll-drag="ignore"
      onKeyDown={event => { if (["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) { event.preventDefault(); settle(event.key === "Home" ? 14 : event.key === "End" ? 99 : auth.age + (event.key === "ArrowUp" ? -1 : 1)); } }}
      onWheel={event => { event.stopPropagation(); settle(auth.age + Math.sign(event.deltaY)); }}
      onPointerDown={event => { if (event.button !== 0 || drag.current) return; animation.current?.stop(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { pointerId:event.pointerId, scale:event.currentTarget.getBoundingClientRect().height/346, y: event.clientY, value: position.get(), lastY: event.clientY, lastTime: performance.now(), velocity: 0 }; }}
      onPointerMove={event => { const d = drag.current; if (!d || d.pointerId!==event.pointerId) return; const now = performance.now(); d.velocity = Math.max(-3, Math.min(3, (event.clientY - d.lastY) / Math.max(1, now - d.lastTime))); d.lastY = event.clientY; d.lastTime = now; position.set(Math.max(14, Math.min(99, d.value - (event.clientY - d.y) / d.scale / 61))); }}
      onPointerUp={event => { const d = drag.current; if (!d || d.pointerId!==event.pointerId) return; drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); const moved = Math.abs(event.clientY - d.y) > 5; settle(moved ? position.get() - (performance.now() - d.lastTime < 80 ? d.velocity : 0) * 110 / d.scale / 61 : position.get() + Math.round((event.clientY - event.currentTarget.getBoundingClientRect().top) / d.scale / 61 - 173 / 61)); }}
      onPointerCancel={event => { if(drag.current?.pointerId!==event.pointerId)return;drag.current = null; settle(position.get()); }}>
      <AgeWheelDigits position={position}/>
      <div className="auth-age-fade top" /><div className="auth-age-fade bottom" />
    </div>
    {auth.age < 18 && <p className="auth-age-warning" style={{ top: height - 140 }} role="status">В приложение можно с 18 лет</p>}
    <motion.button {...getPressProps(reduced)} className="auth-primary auth-questionnaire-continue" onPointerDown={event => event.preventDefault()} style={{ top: height - 116 }} disabled={auth.age < 18} onClick={() => flow.push(route("nickname"))}>Продолжить</motion.button>
  </AuthCanvas>;
}

type NickStatus = "empty" | "checking" | "invalid" | "length" | "taken" | "valid";
function NicknameRoute({ preview }: { preview: AuthRoute }) {
  const auth = useAuth(); const flow = useFlow(); const keyboard = useKeyboard();
  const reduced = useReducedMotion();
  const [nickname,setNickname]=useState(auth.nickname);
  const [swap, setSwap] = useState<{ previous: string; next: string; id: number } | null>(null);
  const swapId = useRef(0);
  const input = useRef<HTMLInputElement>(null); const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<NickStatus>(preview === "nickname-valid" ? "valid" : preview === "nickname-taken" ? "taken" : preview === "nickname-invalid" ? "invalid" : "empty");
  useEffect(() => { if (preview === "nickname-input" || preview === "nickname-invalid") input.current?.focus({ preventScroll: true }); }, [preview]);
  useEffect(() => {
    if (!nickname) { setStatus("empty"); return; }
    if (!/^[\p{L}\p{N}]+$/u.test(nickname)) { setStatus("invalid"); return; }
    if (nickname.length < 3 || nickname.length > 20) { setStatus("length"); return; }
    setStatus("checking");
    const timer = window.setTimeout(() => setStatus(["педик41см", "admin", "chatus", "test"].includes(nickname.toLowerCase()) ? "taken" : "valid"), 450);
    return () => clearTimeout(timer);
  }, [nickname]);
  const error = ["invalid", "length", "taken"].includes(status);
  const fieldError = status === "invalid" || status === "length";
  const caption = status === "invalid" ? "Можно только буквы и цифры" : status === "taken" ? "Ник занят" : status === "valid" ? "Ник свободен" : status === "checking" ? "Проверяем ник…" : "3–20 символов, без пробелов";
  function complete() { if (status !== "valid" || flow.current.id !== preview) return; auth.setNickname(nickname); keyboard.hide(); flow.push(route("bio")); }
  function randomNickname() {
    const words = ["ТихийКосмос", "ЛунныйКот", "ЛисНаСвязи", "ПриветМир"];
    let next = words[Math.floor(Math.random() * words.length)] + Math.floor(Math.random() * 100);
    if (next === nickname) next = words[(words.indexOf(next.replace(/\d+$/, "")) + 1) % words.length] + Math.floor(Math.random() * 100);
    if (!reduced) setSwap({ previous: nickname, next, id: ++swapId.current });
    setNickname(next);
  }
  return <AuthCanvas node={status === "valid" ? "2965:26973" : status === "taken" ? "2965:27222" : error ? "2965:26808" : "2952:26279"}>
    <AuthQuestionnaireLayout contentHeight={421} focused={focused} controlHeight={80} disabled={status!=="valid"} onContinue={complete}>
    <div className="auth-gender-heading"><h1>ТВОЙ НИК?</h1><p>Его увидят твои собеседники.<br />Имя указывать не нужно</p></div>
    <div className={`auth-nickname-controls is-${status}`} data-auth-focus-region>
      <label className={`auth-nickname-field ${focused || nickname ? "is-floating" : ""} ${focused ? "is-focused" : ""} ${fieldError ? "is-error" : ""} ${swap ? "is-swapping" : ""}`}>
        <span>Никнейм</span>
        <KeyboardInput ref={input} aria-label="Никнейм" aria-invalid={error} aria-describedby="nickname-caption" value={nickname} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          onChange={event => { swapId.current++;setSwap(null); setNickname(event.target.value); }} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); auth.setNickname(nickname); keyboard.hide(); }}
          onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) { event.preventDefault(); complete(); } }} />
        {swap && <div className="auth-nickname-swap" aria-hidden="true"><AnimatePresence>
          <motion.span key={swap.previous} initial={{ y: 0 }} animate={{ y: -22 }} exit={{y:-22}} transition={UI_MOTION.surface}>{swap.previous}</motion.span>
          <motion.span key={swap.next} initial={{ y: 22 }} animate={{ y: 0 }} exit={{y:-22}} transition={UI_MOTION.surface} onAnimationComplete={() => {
            setSwap(current => current?.id === swap.id ? null : current);
            if (swapId.current===swap.id && document.activeElement === input.current) input.current?.setSelectionRange(swap.next.length, swap.next.length);
          }}>{swap.next}</motion.span></AnimatePresence>
        </div>}
      </label>
      <button className="auth-nickname-random" aria-label="Случайный ник" onPointerDown={event => event.preventDefault()} onClick={randomNickname}><img src="/assets/auth/dice.svg" alt="" /></button>
      <p className="auth-nickname-caption" id="nickname-caption" role="status">
        {(status === "checking" || status === "valid" || status === "taken") && <span className="auth-nickname-caption-icon" aria-hidden="true">
          {status === "checking" ? <i className="auth-nickname-checking" /> : status === "valid" ? <img src="/assets/auth/nickname-check-source.svg" alt="" /> : <span className="auth-nickname-unavailable">×</span>}
        </span>}
        <span className="auth-nickname-caption-text">{caption}</span>
      </p>
    </div>
    </AuthQuestionnaireLayout>
  </AuthCanvas>;
}


function BioRoute({preview}:{preview:AuthRoute}){
  const auth=useAuth(),flow=useFlow(),keyboard=useKeyboard(),reduced=useReducedMotion();
  const viewport=useChatusViewportLayout();
  const {fontSize,scale:textScale}=nativeTextPlane(15,viewport.native,viewport.zoom);
  const [value,setValue]=useState(auth.bio),[focused,setFocused]=useState(false),[metrics,setMetrics]=useState(()=>bioLineMetrics(0,1));
  const form=useRef<HTMLDivElement>(null),mirror=useRef<HTMLDivElement>(null),draft=useRef(value),measured=useRef(metrics),measure=useRef<()=>void>(()=>{});
  draft.current=value;
  const bioInput=useBioInput(value,setValue);
  const validation=bioValidation(value),state={...validation,tooLong:!bioInput.isComposing&&validation.tooLong,valid:!bioInput.isComposing&&validation.valid};
  const floating=focused||Boolean(value),outlined=focused||state.tooLong;
  const textWidth=outlined?329:330;
  measure.current=()=>{const node=mirror.current;if(!node)return;const next=bioLineMetrics(node.offsetHeight,textScale);if(next.lines!==measured.current.lines){measured.current=next;setMetrics(next);}};
  useLayoutEffect(()=>measure.current(),[value,textScale,textWidth]);
  useLayoutEffect(()=>{
    const node=mirror.current;if(!node)return;let disposed=false;const update=()=>{if(!disposed)measure.current();},observer=new ResizeObserver(update);observer.observe(node);document.fonts.addEventListener('loadingdone',update);void document.fonts.ready.then(update);
    return()=>{disposed=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',update);};
  },[]);
  useEffect(()=>{if(preview==='bio-input'||preview==='bio-invalid')form.current?.querySelector('textarea')?.focus({preventScroll:true});},[preview]);
  useEffect(()=>()=>auth.setBio(draft.current),[auth.setBio]);
  const complete=()=>{if(!state.valid||bioInput.composing.current||flow.current.id!==preview)return;draft.current=value.trim();setValue(draft.current);auth.setBio(draft.current);keyboard.hide();flow.push(route('avatar'));};
  return <AuthCanvas className="auth-questionnaire-new auth-bio-page" node={state.tooLong?'4902:107868':focused?'4902:107827':value?'4902:107918':'4902:107787'}>
    <AuthQuestionnaireLayout contentHeight={342+metrics.height} focused={focused} controlHeight={metrics.height+24} disabled={!state.valid} onContinue={complete} className="auth-bio-continue">
    <div className="auth-gender-heading"><h1><FigmaDisplayLines text="Расскажи о себе"/></h1><p>Расскажи, чем живёшь и что любишь.<br/>Это увидят твои собеседники</p></div>
    <div ref={form} data-auth-focus-region className={`auth-bio-form ${focused?'is-focused':''} ${floating?'is-floating':''} ${state.tooLong?'is-error':''}`}>
      <div className="auth-bio-measure-clip" aria-hidden="true"><div ref={mirror} className="auth-bio-measure" aria-hidden="true" style={{fontSize,width:textWidth/textScale,lineHeight:`${20.25/textScale}px`,letterSpacing:-.3/textScale}}>{value+'\u200b'}</div></div>
      <label className="auth-bio-field" style={{height:metrics.height}}>
        <span className="auth-bio-label">О себе</span>
        <KeyboardTextarea aria-label="О себе" enterKeyHint="enter" aria-invalid={state.tooLong} aria-describedby="onboarding-bio-caption" rows={1} value={value} autoComplete="off" inputMode="text" autoCorrect="on" autoCapitalize="sentences" spellCheck={true}
          style={{fontSize,width:textWidth/textScale,height:metrics.inputHeight/textScale,lineHeight:`${metrics.lineHeight/textScale}px`,letterSpacing:-.3/textScale,transform:`scale(${textScale})`,transformOrigin:'0 0',opacity:floating?1:0,overflowY:metrics.lines>4?'auto':'hidden'}}
          onChange={bioInput.onChange} onCompositionStart={bioInput.onCompositionStart} onCompositionEnd={bioInput.onCompositionEnd} onFocus={()=>setFocused(true)} onBlur={event=>{setFocused(false);const next=bioInput.finish(event.currentTarget);draft.current=next;auth.setBio(next);keyboard.hide();}}
          onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.currentTarget.blur();}if(!viewport.native&&event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&event.nativeEvent.keyCode!==229){event.preventDefault();complete();}}}/>
      </label>
      <p id="onboarding-bio-caption" className="auth-bio-caption" aria-live="polite">{state.tooLong?'Сократи немного — максимум 50 символов':'Пара слов о тебе, до 50 символов'}</p>
    </div>
    </AuthQuestionnaireLayout>
  </AuthCanvas>;
}

function AvatarVisual({ character, background, main = false, grid = false }: { character: number; background: number; main?: boolean; grid?: boolean }) {
  const reduced = useReducedMotion();
  return <span className={`auth-avatar-visual ${main ? 'is-main' : ''} ${grid ? 'is-grid' : ''}`}>
    <AnimatePresence initial={false}>
      <motion.span className="auth-avatar-background" key={background} style={{ background: avatarBackground(background) }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: .999 }} transition={{ duration: reduced ? 0 : .55, ease: [.22, 1, .36, 1] }} />
    </AnimatePresence>
    <AnimatePresence initial={false}>
      <motion.img key={character} {...avatarImage(character)} alt="" draggable={false}
        style={grid ? { transform: `translateY(${character === 5 ? 3 : character === 7 ? 5 : 0}px)` } : undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }} />
    </AnimatePresence>
  </span>;
}

function AvatarRoute() {
  const reduced = useReducedMotion();
  const scrollProgress=useMotionValue(0);
  const setScrollProgress=(value:number)=>scrollProgress.set(value);
  const fadeOpacity=useTransform(scrollProgress,value=>value*value*(3-2*value));
  const auth = useAuth(); const flow = useFlow(); const { height } = useGeometry();
  return <AuthCanvas className="auth-questionnaire-new" node="2988:5555">
    <div className="auth-avatar-scroll-region" style={{ height: height - 186 }} onScrollCapture={event => { if (event.target instanceof HTMLElement) setScrollProgress(Math.min(1, event.target.scrollTop / 35)); }}>
    <MobileScroll className="auth-avatar-scroller"><div className="auth-avatar-scroll-content">
    <div className="auth-gender-heading"><h1><FigmaDisplayLines text="Настрой аватар" /></h1><p>Так тебя будут видеть твои друзья<br />в приложении</p></div>
    <div className="auth-avatar-editor">
      <div className="auth-avatar-preview"><AvatarVisual character={auth.character} background={auth.background} main /></div>
      <div className="auth-avatar-color-controls"><p>Цвет фона</p><div className="auth-avatar-colors" role="group" aria-label="Цвет фона">
        {AVATAR_BACKGROUNDS.map(([label], index) => <button key={label} className={`auth-avatar-swatch ${auth.background === index ? 'is-selected' : ''}`} aria-label={label} aria-pressed={auth.background === index} onClick={() => auth.setBackground(index)}>
          <span style={{ background: avatarBackground(index) }} /><i aria-hidden="true" />
        </button>)}
      </div></div>
      <div className="auth-avatar-character-controls"><p>Выбери персонажа</p><div className="auth-avatar-characters" role="group" aria-label="Персонаж">
        {Array.from({ length: 8 }, (_, index) => <button key={index} className={`auth-character ${auth.character === index ? 'is-selected' : ''}`} aria-label={`Персонаж ${index + 1}`} aria-pressed={auth.character === index} onClick={() => auth.setCharacter(index)}>
          <span className="auth-character-artwork" style={{ clipPath: `path('${AVATAR_CONTOUR}')` }}><AvatarVisual character={index} background={auth.background} grid /></span><svg className="auth-character-outline" viewBox="0 0 89 89" aria-hidden="true"><path d={AVATAR_CONTOUR} transform="translate(1 1) scale(1.12987013)" fill="none" stroke="#1c1407" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
        </button>)}
      </div></div>
    </div>
    </div></MobileScroll></div>
    <motion.div className="auth-interest-top-fade" style={{ opacity: fadeOpacity }} aria-hidden="true" />
    <div className="auth-avatar-bottom-fade" aria-hidden="true" style={{ top: height - 205 }} />
    <div className="auth-avatar-footer" style={{top:height-186}}>
      <motion.button {...getPressProps(reduced)} className="auth-primary" onClick={()=>flow.push(route('interests'))}>Продолжить</motion.button>
      <motion.button {...getPressProps(reduced)} className="auth-avatar-random" data-node-id="3196:6466" onClick={()=>{auth.setCharacter(Math.floor(Math.random()*8));auth.setBackground(Math.floor(Math.random()*7));}}>
        <span className="auth-avatar-random-icon"><img src="/assets/chat/correction/avatar-random.svg" alt="" /></span><span className="auth-avatar-random-label">Случайный аватар</span>
      </motion.button>
    </div>
  </AuthCanvas>;
}

function InterestsRoute() {
  const reduced = useReducedMotion();
  const auth = useAuth(); const flow = useFlow(); const { height } = useGeometry();
  const scrollProgress=useMotionValue(0);
  const setScrollProgress=(value:number)=>scrollProgress.set(value);
  const fadeOpacity=useTransform(scrollProgress,value=>value*value*(3-2*value));
  const toggle = (id: string) => auth.setInterests(auth.interests.includes(id) ? auth.interests.filter(value => value !== id) : [...auth.interests, id]);
  return <AuthCanvas className="auth-questionnaire-new" node={auth.interests.length ? '2995:14089' : '2995:14243'}>
    <div className="auth-interest-scroll-region" style={{ height: height - 188 }} onScrollCapture={event => { if (event.target instanceof HTMLElement) setScrollProgress(Math.min(1, event.target.scrollTop / 117)); }}>
      <MobileScroll className="auth-interest-scroller"><div className="auth-interest-content">
        <div className="auth-gender-heading"><h1><FigmaDisplayLines text="твои интересы?" /></h1><p>Выбери темы для общения. Их можно изменить позже в профиле</p></div>
        <div className="auth-interest-options" role="group" aria-label="Твои интересы">
          {INTERESTS.map(([id, label, width]) => <button key={id} style={{ width }} className={`auth-interest ${auth.interests.includes(id) ? 'is-selected' : ''}`} aria-pressed={auth.interests.includes(id)} onClick={() => toggle(id)}>
            <img src={`/assets/auth/interest-${id}.svg`} alt="" draggable={false} /><span>{label}</span>
          </button>)}
        </div>
      </div></MobileScroll>
    </div>
    <motion.div className="auth-interest-top-fade" style={{ opacity: fadeOpacity }} aria-hidden="true" />
    <div className="auth-interest-bottom-fade" style={{ top: height - 205 }} aria-hidden="true" />
    <div className="auth-interest-actions" style={{ top: height - 188 }}>
      <motion.button {...getPressProps(reduced)} className="auth-primary" disabled={!auth.interests.length} onClick={() => flow.push(route('profile'))}>Продолжить</motion.button>
      <motion.button {...getPressProps(reduced)} className="auth-ghost" onClick={() => { auth.setInterests([]); flow.push(route('profile')); }}>Пропустить</motion.button>
    </div>
  </AuthCanvas>;
}

function ProfileReviewRoute() {
  const reduced = useReducedMotion();
  const auth = useAuth(); const { height } = useGeometry(); const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setConfirmed(false); }, [auth.nickname, auth.gender, auth.age, auth.character, auth.background, auth.interests, auth.bio]);
  const firstInterest = INTERESTS.find(([id]) => id === auth.interests[0]);
  function confirm() {
    storeQuestionnaire({gender:auth.gender,age:auth.age,nickname:auth.nickname,character:auth.character,background:auth.background,interests:auth.interests,bio:auth.bio});
    setConfirmed(true);
    auth.onConfirmed?.();
  }
  return <AuthCanvas className="auth-questionnaire-new auth-profile-review" node="2995:14704">
    <QuestionnaireGlow />
    <div className="auth-gender-heading"><h1><FigmaDisplayLines text="ТВОЙ ПРОФИЛЬ" /></h1><p>Проверь, всё ли верно.<br />Потом это можно будет изменить</p></div>
    <ProfileCard appleDesign className="auth-review-card" height={197} nodeId="2995:14730" hint={false} celebrate completion={100}>
      <div className="auth-review-identity"><div className="auth-review-avatar"><AvatarVisual character={auth.character} background={auth.background} /></div><h2>{auth.nickname}</h2></div>
      <div className="auth-review-facts">
        <div className="auth-review-fact"><p>ПОЛ И ВОЗРАСТ</p><div className="auth-review-value auth-review-gender-age">
          <span className="auth-review-gender-icon"><img src={`/assets/auth/profile-${auth.gender === 'female' ? 'female' : 'male'}.svg`} alt={auth.gender === 'female' ? 'Женский' : 'Мужской'} /></span>
          <img src="/assets/auth/profile-separator.svg" alt="" /><span className="auth-review-age-range">{ageRange(auth.age)}</span>
        </div></div>
        <div className="auth-review-fact"><p>ТВОИ ИНТЕРЕСЫ</p><div className="auth-review-value">
          {firstInterest ? <><img className="auth-review-interest-icon" src={`/assets/auth/interest-${firstInterest[0]}.svg`} alt="" /><span>{firstInterest[1]}{auth.interests.length > 1 ? `, +${auth.interests.length - 1}` : ''}</span></> : <span>Не выбраны</span>}
        </div></div>
      </div>
    </ProfileCard>
    <motion.button {...getPressProps(reduced)} className="onboarding-primary auth-review-confirm" style={{ top: height - 116 }} onClick={confirm}>
      <span className="onboarding-primary-label">Подтвердить</span>
    </motion.button>
    <AnimatePresence>{confirmed && <motion.div className="auth-end-toast" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reduced?STILL:UI_MOTION.fade}>Профиль подтверждён</motion.div>}</AnimatePresence>
  </AuthCanvas>;
}

/** Exact77px Figma SVG artwork silhouette, radius24 with60% smoothing. */
const AVATAR_CONTOUR = 'M0 38.5C0 24.9921 0 18.2381 2.61584 13.1042C4.9168 8.5883 8.5883 4.9168 13.1042 2.61584C18.2381 0 24.9921 0 38.5 0C52.0079 0 58.7619 0 63.8958 2.61584C68.4117 4.9168 72.0832 8.5883 74.3842 13.1042C77 18.2381 77 24.9921 77 38.5C77 52.0079 77 58.7619 74.3842 63.8958C72.0832 68.4117 68.4117 72.0832 63.8958 74.3842C58.7619 77 52.0079 77 38.5 77C24.9921 77 18.2381 77 13.1042 74.3842C8.5883 72.0832 4.9168 68.4117 2.61584 63.8958C0 58.7619 0 52.0079 0 38.5Z';

function route(id: AuthRoute): FlowScreen {
  const questionnaire = id.startsWith("gender") || id.startsWith("age") || id.startsWith("nickname") || id === 'avatar' || id.startsWith('interests') || id.startsWith('bio') || id === 'profile';
  const step = id === 'profile' ? 7 : id.startsWith('interests') ? 6 : id === 'avatar' ? 5 : id.startsWith('bio') ? 4 : id.startsWith("nickname") ? 3 : id.startsWith("age") ? 2 : 1;
  const hasHeader = id.startsWith("email") || id.startsWith("code") || questionnaire;
  return { id,
    ...(hasHeader ? { header: () => <AuthHeader questionnaire={questionnaire} step={step} />, headerHeight: 70 } : {}),
    render: flow => <AuthRouteContent id={id} active={flow.current.id===id}/>,

  };
}

/** Figma2048:8164, through profile review2995:14704. */
export function AuthFlow({ replay = false, start = "welcome", onLater, onConfirmed, scenario = "new" }: { replay?: boolean; start?: AuthRoute; onLater: () => void; onConfirmed?: () => void; scenario?: AuthScenario }) {
  const keyboard = useKeyboard();
  useLayoutEffect(() => { keyboard.hide(); return () => keyboard.hide(); }, []);
  const [email, setEmail] = useState(start.startsWith("code") || start === "email-filled" ? SAMPLE_EMAIL : "");
  const afterNickname = start.startsWith('bio') || start === 'avatar' || start.startsWith('interests') || start === 'profile';
  const [gender, setGender] = useState<"male" | "female" | null>(start === "gender-selected" ? "female" : afterNickname ? 'male' : null);
  const [age, setAge] = useState(start === "age-under18" ? 17 : afterNickname ? 25 : 18);
  const [nickname, setNickname] = useState(start === "nickname-invalid" ? "педикt.me/344" : start === "nickname-taken" ? "педик41см" : start === "nickname-valid" ? "педик40см" : start === "nickname-input" ? "педи" : afterNickname ? 'ЧленСос595' : "");
  const [bio,setBio]=useState(start==='bio-input'?'педи':start==='bio-invalid'?'Люблю ночные прогулки, джаз и разговоры обо всём. Ищу людей с чувством юмора и своими странностями. Расскажи, какой трек у тебя чаще стоит на повторе? Ещё пара слов.':start==='bio-filled'||start==='profile'?'Люблю тихие вечера и длинные разговоры':'' );
  const [character, setCharacter] = useState(0); const [background, setBackground] = useState(0);
  const [interests, setInterests] = useState<string[]>(start === 'profile' || start === 'interests-selected' ? SAMPLE_INTERESTS : []);
  return <AuthContext.Provider value={{ email, setEmail, gender, setGender, age, setAge, nickname, setNickname, character, setCharacter, background, setBackground, interests, setInterests, bio, setBio, replay, onLater, onConfirmed, scenario }}>
    <div className="auth-flow">
      <FlowStack initial={route(start)} />
    </div>
  </AuthContext.Provider>;
}

/** Runtime geometry rerenders its wrapper; retained input scenes stay stable. */
const AuthRouteContent=memo(function AuthRouteContent({id,active}:{id:AuthRoute;active:boolean}){return <div className="auth-route-content" inert={!active} aria-hidden={!active}>
      {id === "welcome" || id === "auth-error" ? <WelcomeRoute error={id === "auth-error"} /> : id === "offline" ? <OfflineRoute /> : id.startsWith("email") ? <EmailRoute preview={id} /> : id.startsWith("code") ? <CodeRoute preview={id} /> : id === "apple" || id === "google" ? <ProviderRoute provider={id} /> : id === "intro" ? <IntroRoute /> : id.startsWith("age") ? <AgeRoute /> : id.startsWith("nickname") ? <NicknameRoute preview={id} /> : id.startsWith('bio') ? <BioRoute preview={id}/> : id === 'avatar' ? <AvatarRoute /> : id.startsWith('interests') ? <InterestsRoute /> : id === 'profile' ? <ProfileReviewRoute /> : <GenderRoute />}
</div>;});
