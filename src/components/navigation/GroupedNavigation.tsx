import { useEffect, useRef, type RefObject } from "react";
import { NavigationTarget, navigationGroups, primaryNavigation } from "../../app/routes";

type GroupedNavigationProps = { open: boolean; menuId: string; onClose: () => void; onNavigate: (target: NavigationTarget) => void; returnFocusRef: RefObject<HTMLButtonElement | null> };

export function GroupedNavigation({ open, menuId, onClose, onNavigate, returnFocusRef }: GroupedNavigationProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); returnFocusRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, returnFocusRef]);
  if (!open) return null;
  return <aside className="employee-destination-sheet" id={menuId} aria-labelledby={`${menuId}-title`}>
    <div className="destination-sheet-header"><h2 id={`${menuId}-title`}>Destinations</h2><button ref={closeButtonRef} type="button" className="destination-sheet-close" onClick={() => { onClose(); returnFocusRef.current?.focus(); }}>Close destinations</button></div>
    <nav aria-label="Employee destinations"><div className="destination-groups">
      <section className="navigation-menu-group" aria-labelledby={`${menuId}-primary`}><h3 id={`${menuId}-primary`}>Primary</h3><ul>{primaryNavigation.map((destination) => <li key={destination.label}><button type="button" onClick={() => { onNavigate(destination.target); onClose(); returnFocusRef.current?.focus(); }}>{destination.label}</button></li>)}</ul></section>
      {navigationGroups.map((group) => <section className="navigation-menu-group" key={group.label} aria-labelledby={`${menuId}-${group.label}`}>
        <h3 id={`${menuId}-${group.label}`}>{group.label}</h3><ul>{group.destinations.map((destination) => <li key={destination.label}><button type="button" onClick={() => { onNavigate(destination.target); onClose(); returnFocusRef.current?.focus(); }}>{destination.label}</button></li>)}</ul>
      </section>)}
    </div></nav>
  </aside>;
}
