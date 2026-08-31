import { type RefObject } from "react";
import { WeeleeLogo } from "../brand/WeeleeLogo";

type EmployeeHeaderProps = {
  branch: string;
  employeeName: string;
  employeeRole: string;
  employeeColor?: string;
  actionCount?: number;
  notificationCount?: number;
  onSearch?: () => void;
  onBranch?: () => void;
  onActionCentre?: () => void;
  onNotifications?: () => void;
  onEmployeeMenu?: () => void;
  onOpenDestinations?: () => void;
  destinationTriggerRef?: RefObject<HTMLButtonElement | null>;
};

export function EmployeeHeader({ branch, employeeName, employeeRole, employeeColor, actionCount = 0, notificationCount = 0, onSearch, onBranch, onActionCentre, onNotifications, onEmployeeMenu, onOpenDestinations, destinationTriggerRef }: EmployeeHeaderProps) {
  return <header className="weelee-header">
    <div className="weelee-header-inner">
      <WeeleeLogo className="weelee-logo" />
      <button type="button" className="weelee-branch" data-tour="header-branch" onClick={onBranch} disabled={!onBranch} aria-label={`Change branch. Selected branch: ${branch}`}>{branch}</button>
      <button type="button" className="weelee-search" data-tour="header-search" onClick={onSearch} aria-label="Search. Press Control or Command K">Search <kbd>Ctrl K</kbd></button>
      <div className="weelee-header-actions">
        <button type="button" className="weelee-utility" data-tour="header-action-centre" onClick={onActionCentre}>Action Centre <span aria-label={`${actionCount} actions`}>{actionCount}</span></button>
        <button type="button" className="weelee-utility" data-tour="header-notifications" onClick={onNotifications}>Notifications <span aria-label={`${notificationCount} notifications`}>{notificationCount}</span></button>
        <button type="button" className="weelee-employee" data-tour="header-employee" style={employeeColor ? { "--role-color": employeeColor } as { [key: string]: string } : undefined} onClick={onEmployeeMenu} aria-label={`${employeeName}, ${employeeRole}, demo mode`}><span className="weelee-employee-name"><span className="weelee-role-dot" aria-hidden="true" />{employeeName}</span><small>{employeeRole} · Demo</small></button>
        <button type="button" className="weelee-header-menu" ref={destinationTriggerRef} aria-label="Open destinations" onClick={onOpenDestinations}>Menu</button>
      </div>
    </div>
  </header>;
}
