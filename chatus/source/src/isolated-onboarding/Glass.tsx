import { useMemo } from "react";

export const CARD_GLASS = Object.freeze({ radius: 0, refraction: 1, depth: 2, lightAngle: 0, lightIntensity: 1, dispersion: 1, splay: 0 });

/** Optical layer is separate from the 48% tint, outside stroke, shadow and content.
 * Zero frost is intentional. Over the frame's uniform backdrop refraction and
 * dispersion preserve its colour. The Glass rim is separate from the grey stroke:
 * at the source's zero-degree light angle its top and bottom catch the light.
 */
export function Glass({ height = 202, id = 'onboarding-glass' }: { height?: number; id?: string } = {}) {
  const map = useMemo(() => {
    const width = 292, radius = 32;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d")!;
    const data = context.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const px = x + .5 - width / 2, py = y + .5 - height / 2;
      const qx = Math.abs(px) - (width / 2 - radius), qy = Math.abs(py) - (height / 2 - radius);
      const ex = Math.max(qx, 0), ey = Math.max(qy, 0);
      const distance = Math.hypot(ex, ey) + Math.min(Math.max(qx, qy), 0) - radius;
      const length = Math.hypot(ex, ey);
      const nx = length ? ex / length * Math.sign(px) : qx > qy ? Math.sign(px) : 0;
      const ny = length ? ey / length * Math.sign(py) : qx > qy ? 0 : Math.sign(py);
      const rim = Math.max(0, 1 - Math.abs(distance) / CARD_GLASS.depth);
      const i = (y * width + x) * 4;
      data.data[i] = Math.round(128 + 127 * nx * rim);
      data.data[i + 1] = Math.round(128 + 127 * ny * rim);
      data.data[i + 2] = 128; data.data[i + 3] = 255;
    }
    context.putImageData(data, 0, 0);
    return canvas.toDataURL();
  }, [height]);
  return <>
    <svg className="onboarding-filter-definitions" aria-hidden="true">
      <defs><filter id={`${id}-refraction`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feImage href={map} x="0" y="0" width="292" height={height} result="normals" preserveAspectRatio="none" />
        <feDisplacementMap in="SourceGraphic" in2="normals" scale={CARD_GLASS.depth * CARD_GLASS.refraction} xChannelSelector="R" yChannelSelector="G" result="refracted" />
      </filter></defs>
    </svg>
    <div className="onboarding-card-optics" style={{ backdropFilter: `url(#${id}-refraction)`, WebkitBackdropFilter: `url(#${id}-refraction)` }} aria-hidden="true" data-glass={JSON.stringify(CARD_GLASS)} />
    <div className="onboarding-card-tint" aria-hidden="true" />
    <svg className="onboarding-card-rim" style={{ height }} viewBox={`0 0 292 ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity={CARD_GLASS.lightIntensity} />
          <stop offset=".42" stopColor="white" stopOpacity="0" />
          <stop offset=".58" stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity={.72 * CARD_GLASS.lightIntensity} />
        </linearGradient>
        <linearGradient id={`${id}-inner-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1407" stopOpacity=".01" />
          <stop offset=".2" stopColor="#1c1407" stopOpacity="0" />
          <stop offset="1" stopColor="#1c1407" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x=".775" y=".775" width="290.45" height={height - 1.55} rx="31.225" fill="none" stroke={`url(#${id}-light)`} strokeWidth="1.55" />
      <rect x="1.95" y="1.95" width="288.1" height={height - 3.9} rx="30.05" fill="none" stroke={`url(#${id}-inner-rim)`} />
    </svg>
    <div className="onboarding-card-stroke" aria-hidden="true" />
  </>;
}
