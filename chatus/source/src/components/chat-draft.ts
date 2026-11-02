/** Input updates belong to the composer; Send reads the same synchronous value. */
export function createChatDraft(initial: string) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: string) => {
      if (next === value) return;
      value = next;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
export type ChatDraft = ReturnType<typeof createChatDraft>;
