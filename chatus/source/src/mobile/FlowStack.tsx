import {UI_MOTION,STILL} from '../ui/motion';
import {
  createContext,
  type CSSProperties,
  type ComponentProps,
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, animate, motion, motionValue, type MotionValue, useIsPresent, useReducedMotion } from "motion/react";
import { useDrag } from "@use-gesture/react";
import { useMobileDevice } from "./Device";
import { useKeyboard, useKeyboardDismissDrag, useKeyboardInsets } from "./Keyboard";

export type FlowScreen = {
  id: string;
  title?: string;
  header?: (flow: FlowControls) => ReactNode;
  headerHeight?: number;
  footer?: (flow: FlowControls) => ReactNode;
  footerHeight?: number;
  render: (flow: FlowControls) => ReactNode;
};

type FlowEntry = FlowScreen & {
  key: string;
};

export type FlowControls = {
  current: FlowEntry;
  previous: FlowEntry | null;
  stack: FlowEntry[];
  canGoBack: boolean;
  push: (screen: FlowScreen) => void;
  pop: () => void;
  replace: (screen: FlowScreen) => void;
};

const FlowContext = createContext<FlowControls | null>(null);

export function useFlow() {
  const context = useContext(FlowContext);

  if (!context) {
    throw new Error("useFlow must be used inside FlowStack");
  }

  return context;
}

function FlowProvider({ value, children }: PropsWithChildren<{ value: FlowControls }>) {
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

function FlowScene(props: ComponentProps<typeof motion.div> & {'data-testid'?: string; 'data-flow-current'?: string}) {
  const present = useIsPresent();
  return <motion.div {...props} inert={!present || props.inert} aria-hidden={!present || props['aria-hidden'] || undefined}
    data-testid={present ? props['data-testid'] : undefined}
    data-flow-current={present ? props['data-flow-current'] : 'false'}
    style={{...props.style, pointerEvents: present ? props.style?.pointerEvents : 'none'}}/>;
}

export function FlowStack({ initial }: { initial: FlowScreen }) {
  const reduced=useReducedMotion();
  const { device } = useMobileDevice();
  const keyboard = useKeyboard();
  const { bottomInset, keyboardDragging } = useKeyboardInsets();
  const dismissKeyboardDrag = useKeyboardDismissDrag();
  const sequence = useRef(1);
  const gestureStartedAtEdge = useRef(false);
  const gestureOrigin = useRef({scale:1,x:0,previousX:0});
  const initialEntry = useRef<FlowEntry>({ ...initial, key: `${initial.id}-0` });
  const [stack, setStack] = useState<FlowEntry[]>(() => [initialEntry.current]);
  const [direction, setDirection] = useState(1);
  // Each route keeps its presentation value through drag, return and exit.
  // The finger writes directly; only release/navigation starts a spring.
  const positions = useRef(new Map<string, MotionValue<number>>());
  const position = (key: string) => {
    let value = positions.current.get(key);
    if (!value) { value = motionValue(0); positions.current.set(key, value); }
    return value;
  };

  const toEntry = useCallback((screen: FlowScreen): FlowEntry => {
    const next = sequence.current;
    sequence.current += 1;
    return { ...screen, key: `${screen.id}-${next}` };
  }, []);

  const pop = useCallback(() => {
    keyboard.hide();
    setDirection(-1);
    setStack((currentStack) => {
      if (currentStack.length <= 1) return currentStack;
      return currentStack.slice(0, -1);
    });
  }, [keyboard]);

  const controls = useMemo<FlowControls>(() => {
    const current = stack[stack.length - 1];
    const previous = stack.length > 1 ? stack[stack.length - 2] : null;

    return {
      current,
      previous,
      stack,
      canGoBack: stack.length > 1,
      push: (screen) => {
        keyboard.hide();
        setDirection(1);
        setStack((currentStack) => [...currentStack, toEntry(screen)]);
      },
      pop,
      replace: (screen) => {
        keyboard.hide();
        setDirection(1);
        setStack((currentStack) => {
          const next = currentStack.slice(0, -1);
          return [...next, toEntry(screen)];
        });
      },
    };
  }, [keyboard, pop, stack, toEntry]);

  const bindEdgeSwipe = useDrag(
    (state) => {
      if (!controls.canGoBack) return;

      if (state.first) {
        const target = state.event.currentTarget as HTMLElement;
        const bounds = target.getBoundingClientRect();
        gestureOrigin.current.scale = bounds.width / device.geometry.screen.width || 1;
        gestureStartedAtEdge.current = (state.initial[0] - bounds.left) / gestureOrigin.current.scale < 28 &&
          !(state.event.target instanceof Element && state.event.target.closest('input,textarea,[data-scroll-drag="ignore"]'));
        if (gestureStartedAtEdge.current) {
          const current = position(controls.current.key);
          current.stop(); gestureOrigin.current.x = current.get();
          if (controls.previous) {
            const previous = position(controls.previous.key);
            previous.stop(); gestureOrigin.current.previousX = previous.get();
          }
        }
      }

      if (!gestureStartedAtEdge.current) return;

      const [movementX] = state.movement;
      const [velocityX] = state.velocity;
      const [directionX] = state.direction;
      const nextX = Math.max(0, Math.min(gestureOrigin.current.x + movementX / gestureOrigin.current.scale, device.geometry.screen.width));

      if (!state.last) {
        if (!reduced) {
          position(controls.current.key).set(nextX);
          if (controls.previous) position(controls.previous.key).set(gestureOrigin.current.previousX + (nextX - gestureOrigin.current.x) * .28);
        }
        return;
      }

      const cancelled = state.canceled || state.event.type === 'pointercancel';
      const releaseVelocity = cancelled ? 0 : velocityX * directionX * 1000 / gestureOrigin.current.scale;
      const shouldPop = !cancelled && nextX + releaseVelocity * .2 > 92;
      gestureStartedAtEdge.current = false;

      if (shouldPop) {
        controls.pop();
      } else {
        const velocity = releaseVelocity;
        void animate(position(controls.current.key), 0, reduced ? STILL : { ...UI_MOTION.scene, velocity });
        if (controls.previous) void animate(position(controls.previous.key), -device.geometry.screen.width * .28, reduced ? STILL : { ...UI_MOTION.scene, velocity: velocity * .28 });
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    },
  );

  const screenWidth = device.geometry.screen.width;
  const topIndex = stack.length - 1;
  const parkedX = -screenWidth * 0.28;
  const header = controls.current.header?.(controls);
  const headerHeight = controls.current.headerHeight ?? 0;
  const headerSafeArea = header ? device.geometry.safeArea.top : 0;
  const totalHeaderHeight = header ? headerSafeArea + headerHeight : 0;
  const footer = controls.current.footer?.(controls);
  const footerHeight = controls.current.footerHeight ?? 0;

  const screenVariants = {
    enter: (animationDirection: number) => ({
      x: reduced?0:animationDirection > 0 ? screenWidth : parkedX,
      scale: animationDirection > 0 ? 1 : 0.985,
    }),
    exit: (animationDirection: number) => ({
      x: reduced?0:animationDirection < 0 ? screenWidth : parkedX,
      scale: animationDirection < 0 ? 1 : 0.985,
    }),
  };

  return (
    <FlowProvider value={controls}>
      <div
        className="flow-stack"
        data-testid="flow-stack"
        data-keyboard-dragging={keyboardDragging ? "true" : "false"}
        style={
          {
            "--flow-header-height": `${totalHeaderHeight}px`,
            "--flow-header-content-height": `${headerHeight}px`,
            "--flow-header-safe-area": `${headerSafeArea}px`,
            "--flow-footer-height": `${footer ? footerHeight : 0}px`,
            "--keyboard-height": `${bottomInset}px`,
          } as CSSProperties
        }
        {...bindEdgeSwipe()}
      >
        {header ? (
          <header className="flow-fixed-header" data-testid="flow-fixed-header">
            {header}
          </header>
        ) : null}
        <div className="flow-scenes">
          <AnimatePresence initial={false} custom={direction} onExitComplete={() => {
            for (const key of positions.current.keys()) if (!stack.some(entry => entry.key === key)) positions.current.delete(key);
          }}>
            {stack.map((entry, index) => {
              const isTop = index === topIndex;
              const isVisible = index >= topIndex - 1;

              return (
                <FlowScene
                  key={entry.key}
                  inert={!isTop}
                  aria-hidden={!isTop}
                  className="flow-screen"
                  data-flow-current={isTop ? "true" : "false"}
                  data-testid={isTop ? "flow-current" : undefined}
                  custom={direction}
                  variants={screenVariants}
                  initial={isTop ? "enter" : false}
                  animate={{
                    x: reduced?0:isTop ? 0 : parkedX,
                    scale: isTop ? 1 : 0.985,
                  }}
                  exit="exit"
                  transition={reduced?STILL:UI_MOTION.scene}
                  style={{
                    x: position(entry.key),
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isTop ? "auto" : "none",
                    visibility: isVisible ? "visible" : "hidden",
                    zIndex: isTop ? 2 : 1,
                  }}
                >
                  {entry.render(controls)}
                </FlowScene>
              );
            })}
          </AnimatePresence>
        </div>
        {footer ? (
          <footer className="flow-fixed-footer" data-testid="flow-fixed-footer" {...dismissKeyboardDrag}>
            {footer}
          </footer>
        ) : null}
      </div>
    </FlowProvider>
  );
}
