# LivingSearchSilhouette — contour search light

The single searching point and its fading trail now follow the **outer PNG alpha contour**, including ears, neck, ponytail and shoulders. There is no interior route. The static character remains quiet; no blobs, particles, cyan or rainbow. Integration remains in `src/Prototype.tsx`, with the same `maskSrc`, `state`, `intensity`, `paused` and `className` props.

```tsx
<LivingSearchSilhouette maskSrc={CHARACTER_MASK} state="searching" intensity={0.35} />
```

## Exact shape and contour data

`character-original.png` is the untouched user PNG; `character-mask.png` is its white-RGB alpha mask. `CHARACTER_MASK` now points to `public/assets/chatus/character-contour.png`, a packed data texture. Its alpha is byte-for-byte identical to the original. RGB contains only contour metadata: R/G encode circular phase as cosine/sine (seam-safe linear filtering), B encodes distance to the boundary. The original artwork RGB and question mark never supply material colors.

`scripts/build-search-contour.py` traces the largest outer boundary directly from the nonzero alpha support, retains the original bottom fade extent, and applies only subpixel raster smoothing. It generates the packed PNG and `contour-data.ts`, a 1,025-position constant-speed head lookup. `path.ts` samples that lookup. The renderer never redraws or approximates the silhouette with geometry.

The fragment shader uses the baked distance and phase to draw the recent 28% of the contour. Thus the tail follows the actual outline at all times, rather than chords between sparse points. The body and thin trail use the original alpha support. The round moving head and its radial halo are composited separately in the same shader, across both sides of the contour, so the mask cannot cut the light into a triangle. The body retains its original shoulder fade. The canvas has 24px of transparent padding on every side to prevent halo clipping at its bounds.

Use the exported `CHARACTER_MASK` as `maskSrc`; it is a preprocessed CHATUS contour asset, not an arbitrary RGB image. If the source silhouette changes, regenerate its contour asset and lookup together.

## Tuning

`config.ts` → `SEARCH_VISUAL`: `LOOP_DURATION_SECONDS` (12), `TRAIL_FRACTION` (.28), `TRAIL_WIDTH_PX` (2.4), `TRAIL_GLOW_PX` (9), `HEAD_CORE_PX` (4.5), `HEAD_GLOW_PX` (16), `HEAD_HALO_PX` (40), `SILHOUETTE_OPACITY` (.29), `RENDER_SCALE` (.8), `MAX_DPR` (1.5), `FPS` (30), `MATCH_DURATION_MS` (650).

Colors remain in `SEARCH_PALETTE`, derived from Figma `p7896b2XIPGOtu6JO7G3h6`, section `1902:19274`, child `1902:19369`: gold `#FFB61C`, cream `#FBE68F`, orange `#FDAB1B`, application paper `#FCF8EC`, near-white light `#FFFEF9`.

During `matched`, the point accelerates at 1.65× for 300ms, then stays on the contour while the tail contracts, the local halo flashes, and the visual fades. This honors the latest direction to keep the point on the outline in all states. The parent owns the destination avatar and match event. Reduced motion freezes the point and uses a plain fade, without movement or flash.

## Cost and validation

One canvas, one WebGL 1 program, one texture, one quad and one draw. One texture lookup per fragment; no trail-segment loop, no CPU particle simulation and no per-frame allocation. Each frame updates a head position and scalar uniforms. The padded 450×427 canvas renders at up to 540×512 pixels; the character retains its original size and position. DPR is capped at 1.5 and rendering at .8 resolution / 30 FPS. Hidden/offscreen/paused states cancel callbacks; context loss exposes the fallback; cleanup releases resources/listeners/observers.

Checks: `node --test tests/search-renderer.test.mjs`, TypeScript, production build, protected-runtime integrity. Regenerate/audit with `python3 scripts/build-search-contour.py` and `python3 scripts/check-search-mask.py` (Pillow and NumPy). `evidence/search-contour-validation.json` reports measured distance to the source boundary and exact alpha preservation. `evidence/contour-path-check.png` is a diagnostic static overlay, not an application screenshot.

Actual in-browser visual tuning and mobile GPU performance remain unverified because browser administrative-policy checks blocked local preview access. The browser tests in `tests/living-search.spec.ts` are still available; deterministic renderer tests do not establish real GPU performance.
