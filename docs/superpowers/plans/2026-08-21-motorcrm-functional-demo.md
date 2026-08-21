# MotorCRM Functional Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Vite MotorCRM into a connected, role-aware dealership CRM demo with 30 vehicles, 240 images, contextual intelligence, and an agent queue.

**Architecture:** Keep the outer Vite SPA and typed browser repository as the production application. Adapt Comp AI concepts into focused domain, access, context, and agent modules while preserving the approved MotorCRM UI.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Playwright, localStorage, existing CSS and component primitives.

**Spec:** `docs/superpowers/specs/2026-08-21-motorcrm-functional-demo-design.md`

## Global Constraints

- Keep Vite, React, TypeScript, Vitest, Testing Library, and the existing outer project structure.
- Keep `motorcrm-release` read-only and outside root test discovery.
- Preserve `DESIGN.md` and `DESIGN_SPEC.md` without visual redesign.
- Use tests before every behavior change.
- Keep all demo records fictional and interconnected.
- Label browser-only authentication and authorization as functional demo security.
- Maintain exactly 30 seeded vehicles and 240 valid gallery files.
- Use `gsd-code-review` because no CodeRabbit-specific skill or executable exists.

---

### Task 1: Stabilize the existing Vite test boundary

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `src/app/App.final.test.tsx`
- Test: `src/app/App.final.test.tsx`

**Interfaces:**
- Produces: root Vitest discovery limited to `src/**/*.test.{ts,tsx}`.
- Produces: deterministic inventory routing assertions without arbitrary timing dependence.

- [ ] Reproduce the inventory routing timeout alone and record duration, stack, and DOM state.
- [ ] Compare the failing flow with working routing tests in `App.routingMetadata.test.tsx`.
- [ ] Add `vitest.config.ts` with `include: ["src/**/*.test.{ts,tsx}"]` and current jsdom setup.
- [ ] Make the smallest test or implementation correction supported by the root-cause evidence.
- [ ] Run `npx vitest run src/app/App.final.test.tsx --reporter=verbose`.
- [ ] Run `npm test` and confirm nested Comp AI tests are absent.
- [ ] Run `npm run check` and `npm run build`.

### Task 2: Expand vehicle records and media contracts

**Files:**
- Modify: `src/domain/models.ts`
- Modify: `src/repository/seed.ts`
- Modify: `src/media/vehicleGalleries.ts`
- Modify: `src/media/vehicleGalleryManifest.json`
- Modify: `scripts/verify-media.mjs`
- Create: `src/repository/inventorySeed.test.ts`
- Create: `public/media/vehicles/<20-new-vehicle-slugs>/*`

**Interfaces:**
- Produces: `createSeedState().vehicles` with exactly 30 distinct records.
- Produces: eight valid `VehicleImage` entries and files per vehicle.
- Produces: richer vehicle fields for body, fuel, transmission, engine, registration, and stock history.

- [ ] Write a failing seed test for 30 unique vehicles, 240 image paths, varied fields, branches, and statuses.
- [ ] Run the test and confirm it fails on the existing count of 10.
- [ ] Extend vehicle types without breaking existing consumers.
- [ ] Add 20 realistic South African vehicle records and eight galleries per record.
- [ ] Add the corresponding local media assets and regenerate the manifest.
- [ ] Run the seed test and `npm run verify:media`.
- [ ] Run inventory and gallery component tests.

### Task 3: Add demo identity, branches, roles, and permissions

**Files:**
- Create: `src/domain/access.ts`
- Create: `src/domain/access.test.ts`
- Modify: `src/domain/models.ts`
- Modify: `src/repository/seed.ts`
- Modify: `src/repository/migrations.ts`
- Modify: `src/repository/migrations.test.ts`
- Modify: `src/repository/demoRepository.ts`

**Interfaces:**
- Produces: `Permission`, `DemoRole`, `DemoAccount`, `DemoSession`, `Organization`, `Branch`, and `Employee` types.
- Produces: `can(session, permission)`, `visibleBranchIds(session)`, `canAccessPage(session, page)`, and `canMutate(session)`.
- Produces: repository `signIn`, `signOut`, and `currentSession` operations.

- [ ] Write failing permission matrix tests for all eleven requested accounts.
- [ ] Write failing branch-scope and auditor mutation tests.
- [ ] Add schema version two types and a migration that preserves preferences.
- [ ] Seed the dealer group, four branches, employees, accounts, and role permissions.
- [ ] Implement repository session operations and access helpers.
- [ ] Run access, seed, migration, and repository tests.

### Task 4: Build the existing-design login and protected shell

**Files:**
- Create: `src/features/auth/LoginPage.tsx`
- Create: `src/features/auth/LoginPage.test.tsx`
- Create: `src/features/auth/AccessDenied.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/useDemoApp.ts`
- Modify: `src/components/navigation/EmployeeShell.tsx`
- Modify: `src/components/navigation/PrimaryNavigation.tsx`
- Modify: `src/components/navigation/GroupedNavigation.tsx`
- Modify: `src/styles/components.css`
- Modify: `src/styles/responsive.css`

**Interfaces:**
- Consumes: repository session operations and access helpers from Task 3.
- Produces: a functional login, account switcher, sign-out action, filtered navigation, and denied-route state.

- [ ] Write failing login tests for valid, invalid, read-only, and role-specific sessions.
- [ ] Write failing navigation tests proving sales and employee users cannot open administration surfaces.
- [ ] Implement the login surface with existing form and button primitives.
- [ ] Gate pages and navigation through named permissions.
- [ ] Disable or hide mutations through the same permission helpers.
- [ ] Run auth, navigation, App, accessibility, and responsive component tests.

### Task 5: Seed an interconnected dealership dataset

**Files:**
- Modify: `src/domain/models.ts`
- Modify: `src/repository/seed.ts`
- Create: `src/repository/seedIntegrity.ts`
- Create: `src/repository/seedIntegrity.test.ts`

**Interfaces:**
- Produces: 40–60 customers, 50–100 leads, 20–40 deals, 10–20 employees, plus linked appointments, test drives, quotes, payments, finance applications, activities, tasks, and documents.
- Produces: `validateDemoState(state): SeedIntegrityIssue[]`.

- [ ] Write a failing integrity test for counts, unique identifiers, and relationship validity.
- [ ] Add the new relationship types and lifecycle statuses.
- [ ] Generate deterministic fictional records connected through identifiers.
- [ ] Implement integrity validation for every foreign-key-like reference.
- [ ] Run integrity, repository, selector, and migration tests.

### Task 6: Add contextual record selectors and intelligence

**Files:**
- Create: `src/domain/context.ts`
- Create: `src/domain/context.test.ts`
- Create: `src/domain/intelligence.ts`
- Create: `src/domain/intelligence.test.ts`
- Create: `src/components/data-display/ContextTimeline.tsx`
- Create: `src/components/data-display/IntelligencePanel.tsx`
- Modify: `src/features/customers/CustomerDetail.tsx`
- Modify: `src/features/inventory/VehicleDetail.tsx`
- Modify: `src/features/sales/DealEntry.tsx`
- Modify: `src/app/DomainWorkspace.tsx`

**Interfaces:**
- Produces: `customerContext`, `vehicleContext`, `leadContext`, and `dealContext` selectors.
- Produces: evidence-backed `AgentInsight[]` with summaries, risks, and recommended actions.

- [ ] Write failing context tests for customer-to-lead-to-vehicle-to-deal-to-finance chains.
- [ ] Write failing intelligence tests for stale leads, aged stock, idle deals, and missing documents.
- [ ] Implement pure selectors and deterministic insight rules.
- [ ] Add timeline and intelligence primitives using existing design tokens.
- [ ] Integrate contextual tabs into existing record details.
- [ ] Run context, intelligence, and detail component tests.

### Task 7: Implement the agent task queue and Command Centre

**Files:**
- Create: `src/domain/agentQueue.ts`
- Create: `src/domain/agentQueue.test.ts`
- Create: `src/features/action-centre/AgentQueue.tsx`
- Create: `src/features/action-centre/AgentQueue.test.tsx`
- Modify: `src/features/action-centre/ActionCentreView.tsx`
- Modify: `src/repository/demoRepository.ts`
- Modify: `src/app/useDemoApp.ts`

**Interfaces:**
- Produces: `rankAgentTasks(state, session): AgentTask[]`.
- Produces: safe queue transitions for assign, acknowledge, complete, and dismiss.

- [ ] Write failing priority tests covering scores 400 through 950.
- [ ] Write failing visibility and mutation tests for branch roles and auditors.
- [ ] Implement deterministic task generation and stable ordering.
- [ ] Implement repository transitions with audit activities.
- [ ] Add the Agent Queue to the existing Action Centre composition.
- [ ] Run agent queue, Action Centre, and command search tests.

### Task 8: Add role-specific dashboards and scoped records

**Files:**
- Create: `src/domain/dashboard.ts`
- Create: `src/domain/dashboard.test.ts`
- Create: `src/features/my-day/RoleDashboard.tsx`
- Create: `src/features/my-day/RoleDashboard.test.tsx`
- Modify: `src/features/my-day/MyDayPage.tsx`
- Modify: `src/app/DomainWorkspace.tsx`
- Modify: `src/domain/selectors.ts`
- Modify: `src/domain/selectors.test.ts`

**Interfaces:**
- Produces: `dashboardFor(session, state)` with executive, manager, sales, finance, stock, marketing, accounts, employee, and auditor variants.
- Produces: branch- and assignment-scoped selectors for every primary list.

- [ ] Write failing dashboard tests for CEO, sales, stock, finance, employee, and auditor metrics.
- [ ] Write failing selector tests for branch and own-record filtering.
- [ ] Implement role-specific dashboard view models from connected records.
- [ ] Render them through existing metric, table, and card primitives.
- [ ] Apply scoped selectors to lists and record-opening actions.
- [ ] Run dashboard, selector, route matrix, and action tests.

### Task 9: Verify browser workflows, review changes, and document reality

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/demo-roles.spec.ts`
- Modify: `README.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/CRM_LOGIC.md`
- Create: `docs/AGENTS.md`
- Create: `docs/ROLES_AND_PERMISSIONS.md`
- Create: `docs/DEMO_ACCOUNTS.md`
- Create: `docs/INVENTORY.md`
- Create: `docs/CUSTOMERS.md`
- Create: `docs/LEADS.md`
- Create: `docs/SALES.md`
- Create: `docs/FINANCE.md`
- Create: `docs/STAFF.md`
- Create: `docs/DATA_MODEL.md`
- Create: `docs/TESTING.md`
- Create: `docs/CODERABBIT.md`
- Create: `docs/DEPLOYMENT.md`
- Create: `docs/MIGRATION_FROM_COMP_AI.md`
- Create: `docs/KNOWN_LIMITATIONS.md`

**Interfaces:**
- Produces: browser evidence for representative role workflows.
- Produces: documentation matching the implemented demo boundary.

- [ ] Write browser tests for login, scoped navigation, customer context, vehicle galleries, agent queue, and auditor denial.
- [ ] Run browser tests at desktop and mobile widths.
- [ ] Run the installed `gsd-code-review` workflow against changed source files.
- [ ] Resolve valid critical and warning findings, then rerun affected tests.
- [ ] Run `npm run check`, `npm test`, `npm run verify:media`, browser tests, and `npm run build`.
- [ ] Write documentation from verified behavior and include exact commands and known limitations.
- [ ] Run final diff checks and verify no nested Comp AI files changed.
