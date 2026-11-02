import { useSyncExternalStore, type ComponentProps } from 'react';
import { ChatComposer } from './ChatConversation';
import type { ChatDraft } from './chat-draft';

/** Keystrokes never rerender the conversation, media overlays or peer scene. */
export function DraftComposer({ draft, ...props }: Omit<ComponentProps<typeof ChatComposer>, 'value' | 'onChange'> & { draft: ChatDraft }) {
  const value = useSyncExternalStore(draft.subscribe, draft.get, draft.get);
  return <ChatComposer {...props} value={value} onChange={draft.set}/>;
}
