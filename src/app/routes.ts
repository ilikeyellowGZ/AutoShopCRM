export const pageKeys = ["my-day", "inventory", "customers", "pipeline", "sales", "finance", "service", "operations"] as const;

export type PageKey = (typeof pageKeys)[number];
export type SubviewKey = string;
export type NavigationTarget = { page: PageKey; subview: SubviewKey };

export type NavigationGroup = {
  label: string;
  destinations: readonly { label: string; target: NavigationTarget }[];
};

export const primaryNavigation: readonly { label: string; target: NavigationTarget }[] = [
  { label: "My Day", target: { page: "my-day", subview: "overview" } },
  { label: "Inventory", target: { page: "inventory", subview: "list" } },
  { label: "Customers", target: { page: "customers", subview: "directory" } },
  { label: "Pipeline", target: { page: "pipeline", subview: "board" } },
  { label: "Sales", target: { page: "sales", subview: "sales-log" } },
  { label: "Finance", target: { page: "finance", subview: "deal-finance" } },
  { label: "Service", target: { page: "service", subview: "service-board" } },
];

export const navigationGroups: readonly NavigationGroup[] = [
  { label: "Command", destinations: [{ label: "My Day", target: { page: "my-day", subview: "overview" } }, { label: "Action Centre", target: { page: "my-day", subview: "action-centre" } }, { label: "Notifications", target: { page: "my-day", subview: "notifications" } }] },
  { label: "CRM", destinations: [{ label: "Leads", target: { page: "customers", subview: "leads" } }, { label: "Customers", target: { page: "customers", subview: "directory" } }, { label: "Pipeline", target: { page: "pipeline", subview: "board" } }, { label: "Follow-ups", target: { page: "customers", subview: "follow-ups" } }, { label: "Appointments", target: { page: "customers", subview: "appointments" } }, { label: "Test Drives", target: { page: "customers", subview: "test-drives" } }] },
  { label: "Vehicles", destinations: [{ label: "Inventory", target: { page: "inventory", subview: "list" } }, { label: "Vehicle intake", target: { page: "inventory", subview: "intake" } }, { label: "Appraisals", target: { page: "inventory", subview: "appraisals" } }, { label: "Trade-ins", target: { page: "inventory", subview: "trade-ins" } }, { label: "Recon", target: { page: "inventory", subview: "recon" } }, { label: "Transfers", target: { page: "inventory", subview: "transfers" } }, { label: "Pricing", target: { page: "inventory", subview: "pricing" } }] },
  { label: "Sales", destinations: [{ label: "Sales Log", target: { page: "sales", subview: "sales-log" } }, { label: "Deals", target: { page: "sales", subview: "deals" } }, { label: "Quotations", target: { page: "sales", subview: "quotations" } }, { label: "Approvals", target: { page: "sales", subview: "approvals" } }, { label: "Deliveries", target: { page: "sales", subview: "deliveries" } }, { label: "Commissions", target: { page: "sales", subview: "commissions" } }] },
  { label: "F&I", destinations: [{ label: "Deal Finance", target: { page: "finance", subview: "deal-finance" } }, { label: "Applications", target: { page: "finance", subview: "applications" } }, { label: "Lenders", target: { page: "finance", subview: "lenders" } }, { label: "Products", target: { page: "finance", subview: "products" } }, { label: "Documents", target: { page: "finance", subview: "documents" } }] },
  { label: "Aftersales", destinations: [{ label: "Service Board", target: { page: "service", subview: "service-board" } }, { label: "Bookings", target: { page: "service", subview: "bookings" } }, { label: "Job Cards", target: { page: "service", subview: "job-cards" } }, { label: "Repair Orders", target: { page: "service", subview: "repair-orders" } }, { label: "Service History", target: { page: "service", subview: "history" } }] },
  { label: "Workforce", destinations: [{ label: "Employees", target: { page: "operations", subview: "employees" } }, { label: "Teams", target: { page: "operations", subview: "teams" } }, { label: "Targets", target: { page: "operations", subview: "targets" } }, { label: "Attendance", target: { page: "operations", subview: "attendance" } }] },
  { label: "Operations", destinations: [{ label: "Tasks", target: { page: "operations", subview: "tasks" } }, { label: "Calendar", target: { page: "operations", subview: "calendar" } }, { label: "Documents", target: { page: "operations", subview: "documents" } }, { label: "Audit Trail", target: { page: "operations", subview: "audit-trail" } }, { label: "Settings", target: { page: "operations", subview: "settings" } }] },
];
