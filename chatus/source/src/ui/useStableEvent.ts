import {useCallback,useLayoutEffect,useRef} from 'react';

/** Stable UI handler identity with the latest committed screen state. */
export function useStableEvent<Args extends unknown[],Result>(handler:(...args:Args)=>Result) {
  const current=useRef(handler);
  useLayoutEffect(()=>{current.current=handler;});
  return useCallback((...args:Args)=>current.current(...args),[]);
}
