import { useEffect, useRef } from "react";

const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const focusable = (element: HTMLElement) => Array.from(element.querySelectorAll<HTMLElement>(selector)).filter((item) => !item.hasAttribute("hidden"));

export function useOverlayFocus(open: boolean, container: React.RefObject<HTMLElement | null>, onClose: () => void) {
  const restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => (focusable(container.current ?? document.body)[0] ?? container.current)?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !container.current) return;
      const elements = focusable(container.current);
      if (!elements.length) { event.preventDefault(); container.current.focus(); return; }
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { window.cancelAnimationFrame(frame); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keydown); restoreFocus.current?.focus(); };
  }, [open, container, onClose]);
}
