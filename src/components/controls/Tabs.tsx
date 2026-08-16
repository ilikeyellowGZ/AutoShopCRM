export type TabItem<T extends string> = { id: T; label: string; disabled?: boolean };

export function Tabs<T extends string>({ items, activeId, onChange, label }: { items: readonly TabItem<T>[]; activeId: T; onChange: (id: T) => void; label: string }) {
  return <div className="ui-tabs" role="tablist" aria-label={label}>{items.map((item) => <button key={item.id} type="button" className="ui-tab" role="tab" aria-selected={activeId === item.id} disabled={item.disabled} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>;
}
