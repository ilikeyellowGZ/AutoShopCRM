import { useEffect, type RefObject } from "react";
import { NavigationTarget, navigationGroups } from "../../app/routes";

type GroupedNavigationProps = { open: boolean; menuId: string; onClose: () => void; onNavigate: (target: NavigationTarget) => void; returnFocusRef: RefObject<HTMLButtonElement | null> };

export function GroupedNavigation({ open, menuId, onClose, onNavigate, returnFocusRef }: GroupedNavigationProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); returnFocusRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, returnFocusRef]);
  if (!open) return null;
  return <div className="grouped-navigation" id={menuId} role="menu" aria-label="Employee destinations">
    {navigationGroups.map((group) => <section className="navigation-menu-group" key={group.label} aria-labelledby={`${menuId}-${group.label}`}>
      <h2 id={`${menuId}-${group.label}`}>{group.label}</h2>
      {group.destinations.map((destination) => <button type="button" key={destination.label} role="menuitem" onClick={() => { onNavigate(destination.target); onClose(); returnFocusRef.current?.focus(); }}>{destination.label}</button>)}
    </section>)}
  </div>;
}
