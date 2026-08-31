import { useEffect, useRef, useState } from "react";
import type { NavigationTarget } from "../../app/routes";
import { useOverlayFocus } from "../../components/overlays/focus";
import type { TourStep } from "./tutorialContent";

type Rect = { top: number; left: number; width: number; height: number };
const toRect = (element: Element): Rect => { const box = element.getBoundingClientRect(); return { top: box.top, left: box.left, width: box.width, height: box.height }; };
const MAX_MEASURE_ATTEMPTS = 40;

export function TourOverlay({ steps, roleTitle, accentColor, onNavigate, onFinish }: { steps: TourStep[]; roleTitle: string; accentColor?: string; onNavigate: (target: NavigationTarget) => void; onFinish: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const current = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => { onNavigate(current.target); }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setRect(null);
    if (!current.highlight) return;
    let attempts = 0;
    let frame = 0;
    const measure = () => {
      const target = document.querySelector(`[data-tour="${current.highlight}"]`);
      if (target) { setRect(toRect(target)); return; }
      attempts += 1;
      if (attempts < MAX_MEASURE_ATTEMPTS) frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [stepIndex, current.highlight]);

  useEffect(() => {
    if (!current.highlight) return;
    const onViewportChange = () => { const target = document.querySelector(`[data-tour="${current.highlight}"]`); if (target) setRect(toRect(target)); };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => { window.removeEventListener("resize", onViewportChange); window.removeEventListener("scroll", onViewportChange, true); };
  }, [current.highlight]);

  useOverlayFocus(true, panelRef, onFinish, (event) => {
    if (event.key === "ArrowRight" || event.key === "Enter") { event.preventDefault(); if (isLast) onFinish(); else setStepIndex((index) => index + 1); }
    if (event.key === "ArrowLeft" && !isFirst) { event.preventDefault(); setStepIndex((index) => index - 1); }
  });

  const margin = 12;
  const calloutStyle: { [key: string]: string | number } = rect ? (() => {
    const spaceBelow = window.innerHeight - rect.top - rect.height;
    const placeAbove = spaceBelow < 220 && rect.top > 220;
    const top = placeAbove ? Math.max(margin, rect.top - margin) : Math.min(window.innerHeight - margin, rect.top + rect.height + margin);
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - 340 - margin);
    return { position: "fixed", top, left, transform: placeAbove ? "translateY(-100%)" : "none" };
  })() : {};

  return <div className="tour-overlay" role="presentation">
    {rect ? <>
      <div className="tour-band tour-band-top" style={{ height: Math.max(0, rect.top) }} />
      <div className="tour-band tour-band-bottom" style={{ top: rect.top + rect.height }} />
      <div className="tour-band tour-band-left" style={{ top: rect.top, height: rect.height, width: Math.max(0, rect.left) }} />
      <div className="tour-band tour-band-right" style={{ top: rect.top, height: rect.height, left: rect.left + rect.width }} />
      <div className="tour-ring" style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, borderColor: accentColor }} />
    </> : <div className="tour-band tour-band-full" />}
    <div className="tour-callout" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body" tabIndex={-1} style={rect ? calloutStyle : undefined}>
      <p className="tour-eyebrow">{roleTitle} tour · Step {stepIndex + 1} of {steps.length}</p>
      <h2 id="tour-title">{current.title}</h2>
      <p id="tour-body">{current.body}</p>
      <div className="tour-callout-actions">
        <button type="button" className="tour-skip" onClick={onFinish}>Skip tour</button>
        <div className="tour-callout-nav">
          {!isFirst ? <button type="button" className="ui-button ui-button--secondary" onClick={() => setStepIndex((index) => index - 1)}>Back</button> : null}
          <button type="button" className="ui-button ui-button--primary" style={accentColor ? { background: accentColor, borderColor: accentColor } : undefined} onClick={() => { if (isLast) onFinish(); else setStepIndex((index) => index + 1); }}>{isLast ? "Finish" : "Next"}</button>
        </div>
      </div>
    </div>
  </div>;
}
