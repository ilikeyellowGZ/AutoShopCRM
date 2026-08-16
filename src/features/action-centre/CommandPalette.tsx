import { useEffect, useId, useRef, useState } from "react";
import type { DemoState } from "../../domain/models";
import { Dialog } from "../../components/overlays/Dialog";
import { searchCommands, type CommandSearchResult } from "./commandSearch";

type CommandPaletteProps = { open: boolean; state: DemoState; onClose: () => void; onSelect: (result: CommandSearchResult) => void };

export function CommandPalette({ open, state, onClose, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const results = searchCommands(state, query);
  useEffect(() => { if (open) { setQuery(""); setActiveIndex(0); } }, [open]);
  useEffect(() => { setActiveIndex((index) => Math.min(index, Math.max(0, results.length - 1))); }, [query, results.length]);
  const choose = (result: CommandSearchResult | undefined) => { if (!result) return; onSelect(result); onClose(); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + results.length) % results.length); }
    else if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === "End") { event.preventDefault(); setActiveIndex(results.length - 1); }
    else if (event.key === "Enter") { event.preventDefault(); choose(results[activeIndex]); }
  };
  return <Dialog open={open} title="Command search" onClose={onClose} initialFocusRef={inputRef}>
    <p id={`${listId}-help`} className="command-palette-help">Search connected vehicles, customers, deals, and employee actions. Use arrow keys to choose, then Enter to open.</p>
    <input ref={inputRef} className="field-control command-palette-input" role="combobox" aria-label="Search employee records" aria-autocomplete="list" aria-controls={listId} aria-expanded={open} aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined} aria-describedby={`${listId}-help`} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={onKeyDown} placeholder="Search vehicles, customers, deals or actions" />
    {query && !results.length ? <p className="command-palette-empty" role="status">No connected records match this search.</p> : null}
    {results.length ? <ul id={listId} className="command-palette-results" role="listbox" aria-label="Search results">{results.map((result, index) => <li key={`${result.type}-${result.id}`} id={`${listId}-${result.id}`} role="option" aria-selected={index === activeIndex}><button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(result)}><span className="command-palette-type">{result.type}</span><strong>{result.title}</strong><small>{result.detail}</small></button></li>)}</ul> : null}
  </Dialog>;
}
