import { useId } from 'react';

/** Keep the Figma gradient confined to its one-pixel inside contour. */
export function OrangeButtonStroke() {
  const id = useId();
  return <svg className="onboarding-primary-stroke" viewBox="0 0 362 64" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="white" stopOpacity="0" />
      <stop offset="1" stopColor="white" stopOpacity=".88" />
    </linearGradient></defs>
    <rect x=".5" y=".5" width="361" height="63" rx="31.5" fill="none" stroke={`url(#${id})`} strokeWidth="1" />
  </svg>;
}
