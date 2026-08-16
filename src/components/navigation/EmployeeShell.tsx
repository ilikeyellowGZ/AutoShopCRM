import { ReactNode } from "react";
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
  actionCount?: number;
  notificationCount?: number;
  onSearch?: () => void;
};

export function EmployeeShell({ activePage, onNavigate, children, branch = "Weelee Sandton", employeeName = "Anele Dlamini", employeeRole = "Sales Executive", actionCount = 0, notificationCount = 0, onSearch }: EmployeeShellProps) {
  return <div className="weelee-shell">
    <EmployeeHeader branch={branch} employeeName={employeeName} employeeRole={employeeRole} actionCount={actionCount} notificationCount={notificationCount} onSearch={onSearch} onActionCentre={() => onNavigate({ page: "my-day", subview: "action-centre" })} onNotifications={() => onNavigate({ page: "my-day", subview: "notifications" })} />
    <PrimaryNavigation activePage={activePage} onNavigate={onNavigate} />
    <main className="weelee-main">{children}</main>
  </div>;
}
