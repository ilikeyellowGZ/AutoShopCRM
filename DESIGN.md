# MotorOS Design System

## 1. Product atmosphere

MotorOS is a dealership operating console: calm under pressure, financially precise, and built for people scanning hundreds of records. The visual contract follows the supplied MotorOS references: a restrained navy rail, a warm white workspace, blue reserved for active actions, and status colour used only to signal operational meaning.

The signature material is a paper-white working canvas over a deep ink navigation rail. Surfaces use thin cool borders and one quiet elevation shadow; dense data is carried by alignment, row rhythm, and clear section labels instead of ornamental cards.

## 2. Colour tokens

| Token | Value | Usage |
| --- | --- | --- |
| `--ink-950` | `#07182f` | Sidebar and high-emphasis text |
| `--ink-900` | `#12223b` | Headings, strong labels |
| `--ink-700` | `#4f5d73` | Secondary text |
| `--ink-500` | `#7d8899` | Metadata and subdued controls |
| `--canvas` | `#f5f7fa` | Application workspace |
| `--surface` | `#ffffff` | Panels and table surfaces |
| `--line` | `#dfe4eb` | Borders and separators |
| `--line-strong` | `#c8d0db` | Active table and field borders |
| `--blue-600` | `#1759e6` | Primary action and current navigation |
| `--blue-050` | `#edf3ff` | Selected/soft blue surfaces |
| `--teal-600` | `#12805b` | Positive financial/operational state |
| `--teal-050` | `#eaf7f0` | Positive soft surface |
| `--amber-600` | `#c66a06` | Attention and time risk |
| `--amber-050` | `#fff4e2` | Attention soft surface |
| `--red-600` | `#cf3d43` | Critical risk and overdue values |
| `--red-050` | `#fff0f0` | Critical soft surface |

Accent is reserved for interactive or status-bearing content. No gradients, glow effects, or decorative colour blocks.

## 3. Typography

Primary: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Level | Size | Weight | Usage |
| --- | --- | --- | --- |
| Page title | 30px | 700 | Screen heading |
| Section heading | 16px | 700 | Panel/title rows |
| KPI value | 31px | 700 | High-signal metric |
| Body | 14px | 400 | Default application copy |
| Body strong | 14px | 600 | Labels and table values |
| Caption | 12px | 500 | Metadata, helper text, legends |
| Overline | 11px | 700 | Uppercase section labels |

## 4. Spacing and layout

All spacing is based on a 4px unit. The shell uses a 224px navigation rail, a 72px utility bar, and a 30px desktop content gutter. Panels use 16px internal padding; data rows use 12px vertical rhythm. The dashboard grid is 5 KPI columns, then a 2/2/1.25 chart-to-exception split, then a 1/3 table split.

Breakpoints: 1200px (compact rail and denser grids), 900px (two-column content), 680px (single column and mobile navigation).

## 5. Reusable primitives

### AppShell

- **Structure:** sidebar + utility bar + main content
- **Variants:** expanded desktop, compact tablet, stacked mobile
- **States:** active route, search focus, notification open, user menu open
- **Accessibility:** semantic nav, labelled buttons, visible keyboard focus

### Panel

- **Structure:** bordered white surface with optional header/footer
- **Variants:** standard, elevated, attention, empty
- **States:** default, loading, error, selected
- **Accessibility:** heading level follows page hierarchy; no content hidden from assistive technology

### StatusPill

- **Variants:** positive, warning, critical, info, neutral
- **States:** default and compact
- **Accessibility:** never rely on colour alone; include status text

### DataTable

- **Variants:** inventory, pipeline, payments, compact
- **States:** default, filtered, selected, empty, loading
- **Accessibility:** table headers, row actions with explicit labels, keyboard reachable controls

### Drawer / Modal

- **Variants:** record detail drawer, quick create modal, confirmation modal
- **States:** closed, open, submitting, success, error
- **Motion:** 200ms transform/opacity transition; respects reduced motion

### MetricBlock

- **Structure:** label, value, comparison, icon
- **Variants:** neutral, positive, warning
- **States:** default and drill-down affordance

## 6. Motion and interaction

Micro interactions use 120ms ease-out. Panels and drawers use 200ms ease-in-out. Only opacity and transform are animated. Hover states clarify clickability; no decorative movement. `prefers-reduced-motion: reduce` removes non-essential transitions.

## 7. Depth and surface

Depth strategy: mixed, restrained. Panels use `1px solid var(--line)` and a subtle `0 1px 2px rgba(12, 29, 55, 0.04)` shadow. The sidebar is a solid tonal shift, not a floating card. Avoid large shadows and rounded containers; the default radius is 8px and controls use 6px.

## Accepted pilot debt

The first runnable slice uses a localStorage repository seeded with fictional South African demo records so every visible action works without external credentials. It is intentionally not the final PostgreSQL/API implementation required by the master prompt. The repository interface and domain calculation tests are the seam for Phase 1 server work.
