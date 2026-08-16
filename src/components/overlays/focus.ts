import { useEffect, useRef, type RefObject } from "react";

const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const focusable = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>(selector)).filter((item) => !item.hasAttribute("hidden"));

type OverlayEntry = { id: symbol; container: RefObject<HTMLElement | null>; restoreFocus: HTMLElement | null; order: number };
const overlays: OverlayEntry[] = [];
let lockCount = 0;
let previousOverflow = "";
let order = 0;

export function isTopOverlay(id: symbol) {
  const top = overlays.filter((entry) => !overlays.some((other) => other !== entry && entry.container.current?.contains(other.container.current))).sort((a, b) => b.order - a.order)[0];
  return top?.id === id;
}

export function useOverlayFocus(open: boolean, container: RefObject<HTMLElement | null>, onClose: () => void, onOverlayKeyDown?: (event: KeyboardEvent) => void) {
  const id = useRef(Symbol("overlay")).current;
  const onCloseRef = useRef(onClose);
  const onOverlayKeyDownRef = useRef(onOverlayKeyDown);
  onCloseRef.current = onClose;
  onOverlayKeyDownRef.current = onOverlayKeyDown;
  useEffect(() => {
    if (!open) return;
    const entry = { id, container, restoreFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null, order: ++order };
    overlays.push(entry);
    if (lockCount++ === 0) previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (focusable(container.current ?? document.body)[0] ?? container.current)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (!isTopOverlay(id)) return;
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key === "Tab") {
        if (!container.current) return;
        const elements = focusable(container.current);
        if (!elements.length) { event.preventDefault(); container.current.focus(); return; }
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        return;
      }
      onOverlayKeyDownRef.current?.(event);
    };
    document.addEventListener("keydown", keydown);
    return () => { overlays.splice(overlays.findIndex((item) => item.id === id), 1); if (--lockCount === 0) document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); entry.restoreFocus?.focus(); };
  }, [open, container, id]);
  return id;
}
