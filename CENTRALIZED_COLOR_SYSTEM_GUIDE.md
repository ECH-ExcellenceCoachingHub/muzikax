# MuzikaX Color System

One dark, **neutral** palette (no blue, slate or brown tint) and **one** brand accent.
Every page, dashboard, modal and community view uses the same surface levels, so they look identical.

Source of truth: `frontend/src/app/globals.css` (`:root`) → exposed via `frontend/tailwind.config.js`.

## Surface hierarchy

Use the level for its **role**, never because it "looks right" on one screen.

| Level | Class | Hex | Use for |
|---|---|---|---|
| Canvas | `bg-background` | `#0A0A0B` | Page roots, navbar, sidebar, player bar, footer |
| Surface | `bg-surface` | `#121214` | Cards, panels, list rows, sections |
| Elevated | `bg-surface-elevated` | `#1A1A1D` | Modals, dropdowns, popovers, inputs, card hover |
| Overlay | `bg-surface-overlay` | `#242428` | Hover/active on elevated, chips, skeletons |

Rules:
- A page root is always `min-h-screen bg-background`, with **no page-level gradients**.
- Go up one level per layer of nesting: canvas → surface → elevated → overlay.
- Separate elements with borders, not with different tints.

## Borders

Translucent white, so they look right on every level.

| Class | Value |
|---|---|
| `border-border-light` | `rgba(255,255,255,0.06)`: default dividers |
| `border-border-medium` | `rgba(255,255,255,0.10)`: cards, modals, inputs |
| `border-border-strong` | `rgba(255,255,255,0.16)`: focus-less emphasis |

## Text

| Class | Hex |
|---|---|
| `text-text-primary` | `#F4F4F5` |
| `text-text-secondary` | `#A1A1AA` |
| `text-text-muted` | `#71717A` |

## Accent: MuzikaX orange (the only accent)

| Class | Hex | Use |
|---|---|---|
| `bg-primary` / `text-primary` | `#FF8C00` | Primary buttons, active nav, progress, selected state |
| `primary-hover` | `#FFA126` | Hover |
| `primary-light` | `#FFB020` | Gradient end, highlights |
| Gradient | `bg-gradient-to-r from-primary to-primary-light` | Hero CTAs only |
| Soft selection | `bg-primary/10 border-primary/40` | Selected rows/options |

Text on an orange background is `text-black`.

**Do not** introduce other UI accents (pink, purple, indigo, blue gradients). Green, red and yellow are only for
status (success, error, warning). Genre and category tiles may keep their own colors, because that is content
and not UI chrome.

## Gray scale

`gray`, `slate`, `zinc`, `neutral` and `stone` all map to the same neutral scale, so legacy classes stay on-brand:
`gray-950` = canvas, `gray-900` = surface, `gray-800` = elevated, `gray-700` = overlay or border.
Prefer the semantic token classes above in new code.

## Typography

- **Section titles:** use `<SectionHeader>` (`components/home/SectionHeader.tsx`), or `SECTION_TITLE_CLASS` for a bare title.
  They are always solid `text-text-primary`. Never use gradient text or orange headings.
- **"See all" links:** `SECTION_LINK_CLASS` (uppercase, grey, turns white on hover).

## Cards and rows (one hover behavior everywhere)

Defined in `globals.css`. Use these instead of writing your own hover utilities.

| Class | Use |
|---|---|
| `mx-card` | Grid card (layout + surface). Add `mx-card-row` or `mx-card-center` for other layouts. Use `data-active={bool}` for now-playing. |
| `mx-surface` | Surface + hover only, for cards that keep their own layout. `card-bg` behaves the same. |
| `mx-card-media` | Artwork wrapper. Its `img` zooms to 1.04 on hover. |
| `mx-card-avatar` | Round artist image with the same zoom. |
| `mx-card-play` | Orange corner play button that slides in on hover. |
| `mx-card-title` / `mx-card-subtitle` | Card text. |
| `mx-row` | List row (Quick Picks, charts). Use `data-active` for the playing row. |

On hover, a card moves from surface to elevated, its border brightens, the artwork zooms 4% and the play button appears.
Hover effects only run on devices with a pointer (`@media (hover: hover)`), and transitions are disabled under
reduced motion. Don't add shimmer, glow, lift (`hover:-translate-y`), colored shadows, card scaling or gradient washes.

## Never

- Hardcoded hex values in classes (`bg-[#121821]`): use a token.
- Tinted cards that give each option its own color (blue, yellow, green): use one style with an accent selected state.
- Page-level `from-gray-900 via-gray-900 to-black` gradients.
