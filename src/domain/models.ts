export type VehicleStatus = "Available" | "Reserved" | "In Transit" | "Service Hold" | "Recon" | "Photography";
export type LeadStage = "Lead" | "Negotiation" | "Contract" | "Delivery";
export type TaskStatus = "Upcoming" | "Due Today" | "Overdue" | "Completed";
export type Tone = "positive" | "warning" | "info" | "critical" | "neutral";
export type GalleryAngle = "front" | "front-left" | "left" | "rear-left" | "rear" | "rear-right" | "right" | "front-right";

export type VehicleImage = { id: string; angle: GalleryAngle; label: string; src: string; alt: string };
export type VehicleGallery = { coverImageId: string; images: VehicleImage[] };
export type Vehicle = {
  id: string; stockId: string; vin: string; year: number; make: string; model: string; derivative: string;
  price: number; purchasePrice: number; mileageKm: number; exterior: string; branch: string; location: string;
  status: VehicleStatus; daysInStock: number; gallery: VehicleGallery;
};
export type Customer = { id: string; name: string; email: string; phone: string; city: string; crmStatus: string; vehicleInterestId: string; lastActivityAt: string };
export type Lead = { id: string; customerId: string; vehicleId: string; owner: string; stage: LeadStage; value: number; nextAction: string; dueAt: string; tone: Tone };
export type Deal = { id: string; customerId: string; vehicleId: string; salesRep: string; grossProfit: number; status: "Closed" | "Pending" | "Approval"; date: string };
export type FinanceDraft = { vehicleId: string; vehiclePrice: number; downPayment: number; termMonths: 36 | 48 | 60 | 72; aprPercent: number; tradeAllowance: number; lienPayoff: number; serviceContract: number; gapInsurance: number };
export type ServiceJob = { id: string; customerId: string; vehicleId: string; advisor: string; technician: string; status: "Booked" | "Checked In" | "In Progress" | "Waiting for Parts" | "Quality Check" | "Ready" | "Completed"; dueAt: string; note: string };
export type TaskItem = { id: string; title: string; detail: string; relatedType: "lead" | "deal" | "vehicle" | "service"; relatedId: string; dueAt: string; status: TaskStatus; tone: Tone };
export type Notification = { id: string; title: string; detail: string; read: boolean; tone: Tone; relatedId: string };
export type ActivityTargetType = "vehicle" | "customer" | "lead" | "deal" | "service" | "task" | "system";
export type AuditActivity = { id: string; action: string; detail: string; actor: string; occurredAt: string; tone: Tone; targetType: ActivityTargetType; targetId: string };
export type ViewPreferences = { inventory: { query: string; status: string; mode: "cards" | "table" }; customers: { query: string; status: string; tab: string }; sales: { query: string; status: string; sort: "date" | "profit" }; service: { query: string; filter: string; view: string } };
export type UserPreferences = { branch: string; density: "comfortable" | "compact"; activePage: string; activeSubview: string; viewPreferences: ViewPreferences };
export type VehicleIntakeDraft = { step: 1 | 2 | 3 | 4; values: Partial<Vehicle> };
export type FormDrafts = { vehicleIntake: VehicleIntakeDraft | null; lead: Partial<Lead> | null; deal: Partial<Deal> | null; serviceNotes: Record<string, string> };
export type DemoState = { schemaVersion: 1; vehicles: Vehicle[]; customers: Customer[]; leads: Lead[]; deals: Deal[]; financeDrafts: FinanceDraft[]; serviceJobs: ServiceJob[]; tasks: TaskItem[]; notifications: Notification[]; activities: AuditActivity[]; preferences: UserPreferences; drafts: FormDrafts };
