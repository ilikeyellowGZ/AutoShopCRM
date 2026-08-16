import { useId, useRef, type ReactNode } from "react";
import { isTopOverlay, useOverlayFocus } from "./focus";

export function Dialog({ open, title, children, onClose, labelledBy, onOverlayKeyDown }: { open: boolean; title: string; children: ReactNode; onClose: () => void; labelledBy?: string; onOverlayKeyDown?: (event: KeyboardEvent) => void }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const overlayId = useOverlayFocus(open, dialogRef, onClose, onOverlayKeyDown);
  if (!open) return null;
  return <div className="overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && isTopOverlay(overlayId)) onClose(); }}><div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? titleId} tabIndex={-1}><header className="overlay-header"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>Close</button></header>{children}</div></div>;
}
