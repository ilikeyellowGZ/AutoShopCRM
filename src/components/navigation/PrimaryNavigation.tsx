import { useId, useRef, useState, type RefObject } from "react";
import { NavigationTarget, PageKey, primaryNavigation } from "../../app/routes";
import { GroupedNavigation } from "./GroupedNavigation";

type PrimaryNavigationProps = { activePage: PageKey; onNavigate: (target: NavigationTarget) => void; canNavigate?: (target: NavigationTarget) => boolean; destinationSheetOpen?: boolean; onDestinationSheetChange?: (open: boolean, trigger?: HTMLButtonElement) => void; returnFocusRef?: RefObject<HTMLButtonElement | null>; showMobileTrigger?: boolean; branch?: string; employeeName?: string; onBranch?: () => void; onEmployeeMenu?: () => void };

export function PrimaryNavigation({ activePage, onNavigate, canNavigate = () => true, destinationSheetOpen, onDestinationSheetChange, returnFocusRef, showMobileTrigger = true, branch, employeeName, onBranch, onEmployeeMenu }: PrimaryNavigationProps) {
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
      {primaryNavigation.filter((item) => canNavigate(item.target)).map((item) => <button type="button" className="navigation-tab" key={item.label} data-tour={`nav-${item.target.page}`} aria-current={item.target.page === activePage ? "page" : undefined} onClick={() => onNavigate(item.target)}>{item.label}</button>)}
      <button type="button" className="navigation-tab" data-tour="nav-more" ref={internalTriggerRef} aria-controls={menuId} aria-expanded={open} onClick={(event) => openSheet(event.currentTarget)}>More</button>
    </div>
    {showMobileTrigger && <button type="button" className="mobile-destination-trigger" aria-label="Open destinations" aria-controls={menuId} aria-expanded={open} onClick={(event) => openSheet(event.currentTarget)}>Menu</button>}
    <GroupedNavigation open={open} menuId={menuId} onClose={() => setOpen(false)} onNavigate={onNavigate} canNavigate={canNavigate} returnFocusRef={focusReturn} branch={branch} employeeName={employeeName} onBranch={onBranch} onEmployeeMenu={onEmployeeMenu} />
  </nav>;
}
