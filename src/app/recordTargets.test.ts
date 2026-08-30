import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { targetForRelatedId } from "./recordTargets";

describe("resolving what a notification points at", () => {
  it("opens the exact record for a connected business record", () => {
    const state = createSeedState();

    expect(targetForRelatedId(state, "vehicle-01")).toEqual({ page: "inventory", subview: "vehicle-01", recordType: "vehicle", recordId: "vehicle-01" });
    expect(targetForRelatedId(state, "deal-02")).toEqual({ page: "sales", subview: "deals", recordType: "deal", recordId: "deal-02" });
  });

  it("opens the conversation a chat mention belongs to", () => {
    const state = createSeedState();

    expect(targetForRelatedId(state, "chat-channel-01")).toEqual({ page: "chat", subview: "chat-channel-01" });
  });

  it("opens the board a mentioned item sits on", () => {
    const state = createSeedState();

    expect(targetForRelatedId(state, "board-item-001")).toEqual({ page: "work", subview: "board-01" });
  });

  it("offers nothing for a record the reader cannot reach", () => {
    const state = createSeedState();
    state.chatChannels = [];
    state.boardItems = [];

    expect(targetForRelatedId(state, "chat-channel-01")).toBeUndefined();
    expect(targetForRelatedId(state, "vehicle-999")).toBeUndefined();
  });
});
