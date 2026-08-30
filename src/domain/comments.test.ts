import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import type { Employee } from "./models";
import { commentSegments, findMentions, mentionedEmployeeIds, threadsFor, unresolvedCount } from "./comments";

const employee = (id: string, name: string): Employee => ({
  id, name, accountId: undefined, email: `${id}@motorcrm.demo`, title: "Tester",
  department: "Sales", branch: "Sandton", branchId: "org-motorgroup-sa-branch-sandton", status: "Active",
});

const directory = [
  employee("employee-a", "Sipho Dlamini"),
  employee("employee-b", "Sipho Dlamini Junior"),
  employee("employee-c", "Naledi Ndlovu"),
];

describe("mention parsing", () => {
  it("finds a mention and reports where it sits", () => {
    const matches = findMentions("Please review @Naledi Ndlovu today", directory);
    expect(matches).toHaveLength(1);
    expect(matches[0].employeeId).toBe("employee-c");
    expect("Please review @Naledi Ndlovu today".slice(matches[0].start, matches[0].end)).toBe("@Naledi Ndlovu");
  });

  it("prefers the longest matching name so a colleague is not mistaken for a prefix", () => {
    expect(mentionedEmployeeIds("ping @Sipho Dlamini Junior", directory)).toEqual(["employee-b"]);
    expect(mentionedEmployeeIds("ping @Sipho Dlamini", directory)).toEqual(["employee-a"]);
  });

  it("ignores an @word that is not a colleague", () => {
    expect(mentionedEmployeeIds("email @support about this", directory)).toEqual([]);
  });

  it("reports each mentioned person once, however often they are named", () => {
    expect(mentionedEmployeeIds("@Naledi Ndlovu and @Naledi Ndlovu again", directory)).toEqual(["employee-c"]);
  });

  it("does not match a name that runs into another word", () => {
    expect(mentionedEmployeeIds("@Naledi Ndlovus", directory)).toEqual([]);
  });

  it("splits a body into text and mentions without losing characters", () => {
    const body = "Hi @Naledi Ndlovu, please check.";
    const segments = commentSegments(body, directory);

    expect(segments.map((segment) => segment.kind === "mention" ? `@${segment.name}` : segment.text).join("")).toBe(body);
    expect(segments.filter((segment) => segment.kind === "mention")).toHaveLength(1);
  });

  it("returns the whole body as text when nobody is mentioned", () => {
    expect(commentSegments("no mentions here", directory)).toEqual([{ kind: "text", text: "no mentions here" }]);
  });
});

describe("threads", () => {
  it("nests replies under their parent and never lists them twice", () => {
    const threads = threadsFor(createSeedState(), "board-item", "board-item-001");

    expect(threads).toHaveLength(1);
    expect(threads[0].comment.id).toBe("comment-01");
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(["comment-02"]);
  });

  it("puts pinned discussions first", () => {
    const state = createSeedState();
    state.comments.push({ ...state.comments[0], id: "comment-90", parentCommentId: undefined, pinned: false, createdAt: "2026-08-10T09:00:00+02:00" });

    const threads = threadsFor(state, "board-item", "board-item-001");

    expect(threads[0].comment.pinned).toBe(true);
  });

  it("counts only unresolved discussions as open", () => {
    const state = createSeedState();
    expect(unresolvedCount(threadsFor(state, "customer", "customer-01"))).toBe(0);
    expect(unresolvedCount(threadsFor(state, "vehicle", "vehicle-01"))).toBe(1);
  });
});
