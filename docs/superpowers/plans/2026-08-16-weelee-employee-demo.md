# Weelee Employee Dealer Operations Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing MotorOS-style pilot with a reference-faithful Weelee employee operations demo containing connected, locally persistent workflows and ten eight-angle studio vehicle galleries.

**Architecture:** Keep React, Vite, TypeScript, Vitest, and plain CSS. Split the current monolithic application into focused feature modules behind a typed `DemoRepository`; use a versioned localStorage adapter for persistence, a route/subview state model for navigation, and project-local media manifests for the eighty vehicle images. All behavior is implemented test-first, and all visible navigation routes to a working view or working subview.

**Tech Stack:** React 19, TypeScript 5, Vite, Vitest, Testing Library, Playwright, semantic HTML, CSS custom properties, localStorage, View Transitions API with CSS fallback.

**Spec:** `DESIGN_SPEC.md`

## Global Constraints

- Preserve the approved two-level horizontal navigation and the supplied monochrome reference language.
- Use the official transparent Weelee mark and wordmark; do not type or redraw the logo.
- Use South African Rand through `Intl.NumberFormat("en-ZA", { currency: "ZAR" })`.
- Persist mutable demo data under `weelee-employee-demo-v1`; never persist image binaries.
- Include exactly ten gallery vehicles and exactly eight distinct studio angles per vehicle: eighty final files.
- Keep the existing plain-CSS infrastructure; do not add Tailwind, shadcn defaults, chart libraries, or a router dependency.
- Animate only transform and opacity for `120–220ms`; respect `prefers-reduced-motion`.
- Every visible navigation item must open a working view or a working subview.
- Every task follows red-green-refactor and ends with a focused commit.
- Never claim real authentication, lender submission, messaging, or external integration behavior.

---

## File Map

| Path | Responsibility |
| --- | --- |
| `src/app/App.tsx` | Composition root and repository subscription only |
| `src/app/routes.ts` | Typed page/subview definitions and navigation resolution |
| `src/app/useDemoApp.ts` | Top-level page, overlay, command, and repository state |
| `src/components/brand/WeeleeLogo.tsx` | Responsive official logo rendering |
| `src/components/controls/*` | Button, field, tabs, and status primitives |
| `src/components/data-display/*` | KPI, record list, table, and empty-state primitives |
| `src/components/feedback/*` | Toast and inline error/success feedback |
| `src/components/navigation/*` | Employee header, primary nav, grouped menu, command palette |
| `src/components/overlays/*` | Dialog, drawer, and media viewer primitives |
| `src/domain/models.ts` | Shared typed entities and state schema |
| `src/domain/calculations.ts` | Finance and dealership calculations |
| `src/domain/selectors.ts` | Pure filtered/derived demo views |
| `src/features/*` | My Day, inventory, customers, pipeline, sales, finance, service views |
| `src/repository/seed.ts` | Deterministic ten-vehicle connected demo dataset |
| `src/repository/migrations.ts` | Local schema validation and migration |
| `src/repository/storage.ts` | Defensive localStorage read/write boundary |
| `src/repository/demoRepository.ts` | Typed actions, subscriptions, and audit logging |
| `src/media/vehicleGalleries.ts` | Ten manifests with eight stable project paths each |
| `src/styles/*.css` | Tokens, reset/base, primitives/features, responsive, motion |
| `tests/e2e/*.spec.ts` | Browser journeys, persistence, keyboard, gallery, responsive QA |
| `public/media/brand/*` | Transparent Weelee lockup |
| `public/media/vehicles/*` | Eight generated images for each of ten vehicles |

---

### Task 1: Test Runtime and Typed Domain Contract

**Files:**
- Modify: `package.json`
- Create: `src/domain/models.ts`
- Create: `src/media/vehicleGalleries.ts`
- Create: `src/repository/seed.ts`
- Create: `src/repository/seed.test.ts`

**Interfaces:**
- Produces: `DemoState`, `Vehicle`, `VehicleGallery`, `Customer`, `Lead`, `Deal`, `FinanceDraft`, `ServiceJob`, `TaskItem`, `Notification`, `AuditActivity`, `vehicleGalleries`, and `createSeedState(): DemoState`.
- Consumes: Existing `src/domain/calculations.ts` only.

- [ ] **Step 1: Install test dependencies without changing runtime dependencies**

Run:

```powershell
npm.cmd install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test
```

Expected: `package.json` and `package-lock.json` include the five dev dependencies and the existing scripts remain intact.

- [ ] **Step 2: Write the failing seed-contract test**

Create `src/repository/seed.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";

describe("createSeedState", () => {
  it("creates ten connected gallery vehicles with eight unique angles each", () => {
    const state = createSeedState();
    expect(state.schemaVersion).toBe(1);
    expect(state.vehicles).toHaveLength(10);
    expect(state.vehicles.every((vehicle) => vehicle.gallery.images.length === 8)).toBe(true);
    expect(new Set(state.vehicles.flatMap((vehicle) => vehicle.gallery.images.map((image) => image.src))).size).toBe(80);
  });

  it("connects every lead, deal, service job, and task to an existing record", () => {
    const state = createSeedState();
    const vehicleIds = new Set(state.vehicles.map((vehicle) => vehicle.id));
    const customerIds = new Set(state.customers.map((customer) => customer.id));
    expect(state.leads.every((lead) => vehicleIds.has(lead.vehicleId) && customerIds.has(lead.customerId))).toBe(true);
    expect(state.deals.every((deal) => vehicleIds.has(deal.vehicleId) && customerIds.has(deal.customerId))).toBe(true);
    expect(state.serviceJobs.every((job) => vehicleIds.has(job.vehicleId) && customerIds.has(job.customerId))).toBe(true);
    expect(state.tasks.every((task) => task.relatedId.length > 0)).toBe(true);
  });
});
```

- [ ] **Step 3: Run the seed test and verify the expected failure**

Run: `npm.cmd test -- src/repository/seed.test.ts`

Expected: FAIL because `./seed` and the domain types do not exist.

- [ ] **Step 4: Implement the typed entities and deterministic seed**

Define these exact discriminants in `src/domain/models.ts`:

```ts
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
export type AuditActivity = { id: string; action: string; detail: string; actor: string; occurredAt: string; tone: Tone };
export type UserPreferences = { branch: string; density: "comfortable" | "compact"; activePage: string; activeSubview: string };
export type VehicleIntakeDraft = { step: 1 | 2 | 3 | 4; values: Partial<Vehicle> };
export type FormDrafts = { vehicleIntake: VehicleIntakeDraft | null; lead: Partial<Lead> | null; deal: Partial<Deal> | null; serviceNotes: Record<string, string> };
export type DemoState = { schemaVersion: 1; vehicles: Vehicle[]; customers: Customer[]; leads: Lead[]; deals: Deal[]; financeDrafts: FinanceDraft[]; serviceJobs: ServiceJob[]; tasks: TaskItem[]; notifications: Notification[]; activities: AuditActivity[]; preferences: UserPreferences; drafts: FormDrafts };
```

Implement `vehicleGalleries` first with the ordered angle filenames from `DESIGN_SPEC.md` and a `.png` extension for every project path. Implement `createSeedState()` with the exact ten vehicles, stable IDs `vehicle-01` through `vehicle-10`, galleries imported from that manifest, twelve realistic customers, sixteen leads, eight deals, six service jobs, twelve tasks, six notifications, and twelve activities. Use a fixed ISO date of `2026-08-16T08:00:00+02:00` so screenshots and tests are deterministic.

- [ ] **Step 5: Run the seed test and all existing domain tests**

Run: `npm.cmd test -- src/repository/seed.test.ts src/domain/calculations.test.ts`

Expected: PASS with 6 tests total.

- [ ] **Step 6: Commit the domain contract**

```powershell
git add package.json package-lock.json src/domain/models.ts src/media/vehicleGalleries.ts src/repository/seed.ts src/repository/seed.test.ts
git commit -m "feat: define connected Weelee demo domain"
```

---

### Task 2: Versioned Persistence and Repository Actions

**Files:**
- Create: `src/repository/migrations.ts`
- Create: `src/repository/storage.ts`
- Create: `src/repository/demoRepository.ts`
- Create: `src/repository/demoRepository.test.ts`
- Create: `src/test/memoryStorage.ts`

**Interfaces:**
- Consumes: `DemoState`, entity types, and `createSeedState()` from Task 1.
- Produces: `STORAGE_KEY`, `loadDemoState(storage)`, `saveDemoState(storage, state)`, `createDemoRepository(storage)`, `DemoRepository`, and the shared test helper `memoryStorage()`.

- [ ] **Step 1: Write failing repository persistence tests**

Create `src/test/memoryStorage.ts`:

```ts
export function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); },
  };
}
```

Create `src/repository/demoRepository.test.ts` with these assertions:

```ts
import { describe, expect, it } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository, STORAGE_KEY } from "./demoRepository";

describe("DemoRepository", () => {
  it("recovers from corrupt storage and persists the recovered seed", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "not-json");
    const repository = createDemoRepository(storage);
    expect(repository.getState().vehicles).toHaveLength(10);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(1);
  });

  it("persists a task completion and writes an audit activity", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const taskId = repository.getState().tasks[0].id;
    repository.completeTask(taskId);
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.tasks.find((task) => task.id === taskId)?.status).toBe("Completed");
    expect(reloaded.activities[0].action).toBe("Task completed");
  });

  it("rejects duplicate VIN values with a specific error", () => {
    const repository = createDemoRepository(memoryStorage());
    const existing = repository.getState().vehicles[0];
    expect(() => repository.addVehicle({ ...existing, id: "vehicle-11", stockId: "WEE-0011" })).toThrow("VIN already exists in the active Weelee inventory.");
  });
});
```

- [ ] **Step 2: Run the repository test and verify it fails**

Run: `npm.cmd test -- src/repository/demoRepository.test.ts`

Expected: FAIL because the repository module does not exist.

- [ ] **Step 3: Implement validation, migration, storage, and repository actions**

Expose this exact interface:

```ts
export type DemoRepository = {
  getState(): DemoState;
  subscribe(listener: (state: DemoState) => void): () => void;
  reset(): void;
  setPreferences(patch: Partial<UserPreferences>): void;
  updateDraft<K extends keyof FormDrafts>(key: K, draft: FormDrafts[K]): void;
  completeTask(taskId: string): void;
  rescheduleTask(taskId: string, dueAt: string): void;
  addVehicle(vehicle: Vehicle): void;
  updateVehicle(vehicleId: string, patch: Partial<Vehicle>): void;
  addCustomer(customer: Customer): void;
  addLead(lead: Lead): void;
  moveLead(leadId: string, stage: LeadStage): void;
  addDeal(deal: Deal): void;
  updateFinanceDraft(vehicleId: string, patch: Partial<FinanceDraft>): void;
  updateServiceJob(jobId: string, patch: Partial<ServiceJob>): void;
  markNotificationRead(notificationId: string): void;
};
```

Every mutation must clone state, prepend a deterministic audit activity using an incrementing local activity ID, persist, and notify subscribers. `loadDemoState()` accepts only objects with `schemaVersion === 1` and required entity arrays; otherwise seed and save a recoverable state.

- [ ] **Step 4: Run repository and seed tests**

Run: `npm.cmd test -- src/repository/demoRepository.test.ts src/repository/seed.test.ts`

Expected: PASS with 5 tests.

- [ ] **Step 5: Commit repository behavior**

```powershell
git add src/repository
git commit -m "feat: add versioned local demo repository"
```

---

### Task 3: Finance Calculations and Pure Selectors

**Files:**
- Modify: `src/domain/calculations.ts`
- Modify: `src/domain/calculations.test.ts`
- Create: `src/domain/selectors.ts`
- Create: `src/domain/selectors.test.ts`

**Interfaces:**
- Consumes: `DemoState`, `FinanceDraft`, and existing landed-cost functions.
- Produces: `monthlyPayment(draft)`, `financeBreakdown(draft)`, `selectDashboardMetrics(state)`, `selectFilteredVehicles(state, query, status)`, `selectPipelineColumns(state)`, `selectCustomerDirectory(state, query)`.

- [ ] **Step 1: Add failing finance and selector tests**

Add to `src/domain/calculations.test.ts`:

```ts
it("calculates amortized monthly payment and guards a zero interest rate", () => {
  expect(monthlyPayment({ principal: 100_000, annualRatePercent: 0, termMonths: 60 })).toBeCloseTo(1666.67, 2);
  expect(monthlyPayment({ principal: 100_000, annualRatePercent: 12, termMonths: 60 })).toBeCloseTo(2224.44, 2);
});
```

Create `src/domain/selectors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { selectFilteredVehicles, selectPipelineColumns } from "./selectors";

describe("demo selectors", () => {
  it("filters inventory by model, VIN, stock ID, and status", () => {
    const state = createSeedState();
    expect(selectFilteredVehicles(state, "GT3", "All")).toHaveLength(1);
    expect(selectFilteredVehicles(state, state.vehicles[1].vin, "All")).toHaveLength(1);
    expect(selectFilteredVehicles(state, state.vehicles[2].stockId, "In Transit")).toHaveLength(1);
  });

  it("returns all four pipeline columns even when one is empty", () => {
    const columns = selectPipelineColumns(createSeedState());
    expect(columns.map((column) => column.stage)).toEqual(["Lead", "Negotiation", "Contract", "Delivery"]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm missing-export failures**

Run: `npm.cmd test -- src/domain/calculations.test.ts src/domain/selectors.test.ts`

Expected: FAIL for missing `monthlyPayment`, `selectFilteredVehicles`, and `selectPipelineColumns` exports.

- [ ] **Step 3: Implement calculations and selectors as pure functions**

Use the standard amortization formula and return this breakdown:

```ts
export type FinanceBreakdown = { netTrade: number; feesAndProducts: number; amountFinanced: number; monthly: number };

export function financeBreakdown(draft: FinanceDraft): FinanceBreakdown {
  const netTrade = draft.tradeAllowance - draft.lienPayoff;
  const feesAndProducts = draft.serviceContract + draft.gapInsurance;
  const amountFinanced = Math.max(0, draft.vehiclePrice - draft.downPayment - netTrade + feesAndProducts);
  return {
    netTrade,
    feesAndProducts,
    amountFinanced,
    monthly: monthlyPayment({ principal: amountFinanced, annualRatePercent: draft.aprPercent, termMonths: draft.termMonths }),
  };
}
```

Selectors must be case-insensitive, must not mutate state, and must return stable stage ordering.

- [ ] **Step 4: Run all domain tests**

Run: `npm.cmd test -- src/domain`

Expected: PASS.

- [ ] **Step 5: Commit calculations and selectors**

```powershell
git add src/domain
git commit -m "feat: add finance and dashboard selectors"
```

---

### Task 4: Design Tokens, Route Model, and Employee Shell

**Files:**
- Modify: `DESIGN.md`
- Modify: `src/main.tsx`
- Replace: `src/styles.css`
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/components.css`
- Create: `src/styles/responsive.css`
- Create: `src/styles/motion.css`
- Create: `src/app/routes.ts`
- Create: `src/components/brand/WeeleeLogo.tsx`
- Create: `src/components/navigation/EmployeeHeader.tsx`
- Create: `src/components/navigation/PrimaryNavigation.tsx`
- Create: `src/components/navigation/GroupedNavigation.tsx`
- Create: `src/components/navigation/navigation.test.tsx`

**Interfaces:**
- Consumes: `UserPreferences`, repository preference updates, and the approved visual tokens.
- Produces: `PageKey`, `SubviewKey`, `NavigationTarget`, `navigationGroups`, and accessible shell components.

- [ ] **Step 1: Configure Vitest for DOM component tests**

Add to `vite.config.ts`:

```ts
test: {
  environment: "jsdom",
  setupFiles: ["./src/test/setup.ts"],
},
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing navigation interaction test**

Create `src/components/navigation/navigation.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PrimaryNavigation } from "./PrimaryNavigation";

describe("PrimaryNavigation", () => {
  it("opens the employee menu and emits a working grouped destination", async () => {
    const onNavigate = vi.fn();
    render(<PrimaryNavigation activePage="my-day" onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Vehicle intake" }));
    expect(onNavigate).toHaveBeenCalledWith({ page: "inventory", subview: "intake" });
  });
});
```

- [ ] **Step 3: Run the navigation test and confirm the component is missing**

Run: `npm.cmd test -- src/components/navigation/navigation.test.tsx`

Expected: FAIL because `PrimaryNavigation` does not exist.

- [ ] **Step 4: Define exact routes and implement the shell navigation**

Define page keys `my-day`, `inventory`, `customers`, `pipeline`, `sales`, `finance`, `service`, `operations`. Map every destination listed in `DESIGN_SPEC.md` to one page and subview. Use native buttons and a `role="menu"` flyout with escape-to-close and focus return.

Update `DESIGN.md` to replace the MotorOS navy/blue contract with the approved Weelee monochrome tokens and component states before importing the new CSS files from `src/styles.css`.

Render the brand asset path `/media/brand/weelee-logo-transparent.png` with `width`, `height`, and `alt="Weelee"` in `WeeleeLogo`.

Wire the existing development-only tools in `src/main.tsx` without loading them in production:

```ts
if (import.meta.env.DEV) {
  void import("react-grab");
  void import("react-scan").then(({ scan }) => scan({ enabled: true }));
}
```

- [ ] **Step 5: Run the navigation test and typecheck**

Run: `npm.cmd test -- src/components/navigation/navigation.test.tsx`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 6: Commit the design contract and shell**

```powershell
git add DESIGN.md vite.config.ts src/main.tsx src/styles.css src/styles src/test src/app/routes.ts src/components/brand src/components/navigation
git commit -m "feat: build Weelee employee navigation shell"
```

---

### Task 5: Reusable Controls, Overlays, and Application State

**Files:**
- Create: `src/components/controls/Button.tsx`
- Create: `src/components/controls/Field.tsx`
- Create: `src/components/controls/StatusPill.tsx`
- Create: `src/components/controls/Tabs.tsx`
- Create: `src/components/data-display/MetricBlock.tsx`
- Create: `src/components/data-display/RecordTable.tsx`
- Create: `src/components/feedback/ToastRegion.tsx`
- Create: `src/components/overlays/Dialog.tsx`
- Create: `src/components/overlays/Drawer.tsx`
- Create: `src/components/overlays/MediaViewer.tsx`
- Create: `src/app/useDemoApp.ts`
- Create: `src/components/overlays/Dialog.test.tsx`

**Interfaces:**
- Consumes: `DemoRepository`, route targets, tone/status values.
- Produces: reusable state-complete primitives and `useDemoApp(repository)`.

- [ ] **Step 1: Write the failing dialog keyboard test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Dialog } from "./Dialog";

it("closes on Escape and returns focus to the trigger", async () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return <><button onClick={() => setOpen(true)}>Open intake</button><Dialog open={open} title="Vehicle intake" onClose={() => setOpen(false)}><button>Save draft</button></Dialog></>;
  }
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Open intake" });
  await userEvent.click(trigger);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
```

- [ ] **Step 2: Run the test and verify the missing component failure**

Run: `npm.cmd test -- src/components/overlays/Dialog.test.tsx`

Expected: FAIL because `Dialog` does not exist.

- [ ] **Step 3: Implement primitives and overlay behavior**

Use native semantic elements, `aria-modal="true"`, labelled titles, escape handling, focus containment, focus return, and background scroll locking. `MediaViewer` accepts `{ images: VehicleImage[]; activeIndex: number; onIndexChange(index: number): void; onClose(): void }` and supports arrow keys.

`useDemoApp` owns the current navigation target, active overlay, toast queue, search command state, and repository snapshot via `useSyncExternalStore`.

- [ ] **Step 4: Run tests and typecheck**

Run: `npm.cmd test -- src/components/overlays/Dialog.test.tsx`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 5: Commit reusable application primitives**

```powershell
git add src/components src/app/useDemoApp.ts
git commit -m "feat: add accessible employee UI primitives"
```

---

### Task 6: My Day, Action Centre, and Command Search

**Files:**
- Create: `src/features/my-day/MyDayPage.tsx`
- Create: `src/features/action-centre/ActionCentreView.tsx`
- Create: `src/features/action-centre/commandSearch.ts`
- Create: `src/features/action-centre/commandSearch.test.ts`

**Interfaces:**
- Consumes: repository snapshot, `completeTask`, `rescheduleTask`, navigation callback.
- Produces: employee landing page, task actions, notification/action views, `searchCommands(state, query)`.

- [ ] **Step 1: Write the failing global-search test**

```ts
import { describe, expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { searchCommands } from "./commandSearch";

it("finds vehicles, customers, deals, and actions with permission-safe labels", () => {
  const state = createSeedState();
  expect(searchCommands(state, "GT3").some((result) => result.type === "vehicle")).toBe(true);
  expect(searchCommands(state, state.customers[0].phone).some((result) => result.type === "customer")).toBe(true);
  expect(searchCommands(state, state.deals[0].id).some((result) => result.type === "deal")).toBe(true);
});
```

- [ ] **Step 2: Run and confirm missing search implementation**

Run: `npm.cmd test -- src/features/action-centre/commandSearch.test.ts`

Expected: FAIL because `searchCommands` does not exist.

- [ ] **Step 3: Implement search and employee landing views**

Render the reference-style KPI rule blocks, current date, priority list, agenda, approvals, branch activity, and task actions. `searchCommands` returns at most eight ranked results with `{ id, type, title, detail, target }`, matching exact IDs before substring title matches.

- [ ] **Step 4: Run feature tests and typecheck**

Run: `npm.cmd test -- src/features/action-centre/commandSearch.test.ts`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 5: Commit employee command views**

```powershell
git add src/features/my-day src/features/action-centre
git commit -m "feat: add My Day and action centre"
```

---

### Task 7: Inventory, Gallery, and Vehicle Intake

**Files:**
- Modify: `src/media/vehicleGalleries.ts`
- Create: `src/features/inventory/InventoryPage.tsx`
- Create: `src/features/inventory/VehicleDetail.tsx`
- Create: `src/features/inventory/VehicleGallery.tsx`
- Create: `src/features/inventory/VehicleGallery.test.tsx`
- Create: `src/features/inventory/VehicleIntake.tsx`
- Create: `src/features/inventory/intakeValidation.ts`
- Create: `src/features/inventory/intakeValidation.test.ts`

**Interfaces:**
- Consumes: vehicles, selectors, repository vehicle actions, `MediaViewer`.
- Produces: inventory list/detail/intake and `validateVehicleIntake(input, state)`.

- [ ] **Step 1: Write failing gallery-interaction and intake tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { VehicleGallery } from "./VehicleGallery";

it("moves through all eight images with arrow keys", async () => {
  render(<VehicleGallery vehicle={createSeedState().vehicles[0]} />);
  expect(screen.getByText("Image 1 of 8")).toBeInTheDocument();
  for (let index = 1; index < 8; index += 1) await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByText("Image 8 of 8")).toBeInTheDocument();
});
```

```ts
it("returns a specific duplicate VIN error", () => {
  const state = createSeedState();
  expect(validateVehicleIntake({ vin: state.vehicles[0].vin, stockId: "WEE-1000", year: 2024, make: "BMW", model: "M3", price: 1_000_000 }, state)).toEqual({ vin: "VIN already exists in the active Weelee inventory." });
});
```

- [ ] **Step 2: Run tests and verify missing modules**

Run: `npm.cmd test -- src/features/inventory/VehicleGallery.test.tsx src/features/inventory/intakeValidation.test.ts`

Expected: FAIL because the gallery component and validator do not exist.

- [ ] **Step 3: Verify the eighty-path manifest and implement intake validation**

Confirm the Task 1 manifest still exposes eight entries for each `vehicle-01` through `vehicle-10`, using filenames `01-front`, `02-front-left`, `03-left`, `04-rear-left`, `05-rear`, `06-rear-right`, `07-right`, `08-front-right`, project paths under `/media/vehicles/<vehicle-slug>/`, and descriptive alt text.

Validation errors must cover empty VIN, VIN not 17 characters, duplicate VIN, duplicate stock ID, invalid year outside 1980–2026, missing make/model, and non-positive price.

- [ ] **Step 4: Implement inventory, detail, gallery, and four-step intake UI**

Inventory supports query/status filters, reference-style selected inventory, operational table, working detail navigation, edit form, and resettable filters. Gallery supports click, arrow keys, swipe, thumbnail focus, current position announcement, and full-screen viewer. Intake auto-saves its form draft through repository preferences and creates the vehicle plus audit activity on review confirmation.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm.cmd test -- src/features/inventory/VehicleGallery.test.tsx src/features/inventory/intakeValidation.test.ts src/repository/demoRepository.test.ts src/repository/seed.test.ts`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 6: Commit inventory workflows**

```powershell
git add src/media src/features/inventory
git commit -m "feat: add persistent inventory and galleries"
```

---

### Task 8: Customers, Pipeline, and Sales Log

**Files:**
- Create: `src/features/customers/CustomersPage.tsx`
- Create: `src/features/customers/CustomerDetail.tsx`
- Create: `src/features/pipeline/PipelinePage.tsx`
- Create: `src/features/pipeline/pipelineRules.ts`
- Create: `src/features/pipeline/pipelineRules.test.ts`
- Create: `src/features/sales/SalesPage.tsx`
- Create: `src/features/sales/exportSalesCsv.ts`
- Create: `src/features/sales/exportSalesCsv.test.ts`

**Interfaces:**
- Consumes: customer/lead/deal data and repository mutations.
- Produces: customer directory/detail, accessible pipeline movement, sales log, `canMoveLead(from, to)`, `exportSalesCsv(deals, state)`.

- [ ] **Step 1: Write failing pipeline and CSV tests**

```ts
it("permits forward and recovery pipeline moves but rejects an identical stage", () => {
  expect(canMoveLead("Lead", "Negotiation")).toBe(true);
  expect(canMoveLead("Contract", "Negotiation")).toBe(true);
  expect(canMoveLead("Delivery", "Delivery")).toBe(false);
});
```

```ts
it("exports South African currency-safe sales rows without spreadsheet formulas", () => {
  const state = createSeedState();
  const csv = exportSalesCsv(state.deals, state);
  expect(csv).toContain("Date,Vehicle,VIN,Sales Rep,Gross Profit,Status");
  expect(csv).toContain("2024 Porsche 911 GT3");
  expect(csv.split("\n").some((line) => /^[=+\-@]/.test(line))).toBe(false);
});
```

- [ ] **Step 2: Run tests and confirm missing behavior**

Run: `npm.cmd test -- src/features/pipeline/pipelineRules.test.ts src/features/sales/exportSalesCsv.test.ts`

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement pure rules and CSV escaping**

Allow movement among all distinct approved stages. Escape commas, quotes, line breaks, and leading spreadsheet formula characters. Format gross profit as a plain decimal string in CSV so spreadsheet consumers decide display currency.

- [ ] **Step 4: Implement working customer, pipeline, and sales views**

Customer detail must show overview, activity, leads, vehicles, deals, service, tasks, and notes as working tabs. Pipeline supports pointer drag plus explicit move menus. Sales supports search, status sort/filter, locally generated download, and a working new-deal form.

- [ ] **Step 5: Run feature tests and typecheck**

Run: `npm.cmd test -- src/features/customers src/features/pipeline src/features/sales`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 6: Commit CRM and sales workflows**

```powershell
git add src/features/customers src/features/pipeline src/features/sales
git commit -m "feat: connect customers pipeline and sales"
```

---

### Task 9: Finance and Service Workflows

**Files:**
- Create: `src/features/finance/FinancePage.tsx`
- Create: `src/features/finance/PaymentBreakdown.tsx`
- Create: `src/features/finance/financeValidation.ts`
- Create: `src/features/finance/financeValidation.test.ts`
- Create: `src/features/service/ServicePage.tsx`
- Create: `src/features/service/serviceRules.ts`
- Create: `src/features/service/serviceRules.test.ts`

**Interfaces:**
- Consumes: finance calculations, finance drafts, service jobs, repository mutations.
- Produces: deal structuring, demo submission activity, service board, `validateFinanceDraft`, `canTransitionServiceJob`.

- [ ] **Step 1: Write failing finance and service rule tests**

```ts
it("requires a deposit below vehicle price and a supported term", () => {
  const validDraft: FinanceDraft = {
    vehicleId: "vehicle-01",
    vehiclePrice: 3_699_900,
    downPayment: 450_000,
    termMonths: 60,
    aprPercent: 11.25,
    tradeAllowance: 300_000,
    lienPayoff: 120_000,
    serviceContract: 45_000,
    gapInsurance: 8_950,
  };
  expect(validateFinanceDraft({ ...validDraft, downPayment: validDraft.vehiclePrice + 1 })).toEqual({ downPayment: "Down payment must be lower than the vehicle price." });
});
```

```ts
it("requires quality check before a vehicle can be marked ready", () => {
  expect(canTransitionServiceJob("In Progress", "Ready")).toBe(false);
  expect(canTransitionServiceJob("Quality Check", "Ready")).toBe(true);
});
```

- [ ] **Step 2: Run tests and confirm missing validation modules**

Run: `npm.cmd test -- src/features/finance/financeValidation.test.ts src/features/service/serviceRules.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement validation and state-machine rules**

Finance validation checks positive price, down payment between zero and price, term in `36|48|60|72`, APR between zero and thirty, and non-negative products/trade values. Service transitions follow `Booked → Checked In → In Progress|Waiting for Parts → Quality Check → Ready → Completed`, allowing cancellation only through an explicit confirmation handled by the UI.

- [ ] **Step 4: Implement finance and service pages**

Finance mirrors the supplied form and live payment breakdown in Rand. `Submit demo application` clearly states no lender was contacted and creates a local audit activity. Service renders schedule/list/board subviews, working notes and status transitions, parts risk, approval state, and completion confirmation.

- [ ] **Step 5: Run feature tests and typecheck**

Run: `npm.cmd test -- src/features/finance src/features/service src/domain/calculations.test.ts`

Expected: PASS.

Run: `npm.cmd run check`

Expected: PASS.

- [ ] **Step 6: Commit finance and aftersales workflows**

```powershell
git add src/features/finance src/features/service
git commit -m "feat: add finance and service workflows"
```

---

### Task 10: Compose the Application and Persist Navigation

**Files:**
- Replace: `src/app/App.tsx`
- Modify: `src/main.tsx`
- Create: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: all feature views, repository, routes, shell, overlays, and `useDemoApp`.
- Produces: complete routeable single-page demo.

- [ ] **Step 1: Write the failing application-navigation persistence test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { App } from "./App";

it("navigates to inventory and restores the page from persisted preferences", async () => {
  const storage = memoryStorage();
  const repository = createDemoRepository(storage);
  const { unmount } = render(<App repository={repository} />);
  await userEvent.click(screen.getByRole("button", { name: "Inventory" }));
  expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
  unmount();
  render(<App repository={createDemoRepository(storage)} />);
  expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm the old App API fails**

Run: `npm.cmd test -- src/app/App.test.tsx`

Expected: FAIL because the existing `App` does not accept a repository or render the approved navigation.

- [ ] **Step 3: Replace the monolith with a focused composition root**

`App` accepts an optional `DemoRepository`, defaults to a browser repository, renders the header/nav, selects the active page/subview, mounts overlays/toasts, and wraps page changes in `document.startViewTransition` when available and reduced motion is not requested. No feature-specific data transformation remains in `App.tsx`.

- [ ] **Step 4: Run the application test, full unit suite, and typecheck**

Run: `npm.cmd test`

Expected: PASS with zero failures.

Run: `npm.cmd run check`

Expected: PASS with zero TypeScript errors.

- [ ] **Step 5: Commit application composition**

```powershell
git add src/app src/main.tsx
git commit -m "feat: compose the Weelee employee demo"
```

---

### Task 11: Generate and Integrate the Transparent Logo and Eighty Vehicle Images

**Files:**
- Create: `public/media/brand/weelee-logo-transparent.png`
- Create: `public/media/vehicles/<ten-slugs>/<eight-angle-files>.png`
- Modify: `src/media/vehicleGalleries.ts` only if generated extension differs from the manifest.

**Interfaces:**
- Consumes: approved brand invariant, gallery manifest, ten vehicle definitions, eight angle sequence.
- Produces: one transparent brand lockup and eighty project-local studio files.

- [ ] **Step 1: Add a failing asset-existence verification script**

Create `scripts/verify-media.mjs`:

```js
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const vehicles = [
  "2024-porsche-911-gt3",
  "2023-bmw-m4-csl",
  "2024-audi-rs6-avant",
  "2024-land-rover-defender-110",
  "2024-porsche-taycan-turbo-s",
  "2024-mercedes-amg-c63-s",
  "2023-toyota-gr-supra",
  "2024-ford-ranger-raptor",
  "2024-volkswagen-golf-8-r",
  "2024-bmw-x5-m-competition",
];
const angles = ["01-front", "02-front-left", "03-left", "04-rear-left", "05-rear", "06-rear-right", "07-right", "08-front-right"];
const missing = [];
for (const vehicle of vehicles) {
  for (const angle of angles) {
    const file = join("public", "media", "vehicles", vehicle, `${angle}.png`);
    if (!existsSync(file) || statSync(file).size === 0) missing.push(file);
  }
}
const logo = join("public", "media", "brand", "weelee-logo-transparent.png");
if (!existsSync(logo) || statSync(logo).size === 0) missing.push(logo);
if (missing.length > 0) {
  throw new Error(`Missing media:\n${missing.join("\n")}`);
}
console.log("10 galleries, 80 vehicle images, 1 transparent brand asset");
```

Add to `package.json`:

```json
"verify:media": "node scripts/verify-media.mjs"
```

- [ ] **Step 2: Run media verification and confirm it fails before generation**

Run: `npm.cmd run verify:media`

Expected: FAIL listing the missing brand asset and eighty missing gallery assets.

- [ ] **Step 3: Produce the transparent Weelee lockup with the built-in image editor**

Use case: `background-extraction`. Preserve only the exact supplied circular green `W` mark and dark Weelee wordmark. Remove the white field to genuine alpha. Preserve proportions, edges, spelling, and brand colours; add no shadow, outline, slogan, or container. Copy the selected result into `public/media/brand/weelee-logo-transparent.png`.

- [ ] **Step 4: Generate eighty distinct studio files using the built-in image generator**

Issue one image-generation request per vehicle/angle. Every prompt repeats the invariant block from `DESIGN_SPEC.md`, the exact vehicle/model/derivative/colour, and exactly one of the eight camera angles. Save each result to the manifest path. Inspect each output for full-car framing, model/colour/wheel consistency, panel geometry, studio continuity, no text/watermarks/people, and correct angle before accepting it.

- [ ] **Step 5: Run the media verification**

Run: `npm.cmd run verify:media`

Expected: PASS with `10 galleries, 80 vehicle images, 1 transparent brand asset`.

- [ ] **Step 6: Commit generated project media**

```powershell
git add public/media src/media scripts/verify-media.mjs package.json package-lock.json
git commit -m "feat: add Weelee brand and studio vehicle galleries"
```

---

### Task 12: Responsive, Motion, Accessibility, and Browser Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/persistence.spec.ts`
- Create: `tests/e2e/galleries.spec.ts`
- Create: `tests/e2e/workflows.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Modify: `src/styles/responsive.css`
- Modify: `src/styles/motion.css`
- Modify: feature/component files only for defects found by the browser tests.

**Interfaces:**
- Consumes: production application and all persisted workflows.
- Produces: executable regression coverage and four-viewport visual evidence.

- [ ] **Step 1: Write failing Playwright smoke and gallery tests**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:5180", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://127.0.0.1:5180", reuseExistingServer: true },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

Create `tests/e2e/navigation.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("all primary employee destinations render", async ({ page }) => {
  await page.goto("/");
  const destinations = ["My Day", "Inventory", "Customers", "Pipeline", "Sales", "Finance", "Service"];
  for (const destination of destinations) {
    await page.getByRole("button", { name: destination, exact: true }).click();
    await expect(page.locator("main h1")).toBeVisible();
  }
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("menuitem", { name: "Vehicle intake" }).click();
  await expect(page.getByRole("heading", { name: "Vehicle intake" })).toBeVisible();
});
```

Create `tests/e2e/galleries.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("each vehicle exposes all eight studio images", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  for (const card of await page.getByTestId("vehicle-card").all()) {
    await card.click();
    await expect(page.getByText("Image 1 of 8")).toBeVisible();
    for (let index = 1; index < 8; index += 1) await page.keyboard.press("ArrowRight");
    await expect(page.getByText("Image 8 of 8")).toBeVisible();
    await page.getByRole("button", { name: "Back to inventory" }).click();
  }
});
```

Create `tests/e2e/persistence.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("a vehicle price edit survives reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await page.getByTestId("vehicle-card").first().click();
  await page.getByRole("button", { name: "Edit record" }).click();
  await page.getByLabel("Listing price").fill("3650000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.reload();
  await expect(page.getByText("R 3 650 000")).toBeVisible();
});
```

Create `tests/e2e/workflows.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("employee actions update connected views", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("priority-task").first().getByRole("button", { name: "Complete" }).click();
  await expect(page.getByRole("status")).toContainText("Task completed");
  await page.getByRole("button", { name: "Finance", exact: true }).click();
  await page.getByLabel("Down payment").fill("500000");
  await expect(page.getByTestId("monthly-payment")).toContainText("R");
  await page.getByRole("button", { name: "Service", exact: true }).click();
  await page.getByTestId("service-job").first().getByRole("button", { name: "Advance status" }).click();
  await expect(page.getByRole("status")).toContainText("Service status updated");
});
```

Create `tests/e2e/accessibility.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("menus, focus, escape, and reduced motion remain operable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "More" }).focus();
  await expect(page.getByRole("button", { name: "More" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(page.getByRole("button", { name: "More" })).toBeFocused();
  const duration = await page.locator("main").evaluate((element) => getComputedStyle(element).animationDuration);
  expect(["0s", "0.001s"]).toContain(duration);
});
```

- [ ] **Step 2: Run Playwright before defect fixes**

Run: `npx.cmd playwright test`

Expected: At least one failure identifying remaining integration, asset, responsive, or accessibility defects.

- [ ] **Step 3: Fix browser-detected behavior and responsive defects**

At `375`, `768`, `1280`, and `1440` widths verify no horizontal page overflow, no clipped navigation, no obscured dialog actions, and full gallery usability. Make mobile touch targets at least `44px`; keep desktop density; add sticky table identifiers only where horizontal scrolling is required.

- [ ] **Step 4: Verify keyboard and reduced-motion behavior**

Test tab order, visible focus, escape close, focus return, arrow-key gallery, pipeline move menu, command search, dialog labels, status text, and a reduced-motion context where computed animation and transition durations are effectively disabled for non-essential motion.

- [ ] **Step 5: Capture reference-fidelity screenshots**

Capture My Day, Inventory, Vehicle Detail, Customers, Pipeline, Finance, Service, desktop navigation flyout, mobile navigation sheet, and vehicle intake at their target viewports. Compare typography, whitespace, rule placement, button dimensions, form density, and status chips against the supplied references. Apply one bounded correction pass, then recapture.

- [ ] **Step 6: Run the complete verification suite**

Run: `npm.cmd run check`

Expected: PASS.

Run: `npm.cmd test`

Expected: PASS.

Run: `npm.cmd run verify:media`

Expected: PASS with eighty vehicle images.

Run: `npm.cmd run build`

Expected: PASS with a production `dist` bundle.

Run: `npx.cmd playwright test`

Expected: PASS with zero failed browser tests.

Run: `git diff --check`

Expected: no output and exit code zero.

- [ ] **Step 7: Commit browser quality work**

```powershell
git add playwright.config.ts tests src/styles src/components src/features
git commit -m "test: verify responsive Weelee employee workflows"
```

---

### Task 13: Documentation and Final Requirement Audit

**Files:**
- Modify: `README.md`
- Create: `ARCHITECTURE.md`
- Create: `TESTING.md`
- Create: `DEPLOYMENT.md`
- Create: `.env.example`

**Interfaces:**
- Consumes: verified implementation, commands, storage key, production boundary.
- Produces: honest operator/developer documentation.

- [ ] **Step 1: Document exact run, reset, persistence, and verification behavior**

README must identify the app as a Weelee employee demo, list the ten connected vehicles and core workflows, document `weelee-employee-demo-v1`, explain `Reset demo data`, and state that external submissions are simulated.

- [ ] **Step 2: Document architecture and production boundary**

`ARCHITECTURE.md` describes the repository interface, state schema, feature boundaries, gallery manifest, and the server adapter seam. `DEPLOYMENT.md` describes the static Vite deployment, cache headers for hashed assets, and the missing backend requirements before real employee use. `.env.example` contains only commented variable names for a future API base URL and demo-mode flag, with no secrets.

- [ ] **Step 3: Document test commands and browser journeys**

`TESTING.md` lists unit, typecheck, media verification, production build, and Playwright commands plus the four required viewports and reduced-motion coverage.

- [ ] **Step 4: Audit every approved specification section**

Create a temporary checklist from `DESIGN_SPEC.md` Sections 1–15. For each requirement, point to a source file, asset path, automated test, or browser screenshot. Fix any uncovered requirement before continuing; do not commit the temporary checklist.

- [ ] **Step 5: Run fresh final verification**

Run `npm.cmd run check`, `npm.cmd test`, `npm.cmd run verify:media`, `npm.cmd run build`, `npx.cmd playwright test`, and `git diff --check` in that order. Every command must exit zero before completion is reported.

- [ ] **Step 6: Commit documentation**

```powershell
git add README.md ARCHITECTURE.md TESTING.md DEPLOYMENT.md .env.example
git commit -m "docs: document the Weelee employee demo"
```
