import { useId, useRef, useState } from "react";
import { NavigationTarget, PageKey, primaryNavigation } from "../../app/routes";
import { GroupedNavigation } from "./GroupedNavigation";

type PrimaryNavigationProps = { activePage: PageKey; onNavigate: (target: NavigationTarget) => void };

export function PrimaryNavigation({ activePage, onNavigate }: PrimaryNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  return <nav className="primary-navigation" aria-label="Primary employee navigation">
    <div className="primary-navigation-scroll">
      {primaryNavigation.map((item) => <button type="button" className="navigation-tab" key={item.label} aria-current={item.target.page === activePage ? "page" : undefined} onClick={() => onNavigate(item.target)}>{item.label}</button>)}
      <button type="button" className="navigation-tab" ref={moreButtonRef} aria-controls={menuId} aria-expanded={isMenuOpen} aria-haspopup="menu" onClick={() => setIsMenuOpen((open) => !open)}>More</button>
    </div>
    <GroupedNavigation open={isMenuOpen} menuId={menuId} onClose={() => setIsMenuOpen(false)} onNavigate={onNavigate} returnFocusRef={moreButtonRef} />
  </nav>;
}
