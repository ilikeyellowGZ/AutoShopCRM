import type { Comment, CommentEntityType, DemoState, Employee } from "./models";

export type MentionMatch = { employeeId: string; name: string; start: number; end: number };

/**
 * Matches "@Firstname Lastname" against the employee directory, longest name first so
 * "@Sipho Dlamini" is never mistaken for a shorter colleague whose name is a prefix.
 * An unmatched @word is left as plain text rather than guessed at.
 */
export function findMentions(body: string, employees: readonly Employee[]): MentionMatch[] {
  const candidates = [...employees].sort((first, second) => second.name.length - first.name.length);
  const matches: MentionMatch[] = [];
  const taken: boolean[] = new Array(body.length).fill(false);
  for (const employee of candidates) {
    const needle = `@${employee.name}`;
    let from = 0;
    for (;;) {
      const index = body.indexOf(needle, from);
      if (index < 0) break;
      const end = index + needle.length;
      const boundaryAfter = end >= body.length || !/[\w']/u.test(body[end]);
      const free = taken.slice(index, end).every((slot) => !slot);
      if (boundaryAfter && free) {
        for (let cursor = index; cursor < end; cursor += 1) taken[cursor] = true;
        matches.push({ employeeId: employee.id, name: employee.name, start: index, end });
      }
      from = index + 1;
    }
  }
  return matches.sort((first, second) => first.start - second.start);
}

export const mentionedEmployeeIds = (body: string, employees: readonly Employee[]): string[] =>
  [...new Set(findMentions(body, employees).map((match) => match.employeeId))];

export type CommentSegment = { kind: "text"; text: string } | { kind: "mention"; employeeId: string; name: string };

/** Splits a body into plain text and mentions so a renderer never has to parse it again. */
export function commentSegments(body: string, employees: readonly Employee[]): CommentSegment[] {
  const matches = findMentions(body, employees);
  if (!matches.length) return body ? [{ kind: "text", text: body }] : [];
  const segments: CommentSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) segments.push({ kind: "text", text: body.slice(cursor, match.start) });
    segments.push({ kind: "mention", employeeId: match.employeeId, name: match.name });
    cursor = match.end;
  }
  if (cursor < body.length) segments.push({ kind: "text", text: body.slice(cursor) });
  return segments;
}

export type CommentThread = { comment: Comment; replies: Comment[] };

const byCreated = (first: Comment, second: Comment) => first.createdAt.localeCompare(second.createdAt);

export function commentsFor(state: DemoState, entityType: CommentEntityType, entityId: string): Comment[] {
  return state.comments.filter((comment) => comment.entityType === entityType && comment.entityId === entityId);
}

/** Pinned threads first, then oldest first. Replies always sit under their parent. */
export function threadsFor(state: DemoState, entityType: CommentEntityType, entityId: string): CommentThread[] {
  const all = commentsFor(state, entityType, entityId);
  const roots = all.filter((comment) => comment.parentCommentId === undefined);
  const repliesByParent = new Map<string, Comment[]>();
  for (const comment of all) {
    if (comment.parentCommentId === undefined) continue;
    repliesByParent.set(comment.parentCommentId, [...(repliesByParent.get(comment.parentCommentId) ?? []), comment]);
  }
  return roots
    .sort((first, second) => Number(second.pinned) - Number(first.pinned) || byCreated(first, second))
    .map((comment) => ({ comment, replies: (repliesByParent.get(comment.id) ?? []).sort(byCreated) }));
}

export const unresolvedCount = (threads: readonly CommentThread[]): number =>
  threads.filter((thread) => thread.comment.resolvedAt === undefined).length;

export const authorName = (state: DemoState, employeeId: string): string =>
  state.employees.find((employee) => employee.id === employeeId)?.name ?? "Outside your access";
