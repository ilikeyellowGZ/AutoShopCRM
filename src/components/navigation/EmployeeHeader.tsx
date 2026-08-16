import { type RefObject } from "react";
import { WeeleeLogo } from "../brand/WeeleeLogo";

type EmployeeHeaderProps = {
  branch: string;
  employeeName: string;
  employeeRole: string;
  actionCount?: number;
  notificationCount?: number;
  onSearch?: () => void;
  onActionCentre?: () => void;
  onNotifications?: () => void;
  onEmployeeMenu?: () => void;
  onOpenDestinations?: () => void;
  destinationTriggerRef?: RefObject<HTMLButtonElement | null>;
};

export function EmployeeHeader({ branch, employeeName, employeeRole, actionCount = 0, notificationCount = 0, onSearch, onActionCentre, onNotifications, onEmployeeMenu, onOpenDestinations, destinationTriggerRef }: EmployeeHeaderProps) {
  return <header className="weelee-header">
    <div className="weelee-header-inner">
      <WeeleeLogo className="weelee-logo" />
      <button type="button" className="weelee-branch" aria-label={`Selected branch: ${branch}`}>{branch}</button>
      <button type="button" className="weelee-search" onClick={onSearch} aria-label="Search. Press Control or Command K">Search <kbd>Ctrl K</kbd></button>
      <div className="weelee-header-actions">
        <button type="button" className="weelee-utility" onClick={onActionCentre}>Action Centre <span aria-label={`${actionCount} actions`}>{actionCount}</span></button>
        <button type="button" className="weelee-utility" onClick={onNotifications}>Notifications <span aria-label={`${notificationCount} notifications`}>{notificationCount}</span></button>
        <button type="button" className="weelee-employee" onClick={onEmployeeMenu} aria-label={`${employeeName}, ${employeeRole}, demo mode`}><span>{employeeName}</span><small>{employeeRole} · Demo</small></button>
        <button type="button" className="weelee-header-menu" ref={destinationTriggerRef} aria-label="Open destinations" onClick={onOpenDestinations}>Menu</button>
      </div>
    </div>
  </header>;
}
