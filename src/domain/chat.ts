import type { ChatChannel, ChatMessage, DemoState } from "./models";

type ChatState = Pick<DemoState, "chatChannels" | "chatMessages" | "chatReads" | "employees">;

const byOrder = (first: ChatMessage, second: ChatMessage) => first.createdAt.localeCompare(second.createdAt) || first.id.localeCompare(second.id);

/** The single ordering every chat read uses, so a receipt and a message list can never disagree. */
export function messagesIn(state: ChatState, channelId: string): ChatMessage[] {
  return state.chatMessages.filter((message) => message.channelId === channelId).sort(byOrder);
}

export const isMember = (channel: ChatChannel, employeeId: string): boolean => channel.memberEmployeeIds.includes(employeeId);

/** Named channels first, then direct conversations, each alphabetically by the title the reader sees. */
export function channelsForEmployee(state: ChatState, employeeId: string): ChatChannel[] {
  return state.chatChannels
    .filter((channel) => isMember(channel, employeeId))
    .sort((first, second) => (first.kind === second.kind
      ? channelTitle(state, first, employeeId).localeCompare(channelTitle(state, second, employeeId))
      : first.kind === "channel" ? -1 : 1));
}

/** A direct conversation is named by the colleague on the other side of it, from the reader's point of view. */
export function channelTitle(state: ChatState, channel: ChatChannel, viewerEmployeeId?: string): string {
  if (channel.kind !== "direct") return `#${channel.name}`;
  const other = channel.memberEmployeeIds.find((employeeId) => employeeId !== viewerEmployeeId) ?? channel.memberEmployeeIds[0];
  return state.employees.find((employee) => employee.id === other)?.name ?? "Outside your access";
}

const readMarkerIndex = (state: ChatState, channelId: string, employeeId: string, messages: readonly ChatMessage[]): number => {
  const marker = state.chatReads.find((read) => read.channelId === channelId && read.employeeId === employeeId);
  if (!marker) return -1;
  return messages.findIndex((message) => message.id === marker.lastReadMessageId);
};

/** Messages posted after a colleague's read marker, never counting what they wrote themselves. */
export function unreadFor(state: ChatState, channelId: string, employeeId: string): ChatMessage[] {
  const messages = messagesIn(state, channelId);
  const index = readMarkerIndex(state, channelId, employeeId, messages);
  return messages.slice(index + 1).filter((message) => message.authorEmployeeId !== employeeId);
}

export const unreadCount = (state: ChatState, channelId: string, employeeId: string): number => unreadFor(state, channelId, employeeId).length;

/** The members whose read marker has reached this message, excluding its author. */
export function readersOf(state: ChatState, message: ChatMessage): string[] {
  const channel = state.chatChannels.find((candidate) => candidate.id === message.channelId);
  if (!channel) return [];
  const messages = messagesIn(state, message.channelId);
  const position = messages.findIndex((candidate) => candidate.id === message.id);
  if (position < 0) return [];
  return channel.memberEmployeeIds.filter((employeeId) => employeeId !== message.authorEmployeeId && readMarkerIndex(state, channel.id, employeeId, messages) >= position);
}

export const lastMessageIn = (state: ChatState, channelId: string): ChatMessage | undefined => messagesIn(state, channelId).at(-1);

export const chatAuthorName = (state: ChatState, employeeId: string): string =>
  state.employees.find((employee) => employee.id === employeeId)?.name ?? "Outside your access";
