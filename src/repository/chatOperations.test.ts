import { describe, expect, it } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository } from "./demoRepository";
import { validateDemoState } from "./seedIntegrity";
import { getDemoAccount } from "../app/access";
import { scopeStateForAccount } from "../app/stateScope";
import { unreadCount } from "../domain/chat";

const repo = () => createDemoRepository(memoryStorage());
const jacques = "employee-03";
const naledi = "employee-05";
const kabelo = "employee-07";

describe("sending a chat message", () => {
  it("stores a trimmed message against its channel", () => {
    const repository = repo();

    const id = repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "  Buyer is on the way  " });
    const message = repository.getState().chatMessages.find((candidate) => candidate.id === id);

    expect(message?.body).toBe("Buyer is on the way");
    expect(message?.channelId).toBe("chat-channel-01");
    expect(validateDemoState(repository.getState())).toEqual([]);
  });

  it("refuses an empty message, an unknown channel and a colleague who is not a member", () => {
    const repository = repo();

    expect(() => repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "   " })).toThrow("A message needs something to say.");
    expect(() => repository.sendChatMessage({ channelId: "chat-channel-99", authorEmployeeId: naledi, body: "hello" })).toThrow("Channel not found.");
    expect(() => repository.sendChatMessage({ channelId: "chat-channel-02", authorEmployeeId: naledi, body: "hello" })).toThrow("Only channel members can post here.");
  });

  it("notifies a mentioned member and links the notification to the message", () => {
    const repository = repo();

    const id = repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "@Jacques van der Merwe can you approve this?" });

    const state = repository.getState();
    const notification = state.notifications.find((candidate) => candidate.chatMessageId === id);
    expect(state.chatMessages.find((candidate) => candidate.id === id)?.mentions).toEqual([jacques]);
    expect(notification?.category).toBe("mention");
    expect(notification?.priority).toBe("high");
    expect(notification?.recipientEmployeeId).toBe(jacques);
    expect(notification?.relatedId).toBe("chat-channel-01");
    expect(validateDemoState(state)).toEqual([]);
  });

  it("leaves a mention of somebody outside the channel as plain text", () => {
    const repository = repo();
    const before = repository.getState().notifications.length;

    const id = repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "@Kabelo Molefe is not in here" });

    const state = repository.getState();
    expect(state.chatMessages.find((candidate) => candidate.id === id)?.mentions).toEqual([]);
    expect(state.notifications).toHaveLength(before);
  });

  it("records the message in the audit trail", () => {
    const repository = repo();

    repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "Noted" });

    expect(repository.getState().activities[0]).toMatchObject({ action: "Chat message sent", detail: "A message was posted in #sales-floor." });
  });
});

describe("read markers", () => {
  it("advances a marker to the newest message and clears the unread count", () => {
    const repository = repo();
    expect(unreadCount(repository.getState(), "chat-channel-01", jacques)).toBe(1);

    repository.markChannelRead("chat-channel-01", jacques);

    expect(unreadCount(repository.getState(), "chat-channel-01", jacques)).toBe(0);
    expect(validateDemoState(repository.getState())).toEqual([]);
  });

  it("creates a marker for a reader who has none yet", () => {
    const repository = repo();

    repository.markChannelRead("chat-channel-02", kabelo);

    expect(repository.getState().chatReads.some((read) => read.channelId === "chat-channel-02" && read.employeeId === kabelo)).toBe(true);
  });

  it("stays out of the audit trail because reading is not a business action", () => {
    const repository = repo();
    const before = repository.getState().activities.length;

    repository.markChannelRead("chat-channel-01", jacques);

    expect(repository.getState().activities).toHaveLength(before);
  });

  it("does nothing when the marker is already on the newest message", () => {
    const repository = repo();
    const before = repository.getState().chatReads.find((read) => read.channelId === "chat-channel-01" && read.employeeId === naledi);

    repository.markChannelRead("chat-channel-01", naledi);

    expect(repository.getState().chatReads.find((read) => read.channelId === "chat-channel-01" && read.employeeId === naledi)).toEqual(before);
  });

  it("refuses a channel the reader does not belong to", () => {
    const repository = repo();

    expect(() => repository.markChannelRead("chat-channel-02", naledi)).toThrow("Only channel members can read here.");
    expect(() => repository.markChannelRead("chat-channel-99", naledi)).toThrow("Channel not found.");
  });
});

describe("chat visibility", () => {
  it("gives a colleague only the channels they belong to", () => {
    const state = repo().getState();

    const forNaledi = scopeStateForAccount(state, getDemoAccount("sales"));
    const forKabelo = scopeStateForAccount(state, getDemoAccount("stock"));

    expect(forNaledi.chatChannels.map((channel) => channel.id)).toEqual(["chat-channel-01", "chat-channel-03"]);
    expect(forKabelo.chatChannels.map((channel) => channel.id)).toEqual(["chat-channel-02"]);
    expect(forKabelo.chatMessages.every((message) => message.channelId === "chat-channel-02")).toBe(true);
  });

  it("gives an account with no channels nothing to read", () => {
    const state = repo().getState();

    const forAuditor = scopeStateForAccount(state, getDemoAccount("auditor"));

    expect(forAuditor.chatChannels).toEqual([]);
    expect(forAuditor.chatMessages).toEqual([]);
    expect(forAuditor.chatReads).toEqual([]);
  });

  it("makes the members of a shared channel readable without opening the wider directory", () => {
    const state = repo().getState();

    const forNaledi = scopeStateForAccount(state, getDemoAccount("sales"));

    expect(forNaledi.employees.map((employee) => employee.id).sort()).toEqual(["employee-01", "employee-03", "employee-04", "employee-05"]);
    expect(forNaledi.employees.some((employee) => employee.id === "employee-08")).toBe(false);
  });

  it("keeps channel membership inside its own organization", () => {
    const repository = repo();
    const state = repository.getState();
    state.organizations.push({ id: "org-rival-motors", name: "Rival Motors", tradingName: "Rival" });
    state.chatChannels.push({ id: "chat-channel-90", organizationId: "org-rival-motors", kind: "channel", name: "rival-floor", topic: "", memberEmployeeIds: ["employee-05"], createdAt: "2026-08-10T08:00:00+02:00" });

    const forNaledi = scopeStateForAccount(state, getDemoAccount("sales"));

    expect(forNaledi.chatChannels.some((channel) => channel.id === "chat-channel-90")).toBe(false);
  });

  it("delivers a chat mention only to the colleague who was named", () => {
    const repository = repo();
    const id = repository.sendChatMessage({ channelId: "chat-channel-01", authorEmployeeId: naledi, body: "@Jacques van der Merwe please look" });
    const state = repository.getState();

    const forJacques = scopeStateForAccount(state, getDemoAccount("manager"));
    const forLindiwe = scopeStateForAccount(state, getDemoAccount("salesmanager"));

    expect(forJacques.notifications.some((notification) => notification.chatMessageId === id)).toBe(true);
    expect(forLindiwe.notifications.some((notification) => notification.chatMessageId === id)).toBe(false);
  });
});
