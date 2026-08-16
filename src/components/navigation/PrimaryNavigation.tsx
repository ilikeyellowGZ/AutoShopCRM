import { useId, useRef, useState, type RefObject } from "react";
import { NavigationTarget, PageKey, primaryNavigation } from "../../app/routes";
import { GroupedNavigation } from "./GroupedNavigation";

type PrimaryNavigationProps = { activePage: PageKey; onNavigate: (target: NavigationTarget) => void; destinationSheetOpen?: boolean; onDestinationSheetChange?: (open: boolean, trigger?: HTMLButtonElement) => void; returnFocusRef?: RefObject<HTMLButtonElement | null>; showMobileTrigger?: boolean };

export function PrimaryNavigation({ activePage, onNavigate, destinationSheetOpen, onDestinationSheetChange, returnFocusRef, showMobileTrigger = true }: PrimaryNavigationProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const open = destinationSheetOpen ?? isSheetOpen;
  const focusReturn = returnFocusRef ?? internalTriggerRef;
  const setOpen = (next: boolean, trigger?: HTMLButtonElement) => {
    if (trigger) focusReturn.current = trigger;
    onDestinationSheetChange?.(next, trigger);
    if (destinationSheetOpen === undefined) setIsSheetOpen(next);
  };
  const openSheet = (trigger: HTMLButtonElement) => setOpen(true, trigger);
  return <nav className="primary-navigation" aria-label="Primary employee navigation">
    <div className="primary-navigation-scroll">
      {primaryNavigation.map((item) => <button type="button" className="navigation-tab" key={item.label} aria-current={item.target.page === activePage ? "page" : undefined} onClick={() => onNavigate(item.target)}>{item.label}</button>)}
      <button type="button" className="navigation-tab" ref={internalTriggerRef} aria-controls={menuId} aria-expanded={open} onClick={(event) => openSheet(event.currentTarget)}>More</button>
    </div>
    {showMobileTrigger && <button type="button" className="mobile-destination-trigger" aria-label="Open destinations" aria-controls={menuId} aria-expanded={open} onClick={(event) => openSheet(event.currentTarget)}>Menu</button>}
    <GroupedNavigation open={open} menuId={menuId} onClose={() => setOpen(false)} onNavigate={onNavigate} returnFocusRef={focusReturn} />
  </nav>;
}
