import type { HTMLMotionProps } from 'motion/react';
import { STILL, UI_MOTION } from './motion';

type PressProps = Pick<HTMLMotionProps<'button'>, 'whileTap' | 'transition'> & {
  'data-chatus-press': true;
};

/** Shared touch-down/keyboard feedback; Motion retargets the live spring on release. */
export function getPressProps(reduced: boolean | null = false): PressProps {
  return {
    'data-chatus-press': true,
    whileTap: reduced ? { opacity: .88 } : { scale: .985, opacity: .88 },
    transition: reduced ? STILL : UI_MOTION.surface,
  };
}
