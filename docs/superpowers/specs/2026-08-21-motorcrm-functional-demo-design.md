# MotorCRM Functional Demo Design

## Status

Approved through the user-authored continuation brief dated 2026-08-21.

## Product direction

The outer AutoShopCRM repository remains the only production application. It keeps Vite, React, TypeScript, Vitest, Testing Library, the current source layout, and browser persistence. The nested `motorcrm-release` project remains read-only reference material. MotorCRM adapts its contextual CRM, task queue, relationship, permission, evidence, and agent concepts without adopting Bun, Next.js, NestJS, Prisma, or its deployment services.

## Visual contract

`DESIGN.md` and `DESIGN_SPEC.md` remain authoritative. Existing navigation, typography, spacing, colors, surfaces, tables, cards, vehicle presentation, responsive rules, and interaction patterns stay unchanged. New login, intelligence, contextual record, and queue surfaces must reuse existing controls and layout grammar.

## Runtime architecture

The application remains a client-rendered Vite SPA. A typed repository owns seeded state, schema migrations, local persistence, session persistence, and deterministic demo mutations. Feature modules consume repository state through `useDemoApp`; they do not read storage directly.

The functional demo boundary is explicit:

- Demo accounts use a local password supplied through `VITE_DEMO_ACCOUNT_PASSWORD`, with a documented development fallback.
- Sessions and permissions are enforced inside the client repository and UI.
- Role and branch restrictions change visible records, routes, actions, metrics, and dashboards.
- The implementation demonstrates correct product behavior but does not claim server-enforced authorization or hardened multi-tenant isolation.
- A future backend can replace the repository adapter without replacing domain types or feature components.

## Demo organization and access

The seed contains one dealer group with four branches: Johannesburg North, Sandton, Pretoria, and Midrand. Eleven accounts cover owner, CEO, general manager, sales manager, sales executive, finance manager, stock controller, marketing, accountant, employee, and read-only auditor roles.

Permissions use named capabilities instead of scattered role checks. Access helpers resolve page access, action access, branch scope, record ownership, financial visibility, staff visibility, and read-only behavior. Role-specific dashboards select connected facts from the same seeded dataset.

## Connected data model

The state expands around typed relationships:

- Organization, branch, employee, demo account, session, role, and permission.
- Customer, lead, appointment, test drive, quote, deal, finance application, payment, activity, note, and document.
- Vehicle, gallery, inspection, reconstruction work, price history, and stock movement.
- Agent task, agent insight, evidence, approval state, and queue priority.

Selectors build customer, vehicle, lead, deal, branch, and user context from identifiers. Seed validation rejects dangling relationships, duplicate identifiers, missing vehicle media, invalid account roles, and inaccessible branch references.

## Inventory and media

The existing 10 vehicles and 80 images remain intact. The seed adds 20 distinct South African inventory vehicles. Every vehicle owns eight ordered gallery entries, producing 30 vehicles and 240 referenced image files. Added vehicles vary by make, model, year, price, mileage, body type, color, transmission, fuel, stock age, branch, and status.

Local media remains under `public/media/vehicles/<vehicle-slug>/`. The verification script confirms every manifest path, file count, supported format, and non-empty asset.

## Contextual CRM behavior

Customer, vehicle, lead, and deal detail views receive a shared context model. Each context includes connected records, a chronological timeline, open tasks, documents, financial state when permitted, and deterministic intelligence.

Intelligence summaries never invent data. Each claim references connected records and evidence identifiers. Recommended actions derive from transparent rules such as overdue follow-ups, stale leads, aged stock, missing documents, stalled finance, and idle deals.

## Agent queue

The Command Centre uses a deterministic priority queue. Priority rules map events to scores between 400 and 950. Tasks record agent kind, organization, branch, target type, target identifier, reason, evidence, status, risk, assignee, and timestamps.

Low-risk actions can create follow-ups, recommendations, summaries, and data-quality tasks. Finance approvals, refunds, permission changes, and destructive actions stay unavailable in the demo agent layer.

## Error and state handling

Every new surface provides loading, empty, permission-denied, invalid-session, and unavailable-data states. Repository migrations preserve compatible user preferences while adding new seed data. Reset restores the complete current seed and records an audit event.

## Testing strategy

Development follows red, green, refactor. Vitest discovery excludes the nested reference project. The existing inventory timeout receives root-cause investigation before changes. Unit tests cover permissions, context selectors, queue priorities, seed integrity, repository migrations, and role dashboards. Component tests cover login, navigation filtering, action denial, contextual panels, and read-only behavior. Browser tests cover representative owner, sales, stock, finance, employee, and auditor workflows.

Verification runs `npm run check`, scoped Vitest, the complete root Vitest suite, media verification, browser tests, and `npm run build`. The installed `gsd-code-review` workflow substitutes for the unavailable CodeRabbit-specific skill. Review documentation records this limitation without claiming a CodeRabbit review occurred.

## Documentation and deployment

Documentation describes the actual Vite demo, data model, CRM context, agents, accounts, permissions, testing, deployment, Comp AI adaptation, and known security limitations. Existing Netlify configuration remains the default static deployment path. Production authentication, server authorization, shared database persistence, secrets management, and tenant isolation remain documented future hardening work.
