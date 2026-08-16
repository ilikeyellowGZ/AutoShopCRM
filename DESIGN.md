# Weelee Employee Demo Design System

## 1. Product atmosphere

Weelee is an editorial dealer-operations workspace: precise, calm, and deliberately open. It keeps the supplied black-and-white dashboard language: a white working canvas, black type and rules, outlined capsule controls, and generous negative space. The Weelee lime is a restrained positive accent, never a replacement for black primary actions.

No gradients, glass, coloured application rails, decorative cards, or large rounded containers are permitted.

## 2. Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-canvas` | `#ffffff` | Working canvas |
| `--color-ink` | `#050505` | Primary text and actions |
| `--color-ink-soft` | `#233c46` | Secondary brand ink |
| `--color-muted` | `#6f6f6f` | Supporting text |
| `--color-faint` | `#9b9b9b` | Tertiary labels |
| `--color-line` | `#e8e8e8` | Quiet separators |
| `--color-line-strong` | `#151515` | Strong rules and focus outlines |
| `--color-field` | `#f7f7f7` | Field background |
| `--color-brand` | `#72bf36` | Restrained Weelee accent |
| `--color-positive` | `#58e9a0` | Completed and available statuses |
| `--color-warning` | `#ecea79` | Pending and review statuses |
| `--color-info` | `#caedf5` | Scheduled and information statuses |
| `--color-critical` | `#f4b6b6` | Overdue and blocked statuses |

## 3. Typography and layout

Primary family: `Arial, Helvetica, sans-serif`. Page titles are 40–48px/700; section titles 22–30px/700; navigation 13–15px/600; body 14–16px/400; labels 11–12px/700. Content is centered at 1020px, expanding to 1180px for dense views, with 32px desktop, 24px compact, and 16px mobile outer gutters. Spacing uses a 4px base unit.

## 4. Reusable primitives

### EmployeeShell

- **Structure:** product header, horizontal primary navigation, horizontal task navigation/flyout, then open content canvas.
- **States:** active route, menu open, compact/mobile navigation, selected branch.
- **Accessibility:** named banner/navigation landmarks, native buttons, visible focus, escape closes menus and returns focus.

### CapsuleButton and NavigationTab

- **States:** default, hover, active, focus-visible, disabled.
- **Treatment:** black filled only when selected/primary; otherwise one-pixel black outline and white fill.
- **Accessibility:** 44px minimum target on mobile; status is never color-only.

### GroupedNavigation

- **States:** closed, open, keyboard escape close.
- **Accessibility:** trigger uses `aria-expanded` and `aria-controls`; destinations are native buttons in a labelled `role="menu"`.

### WeeleeLogo

- **Asset contract:** renders `/media/brand/weelee-logo-transparent.png` using intrinsic `width` and `height` and `alt="Weelee"`. The asset is provided in the brand-media task; until then the component retains the image slot without redrawing the wordmark.

## 5. Motion and responsive behaviour

Only opacity and transforms animate. Navigation/flyouts use 160–180ms ease-out; page/content changes use 180–220ms with a vertical transform no greater than 8px. Reduced motion removes non-essential transitions.

At 1280px, show full utilities and primary navigation. From 768px, the navigation scrolls horizontally. From 767px, the utility header condenses to logo, search, Action Centre, and a menu; every primary destination remains reachable in the scrollable navigation or grouped menu.

## 6. Accepted demo boundary

The shell consumes browser-persisted preferences behind the repository interface. It is an employee demo, not an authentication or authorization implementation.
