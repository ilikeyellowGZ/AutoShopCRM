# Task 10 Fix 1 Report

Implementation commit: `effe5bb3ae3a9d7ff27030bd13a83c0984e17f19`

## Route matrix

- Inventory: list, intake, vehicle record, appraisals, trade-ins, recon, transfers, pricing.
- CRM: directory/customer record, leads, follow-ups, appointments, test drives.
- Sales: sales log, deals, quotations, approvals, deliveries, commissions.
- F&I: structure deal, applications, lender queue, products, documents.
- Aftersales: service board, bookings, job cards, repair orders, service history.
- Workforce/Operations: employees, teams, targets, attendance, tasks, calendar, documents, audit trail, settings.

Distinct grouped destinations render their own semantic heading and connected repository rows. Command/vehicle detail navigation carries the selected record ID.

## Persistence and lifecycle

- Inventory query, status, and list mode are persisted under `weelee-employee-demo-v1` through typed view preferences.
- Legacy version-1 data deterministically receives default view preferences during migration.
- Repository replacement synchronizes `useDemoApp.target`.
- Reset returns to the seeded My Day route without appending a preference audit over `Demo data reset`.

## Verification

- Focused app/hook/repository tests: 55 tests passed.
- Full suite: 122 tests passed across 28 files.
- Typecheck, production build, and `git diff --check`: passed.

## Concerns

The expanded route adapters reuse the existing connected repository data rather than introducing fabricated external integrations.
