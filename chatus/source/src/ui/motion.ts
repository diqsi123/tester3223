/** Shared behavior tokens. OS keyboard geometry follows VisualViewport directly. */
export const UI_MOTION = {
  surface: {type:'spring' as const,stiffness:400,damping:40,mass:1},
  scene: {type:'spring' as const,stiffness:400,damping:40,mass:1},
  gesture: {type:'spring' as const,stiffness:300,damping:30,mass:.75},
  fade: {duration:.2,ease:[.2,0,.2,1] as [number,number,number,number]},
  input: {duration:.3,ease:[.22,1,.36,1] as [number,number,number,number]},
  send: {type:'spring' as const,stiffness:440,damping:42,mass:1},
} as const;
export const STILL={duration:0} as const;
