export type VehicleStatus = "Available" | "Reserved" | "In Transit" | "Service Hold" | "Recon" | "Photography";
export const vehicleBodyTypes = ["Unknown", "Coupe", "Sedan", "Hatchback", "SUV", "Double Cab", "Wagon", "MPV"] as const;
export const vehicleFuels = ["Unknown", "Petrol", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric"] as const;
export const vehicleTransmissions = ["Unknown", "Manual", "Automatic", "DCT", "CVT", "e-CVT", "Single-speed"] as const;
export const demoBranches = ["Johannesburg North", "Sandton", "Pretoria", "Midrand"] as const;
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
  price: number; purchasePrice: number; mileageKm: number; exterior: string; branch: string; location: string;
  status: VehicleStatus; daysInStock: number; bodyType: VehicleBodyType; fuel: VehicleFuel;
  transmission: VehicleTransmission; engine: string; registration: string; gallery: VehicleGallery;
};
export type Customer = { id: string; name: string; email: string; phone: string; city: string; crmStatus: string; vehicleInterestId: string; lastActivityAt: string };
export type Lead = { id: string; customerId: string; vehicleId: string; owner: string; stage: LeadStage; value: number; nextAction: string; dueAt: string; tone: Tone };
export type Deal = { id: string; customerId: string; vehicleId: string; salesRep: string; grossProfit: number; status: "Closed" | "Pending" | "Approval"; date: string };
export type FinanceDraft = { vehicleId: string; vehiclePrice: number; downPayment: number; termMonths: 36 | 48 | 60 | 72; aprPercent: number; tradeAllowance: number; lienPayoff: number; serviceContract: number; gapInsurance: number };
export type ServiceJob = { id: string; customerId: string; vehicleId: string; advisor: string; technician: string; status: "Booked" | "Checked In" | "In Progress" | "Waiting for Parts" | "Quality Check" | "Ready" | "Completed"; dueAt: string; note: string };
export type Employee = { id: string; accountId?: string; name: string; email: string; title: string; department: "Executive" | "Sales" | "Finance" | "Inventory" | "Marketing" | "Accounts" | "Service" | "Audit"; branch: string; managerId?: string; status: "Active" | "Leave" };
export type Appointment = { id: string; customerId: string; leadId: string; vehicleId: string; assignedTo: string; branch: string; scheduledAt: string; purpose: "Consultation" | "Finance Review" | "Delivery" | "Service Handover"; status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" };
export type TestDrive = { id: string; appointmentId: string; customerId: string; leadId: string; vehicleId: string; host: string; scheduledAt: string; status: "Booked" | "Completed" | "No Show"; outcome: string };
export type Quote = { id: string; customerId: string; leadId: string; vehicleId: string; createdBy: string; amount: number; status: "Draft" | "Sent" | "Accepted" | "Expired"; createdAt: string; expiresAt: string };
export type Payment = { id: string; dealId: string; customerId: string; amount: number; kind: "Deposit" | "Balance" | "Refund"; status: "Pending" | "Cleared" | "Failed"; paidAt: string };
export type FinanceApplication = { id: string; dealId: string; customerId: string; vehicleId: string; owner: string; requestedAmount: number; status: "Draft" | "Submitted" | "Approved" | "Declined"; updatedAt: string };
export type CrmDocument = { id: string; customerId?: string; leadId?: string; dealId?: string; vehicleId?: string; name: string; category: "Identity" | "Quote" | "Finance" | "Contract" | "Delivery" | "Service"; status: "Required" | "Uploaded" | "Verified" | "Expired"; updatedAt: string };
export type TaskItem = { id: string; title: string; detail: string; relatedType: "lead" | "deal" | "vehicle" | "service"; relatedId: string; dueAt: string; status: TaskStatus; tone: Tone };
export type Notification = { id: string; title: string; detail: string; read: boolean; tone: Tone; relatedId: string };
export type ActivityTargetType = "vehicle" | "customer" | "lead" | "deal" | "service" | "task" | "system";
export type AuditActivity = { id: string; action: string; detail: string; actor: string; occurredAt: string; tone: Tone; targetType: ActivityTargetType; targetId: string };
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
export type DemoState = { schemaVersion: 2; vehicles: Vehicle[]; customers: Customer[]; leads: Lead[]; deals: Deal[]; financeDrafts: FinanceDraft[]; financeApplications: FinanceApplication[]; serviceJobs: ServiceJob[]; employees: Employee[]; appointments: Appointment[]; testDrives: TestDrive[]; quotes: Quote[]; payments: Payment[]; documents: CrmDocument[]; tasks: TaskItem[]; notifications: Notification[]; activities: AuditActivity[]; preferences: UserPreferences; drafts: FormDrafts };


// ============================================================================
// Authentication Interfaces for Production-Ready Language-Learning Application
// Re-exported from auth.ts for backward compatibility
// ============================================================================

export type {
  AuthProvider,
  MFAMethod,
  Credentials,
  OAuthCredentials,
  EmailCredentials,
  TokenCredentials,
  BiometricCredentials,
  Permission,
  AuthSession,
  UserMetadata,
  MFAConfig,
  AuthService,
  AuthErrorCode,
  AuthError,
  AuthResult,
  AuthConfig,
  AuthState,
  AuthEvent,
  AuthEventHandler,
  AuthServiceFactory
} from './auth';


// ============================================================================
// Progress Tracking Interfaces for Language-Learning Application
// Re-exported from progress-models.ts for backward compatibility
// ============================================================================

export type {
  LearningActivityType,
  DifficultyLevel,
  SpacedRepetitionInterval,
  LearningActivity,
  DailyGoal,
  Achievement,
  SpacedRepetitionItem,
  Progress,
  ProgressUpdate,
  Schedule,
  SyncResult,
  ProgressTracker
} from './progress-models';

export {
  DIFFICULTY_MULTIPLIERS,
  DEFAULT_SPACED_REPETITION_INTERVALS,
  STREAK_RESET_HOURS,
  calculateActivityXP,
  shouldMaintainStreak,
  calculateNextInterval
} from './progress-models';