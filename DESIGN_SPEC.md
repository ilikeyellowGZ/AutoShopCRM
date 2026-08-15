# Weelee Employee Dealer Operations Demo — Design Specification

**Status:** Approved direction; implementation pending specification review

**Date:** 16 August 2026
**Visual authority:** User-supplied dashboard references and Weelee brand artwork

## 1. Product objective

Build a polished, desktop-first employee operations demo for Weelee that feels credible in a live client presentation. The interface must reproduce the supplied black-and-white dashboard language as closely as practical while adding a deeper employee navigation system, realistic South African dealership data, durable local interactions, and ten high-quality vehicle galleries.

This repository currently contains a React/Vite browser demo with no server, authentication service, or database. This phase therefore delivers a production-quality frontend demonstration with versioned browser persistence. It must not represent simulated external integrations, browser-only authorization, or local data as production security.

## 2. Selected approach

Use a **reference-faithful two-level horizontal navigation** rather than a permanent sidebar.

- Preserve the reference composition: centered white working canvas, bold black type, thin rules, outlined capsule controls, black primary actions, restrained semantic status chips, and generous negative space.
- Replace the personal `Joshua Kaplan` label with the official transparent Weelee mark and wordmark.
- Add employee depth through a compact product-level header, a scrollable task-level navigation row, and keyboard-accessible grouped flyouts.
- Do not introduce a coloured application rail, generic card dashboard, glass effects, gradients, decorative charts, or large rounded containers.

Alternatives rejected:

1. A hybrid header plus collapsible rail adds capacity but visibly departs from the supplied layouts.
2. A full operational sidebar scales furthest but replaces the reference's defining navigation grammar.

## 3. Visual reconstruction contract

### 3.1 Canvas and geometry

- Background: solid white.
- Desktop content width: `1020px` reference canvas centered inside the viewport, expanding to a maximum of `1180px` for dense employee views.
- Desktop outer gutter: at least `32px`; compact laptop gutter: `24px`; mobile gutter: `16px`.
- Major section spacing: `48–64px`.
- Component spacing follows a `4px` base unit.
- Separators use one-pixel neutral rules. Information grouping relies on alignment and whitespace before boxes.
- Default radius: `0px` for sections, `4px` for fields and dialogs, and full capsule radius only for buttons, tabs, and statuses shown that way in the references.

### 3.2 Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#ffffff` | Main background |
| `--color-ink` | `#050505` | Primary text and black actions |
| `--color-ink-soft` | `#233c46` | Weelee wordmark tone and secondary brand ink |
| `--color-muted` | `#6f6f6f` | Supporting text |
| `--color-faint` | `#9b9b9b` | Tertiary labels |
| `--color-line` | `#e8e8e8` | Quiet separators |
| `--color-line-strong` | `#151515` | Section rules and focused outlines |
| `--color-field` | `#f7f7f7` | Subtle field background |
| `--color-brand` | `#72bf36` | Weelee accent and selected positive actions |
| `--color-positive` | `#58e9a0` | Available, completed, passed |
| `--color-warning` | `#ecea79` | Reserved, pending, review |
| `--color-info` | `#caedf5` | In transit, scheduled, information |
| `--color-critical` | `#f4b6b6` | Overdue, blocked, failed |

Semantic colours must always appear with text labels or icons. The Weelee green is an accent, not a replacement for the references' black primary actions.

### 3.3 Typography

- Primary family: a clean Helvetica/Arial-compatible grotesk to match the screenshots without adding an unrelated display typeface.
- Wordmark: official Weelee artwork only; never approximate it with typed text.
- Page title: `40–48px`, weight `700`, tight but no tighter than `-0.03em`.
- Section title: `22–30px`, weight `700`.
- Navigation: `13–15px`, weight `600`.
- Body: `14–16px`, weight `400`.
- Labels and table headers: `11–12px`, weight `600–700`, uppercase only where shown in the references.
- KPI values: `30–38px`, weight `600–700`, tabular numbers.
- VIN, stock ID, and references: `11–12px`, tabular/monospaced fallback.

### 3.4 Controls and surface behavior

- Primary buttons: black fill, white label, capsule shape, 40–48px height.
- Secondary buttons: white fill, black one-pixel outline, capsule shape.
- Navigation tabs: outlined capsules with solid black selected state.
- Inputs: rectangular, one-pixel neutral border, restrained radius, 44–52px height.
- Status chips: compact capsule with semantic tint and readable status text.
- Data surfaces remain predominantly open; bordered panels are reserved for dialogs, drawers, tables that require containment, and the vehicle media stage.
- Hover, focus, active, disabled, loading, empty, error, and success states are required for every reusable control.

## 4. Brand asset contract

- Use the official Weelee circular `W` mark plus wordmark.
- Remove every white/background pixel and preserve genuine transparency.
- Preserve the supplied green mark and dark wordmark colours; do not redraw, recolour, stretch, or add a container.
- Produce a project-local transparent PNG or WebP with intrinsic dimensions and an accessible text alternative of `Weelee`.
- Header rendering target: approximately `154–176px` wide on desktop and `116–132px` on mobile.

## 5. Employee navigation and information architecture

### 5.1 Persistent header

The header contains:

1. Transparent Weelee logo.
2. Current branch selector.
3. Global search trigger with `Ctrl/Cmd + K`.
4. Action Centre count.
5. Notifications count.
6. Employee menu with name, role, and demo-mode indicator.

### 5.2 Primary employee navigation

The visible row uses the reference capsule treatment:

- My Day
- Inventory
- Customers
- Pipeline
- Sales
- Finance
- Service
- More

`More` opens a keyboard-accessible grouped menu. Every visible item must navigate to a working view or a working tab within a consolidated view.

### 5.3 Detailed grouped destinations

| Group | Destinations |
| --- | --- |
| Command | My Day, Action Centre, Notifications |
| CRM | Leads, Customers, Pipeline, Follow-ups, Appointments, Test Drives |
| Vehicles | Inventory, Intake, Appraisals, Trade-ins, Recon, Transfers, Pricing |
| Sales | Sales Log, Deals, Quotations, Approvals, Deliveries, Commissions |
| F&I | Deal Finance, Applications, Lenders, Products, Documents |
| Aftersales | Service Board, Bookings, Job Cards, Repair Orders, Service History |
| Workforce | Employees, Teams, Targets, Attendance |
| Operations | Tasks, Calendar, Documents, Audit Trail, Settings |

Closely related destinations may share a screen with an immediately selected tab. No navigation item may be a dead control.

## 6. Screen specifications

### 6.1 My Day

- Personal greeting and current date.
- Four reference-style KPI blocks separated by top rules.
- Today's agenda, priority actions, active pipeline, approvals, and branch activity.
- Completing or rescheduling an action updates the associated lead/deal and activity log.

### 6.2 Inventory

- KPI strip, VIN/model/stock search, filters, add-vehicle action, and selected inventory section.
- List and operational table modes.
- Status, price, mileage, colour, branch, days in stock, owner, and next action.
- Clicking a vehicle opens its complete record and gallery.

### 6.3 Vehicle detail

- Large 8-angle studio media stage with thumbnails, arrow keys, swipe, and full-screen viewer.
- Status, year/make/model, VIN, price, mileage, exterior colour, location, and branch.
- Specifications, history/service timeline, cost and margin, documents, tasks, and audit activity.
- Working edit record, download/print sheet, and create deal actions.

### 6.4 Vehicle intake

- Four steps: Identification, Specifications, Media, Review.
- Auto-saved draft persisted between pages and reloads.
- Inline validation and explicit duplicate-VIN error text.
- Successful submission adds the vehicle to inventory and creates an audit activity.

### 6.5 Customers and CRM

- Customer directory, meaningful South African demo identities, interests, last purchase, ownership status, and next follow-up.
- Search, status filter, create lead/customer, notes, communication timeline, and follow-up completion.

### 6.6 Pipeline and sales log

- Kanban stages matching the reference: Lead, Negotiation, Contract, Delivery.
- Dragging or using an accessible move action updates stage, metrics, next action, and audit log.
- Sales log supports search, status filtering, sorting, new deal entry, and local CSV export.

### 6.7 Finance

- Reference-faithful deal structuring form with vehicle price, deposit, term, interest rate, trade allowance, lien payoff, and backend products.
- Live payment breakdown in South African Rand.
- Finance submissions are explicitly labelled as demo/sandbox and create a local activity only.

### 6.8 Service

- Booking and job-card board with status, customer, vehicle, advisor, technician, due time, parts risk, and approval state.
- Status transitions, notes, customer approval, and completion all persist and update the activity log.

## 7. Ten-vehicle demo roster

All records are fictional demonstrations. Identifiers and histories must be internally consistent.

| # | Vehicle | Exterior | Operational state |
| --- | --- | --- | --- |
| 01 | 2024 Porsche 911 GT3 | Chalk | Available |
| 02 | 2023 BMW M4 CSL | Frozen Grey | Reserved |
| 03 | 2024 Audi RS6 Avant | Nardo Grey | In Transit |
| 04 | 2024 Land Rover Defender 110 | Carpathian Grey | Available |
| 05 | 2024 Porsche Taycan Turbo S | Carmine Red | Service Hold |
| 06 | 2024 Mercedes-AMG C63 S | Obsidian Black | Available |
| 07 | 2023 Toyota GR Supra | Absolute White | Reserved |
| 08 | 2024 Ford Ranger Raptor | Code Orange | Recon |
| 09 | 2024 Volkswagen Golf 8 R | Lapiz Blue | Available |
| 10 | 2024 BMW X5 M Competition | Marina Bay Blue | Photography |

## 8. Eight-angle gallery contract

Each of the ten vehicles receives eight separately generated high-resolution images, producing **80 final project images**.

Required angles for every vehicle:

1. Front elevation.
2. Front-left three-quarter.
3. Left profile.
4. Rear-left three-quarter.
5. Rear elevation.
6. Rear-right three-quarter.
7. Right profile.
8. Front-right three-quarter.

Generation invariants:

- Full vehicle remains in frame at every angle.
- Same exact model, derivative, body colour, wheel design, trim, ride height, lighting, and studio across all eight images in one gallery.
- Premium commercial automotive photography on a seamless neutral light-grey cyclorama.
- Large diffused softboxes, controlled floor reflection, realistic paint, glass, tires, and panel geometry.
- No people, text, price cards, logos added by the generator, watermarks, number plates, dealership props, outdoor scenery, dramatic smoke, or motion blur.
- Landscape composition with gallery-safe negative space and explicit intrinsic dimensions.
- Files use stable paths: `public/media/vehicles/<vehicle-slug>/<01-08>-<angle>.webp` or `.png`.
- Gallery thumbnails and full views use the same source images; no low-quality placeholders may remain in the final build.

## 9. Demo data and persistence

### 9.1 Repository boundary

Use a typed local repository behind a small interface so a future API adapter can replace browser storage without rewriting product components.

Persistent key: `weelee-employee-demo-v1`.

Persist:

- Current user preferences and selected branch.
- Current route and active subview where safe.
- Vehicles, gallery metadata, customers, leads, deals, finance drafts, service jobs, tasks, notifications, and audit activities.
- Search/filter/sort preferences and saved views.
- Intake, lead, deal, finance, and service form drafts.

Do not store the 80 image binaries in localStorage. Store project asset paths and gallery metadata only.

### 9.2 Data durability

- Initialize realistic seed data only when no compatible saved state exists.
- Include schema version and a deterministic migration function.
- Validate parsed storage before use; corrupted or incompatible data falls back to a recoverable reset prompt rather than crashing.
- Provide a visible `Reset demo data` action with confirmation.
- Use localStorage instead of cookies because the data volume exceeds safe cookie limits and must not be transmitted with every request.

## 10. Motion contract

- Page transition: `180–220ms`, opacity plus a maximum `8px` vertical transform.
- Navigation indicator: `140–180ms` transform/colour transition.
- Dialog: `180ms` opacity and scale from `0.985`.
- Drawer/menu: `180–220ms` transform and opacity.
- Gallery image change: `160–200ms` opacity with direction-aware transform no larger than `12px`.
- Table/filter/list state: `120–180ms` opacity/transform; no height-thrashing animation.
- Toast: `180ms` enter and exit, with sufficient reading duration.
- All interactions remain interruptible and use only transform/opacity where possible.
- `prefers-reduced-motion: reduce` removes non-essential motion and preserves immediate state changes.

No bouncing metrics, parallax, animated backgrounds, perpetual loops, or decorative motion.

## 11. Responsive contract

### Desktop: 1280px and above

- Centered high-density canvas.
- Full primary navigation and employee utilities.
- Multi-column KPI, directory, pipeline, and record detail layouts.

### Compact laptop/tablet: 768–1279px

- Primary navigation becomes horizontally scrollable; grouped navigation remains available through `More`.
- KPI and record grids collapse to two columns.
- Tables preserve horizontal scrolling with sticky identifying columns where useful.
- Detail media and record information stack without reducing image legibility.

### Mobile: 375–767px

- Header becomes logo, search, Action Centre, and a menu button.
- Primary destinations appear in a full-height menu sheet using the same monochrome visual language.
- One-column content, touch targets at least `44px`, gallery swipe, persistent contextual action bar.
- Priority mobile tasks: leads, customers, calls, follow-ups, vehicle search/gallery, appraisals, test drives, approvals, notifications, tasks.

## 12. Accessibility and content

- Semantic landmarks and correct heading order.
- Native buttons, links, labels, fieldsets, tables, and dialogs before ARIA.
- Visible `:focus-visible` treatment with at least 3:1 contrast.
- Dialog focus trap, focus return, escape close, and background inertness.
- Keyboard navigation for menus, tabs, gallery, pipeline move actions, tables, and command search.
- Descriptive alternative text for each vehicle image including vehicle and angle.
- Status is never communicated by colour alone.
- Form errors identify what happened, why where known, and how to recover.
- No generic `Something went wrong` messages where specific context exists.

## 13. Frontend architecture

Target structure:

```text
src/
  app/
    App.tsx
    routes.ts
  components/
    brand/
    controls/
    data-display/
    feedback/
    navigation/
    overlays/
  domain/
    calculations.ts
    models.ts
    selectors.ts
  features/
    action-centre/
    customers/
    finance/
    inventory/
    my-day/
    pipeline/
    sales/
    service/
  repository/
    demoRepository.ts
    migrations.ts
    seed.ts
    storage.ts
  styles/
    tokens.css
    base.css
    components.css
    responsive.css
  test/
    fixtures.ts
    setup.ts
```

Constraints:

- No monolithic multi-thousand-line dashboard component.
- Domain calculations remain independent and unit tested.
- Reusable primitives own their states and accessibility behavior.
- Feature modules consume the repository interface rather than accessing localStorage directly.
- No new styling framework is introduced; the existing plain CSS approach remains.

## 14. Testing and verification

Use test-first development for new behavior.

Unit/integration coverage:

- Seed and state migration.
- Storage corruption recovery.
- Vehicle CRUD and duplicate VIN rejection.
- Lead/pipeline transitions and metrics.
- Finance calculations and edge cases.
- Service transitions.
- Search/filter/sort selectors.
- Persistence across repository reinitialization.

Browser journeys:

- Navigate every employee destination.
- Create and edit a vehicle, then reload and confirm persistence.
- Open each of ten galleries and traverse all eight images.
- Create a lead and move it through pipeline stages.
- Edit finance inputs and confirm live Rand breakdown.
- Update a service job.
- Verify dialogs, menus, keyboard flows, responsive layouts, and reduced motion.

Visual QA viewports: `375px`, `768px`, `1280px`, and `1440px`. Compare reference-derived screens for typography, spacing, alignment, control dimensions, divider placement, status treatment, and whitespace.

Completion evidence requires fresh successful results from typecheck, unit tests, production build, browser flows, responsive screenshots, accessibility inspection, and an eighty-file gallery asset count.

## 15. Production boundary and future seam

The completed phase is a locally persistent client demonstration. Real production deployment for dealership employees still requires a server database, secure authentication, server-side authorization, tenant isolation, audit persistence, API validation, rate limiting, file storage, secrets management, backups, observability, and integration credentials.

The repository and domain boundaries in this specification are deliberately structured so those services can replace the browser adapter without replacing the interface or workflows.
