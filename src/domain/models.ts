export type VehicleStatus = "Available" | "Reserved" | "In Transit" | "Service Hold" | "Recon" | "Photography";
export const vehicleBodyTypes = ["Unknown", "Coupe", "Sedan", "Hatchback", "SUV", "Double Cab", "Wagon", "MPV"] as const;
export const vehicleFuels = ["Unknown", "Petrol", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"] as const;
export const vehicleTransmissions = ["Unknown", "Manual", "Automatic", "DCT", "CVT", "e-CVT", "Single-speed"] as const;
export const demoBranches = ["Johannesburg North", "Sandton", "Pretoria", "Midrand"] as const;
export const demoOrganizationId = "org-motorgroup-sa";
export const branchIdForName = (organizationId: string, name: string) => `${organizationId}-branch-${name.toLowerCase().replace(/[^a-z0-9]+/gu, "-")}`;
export type Organization = { id: string; name: string; tradingName: string };
export type Branch = { id: string; organizationId: string; name: string };
export type VehicleBodyType = (typeof vehicleBodyTypes)[number];
export type VehicleFuel = (typeof vehicleFuels)[number];
export type VehicleTransmission = (typeof vehicleTransmissions)[number];
export type LeadStage = "Lead" | "Negotiation" | "Contract" | "Delivery";
export type TaskStatus = "Upcoming" | "Due Today" | "Overdue" | "Completed";
export type Tone = "positive" | "warning" | "info" | "critical" | "neutral";
export type GalleryAngle = "front" | "front-left" | "left" | "rear-left" | "rear" | "rear-right" | "right" | "front-right";

export type VehicleImage = { id: string; angle: GalleryAngle; label: string; src: string; alt: string };
export type VehicleGallery = { coverImageId: string; images: VehicleImage[] };
export type Vehicle = {
  id: string; stockId: string; vin: string; year: number; make: string; model: string; derivative: string;
  price: number; purchasePrice: number; mileageKm: number; exterior: string; branch: string; branchId: string; location: string;
  status: VehicleStatus; daysInStock: number; bodyType: VehicleBodyType; fuel: VehicleFuel;
  transmission: VehicleTransmission; engine: string; registration: string; gallery: VehicleGallery;
};
export type Customer = { id: string; name: string; email: string; phone: string; city: string; crmStatus: string; vehicleInterestId: string; lastActivityAt: string };
export type Lead = { id: string; customerId: string; vehicleId: string; owner: string; stage: LeadStage; value: number; nextAction: string; dueAt: string; tone: Tone };
export type Deal = { id: string; customerId: string; vehicleId: string; salesRep: string; grossProfit: number; status: "Closed" | "Pending" | "Approval"; date: string };
export type FinanceDraft = { vehicleId: string; vehiclePrice: number; downPayment: number; termMonths: 36 | 48 | 60 | 72; aprPercent: number; tradeAllowance: number; lienPayoff: number; serviceContract: number; gapInsurance: number };
export type ServiceJob = { id: string; customerId: string; vehicleId: string; advisor: string; technician: string; status: "Booked" | "Checked In" | "In Progress" | "Waiting for Parts" | "Quality Check" | "Ready" | "Completed"; dueAt: string; note: string };
export type Employee = { id: string; accountId?: string; name: string; email: string; title: string; department: "Executive" | "Sales" | "Finance" | "Inventory" | "Marketing" | "Accounts" | "Service" | "Audit"; branch: string; branchId: string; managerId?: string; status: "Active" | "Leave" };
export type Appointment = { id: string; customerId: string; leadId: string; vehicleId: string; assignedTo: string; branch: string; branchId: string; scheduledAt: string; purpose: "Consultation" | "Finance Review" | "Delivery" | "Service Handover"; status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" };
export type TestDrive = { id: string; appointmentId: string; customerId: string; leadId: string; vehicleId: string; host: string; scheduledAt: string; status: "Booked" | "Completed" | "No Show"; outcome: string };
export type Quote = { id: string; customerId: string; leadId: string; vehicleId: string; createdBy: string; amount: number; status: "Draft" | "Sent" | "Accepted" | "Expired"; createdAt: string; expiresAt: string };
export type Payment = { id: string; dealId: string; customerId: string; amount: number; kind: "Deposit" | "Balance" | "Refund"; status: "Pending" | "Cleared" | "Failed"; paidAt: string };
export type FinanceApplication = { id: string; dealId: string; customerId: string; vehicleId: string; owner: string; requestedAmount: number; status: "Draft" | "Submitted" | "Approved" | "Declined"; updatedAt: string };
export type CrmDocument = { id: string; customerId?: string; leadId?: string; dealId?: string; vehicleId?: string; name: string; category: "Identity" | "Quote" | "Finance" | "Contract" | "Delivery" | "Service"; status: "Required" | "Uploaded" | "Verified" | "Expired"; updatedAt: string };
export type TaskItem = { id: string; title: string; detail: string; relatedType: "lead" | "deal" | "vehicle" | "service"; relatedId: string; dueAt: string; status: TaskStatus; tone: Tone };
export const notificationCategories = ["mention", "deal", "lead", "customer", "inventory", "service", "task", "system"] as const;
export type NotificationCategory = (typeof notificationCategories)[number];
export type NotificationPriority = "normal" | "high";
export type Notification = { id: string; organizationId: string; category: NotificationCategory; priority: NotificationPriority; title: string; detail: string; read: boolean; tone: Tone; createdAt: string; relatedId: string; commentId?: string; chatMessageId?: string; recipientEmployeeId?: string };
export type ActivityTargetType = "vehicle" | "customer" | "lead" | "deal" | "service" | "task" | "system";
export type AuditActivity = { id: string; organizationId: string; branchId?: string; action: string; detail: string; actor: string; occurredAt: string; tone: Tone; targetType: ActivityTargetType; targetId: string };
export type SessionStatus = "active" | "ended";
export type SessionEndReason = "signed-out" | "replaced";
export type SessionRecord = { id: string; organizationId: string; branchId: string; accountId: string; actor: string; startedAt: string; lastActivityAt: string; endedAt?: string; status: SessionStatus; userAgent: string; endReason?: SessionEndReason };
export type InventoryStatusPreference = VehicleStatus | "All";
export type InventoryViewMode = "cards" | "table";
export type CustomerStatusPreference = "All" | "Active" | "Prospect";
export type CustomerViewTab = "overview" | "follow-ups";
export type SalesStatusPreference = "All" | Deal["status"];
export type SalesSortPreference = "date" | "profit";
export type ServiceFilterPreference = "All" | ServiceJob["status"];
export type ServiceViewMode = "Board" | "Schedule" | "List";
export type ViewPreferences = {
  inventory: { query: string; status: InventoryStatusPreference; mode: InventoryViewMode };
  customers: { query: string; status: CustomerStatusPreference; tab: CustomerViewTab };
  sales: { query: string; status: SalesStatusPreference; sort: SalesSortPreference };
  service: { query: string; filter: ServiceFilterPreference; view: ServiceViewMode };
};
export type PersistedRecordType = "vehicle" | "customer" | "lead" | "deal" | "service" | "task";
export type UserPreferences = { branch: string; density: "comfortable" | "compact"; activePage: string; activeSubview: string; activeRecordType?: PersistedRecordType; activeRecordId?: string; activeContextId?: string; viewPreferences: ViewPreferences };
export type VehicleIntakeDraft = { step: 1 | 2 | 3 | 4; values: Partial<Vehicle> };
export type FormDrafts = { vehicleIntake: VehicleIntakeDraft | null; vehicleIntakes: Record<string, VehicleIntakeDraft>; lead: Partial<Lead> | null; deal: Partial<Deal> | null; serviceNotes: Record<string, string> };
export const boardColumnKinds = ["text", "number", "money", "status", "priority", "person", "date", "checkbox", "tags", "progress", "relation"] as const;
export type BoardColumnKind = (typeof boardColumnKinds)[number];
export type BoardColumnOption = { id: string; label: string; tone: Tone };
export type BoardColumn = { id: string; boardId: string; kind: BoardColumnKind; title: string; position: number; options: BoardColumnOption[]; relationTarget?: PersistedRecordType };

export type BoardCellValue =
  | { kind: "text"; text: string }
  | { kind: "number"; number: number }
  | { kind: "option"; optionId: string }
  | { kind: "options"; optionIds: string[] }
  | { kind: "date"; date: string }
  | { kind: "checkbox"; checked: boolean }
  | { kind: "person"; employeeId: string }
  | { kind: "relation"; recordType: PersistedRecordType; recordId: string };

export type BoardGroup = { id: string; boardId: string; title: string; tone: Tone; position: number };
export type BoardItem = { id: string; boardId: string; groupId: string; parentItemId?: string; title: string; position: number; values: Record<string, BoardCellValue>; createdAt: string; createdBy: string; updatedAt: string; updatedBy: string };

export const boardViewKinds = ["table", "kanban", "calendar", "timeline", "workload"] as const;
export type BoardViewKind = (typeof boardViewKinds)[number];
export const boardFilterOperators = ["is", "isNot", "contains", "before", "after"] as const;
export type BoardFilterOperator = (typeof boardFilterOperators)[number];
export type BoardFilter = { columnId: string; operator: BoardFilterOperator; value: string };
export type BoardView = { id: string; boardId: string; kind: BoardViewKind; title: string; position: number; groupByColumnId?: string; filters: BoardFilter[] };

export type Board = { id: string; workspaceId: string; title: string; description: string; position: number };
export type Workspace = { id: string; organizationId: string; branchId?: string; name: string; description: string; position: number };

export const commentEntityTypes = ["vehicle", "customer", "lead", "deal", "service", "task", "board-item"] as const;
export type CommentEntityType = (typeof commentEntityTypes)[number];
export type CommentReaction = { emoji: string; employeeIds: string[] };
export type Comment = {
  id: string;
  organizationId: string;
  entityType: CommentEntityType;
  entityId: string;
  columnId?: string;
  parentCommentId?: string;
  authorEmployeeId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  editedAt?: string;
  resolvedAt?: string;
  resolvedByEmployeeId?: string;
  pinned: boolean;
  reactions: CommentReaction[];
};

export const chatChannelKinds = ["channel", "direct"] as const;
export type ChatChannelKind = (typeof chatChannelKinds)[number];
export type ChatChannel = { id: string; organizationId: string; kind: ChatChannelKind; name: string; topic: string; memberEmployeeIds: string[]; createdAt: string };
export type ChatMessage = { id: string; channelId: string; authorEmployeeId: string; body: string; mentions: string[]; createdAt: string; editedAt?: string };
/** A read receipt is a marker on the last message a colleague has seen, not a timestamp, so two messages posted in the same instant still order correctly. */
export type ChatRead = { channelId: string; employeeId: string; lastReadMessageId: string; readAt: string };

export const CURRENT_SCHEMA_VERSION = 8;
export type DemoState = { schemaVersion: typeof CURRENT_SCHEMA_VERSION; organizations: Organization[]; branches: Branch[]; sessions: SessionRecord[]; comments: Comment[]; chatChannels: ChatChannel[]; chatMessages: ChatMessage[]; chatReads: ChatRead[]; workspaces: Workspace[]; boards: Board[]; boardGroups: BoardGroup[]; boardColumns: BoardColumn[]; boardItems: BoardItem[]; boardViews: BoardView[]; vehicles: Vehicle[]; customers: Customer[]; leads: Lead[]; deals: Deal[]; financeDrafts: FinanceDraft[]; financeApplications: FinanceApplication[]; serviceJobs: ServiceJob[]; employees: Employee[]; appointments: Appointment[]; testDrives: TestDrive[]; quotes: Quote[]; payments: Payment[]; documents: CrmDocument[]; tasks: TaskItem[]; notifications: Notification[]; activities: AuditActivity[]; preferences: UserPreferences; drafts: FormDrafts };
