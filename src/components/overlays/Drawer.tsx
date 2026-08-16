import { useId, useRef, type ReactNode } from "react";
import { useOverlayFocus } from "./focus";

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  useOverlayFocus(open, drawerRef, onClose);
  if (!open) return null;
  return <div className="overlay-backdrop overlay-backdrop--drawer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside ref={drawerRef} className="drawer" aria-modal="true" aria-labelledby={titleId} role="dialog" tabIndex={-1}><header className="overlay-header"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}>Close</button></header>{children}</aside></div>;
}
