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

## Phase 1 Progress — Platform Foundation

Date: 2026-08-29. Schema version: 4.

### Tenancy

- Organization and Branch are records. `DemoState` holds `organizations` and `branches`.
- Vehicles, employees, appointments and sessions hold `branchId`. Branch identity decides visibility. Branch name does not.
- Branch identifiers include the organization. `branchIdForName(organizationId, name)` in `src/domain/models.ts` is the only definition. Two organizations can both own a branch called Sandton.
- Every account holds `organizationId` and a declared `dataScope` of `organization`, `branch` or `own`. Role names no longer drive visibility.
- `scopeStateForAccount` returns an empty workspace when the account organization owns no branch.
- Application routing reads the scoped state. A denied account cannot follow a persisted deep link.

### Sessions

- `startSession`, `touchSession` and `endSession` record real wall-clock times. The repository takes a clock, so tests control it.
- The demo seed contains no sessions. Session history accumulates from real sign-ins only.
- `sessionPresence` and `sessionDurationMs` in `src/domain/sessions.ts` derive online, idle, away and offline from real timestamps. No presence value is stored.
- Signing in again on one account ends the previous session with reason `replaced`.
- A user sees their own sessions. A holder of `staff.read` also sees sessions in visible branches of their own organization.

### Audit

- Every committed audit event carries `organizationId` and the `branchId` it happened in, derived from state at commit time.
- Audit reads are filtered by organization, so one dealer group cannot read another group's trail.

### Validation

- `isCompatibleDemoState` rejects duplicate branch identifiers, unresolvable `branchId` references on vehicles, employees, appointments and sessions, and audit events without an organization.
- `validateDemoState` checks organizations, branches, sessions and every branch link.
- `addVehicle` refuses a vehicle whose branch does not exist.

### Not Delivered

The notification centre is unbuilt. Notifications remain a flat list without categories, timestamps or deep links.

### Security Boundary Unchanged

This is browser-side scoping. It is not a network boundary. The production requirements in the Security Boundary section above still apply in full.

## Phase 2 Progress — Work OS

Date: 2026-08-30. Schema version: 6.

### Board Engine

- Workspace, Board, BoardGroup, BoardColumn, BoardItem and BoardView are generic records in `DemoState`. A board is described by its columns. No board has its own schema.
- Eleven column kinds ship: text, number, money, status, priority, person, date, checkbox, tags, progress and relation.
- `BoardCellValue` is a discriminated union. `valueKindForColumn` in `src/domain/boards.ts` maps each column kind to exactly one value shape. A status column cannot hold free text.
- `validateCellValue` rejects an undefined option, out-of-range progress, an unknown employee, and a relation to a missing record or the wrong record type. The repository refuses the write. `validateDemoState` checks every stored cell.

### Views

- `itemsForView` is the single read path. Table, kanban, calendar and workload all use it, so a view cannot disagree with the board behind it.
- Saved filters live on the view. Applying one narrows what is read and never changes an item.
- Kanban lanes come from the grouping column's options plus an explicit lane for unset values.
- Workload reports unassigned work rather than hiding it.
- Subitems hang off `parentItemId` and are never listed twice.

### Tenancy

- Workspaces are organization owned and may be branch scoped.
- A board item is hidden when any relation points at a record the viewer cannot see.
- An own-scoped account sees only work assigned to it, or unassigned work.
- A subitem never outlives a hidden parent.
- A person assigned to visible work is named only within the viewer's visible branches. Anyone further away reads "Outside your access". Branch isolation is not relaxed to render a name.
- Saved filters compare person cells on the employee id, so one saved view returns the same rows for every viewer.

### Permissions

`work.item.write` allows creating, moving and editing items. `work.view.manage` allows saving views. The CEO and the auditor hold neither.

### Not Delivered

Timeline and Gantt render through the calendar view and have no dependency or milestone model. There is no drag and drop; items move through explicit buttons. There is no column editor, so a board's columns are seeded rather than user-configurable.

## Phase 3 Progress — Collaboration

Date: 2026-08-30. Schema version: 7.

### Contextual Discussion

- `Comment` hangs off any record through `entityType` and `entityId`: vehicle, customer, lead, deal, service, task and board item. An optional `columnId` anchors a comment to one field.
- Threads are one level deep. A reply must stay on its parent's record, and a reply cannot be replied to.
- Comments carry pin, resolve and reopen state, an edited marker, and emoji reactions that disappear when the last person removes theirs.

### Mentions

- `findMentions` matches `@Firstname Lastname` against the employee directory, longest name first, so a colleague whose name is a prefix of another is never mistaken for them. An unmatched `@word` stays plain text.
- A mention creates a high-priority notification for that person, carrying `commentId` so the notification links back to the comment rather than only the record.
- Editing a comment notifies people added by the edit, and does not notify anyone twice.
- Mentioning yourself notifies nobody.

### Delivery and Scope

- A notification with a `recipientEmployeeId` reaches only that person.
- A comment is only as visible as the record it hangs on. A reply never outlives a hidden parent.
- A mention on a record the recipient cannot reach is stored but not delivered. This is deliberate: the notification would link to a record they cannot open. It is covered by a test.

### Migration Correctness

Each migration step now stamps the version it produces rather than the current build's version. Before this, a stored v4 or v5 state skipped the later steps, failed validation and was silently replaced by the seed. Stepwise upgrade tests cover v4, v5 and v6 payloads.

### Not Delivered

Mentions resolve to people only; `@team` and `@department` are not supported.

## Phase 3 Progress — Staff Chat and Presence

Date: 2026-08-30. Schema version: 8.

### Conversations

- `ChatChannel` is either a named channel or a direct conversation. Membership is an explicit list of employee ids; there is no implicit "everyone" channel.
- A direct conversation is titled by the colleague on the other side of it, computed per reader rather than stored.
- Messages carry the same mention parser the comment thread uses, so `@Firstname Lastname` behaves identically in both places.
- A mention of somebody who is not in the channel is left as plain text and notifies nobody, because the notification would link to a conversation they cannot open.

### Read Receipts

- A read receipt is a marker on the last message a colleague has seen, not a timestamp. Two messages posted in the same instant still order correctly, and a stale marker that no longer matches a message reads as "everything unread" rather than silently reporting zero.
- The unread count never counts what the reader wrote themselves.
- Marking a conversation read is written with `persist` rather than `commit`: reading is per-reader bookkeeping, not an auditable business action.

### Presence

- Presence is read from the most recent session for the colleague's account and classified by `sessionPresence`: online, idle after five minutes, away after twenty, signed out when the session has ended.
- A colleague with no visible session reads "No signal". The screen does not claim they are offline, because with no session record there is nothing to read.
- The member rail refreshes every thirty seconds. Tests inject a fixed clock instead, so no timer runs in them.

### Scope

- A channel is visible only to its members, and only inside the account's own organization.
- Sharing a channel makes a colleague's employee record readable across branches. This deliberately widens the previous rule, because a conversation cannot have anonymous participants. It is bounded by membership and by tenancy: a sales executive sees the three colleagues she shares channels with and nobody else, and a channel belonging to another organization stays invisible.
- The lookup for "which employee is this account" is now tenant-checked, so a same-named employee in another organization can no longer be mistaken for the reader.

### Migration Correctness

Interdependent collections are now restored as a set. Filling one of them from the seed while keeping the rest of a stored payload left references pointing at records that never existed, and the whole state then failed validation and was thrown away. This applied to the board collections as well as the chat ones, and both are covered by tests.

### Notification Targets

`targetForRelatedId` now resolves a chat channel and a board item, so a mention notification raised from either can actually be opened. Before this, a board-item mention appeared in the notification centre with no way to reach it.

### Not Delivered

Typing indicators are not built. They would need a live transport between browsers; in a single-browser demo any indicator would be invented rather than observed, so none is shown. Attachments are not built: there is no file store, and a link that does not open a file would be a false promise. Channels cannot be created, renamed or joined from the interface; membership is seeded. Messages cannot be edited or deleted, and there are no threaded replies inside a channel.
