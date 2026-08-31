import { ReactNode, useRef, useState } from "react";
import { NavigationTarget, PageKey } from "../../app/routes";
import { EmployeeHeader } from "./EmployeeHeader";
import { PrimaryNavigation } from "./PrimaryNavigation";

type EmployeeShellProps = {
  activePage: PageKey;
  onNavigate: (target: NavigationTarget) => void;
  children: ReactNode;
  branch?: string;
  employeeName?: string;
  employeeRole?: string;
  employeeColor?: string;
  actionCount?: number;
  notificationCount?: number;
  onSearch?: () => void;
  onBranch?: () => void;
  onEmployeeMenu?: () => void;
  canNavigate?: (target: NavigationTarget) => boolean;
};

export function EmployeeShell({ activePage, onNavigate, children, branch = "Weelee Sandton", employeeName = "Anele Dlamini", employeeRole = "Sales Executive", employeeColor, actionCount = 0, notificationCount = 0, onSearch, onBranch, onEmployeeMenu, canNavigate }: EmployeeShellProps) {
  const [destinationSheetOpen, setDestinationSheetOpen] = useState(false);
  const destinationTriggerRef = useRef<HTMLButtonElement>(null);
  const setDestinationSheet = (open: boolean, trigger?: HTMLButtonElement) => {
    if (trigger) destinationTriggerRef.current = trigger;
    setDestinationSheetOpen(open);
  };
  return <div className="weelee-shell">
    <EmployeeHeader branch={branch} employeeName={employeeName} employeeRole={employeeRole} employeeColor={employeeColor} actionCount={actionCount} notificationCount={notificationCount} onSearch={onSearch} onBranch={onBranch} onEmployeeMenu={onEmployeeMenu} onActionCentre={() => onNavigate({ page: "my-day", subview: "action-centre" })} onNotifications={() => onNavigate({ page: "my-day", subview: "notifications" })} onOpenDestinations={() => setDestinationSheet(true)} destinationTriggerRef={destinationTriggerRef} />
    <PrimaryNavigation activePage={activePage} onNavigate={onNavigate} canNavigate={canNavigate} destinationSheetOpen={destinationSheetOpen} onDestinationSheetChange={setDestinationSheet} returnFocusRef={destinationTriggerRef} showMobileTrigger={false} branch={branch} employeeName={employeeName} onBranch={onBranch} onEmployeeMenu={onEmployeeMenu} />
    <main className="weelee-main">{children}</main>
  </div>;
}
