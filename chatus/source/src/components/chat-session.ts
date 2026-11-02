import type { ChatMessage } from './ChatConversation';

export function requiresEndConfirmation(messageCount: number) { return messageCount < 10; }
export function editMessage(messages: ChatMessage[], id: string, text: string): ChatMessage[] {
  const value = text.trim();
  if (!value) return messages;
  return messages.map(message => message.id === id && message.outgoing && message.text !== undefined && message.text !== value
    ? { ...message, text: value, edited: true, width: undefined, height: undefined, fresh: false } : message);
}
export function reactToMessage(messages: ChatMessage[], id: string, emoji: string): ChatMessage[] {
  return messages.map(message => {
    if (message.id !== id) return message;
    const reactions = (message.reactions ?? []).map(reaction => ({
      ...reaction, count: reaction.count - (reaction.selected ? 1 : 0), selected: false,
    })).filter(reaction => reaction.count > 0);
    const previous = message.reactions?.find(reaction => reaction.emoji === emoji && reaction.selected);
    if (!previous) {
      const existing = reactions.find(reaction => reaction.emoji === emoji);
      if (existing) { existing.count++; existing.selected = true; }
      else reactions.push({ emoji, count: 1, selected: true });
    }
    return { ...message, reactions };
  });
}

/** Resolve the existing event in place; acceptance never changes history order. */
export function setFriendshipState(messages: ChatMessage[], state: NonNullable<ChatMessage['friendship']>['state']): ChatMessage[] {
  return messages.map(message=>message.friendship&&message.friendship.state!==state
    ? {...message,friendship:{...message.friendship,state},fresh:false}:message);
}
