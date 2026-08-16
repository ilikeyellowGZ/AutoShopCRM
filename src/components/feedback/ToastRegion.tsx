import type { Tone } from "../../domain/models";

export type Toast = { id: string; title: string; detail?: string; tone?: Tone };

export function ToastRegion({ toasts, onDismiss }: { toasts: readonly Toast[]; onDismiss: (id: string) => void }) {
  return <div className="toast-region" aria-live="polite" aria-label="Notifications">{toasts.map((toast) => <article className={`toast toast--${toast.tone ?? "neutral"}`} key={toast.id}><div><strong>{toast.title}</strong>{toast.detail ? <p>{toast.detail}</p> : null}</div><button type="button" aria-label={`Dismiss ${toast.title}`} onClick={() => onDismiss(toast.id)}>Close</button></article>)}</div>;
}
