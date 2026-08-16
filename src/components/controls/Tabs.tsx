import { useId, useRef, type ReactNode } from "react";

export type TabItem<T extends string> = { id: T; label: string; panel: ReactNode; disabled?: boolean };

export function Tabs<T extends string>({ items, activeId, onChange, label }: { items: readonly TabItem<T>[]; activeId: T; onChange: (id: T) => void; label: string }) {
  const prefix = useId();
  const tabs = useRef(new Map<T, HTMLButtonElement>()).current;
  const enabled = items.filter((item) => !item.disabled);
  const move = (id: T, direction: -1 | 1 | "first" | "last") => {
    const index = enabled.findIndex((item) => item.id === id);
    const next = direction === "first" ? enabled[0] : direction === "last" ? enabled.at(-1) : enabled[(index + direction + enabled.length) % enabled.length];
    if (next) { onChange(next.id); tabs.get(next.id)?.focus(); }
  };
  const active = items.find((item) => item.id === activeId) ?? enabled[0];
  return <><div className="ui-tabs" role="tablist" aria-label={label}>{items.map((item) => { const tabId = `${prefix}-${item.id}-tab`; const panelId = `${prefix}-${item.id}-panel`; return <button key={item.id} ref={(element) => { if (element) tabs.set(item.id, element); else tabs.delete(item.id); }} type="button" className="ui-tab" role="tab" id={tabId} aria-controls={panelId} aria-selected={active?.id === item.id} tabIndex={active?.id === item.id ? 0 : -1} disabled={item.disabled} onClick={() => onChange(item.id)} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(item.id, 1); } if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(item.id, -1); } if (event.key === "Home") { event.preventDefault(); move(item.id, "first"); } if (event.key === "End") { event.preventDefault(); move(item.id, "last"); } }}>{item.label}</button>; })}</div>{active ? <section role="tabpanel" id={`${prefix}-${active.id}-panel`} aria-labelledby={`${prefix}-${active.id}-tab`} tabIndex={0}>{active.panel}</section> : null}</>;
}
