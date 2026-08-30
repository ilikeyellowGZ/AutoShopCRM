import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { channelTitle, channelsForEmployee, isMember, lastMessageIn, messagesIn, readersOf, unreadCount, unreadFor } from "./chat";

const naledi = "employee-05";
const lindiwe = "employee-04";
const jacques = "employee-03";
const anele = "employee-01";

describe("channels", () => {
  it("lists only the channels a colleague belongs to, named channels before direct ones", () => {
    const state = createSeedState();

    const channels = channelsForEmployee(state, naledi);

    expect(channels.map((channel) => channel.id)).toEqual(["chat-channel-01", "chat-channel-03"]);
    expect(channels.every((channel) => isMember(channel, naledi))).toBe(true);
  });

  it("names a direct conversation after the colleague on the other side of it", () => {
    const state = createSeedState();
    const direct = state.chatChannels.find((channel) => channel.id === "chat-channel-03")!;

    expect(channelTitle(state, direct, naledi)).toBe("Lindiwe Khumalo");
    expect(channelTitle(state, direct, lindiwe)).toBe("Naledi Ndlovu");
  });

  it("names a channel the reader cannot resolve without inventing a person", () => {
    const state = createSeedState();
    const direct = state.chatChannels.find((channel) => channel.id === "chat-channel-03")!;
    state.employees = state.employees.filter((employee) => employee.id !== lindiwe);

    expect(channelTitle(state, direct, naledi)).toBe("Outside your access");
  });

  it("orders messages the same way every reader sees them", () => {
    const state = createSeedState();

    expect(messagesIn(state, "chat-channel-01").map((message) => message.id)).toEqual(["chat-message-001", "chat-message-002", "chat-message-003"]);
    expect(lastMessageIn(state, "chat-channel-01")?.id).toBe("chat-message-003");
  });

  it("orders two messages posted in the same instant by the order they were created", () => {
    const state = createSeedState();
    const first = state.chatMessages.find((message) => message.id === "chat-message-003")!;
    state.chatMessages.push({ ...first, id: "chat-message-009", body: "Same second, later message." });
    state.chatMessages.push({ ...first, id: "chat-message-010", body: "Same second, latest message." });

    expect(lastMessageIn(state, "chat-channel-01")?.id).toBe("chat-message-010");
  });
});

describe("read receipts", () => {
  it("counts what a colleague has not read, never their own messages", () => {
    const state = createSeedState();

    expect(unreadFor(state, "chat-channel-01", jacques).map((message) => message.id)).toEqual(["chat-message-002"]);
    expect(unreadCount(state, "chat-channel-01", naledi)).toBe(0);
  });

  it("treats a channel with no read marker as entirely unread", () => {
    const state = createSeedState();

    expect(unreadCount(state, "chat-channel-01", lindiwe)).toBe(2);
  });

  it("treats a marker that no longer points at a message as entirely unread", () => {
    const state = createSeedState();
    state.chatReads = state.chatReads.map((read) => read.employeeId === naledi && read.channelId === "chat-channel-01" ? { ...read, lastReadMessageId: "chat-message-999" } : read);

    expect(unreadCount(state, "chat-channel-01", naledi)).toBe(2);
  });

  it("reports who has read a message and never counts its author", () => {
    const state = createSeedState();
    const message = state.chatMessages.find((candidate) => candidate.id === "chat-message-001")!;

    expect(readersOf(state, message)).toEqual([jacques, naledi]);
    expect(readersOf(state, state.chatMessages.find((candidate) => candidate.id === "chat-message-003")!)).toEqual([naledi]);
  });

  it("reports nobody for a message in a channel that no longer exists", () => {
    const state = createSeedState();
    const message = state.chatMessages.find((candidate) => candidate.id === "chat-message-006")!;
    state.chatChannels = state.chatChannels.filter((channel) => channel.id !== "chat-channel-02");

    expect(readersOf(state, message)).toEqual([]);
  });

  it("does not count a member whose marker sits behind the message", () => {
    const state = createSeedState();
    const message = state.chatMessages.find((candidate) => candidate.id === "chat-message-005")!;

    expect(readersOf(state, message)).toEqual([]);
    expect(readersOf(state, state.chatMessages.find((candidate) => candidate.id === "chat-message-004")!)).toEqual([anele]);
  });
});
