import {
  createContext,
  type CSSProperties,
  type DragEvent,
  type PropsWithChildren,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DevicePicker, useMobileDevice } from "./Device";
import { useMobileCursor } from "./MobileCursor";

type ScreenPortalContextValue = {
  screenRef: RefObject<HTMLDivElement | null>;
};

const ScreenPortalContext = createContext<ScreenPortalContextValue | null>(null);

function suppressNativeDrag(event: DragEvent<HTMLElement>) {
  if (event.target instanceof Element && event.target.closest('[data-native-drag="true"]')) {
    return;
  }

  event.preventDefault();
}

export function useScreenPortal() {
  const context = useContext(ScreenPortalContext);

  if (!context) {
    throw new Error("useScreenPortal must be used inside PhoneFrame");
  }

  return context;
}

function getDeviceScale(deviceWidth: number, deviceHeight: number, verticalMargin = 48) {
  if (typeof window === "undefined") return 1;

  const horizontal = (window.innerWidth - 48) / deviceWidth;
  const vertical = (window.innerHeight - verticalMargin) / deviceHeight;

  return Math.max(0.42, Math.min(horizontal, vertical, 1));
}

function useDeviceScale(deviceWidth: number, deviceHeight: number, verticalMargin = 48) {
  const [scale, setScale] = useState(() => getDeviceScale(deviceWidth, deviceHeight, verticalMargin));

  useEffect(() => {
    const update = () => setScale(getDeviceScale(deviceWidth, deviceHeight, verticalMargin));

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [deviceHeight, deviceWidth, verticalMargin]);

  return scale;
}

export function PhoneFrame({ children }: PropsWithChildren) {
  const { device, presentation } = useMobileDevice();
  const { geometry } = device;
  const scale = useDeviceScale(geometry.device.width, geometry.device.height, presentation === "design" ? 120 : 48);
  const screenRef = useRef<HTMLDivElement | null>(null);
  const contextValue = useMemo(() => ({ screenRef }), []);
  const mobileCursor = useMobileCursor();

  return (
    <ScreenPortalContext.Provider value={contextValue}>
      <div className="phone-stage">
        <DevicePicker />
        <div
          className="phone-scale-box"
          style={{
            width: geometry.device.width * scale,
            height: geometry.device.height * scale,
          }}
        >
          <div
            className="phone-device"
            data-device={device.id}
            data-platform={device.platform}
            data-testid="phone-frame"
            data-presentation={presentation}
            onDragStartCapture={suppressNativeDrag}
            style={{
              width: geometry.device.width,
              height: geometry.device.height,
              transform: `scale(${scale})`,
            }}
          >
            {presentation === "device" && <img
              className="phone-bezel"
              src={device.bezel}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{ zIndex: device.bezelLayer === "above-screen" ? 2 : 1 }}
            />}
            <div
              ref={screenRef}
              className="device-screen"
              data-cursor-debug={mobileCursor.cursorDebug ? "true" : "false"}
              data-device={device.id}
              data-phone-screen
              data-testid="device-screen"
              {...mobileCursor.cursorHandlers}
              style={
                {
                  "--device-safe-area-bottom": `${geometry.safeArea.bottom}px`,
                  left: geometry.screen.x,
                  top: geometry.screen.y,
                  width: geometry.screen.width,
                  height: geometry.screen.height,
                  borderRadius: geometry.screen.radius,
                  zIndex: device.bezelLayer === "above-screen" ? 1 : 2,
                } as CSSProperties
              }
            >
              {children}
              {presentation === "design" && device.platform === "ios" && (
                <div aria-hidden="true" style={{ position: "absolute", left: 104, top: 1, width: 194, height: 53, overflow: "hidden", pointerEvents: "none", zIndex: 24 }}>
                  <img src="/assets/welcome/dynamic-island.png" alt="" draggable={false} style={{ position: "absolute", left: -128, top: -27, width: 450, height: 920, maxWidth: "none" }} />
                </div>
              )}
              {device.camera ? (
                <span
                  className="device-camera"
                  data-testid="device-camera"
                  aria-hidden="true"
                  style={{
                    width: device.camera.size,
                    height: device.camera.size,
                    top: device.camera.top,
                    left: `calc(50% - ${device.camera.size / 2}px)`,
                  }}
                />
              ) : null}
              {mobileCursor.cursorElement}
            </div>
          </div>
        </div>
      </div>
    </ScreenPortalContext.Provider>
  );
}
