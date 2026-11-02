import { useMemo } from "react";
import { ShaderFill } from "./lib/custom-effect-runtime";
import { setup, render, manifest } from "./lib/custom-effects/LiveTelegramSpoiler";

/** Source geometry/colours with a more visible moving grain, as requested. */
export function Spoiler({ label, nodeId }: { label: string; nodeId: string }) {
  const shader = useMemo(() => ({ setup, render, manifest, params: {
    particleSize: 1.399999976158142,
    particleColor: { r: 0.10980392247438431, g: 0.0784313753247261, b: 0.027450980618596077, a: 0.5600000023841858 },
    reveal: 0,
    animationSpeed: 1.0500000715255737,
    bubbleColor: { r: 0.9764705896377563, g: 0.9372549057006836, b: 0.8784313797950745, a: 0 },
    particleDensity: 0.25999999046325684,
  } }), []);
  return <div className="onboarding-spoiler" role="img" aria-label={label} data-node-id={nodeId}>
    <ShaderFill width={56} height={24} shader={shader} />
  </div>;
}
