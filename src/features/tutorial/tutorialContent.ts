import type { DemoRole } from "../../app/access";
import type { NavigationTarget } from "../../app/routes";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  target: NavigationTarget;
  highlight?: string;
};

const step = (id: string, title: string, body: string, target: NavigationTarget, highlight?: string): TourStep => ({ id, title, body, target, highlight });

const myDay = (subview = "overview") => ({ page: "my-day", subview }) as const;

const welcome = (roleTitle: string, summary: string): TourStep =>
  step("welcome", `Welcome, ${roleTitle}`, summary, myDay());

const closing = (nextStep: string): TourStep =>
  step("closing", "You're ready to go", `That's the tour. ${nextStep} You can replay this walkthrough any time from your employee menu.`, myDay());

const header = (roleContext: string): TourStep[] => [
  step("header-search", "Jump to anything", `Press Ctrl/Cmd K or use this search bar to open any vehicle, customer, lead or deal by name, VIN or stock number${roleContext}.`, myDay(), "header-search"),
  step("header-employee", "Your account menu", "Your name, role and demo controls live here — including workspace settings, resetting demo data, and replaying this tour.", myDay(), "header-employee"),
];

export const tutorialForRole: Record<DemoRole, TourStep[]> = {
  owner: [
    welcome("Dealership Owner", "As the owner you see every branch, every deal and every number across the group. Here's where to find it all."),
    step("nav-my-day", "My Day: your daily command centre", "Your priority actions, today's agenda, pending approvals and branch activity all surface here first thing every morning.", myDay(), "nav-my-day"),
    step("my-day-metrics", "Group-wide KPIs at a glance", "These figures roll up every branch: tasks due, active pipeline value, available stock and unread updates.", myDay(), "my-day-metrics"),
    step("header-branch", "Switch between branches", "As owner you can view and act on behalf of any branch in the group — switch here without signing out.", myDay(), "header-branch"),
    ...header(" across the whole group"),
    step("nav-finance", "Finance oversight", "Review every deal's structured finance, applications and lender activity across all branches from here.", { page: "finance", subview: "deal-finance" }, "nav-finance"),
    step("nav-service", "Service and aftersales", "Keep an eye on the service board, parts risk and customer approvals across the dealership network.", { page: "service", subview: "service-board" }, "nav-service"),
    step("nav-more", "Workforce, audit and settings", "Open More to reach employees, targets, the audit trail and workspace settings — all reserved for ownership-level access.", myDay(), "nav-more"),
    closing("Start your day from My Day, or jump straight into any branch's numbers."),
  ],
  ceo: [
    welcome("Group CEO", "Your view is built for oversight: performance, approvals and staff across every branch, without the day-to-day record-keeping."),
    step("nav-my-day", "My Day: group performance snapshot", "See pending approvals and branch activity the moment you sign in, group-wide.", myDay(), "nav-my-day"),
    step("my-day-metrics", "The numbers that matter", "Active pipeline value and available stock are rolled up across every branch here.", myDay(), "my-day-metrics"),
    step("header-branch", "Move between branches", "Switch branch context to review any location's activity without a separate login.", myDay(), "header-branch"),
    ...header(" across the group"),
    step("nav-sales", "Sales performance and approvals", "Track closed deals and review margin approvals awaiting a decision.", { page: "sales", subview: "approvals" }, "nav-sales"),
    step("nav-more", "Staff and the audit trail", "Open More to review workforce activity and the full audit trail of what changed, when, and by whom.", myDay(), "nav-more"),
    closing("Check My Day each morning, then drill into sales approvals or the audit trail as needed."),
  ],
  manager: [
    welcome("General Manager", "You run daily operations across your branches — inventory, customers, sales, service and your team all report through you."),
    step("nav-my-day", "My Day: your operational hub", "Priority actions, today's agenda and approvals awaiting your sign-off open here.", myDay(), "nav-my-day"),
    step("header-branch", "Your branches", "Switch between the branches you manage to review and act on their records.", myDay(), "header-branch"),
    step("nav-inventory", "Inventory across your branches", "Search, filter and manage every vehicle on your lots, and add new stock as it arrives.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("inventory-toolbar", "Find any vehicle fast", "Search by VIN, model, stock number or branch, and filter by status.", { page: "inventory", subview: "list" }, "inventory-toolbar"),
    step("nav-pipeline", "Sales pipeline", "Watch every lead move from first contact through to delivery, and step in wherever a deal needs help.", { page: "pipeline", subview: "board" }, "nav-pipeline"),
    step("nav-service", "Service board", "Monitor job cards, parts risk and customer approvals for every vehicle in for work.", { page: "service", subview: "service-board" }, "nav-service"),
    ...header(" for your branches"),
    step("nav-more", "Your team", "Open More to review employees, targets and attendance for the people you manage.", myDay(), "nav-more"),
    closing("My Day is your starting point every morning — everything else is one tab away."),
  ],
  salesmanager: [
    welcome("Sales Manager", "Your job is moving deals through the pipeline and keeping your sales team on target — here's your toolkit."),
    step("nav-pipeline", "Pipeline: your home screen", "This is where you land every time you sign in. Drag leads between stages, or use the accessible menu on each card.", { page: "pipeline", subview: "board" }, "nav-pipeline"),
    step("pipeline-board", "Move deals stage by stage", "Each column is a stage from Lead through to Delivery — drag a card across, or open it to log the next action.", { page: "pipeline", subview: "board" }, "pipeline-board"),
    step("nav-sales", "Sales log and approvals", "Review every deal your team has logged, and approve margin exceptions that need a manager's sign-off.", { page: "sales", subview: "approvals" }, "nav-sales"),
    step("nav-customers", "Customer records", "Open any customer to see their full history, notes and next follow-up before you coach a rep on a deal.", { page: "customers", subview: "directory" }, "nav-customers"),
    step("nav-inventory", "Stock your team is selling", "Check availability and pricing on any vehicle your reps are quoting.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("header-branch", "Your branches", "Switch between the branches under your management.", myDay(), "header-branch"),
    ...header(" for your deals and customers"),
    closing("Start each session on the pipeline board — that's where your team's deals live."),
  ],
  sales: [
    welcome("Sales Executive", "Everything here is built around your customers and your deals — let's find your way around."),
    step("nav-my-day", "My Day: your task list", "Your assigned follow-ups, test drives and next actions are waiting for you here every morning.", myDay(), "nav-my-day"),
    step("priority-actions", "Priority actions, your way", "Drag a task to reorder it, or use the up/down buttons — your priority order is saved and stays put next time you sign in.", myDay(), "priority-actions"),
    step("nav-pipeline", "Your pipeline", "Every lead assigned to you, from first contact to delivery. Move a card forward as you make progress.", { page: "pipeline", subview: "board" }, "nav-pipeline"),
    step("nav-customers", "Your customers", "Search your customer list, log notes, and see each person's purchase history and next follow-up date.", { page: "customers", subview: "directory" }, "nav-customers"),
    step("nav-inventory", "Vehicle inventory", "Find a vehicle by VIN, model or stock number, and open its full gallery and specs to share with a customer.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("nav-sales", "Your sales log", "Every deal you've closed or have pending, with your commission-relevant numbers.", { page: "sales", subview: "sales-log" }, "nav-sales"),
    step("header-search", "Jump to anything", "Press Ctrl/Cmd K to open any vehicle, customer or deal instantly by name, VIN or stock number.", myDay(), "header-search"),
    step("header-employee", "Your account menu", "Your name and role live here, along with the option to replay this tour any time.", myDay(), "header-employee"),
    closing("My Day is your starting point — your priority actions and pipeline are one tab away."),
  ],
  finance: [
    welcome("F&I Manager", "You structure the numbers behind every deal — here's where finance applications, products and lenders live."),
    step("nav-my-day", "My Day: applications awaiting you", "Deals moving into finance, and tasks tied to applications in progress, surface here.", myDay(), "nav-my-day"),
    step("nav-finance", "Deal finance worksheet", "Build the full payment structure for a deal: deposit, term, interest rate, trade-in and backend products, with a live monthly repayment estimate.", { page: "finance", subview: "deal-finance" }, "nav-finance"),
    step("finance-breakdown", "Live payment breakdown", "Every change to the worksheet updates this panel instantly, in South African Rand, so you can talk numbers with a customer in real time.", { page: "finance", subview: "deal-finance" }, "finance-breakdown"),
    step("nav-sales", "Deals awaiting finance", "See every deal in your branches so you know what's coming before the customer sits down with you.", { page: "sales", subview: "deals" }, "nav-sales"),
    step("nav-customers", "Customer context", "Open a customer's record for their contact details and history before structuring their finance.", { page: "customers", subview: "directory" }, "nav-customers"),
    ...header(" for finance records"),
    step("nav-more", "Your tasks", "Open More to see every finance-related task assigned to you across your branches.", myDay(), "nav-more"),
    closing("Deal finance is your main screen — everything you need to structure a deal is on that one worksheet."),
  ],
  stock: [
    welcome("Stock Controller", "Vehicles are your world — intake, condition, pricing and readiness for every unit on the lot."),
    step("nav-my-day", "My Day: recon and intake tasks", "Vehicles waiting on photography, recon work or pricing review show up in your priority actions.", myDay(), "nav-my-day"),
    step("nav-inventory", "Inventory: your main screen", "This is where you land every time you sign in — every vehicle across your branches, searchable by VIN, stock number or model.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("inventory-toolbar", "Search and filter stock", "Narrow the list by status — Available, In Transit, Recon and more — or search directly for a VIN or stock ID.", { page: "inventory", subview: "list" }, "inventory-toolbar"),
    step("inventory-metrics", "Stock levels at a glance", "On-hand count, availability and total retail value for your branches, updated as records change.", { page: "inventory", subview: "list" }, "inventory-metrics"),
    step("nav-service", "Service and recon board", "Track job cards, parts risk and readiness for vehicles going through recon or service before they're ready to sell.", { page: "service", subview: "service-board" }, "nav-service"),
    step("header-branch", "Your branches", "Switch between the branches you control stock for.", myDay(), "header-branch"),
    ...header(" for any vehicle"),
    closing("Inventory is home base — add a vehicle, check its status or hand it to service from there."),
  ],
  marketing: [
    welcome("Marketing Specialist", "Leads are your focus — where they come from, how they're progressing, and what stock is worth promoting."),
    step("nav-my-day", "My Day: campaign follow-ups", "Tasks tied to leads and customer outreach land here every morning.", myDay(), "nav-my-day"),
    step("nav-customers", "Leads: your main screen", "This is where you land every time you sign in — every new lead, ready to be qualified and handed to sales.", { page: "customers", subview: "leads" }, "nav-customers"),
    step("customers-toolbar", "Find a lead or customer", "Search by name, email, phone or city, and filter by status to focus on active prospects.", { page: "customers", subview: "directory" }, "customers-toolbar"),
    step("nav-pipeline", "Pipeline visibility", "See how leads you've generated are progressing through negotiation toward a closed deal.", { page: "pipeline", subview: "board" }, "nav-pipeline"),
    step("nav-inventory", "Stock worth promoting", "Browse the gallery for any vehicle to pull imagery and details for a campaign.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("header-branch", "Your branches", "Switch between the branches your campaigns cover.", myDay(), "header-branch"),
    ...header(" for leads and vehicles"),
    closing("Leads is your starting point — qualify a lead there and track it through the pipeline."),
  ],
  accounts: [
    welcome("Accounts Clerk", "You're the last checkpoint on every deal's numbers — finance records and sales figures are your focus."),
    step("nav-my-day", "My Day: reconciliation tasks", "Deals needing finance sign-off or documentation surface in your priority actions.", myDay(), "nav-my-day"),
    step("nav-finance", "Deal finance records", "Review the full payment structure behind any deal, including deposit, trade-in and backend products.", { page: "finance", subview: "deal-finance" }, "nav-finance"),
    step("nav-sales", "Sales log", "Every deal across your branches, with status and dates — gross profit figures stay with sales management.", { page: "sales", subview: "sales-log" }, "nav-sales"),
    step("header-branch", "Your branches", "Switch between the branches whose accounts you handle.", myDay(), "header-branch"),
    ...header(" for a deal or customer"),
    step("nav-more", "Your tasks", "Open More to see every accounts-related task assigned to you.", myDay(), "nav-more"),
    closing("Deal finance and the sales log are your two main screens — everything else branches from there."),
  ],
  employee: [
    welcome("Employee", "Here's a quick look at the tools available to you day to day."),
    step("nav-my-day", "My Day: your task list", "Your assigned tasks and today's agenda are waiting for you here every time you sign in.", myDay(), "nav-my-day"),
    step("priority-actions", "Reorder your priorities", "Drag a task up or down, or use the up/down buttons, to set your own order — it's saved automatically.", myDay(), "priority-actions"),
    step("nav-inventory", "Vehicle inventory", "Browse and search every vehicle at your branch.", { page: "inventory", subview: "list" }, "nav-inventory"),
    step("nav-customers", "Customer records", "Look up a customer's details and history when you need them.", { page: "customers", subview: "directory" }, "nav-customers"),
    step("nav-service", "Service board", "Check job cards and status for vehicles currently in for work.", { page: "service", subview: "service-board" }, "nav-service"),
    step("header-search", "Jump to anything", "Press Ctrl/Cmd K to search for any vehicle, customer or task by name.", myDay(), "header-search"),
    step("header-employee", "Your account menu", "Your name and role live here, along with the option to replay this tour any time.", myDay(), "header-employee"),
    closing("My Day is your starting point every time you sign in."),
  ],
  auditor: [
    welcome("External Auditor", "You have read-only visibility across the entire group — here's where every record and every change lives."),
    step("nav-my-day", "My Day: activity overview", "Recent branch activity is visible here the moment you sign in, though task actions are read-only for your role.", myDay(), "nav-my-day"),
    step("header-branch", "Every branch, one login", "Switch between any branch in the group without a separate sign-in.", myDay(), "header-branch"),
    step("nav-more", "The audit trail: your main screen", "This is where you land every time you sign in — a full, timestamped record of what changed, when, and by whom, across every branch.", { page: "operations", subview: "audit-trail" }, "nav-more"),
    step("nav-finance", "Finance records", "Review deal finance worksheets across every branch without the ability to edit them.", { page: "finance", subview: "deal-finance" }, "nav-finance"),
    step("nav-sales", "Sales performance", "See every deal and its approval history across the group.", { page: "sales", subview: "deals" }, "nav-sales"),
    step("nav-service", "Service records", "Review job cards, parts risk and customer approvals across the network.", { page: "service", subview: "service-board" }, "nav-service"),
    ...header(" across the whole group"),
    closing("The audit trail is your primary reference — everything else here is available for read-only review."),
  ],
};
