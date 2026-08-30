import { useState } from "react";
import type { CommentEntityType, DemoState } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { authorName, commentSegments, threadsFor, unresolvedCount } from "../../domain/comments";

type CommentRepository = Pick<DemoRepository, "addComment" | "editComment" | "resolveComment" | "reopenComment" | "toggleCommentPin" | "toggleCommentReaction">;

type CommentThreadProps = {
  state: DemoState;
  repository: CommentRepository;
  entityType: CommentEntityType;
  entityId: string;
  authorEmployeeId?: string;
  canComment?: boolean;
  highlightCommentId?: string;
};

const REACTIONS = ["👍", "👀", "🎉"] as const;

function Body({ state, body }: { state: DemoState; body: string }) {
  return <p>{commentSegments(body, state.employees).map((segment, index) => segment.kind === "mention"
    ? <strong key={`${segment.employeeId}-${index}`} className="comment-mention">@{segment.name}</strong>
    : <span key={`text-${index}`}>{segment.text}</span>)}</p>;
}

export function CommentThread({ state, repository, entityType, entityId, authorEmployeeId, canComment = false, highlightCommentId }: CommentThreadProps) {
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [error, setError] = useState("");

  const threads = threadsFor(state, entityType, entityId);
  const open = unresolvedCount(threads);
  const mayWrite = canComment && Boolean(authorEmployeeId);

  const attempt = (change: () => void, reset?: () => void) => {
    try { setError(""); change(); reset?.(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That comment could not be saved."); }
  };

  return <section className="comment-thread" aria-label="Discussion">
    <header className="crm-heading"><h3>Discussion</h3><span>{open} open</span></header>

    {mayWrite ? <div className="crm-form">
      <label htmlFor={`comment-${entityId}`}>Add a comment</label>
      <textarea id={`comment-${entityId}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder="Use @name to notify a colleague" />
      <Button onClick={() => attempt(() => repository.addComment({ entityType, entityId, body: draft, authorEmployeeId: authorEmployeeId! }), () => setDraft(""))}>Comment</Button>
    </div> : null}

    {error ? <p className="form-error" role="alert">{error}</p> : null}

    <ul className="action-centre-list">{threads.length ? threads.map(({ comment, replies }) => <li key={comment.id} aria-current={comment.id === highlightCommentId ? "true" : undefined}>
      <div>
        <div className="comment-meta">
          <strong>{authorName(state, comment.authorEmployeeId)}</strong>
          <span>{comment.createdAt.slice(0, 10)}</span>
          {comment.editedAt ? <span>edited</span> : null}
          {comment.pinned ? <StatusPill tone="info">Pinned</StatusPill> : null}
          {comment.resolvedAt ? <StatusPill tone="positive">Resolved</StatusPill> : null}
        </div>

        {editing === comment.id
          ? <div className="crm-form">
              <label htmlFor={`edit-${comment.id}`}>Edit comment</label>
              <textarea id={`edit-${comment.id}`} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} rows={2} />
              <Button onClick={() => attempt(() => repository.editComment(comment.id, editDraft), () => setEditing(null))}>Save</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          : <Body state={state} body={comment.body} />}

        {comment.reactions.length ? <p className="comment-reactions">{comment.reactions.map((reaction) => <span key={reaction.emoji}>{reaction.emoji} {reaction.employeeIds.length}</span>)}</p> : null}

        {replies.length ? <ul className="comment-replies">{replies.map((reply) => <li key={reply.id}>
          <div className="comment-meta"><strong>{authorName(state, reply.authorEmployeeId)}</strong><span>{reply.createdAt.slice(0, 10)}</span>{reply.editedAt ? <span>edited</span> : null}</div>
          <Body state={state} body={reply.body} />
        </li>)}</ul> : null}

        {replyTo === comment.id ? <div className="crm-form">
          <label htmlFor={`reply-${comment.id}`}>Reply</label>
          <textarea id={`reply-${comment.id}`} value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} rows={2} />
          <Button onClick={() => attempt(() => repository.addComment({ entityType, entityId, body: replyDraft, authorEmployeeId: authorEmployeeId!, parentCommentId: comment.id }), () => { setReplyDraft(""); setReplyTo(null); })}>Post reply</Button>
          <Button variant="secondary" onClick={() => setReplyTo(null)}>Cancel</Button>
        </div> : null}
      </div>

      {mayWrite ? <div className="action-centre-buttons">
        <Button variant="secondary" onClick={() => { setReplyTo(comment.id); setReplyDraft(""); }}>Reply</Button>
        {comment.authorEmployeeId === authorEmployeeId ? <Button variant="secondary" onClick={() => { setEditing(comment.id); setEditDraft(comment.body); }}>Edit</Button> : null}
        <Button variant="secondary" onClick={() => attempt(() => repository.toggleCommentPin(comment.id))}>{comment.pinned ? "Unpin" : "Pin"}</Button>
        {comment.resolvedAt
          ? <Button variant="secondary" onClick={() => attempt(() => repository.reopenComment(comment.id))}>Reopen</Button>
          : <Button variant="secondary" onClick={() => attempt(() => repository.resolveComment(comment.id, authorEmployeeId!))}>Resolve</Button>}
        {REACTIONS.map((emoji) => <Button key={emoji} variant="secondary" aria-label={`React ${emoji}`} onClick={() => attempt(() => repository.toggleCommentReaction(comment.id, emoji, authorEmployeeId!))}>{emoji}</Button>)}
      </div> : null}
    </li>) : <li className="my-day-empty">No discussion on this record yet.</li>}</ul>
  </section>;
}
