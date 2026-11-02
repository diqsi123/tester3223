/** Art direction: Figma p7896b2XIPGOtu6JO7G3h6 / 1924:24155. */
export const SEARCH_PALETTE = {
  yellow: "#ffb61c", // CharacterVisual gradient
  orange: "#fdab1b", // background/page and avatar gradient
  cream: "#fbe68f", // CharacterVisual gradient
  highlight: "#fcf8ec", // existing CHATUS paper token
  core: "#fffef9", // near-white light warmed toward the existing paper token
} as const;

export const SEARCH_VISUAL = {
  LOOP_DURATION_SECONDS: 12,
  TRAIL_FRACTION: 0.075,
  TRAIL_WIDTH_PX: 3,
  TRAIL_GLOW_PX: 4,
  CANVAS_PADDING_PX: 100,
  SILHOUETTE_OPACITY: 1,
  RENDER_SCALE: 0.8,
  MAX_DPR: 1.5,
  FPS: 30,
  MATCH_DURATION_MS: 650,
} as const;

export const CHARACTER_ORIGINAL = "/assets/chatus/character-original.png";
export const CHARACTER_MASK = "/assets/chatus/character-contour.png";
export const SEARCH_LIGHT = "/assets/chatus/search-light.svg";
export const LUMA_PRESET = { speed: 0.65, intensity: 0.30, width: 0.90, bend: 1.55, fps: 60, quality: 1 } as const;
