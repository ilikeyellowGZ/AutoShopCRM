# MotorCRM Platform Audit

Date: 2026-08-22

## Current Architecture

MotorCRM is a Vite React single-page application. The root application is the product. The nested `motorcrm-release` project is reference material only.

The app uses:

- Frontend framework: React with Vite.
- Language: TypeScript.
- Styling: project CSS files under `src/styles` and the root `DESIGN.md` contract.
- Test framework: Vitest, Testing Library, jsdom, and Playwright.
- Build command: `npm run build`.
- Type check command: `npm run check`.
- Static deployment: Netlify, with `dist` as the publish directory.
- Persistence: browser `localStorage` through `src/repository/storage.ts`.
- Repository layer: typed browser repository in `src/repository/demoRepository.ts`.
- Seed data: deterministic state from `src/repository/seed.ts`.
- Migration layer: local persisted-state migration in `src/repository/migrations.ts`.
- Media storage: local files under `public/media`.
- Media manifest: `src/media/vehicleGalleryManifest.json`.
- Authentication: functional demo login in the client application.
- Authorization: functional demo RBAC and branch scoping in client application helpers.

## Not Present

This repository does not currently contain:

- A backend server.
- API routes.
- A database.
- An ORM or query builder.
- Server-enforced authentication.
- Server-enforced tenant isolation.
- Realtime transport.
- Background jobs.
- External file storage.
- Production observability services.
- A DBMS control centre.
- Server-side rate limits or security headers.

These missing systems are real platform gaps. They must not be represented as production-secure infrastructure in the UI or documentation.

## Existing CRM Modules

The current app already has reusable CRM surfaces:

- Employee shell and primary navigation.
- Login and role-aware access helpers.
- My Day and Action Centre.
- Command palette and global record search.
- Inventory, vehicle detail, vehicle intake, and gallery.
- Customer directory and customer detail.
- Sales entry and sales workspace.
- Pipeline board.
- Finance calculator and local demo finance submission.
- Service board, schedule, and job transitions.
- Domain workspaces for connected records.
- Audit-style activity records.
- Toast notifications.

## Current Data Model

The local state currently includes:

- Vehicles.
- Customers.
- Leads.
- Deals.
- Finance drafts.
- Finance applications.
- Service jobs.
- Employees.
- Appointments.
- Test drives.
- Quotes.
- Payments.
- CRM documents.
- Tasks.
- Notifications.
- Activities.
- Preferences.
- Draft forms.

Every persisted state load passes through migration and shape validation before the repository uses it.

## Reusable Systems

The next platform phases should reuse:

- `DemoState` domain types as the browser adapter contract.
- Repository commit functions for deterministic mutations and audit activity.
- Seed generation for rich demo data.
- `scopeStateForAccount` for demo branch and assignment filtering.
- `canAccessTarget` and permission helpers for role behavior.
- Existing `Button`, `Field`, `Tabs`, `MetricBlock`, `RecordTable`, `Dialog`, and shell components.
- Existing list expansion behavior for large connected datasets.
- Existing Vite, Vitest, Testing Library, and Playwright setup.

## Security Boundary

The current RBAC implementation is a functional demo. It changes routes, visible records, available actions, and local mutations. It does not secure a network boundary.

Production security requires a backend before real employee or customer data is stored:

- Server sessions.
- Password hashing.
- Server-side permission checks.
- Organization and branch enforcement in all queries.
- Rate limits.
- CSRF and security headers where applicable.
- Audit logs stored outside client-editable state.
- A real database with migrations and backups.

## Work OS Gap Analysis

The master prompt asks for an enterprise Work OS. The current app has the dealership CRM foundation, but the following systems remain unbuilt:

- Configurable board engine.
- Board groups, columns, items, subitems, and saved views.
- Contextual comments and mentions.
- Persistent staff chat.
- Realtime presence.
- Session analytics.
- Department templates for Marketing, Operations, IT, Product, HR, and PMO.
- Automation engine and run history.
- System Control Room.
- Observability model.
- Incident management.
- Safe recovery policies.
- DBMS control centre.
- Resource attribution.
- Error centre.
- Immutable audit store.

## Recommended Phase Order

The safest order is:

1. Finish connected dealership data, context selectors, intelligence, agent queue, and role dashboards.
2. Add a generic board engine that maps existing CRM records into table, kanban, calendar, timeline, and workload views.
3. Add contextual comments, mentions, notifications, and activity events.
4. Add local persistent chat and presence as a demo-only feature.
5. Add department workspace templates.
6. Add automation rules and deterministic run history.
7. Add a demo System Control Room that only shows runtime values that the browser can truthfully measure.
8. Document backend requirements for production observability, DBMS, incidents, and recovery.

## Deployment Notes

The app can deploy as a static website through the existing Netlify configuration. The CRM login and backend-like behavior run in the browser. A future production hosted CRM must add a backend and database instead of storing shared business data in `localStorage`.

## Review Notes

The user requested CodeRabbit review through a skill. No CodeRabbit-specific local skill or executable is available in this workspace. Use the available `gsd-code-review` skill as the local review fallback, and do not claim CodeRabbit has run.
