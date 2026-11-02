import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CHARACTER_MASK, CHARACTER_ORIGINAL, SEARCH_LIGHT, SEARCH_PALETTE, SEARCH_VISUAL } from "./config";
import { createSearchRenderer, type SearchState, type SceneLayout, type VisualControls } from "./renderer";
import "./living-search.css";

export type LivingSearchSilhouetteProps = {
  maskSrc: string;
  state?: SearchState;
  intensity?: number;
  paused?: boolean;
  className?: string;
  /** App composition; omitted for the reusable standalone silhouette. */
  scene?: SceneLayout;
};

/** Decorative search energy. Keep status announcements and the next avatar in the parent. */
export function LivingSearchSilhouette({ maskSrc, state = "searching", intensity = 0.35,
  paused = false, className = "", scene }: LivingSearchSilhouetteProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<ReturnType<typeof createSearchRenderer> | null>(null);
  const controls = useRef<VisualControls>({ state, intensity, paused, scene });
  const [mode, setMode] = useState<"fallback" | "webgl">("fallback");
  const [aspect, setAspect] = useState(402 / 379);
  const clamped = Number.isFinite(intensity) ? Math.min(1, Math.max(0, intensity)) : 0.35;

  useEffect(() => {
    controls.current = { state, intensity: clamped, paused, scene };
    renderer.current?.update(controls.current);
  }, [state, clamped, paused, scene?.height, scene?.characterTop, scene?.searching]);

  useEffect(() => {
    const target = canvas.current!;
    let disposed = false;
    let loaded = false;
    const artwork = new Image();
    const light = new Image();
    const atlas = document.createElement("canvas");
    atlas.width = 544; atlas.height = 758;
    const source = new Image();
    source.crossOrigin = "anonymous";
    setMode("fallback");
    function initialize() {
      if (disposed || !loaded) return;
      renderer.current?.dispose(); renderer.current = null;
      try {
        renderer.current = createSearchRenderer(target, atlas, controls.current, () => {
          if (!disposed) setMode("webgl");
        });
      } catch {
        // Includes blocked WebGL, compile/link, CORS and texture allocation failures.
        setMode("fallback");
      }
    }
    let count = 0;
    const onload = () => {
      if (disposed || ++count < 3) return;
      const context = atlas.getContext("2d");
      if (!context) return;
      context.drawImage(source, 0, 0, 402, 379);
      context.drawImage(artwork, 0, 379, 402, 379);
      context.drawImage(light, 402, 0, 141.793, 195.817);
      loaded = true; setAspect(402 / 379); initialize();
    };
    for (const image of [source, artwork, light]) {
      image.crossOrigin = "anonymous";
      image.onload = onload;
      image.onerror = () => { if (!disposed) setMode("fallback"); };
    }
    const lost = (event: Event) => {
      event.preventDefault();
      renderer.current?.dispose(); renderer.current = null;
      if (!disposed) setMode("fallback");
    };
    target.addEventListener("webglcontextlost", lost);
    target.addEventListener("webglcontextrestored", initialize);
    source.src = maskSrc;
    artwork.src = CHARACTER_ORIGINAL;
    light.src = SEARCH_LIGHT;
    return () => {
      disposed = true;
      for (const image of [source, artwork, light]) { image.onload = null; image.onerror = null; }
      target.removeEventListener("webglcontextlost", lost);
      target.removeEventListener("webglcontextrestored", initialize);
      renderer.current?.dispose(); renderer.current = null;
    };
  }, [maskSrc]);

  const style = {
    aspectRatio: scene ? undefined : aspect,
    height: scene?.height,
    "--character-top": `${scene?.characterTop ?? 0}px`,
    "--search-mask": `url(${JSON.stringify(maskSrc)})`,
    "--search-yellow": SEARCH_PALETTE.yellow,
    "--search-cream": SEARCH_PALETTE.cream,
    "--search-orange": SEARCH_PALETTE.orange,
    "--search-silhouette-opacity": SEARCH_VISUAL.SILHOUETTE_OPACITY,
    "--search-canvas-padding": `${SEARCH_VISUAL.CANVAS_PADDING_PX}px`,
    "--search-match-duration": `${SEARCH_VISUAL.MATCH_DURATION_MS}ms`,
  } as CSSProperties;
  return <div className={`living-search ${className}`} style={style} aria-hidden="true"
    data-renderer={mode} data-state={state} data-paused={paused} data-scene={Boolean(scene)} data-searching={scene?.searching !== false}>
    <div className="living-search__fallback">
      <img src={CHARACTER_ORIGINAL} onError={event => { if (event.currentTarget.getAttribute("src") !== CHARACTER_MASK) event.currentTarget.src = CHARACTER_MASK; }} alt="" draggable={false} />
      <div className="living-search__static-light" />
    </div>
    <canvas ref={canvas} className="living-search__canvas" />
  </div>;
}
