# Task 10 integration completion — fix 3

## Implemented route matrix

Every destination in `src/app/routes.ts` now renders a named domain view with a destination-specific heading, working control, connected local record, and typed exact-record Open action where applicable.

| Group | Destinations rendered |
| --- | --- |
| Primary | My Day; Vehicle inventory; Customers; Pipeline; Sales log; Structure a deal; Service board |
| Command | My Day; Action Centre; Notifications |
| CRM | CRM leads; Customers; Pipeline; Customer follow-ups; Customer appointments; Test drives |
| Vehicles | Vehicle inventory; Vehicle intake; Vehicle appraisals; Trade-ins; Reconditioning queue; Vehicle transfers; Pricing review |
| Sales | Sales log; Deals; Quotations; Sales approvals; Vehicle deliveries; Sales commissions |
| F&I | Structure a deal; Finance applications; Lender queue; Finance products; Finance documents |
| Aftersales | Service board; Service bookings; Workshop job cards; Repair orders; Service history |
| Workforce | Employees; Teams; Team targets; Attendance |
| Operations | Operations tasks; Operations calendar; Operations documents; Audit trail; Workspace settings |

Finance workspaces are built from finance drafts and optional linked deals. Unassigned drafts render an explicit no-deal state and open the persisted vehicle finance context without dereferencing a missing deal. Workforce workspaces now derive only from real task/assignee/activity relations. System activities and notifications without a typed entity render without an Open action. Operations documents expose local audit artifacts and remain distinct from finance deal documents.

Grouped domain queues now use meaningful, mutation-sensitive selectors: appraisal/trade context, recon state/tasks, in-transit status, price-review context; lead-targeted follow-ups, scheduled appointments, vehicle-interest test drives; deal stage/status and earned commissions; and service booking/workshop/repair/completed state. Empty queues render an honest empty state.

## Exact routing and workflows

- My Day resolves vehicle, lead, deal, and service tasks to the exact related record.
- Command search resolves exact vehicle, customer, lead, deal, service, and task records.
- All domain Open actions persist `recordType` and `recordId`.
- Vehicle detail routes Create Deal to `sales/new-deal` with a persisted vehicle context.
- `DealEntry` preselects the vehicle and its interested customer, persists a typed deal audit, and routes to the exact created deal.
- Inventory remains mounted and route-synchronised through list, intake, exact detail, Back, intake completion, and Create Deal.
- Exact Inventory vehicle routes are owned by the same controlled `InventoryPage` instance; mount identity is preserved across list, detail, Back, and command navigation.
- Action Centre, typed notifications, Pipeline cards, Sales rows, and Service job cards expose exact related-record actions.

## Preferences and migration coverage

- Added finite unions for every Inventory, Customer, Sales, and Service query/filter/tab/sort/view preference.
- App composition supplies controlled values and immediate repository callbacks to all four feature pages.
- Migration deep-merges missing and partial preferences, replaces invalid nested values, validates static and exact routes, validates record existence/type/page/subview relationships, validates deal vehicle context and task related-record context, and rewrites the repaired state to storage.
- Passive route and view-preference persistence saves and notifies immediately without adding audit artifacts. Only meaningful branch/density settings changes use a settings audit, so reset remains the latest activity and Operations Documents is not polluted by typing.

## New substantive tests

`src/app/App.completion.test.tsx` adds:

- 48 table-driven rendered route cases covering every primary and grouped destination.
- 6 exact persisted record render cases.
- 4 My Day exact related-record cases.
- 6 exact command-palette record cases.
- 5 typed domain Open-action cases.
- Grouped subview reload followed by exact record reload.
- One mounted Inventory journey covering intake, completion detail, Back, linked Create Deal prefill, submit, persistence, audit, and exact created-deal rendering.
- One all-domain preference journey covering every query/filter/tab/sort/view across route changes and a same-storage App remount.
- Bound View Transition, branch selector, employee controls, visible reset toast, reset audit ordering, and My Day reset visibility.

`src/repository/migrations.test.ts` adds 21 migration cases covering missing, partial, invalid nested preferences and malformed route metadata, plus valid exact-route retention and rewritten storage.

Verification target after these additions: 30 files and 223 tests, up from 28 files and 127 tests at the start of this completion pass.

## Final review-fix tests

`src/app/DomainWorkspace.final.test.tsx` adds 11 focused tests covering finance drafts without deals in Applications/Lenders/Products/Documents (including same-storage reload), mutation-sensitive queue separation in all four domains, empty Workforce state, system activity behavior, and untyped notification behavior.

`src/app/App.final.test.tsx` adds 9 focused tests covering Inventory mount identity and state preservation, exact Action Centre/Notification/Pipeline/Sales/Service Open actions, passive preference audit bounds, reset ordering, and reduced-motion suppression.

`src/app/App.completion.test.tsx` adds 29 table-driven click-through cases asserting that every grouped route with a real entity opens the exact vehicle/lead/deal/service/task record. Service History explicitly asserts the honest empty state because the deterministic seed has no completed jobs.

Final verification: 32 test files and 273 tests passed; TypeScript, production build, and diff integrity passed.
