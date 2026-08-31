import { useEffect, useState } from "react";
import type { ChatChannel, DemoState, Tone } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import type { NavigationTarget } from "../../app/routes";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { commentSegments } from "../../domain/comments";
import { chatAuthorName, channelTitle, channelsForEmployee, lastMessageIn, messagesIn, readersOf, unreadCount } from "../../domain/chat";
import { presenceForAccount, type PresenceReading } from "../../domain/sessions";

type ChatRepository = Pick<DemoRepository, "sendChatMessage" | "markChannelRead">;

type ChatPageProps = {
  state: DemoState;
  repository: ChatRepository;
  employeeId?: string;
  canPost?: boolean;
  channelId?: string;
  onNavigate?: (target: NavigationTarget) => void;
  now?: string;
};

const PRESENCE_LABELS: Record<PresenceReading["presence"], { label: string; tone: Tone }> = {
  online: { label: "Online", tone: "positive" },
  idle: { label: "Idle", tone: "info" },
  away: { label: "Away", tone: "warning" },
  offline: { label: "Signed out", tone: "neutral" },
  unknown: { label: "No signal", tone: "neutral" },
};

const stamp = (value: string) => `${value.slice(0, 10)} ${value.slice(11, 16)}`;

function Body({ state, body }: { state: DemoState; body: string }) {
  return <p>{commentSegments(body, state.employees).map((segment, index) => segment.kind === "mention"
    ? <strong key={`${segment.employeeId}-${index}`} className="comment-mention">@{segment.name}</strong>
    : <span key={`text-${index}`}>{segment.text}</span>)}</p>;
}

function Members({ state, channel, now }: { state: DemoState; channel: ChatChannel; now: string }) {
  return <aside className="chat-presence" aria-label="Who is here">
    <header className="crm-heading"><h3>Members</h3><span>{channel.memberEmployeeIds.length}</span></header>
    <ul className="action-centre-list">{channel.memberEmployeeIds.map((employeeId) => {
      const employee = state.employees.find((candidate) => candidate.id === employeeId);
      const reading = presenceForAccount(state.sessions, employee?.accountId, now);
      const presence = PRESENCE_LABELS[reading.presence];
      return <li key={employeeId}>
        <div><strong>{employee?.name ?? "Outside your access"}</strong><p>{employee?.title ?? ""}</p></div>
        <div className="action-centre-buttons"><StatusPill tone={presence.tone}>{presence.label}</StatusPill></div>
      </li>;
    })}</ul>
  </aside>;
}

export function ChatPage({ state, repository, employeeId, canPost = false, channelId, onNavigate, now: fixedNow }: ChatPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => fixedNow ?? new Date().toISOString());

  useEffect(() => {
    if (fixedNow) { setNow(fixedNow); return; }
    const timer = window.setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => window.clearInterval(timer);
  }, [fixedNow]);

  const channels = employeeId ? channelsForEmployee(state, employeeId) : [];
  const selected = channels.find((channel) => channel.id === (selectedId ?? channelId)) ?? channels[0];
  const lastReadableId = selected && employeeId ? lastMessageIn(state, selected.id)?.id : undefined;

  useEffect(() => {
    if (!selected || !employeeId || !lastReadableId) return;
    try { repository.markChannelRead(selected.id, employeeId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "That conversation could not be marked as read."); }
  }, [employeeId, lastReadableId, repository, selected]);

  const heading = <header className="crm-heading">
    <p className="crm-eyebrow">Collaboration</p>
    <h1 id="chat-title">Staff chat</h1>
  </header>;

  if (!employeeId) return <section className="chat-page" aria-labelledby="chat-title">{heading}<p className="my-day-empty">This demo account is not linked to an employee record, so staff chat has nobody to speak as.</p></section>;
  if (!selected) return <section className="chat-page" aria-labelledby="chat-title">{heading}<p className="my-day-empty">You are not a member of any channel yet.</p></section>;

  const messages = messagesIn(state, selected.id);
  const send = () => {
    try {
      setError("");
      repository.sendChatMessage({ channelId: selected.id, authorEmployeeId: employeeId, body: draft });
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That message could not be sent.");
    }
  };

  return <section className="chat-page" data-tour="chat-page" aria-labelledby="chat-title">
    {heading}
    <div className="chat-layout">
      <nav className="chat-channels" aria-label="Conversations">
        <ul>{channels.map((channel) => {
          const unread = unreadCount(state, channel.id, employeeId);
          return <li key={channel.id}>
            <Button variant={channel.id === selected.id ? "primary" : "secondary"} aria-pressed={channel.id === selected.id} onClick={() => { setSelectedId(channel.id); setError(""); onNavigate?.({ page: "chat", subview: channel.id }); }}>
              {channelTitle(state, channel, employeeId)}{unread ? ` · ${unread} unread` : ""}
            </Button>
          </li>;
        })}</ul>
      </nav>

      <div className="chat-stream">
        <header className="crm-heading">
          <h2>{channelTitle(state, selected, employeeId)}</h2>
          <span>{selected.topic || "Direct conversation"}</span>
        </header>

        <ul className="chat-messages">{messages.length ? messages.map((message) => {
          const readers = readersOf(state, message);
          return <li key={message.id} className="chat-message">
            <div className="comment-meta">
              <strong>{chatAuthorName(state, message.authorEmployeeId)}</strong>
              <span>{stamp(message.createdAt)}</span>
              {message.editedAt ? <span>edited</span> : null}
            </div>
            <Body state={state} body={message.body} />
            {message.authorEmployeeId === employeeId
              ? <p className="chat-receipt">{readers.length ? `Seen by ${readers.map((reader) => chatAuthorName(state, reader)).join(", ")}` : "Not seen yet"}</p>
              : null}
          </li>;
        }) : <li className="my-day-empty">No messages in this conversation yet.</li>}</ul>

        {canPost ? <div className="chat-composer">
          <label className="sr-only" htmlFor="chat-draft">Message {channelTitle(state, selected, employeeId)}</label>
          <textarea id="chat-draft" className="chat-composer-input" value={draft} onChange={(event) => { setDraft(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && draft.trim()) { event.preventDefault(); send(); } }} rows={2} placeholder="Use @name to notify a member of this channel" />
          <div className="chat-composer-actions"><span className="chat-composer-hint">Enter to send · Shift + Enter for a new line</span><Button onClick={send}>Send</Button></div>
        </div> : <p className="my-day-empty">You can read this conversation but not post in it.</p>}

        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </div>

      <Members state={state} channel={selected} now={now} />
    </div>
  </section>;
}
