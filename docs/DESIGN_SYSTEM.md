# CosmIQ Design System Handbook

**System Name:** Tandem Warm Paper  
**Product Scope:** `cosmiq-os-web` (Marketing Site, Interactive `/demo`, `/pilot-demo`, `/staff`, `/contact`, and `/styleguide`)  
**Source of Truth:** [app/globals.css](../app/globals.css) · [docs/design-tokens.json](./design-tokens.json) · Live Workbench: `/styleguide`

---

## 1. Brand & Design Principles

CosmIQ automates WhatsApp laboratory enquiries and builds deterministic quotations directly from a lab's LIMS. Every visual token exists to reinforce **analytical authority** and **editorial clarity**:

1. **Deterministic Authority:** Data, quotes, method IDs (`AOAC 2007.01`), and telemetry are set in `Geist Mono` with `tabular-nums` alignment and 1px structural rules—never decorative gradients or soft blurs.
2. **Editorial Warmth:** Instead of sterile pure-white (`#ffffff`) or harsh blue-black canvases, CosmIQ pairs warm archival paper (`#f4f1ea`) in Light mode with deep charcoal obsidian (`#0a0a0a`) and warm stone typography (`#b8b3a8`) in Dark mode.
3. **The 60–30–10 Proportion Rule:**
   - **60% Dominant Surfaces:** `--bg-canvas`, `--bg-surface`, and `--bg-elevated`.
   - **30% Ink & Structure:** `--text-primary`, `--text-secondary`, `--text-muted`, and 1px `--border-default` rules.
   - **10% Focal Accent:** `--accent-primary` (`#ff5a1f`), reserved exclusively for primary CTAs, focus indicators, highlight claims (`.claim`), and active step markers.
4. **Sharp Architectural Geometry:** `0px` border radius (`--r: 0px`, `--r-sm: 0px`) across all cards, inputs, panels, quotes, and buttons.

---

## 2. Three-Tier Color Architecture

CosmIQ uses a three-tier token model following the **W3C Design Tokens Community Group (DTCG)** convention. Components consume **Tier 2 Semantic Tokens** (or mapped legacy aliases), never raw HEX primitives.

### Tier 1 — Primitive Color Scale (`:root`)

| Scale Group | Token | HEX | Primary Role |
| :--- | :--- | :--- | :--- |
| **Warm Stone** | `--stone-50` | `#faf8f5` | Warm off-white highlight |
| **Warm Stone** | `--stone-100` | `#f4f1ea` | Light mode canvas / Dark mode primary ink |
| **Warm Stone** | `--stone-200` | `#ebe6da` | Light mode secondary surface |
| **Warm Stone** | `--stone-300` | `#d8d2c4` | Light mode 1px border & hairline |
| **Warm Stone** | `--stone-400` | `#b8b3a8` | Dark mode warm secondary text |
| **Warm Stone** | `--stone-500` | `#8f8a80` | Dark mode muted metadata text |
| **Warm Stone** | `--stone-600` | `#57524a` | Light mode muted metadata text |
| **Warm Stone** | `--stone-700` | `#3a3630` | Light mode secondary body text |
| **Warm Stone** | `--stone-800` | `#2e2b27` | Dark mode 1px border & hairline |
| **Warm Stone** | `--stone-850` | `#22201d` | Dark mode elevated surface (inputs, bubbles) |
| **Warm Stone** | `--stone-900` | `#181715` | Dark mode card & panel surface |
| **Warm Stone** | `--stone-950` | `#0a0a0a` | Dark mode canvas / Light mode primary ink |
| **Signal Orange** | `--orange-500` | `#ff5a1f` | Signature CosmIQ accent |
| **Signal Orange** | `--orange-600` | `#e04812` | High-density hover / pressed reference |
| **Status Green** | `--green-700` / `--green-500` | `#146c3a` / `#4ade80` | LIMS verified & live state (Light / Dark) |
| **Status Amber** | `--amber-400` | `#ffd400` | Caution & approval highlight |
| **Status Red** | `--red-600` / `--red-400` | `#c81e1e` / `#f87171` | Validation errors & alerts (Light / Dark) |

### Tier 2 — Semantic Tokens (Light & Dark Modes)

| Category | Semantic Token | Light (`:root`) | Dark (`[data-theme="dark"]`) | Legacy Aliases | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Surface** | `--bg-canvas` | `var(--stone-100)` (`#f4f1ea`) | `var(--stone-950)` (`#0a0a0a`) | `--black`, `--paper` | Main viewport & section canvas |
| **Surface** | `--bg-surface` | `var(--stone-200)` (`#ebe6da`) | `var(--stone-900)` (`#181715`) | `--gray-3`, `--paper2` | Cards, panels, workflow terminals |
| **Surface** | `--bg-elevated` | `#ffffff` | `var(--stone-850)` (`#22201d`) | — | Inputs, WhatsApp bubbles, quote rows |
| **Text** | `--text-primary` | `var(--stone-950)` (`#0a0a0a`) | `var(--stone-100)` (`#f4f1ea`) | `--white`, `--ink`, `--ink-pure` | Display titles, headings, primary copy |
| **Text** | `--text-secondary` | `var(--stone-700)` (`#3a3630`) | `var(--stone-400)` (`#b8b3a8`) | `--gray-1` | Lede copy, step descriptions, table values |
| **Text** | `--text-muted` | `var(--stone-600)` (`#57524a`) | `var(--stone-500)` (`#8f8a80`) | `--mut` | Kickers, timestamps, subtle labels |
| **Border** | `--border-default` | `var(--stone-300)` (`#d8d2c4`) | `var(--stone-800)` (`#2e2b27`) | `--gray-2`, `--line` | Structural 1px rules & table borders |
| **Border** | `--border-strong` | `var(--stone-950)` (`#0a0a0a`) | `var(--stone-100)` (`#f4f1ea`) | — | High-contrast buttons & command boxes |
| **Accent** | `--accent-primary` | `var(--orange-500)` (`#ff5a1f`) | `var(--orange-500)` (`#ff5a1f`) | `--red`, `--acc` | Primary CTAs, focus rings, `.claim` |
| **Accent** | `--accent-ink` | `#ffffff` | `#ffffff` | `--acc-ink` | Foreground placed on `--accent-primary` |
| **Status** | `--status-success` | `var(--green-700)` (`#146c3a`) | `var(--green-500)` (`#4ade80`) | `--live`, `--ok` | Verified LIMS checks & live indicators |
| **Status** | `--status-warning` | `var(--amber-400)` (`#ffd400`) | `var(--amber-400)` (`#ffd400`) | `--hi` | Caution states & pending highlights |
| **Status** | `--status-danger` | `var(--red-600)` (`#c81e1e`) | `var(--red-400)` (`#f87171`) | `--err` | Form errors & invalid payloads |

### Tier 3 — Component Contextual Tokens

- **Inverted Navigation & Guardrail Band (`.nav.inv`, `.secure`):** Swaps canvas and ink via `--nav-bg: var(--white)` / `--nav-ink: var(--black)` (or `background: var(--white); color: var(--black);`) to create full-bleed contrast transitions.
- **Dynamic Translucent Tints:** Status tags (`.tag.ok`, `.tag.acc`, `.ai-confidence-pill`, `.bubble.out`, `.check`) compute subtle 10–12% fills via `color-mix(in srgb, <token> 10%, transparent)` so tints automatically track the active theme.

---

## 3. Accessibility & WCAG 2.1 Contrast Audit

Every foreground/background pairing in the canonical Tandem Warm Paper palette is verified against **WCAG 2.1** relative luminance standards:

| Token Pairing | WCAG Target | Light Mode Ratio | Dark Mode Ratio |
| :--- | :--- | :--- | :--- |
| `--text-primary` on `--bg-canvas` | **7.0:1 (AAA)** | `17.55:1` (AAA) | `17.55:1` (AAA) |
| `--text-primary` on `--bg-surface` | **7.0:1 (AAA)** | `15.90:1` (AAA) | `15.88:1` (AAA) |
| `--text-secondary` on `--bg-canvas` | **4.5:1 (AA)** | `10.64:1` (AAA) | `9.48:1` (AAA) |
| `--text-muted` on `--bg-canvas` | **4.5:1 (AA)** | `6.87:1` (AA) | `5.77:1` (AA) |
| `--status-success` on `--bg-canvas` | **4.5:1 (AA)** | `5.75:1` (AA) | `11.36:1` (AAA) |
| `--status-danger` on `--bg-canvas` | **4.5:1 (AA)** | `5.09:1` (AA) | `7.16:1` (AAA) |
| `--accent-ink` (`#ffffff`) on `--accent-primary` (`#ff5a1f`) | **3.0:1 (AA Large)** | `3.12:1` (Bold/Large UI only) | `3.12:1` (Bold/Large UI only) |

### Color Usage Do's and Don'ts

| DO | DON'T |
| :--- | :--- |
| **Use `--text-secondary` (`#b8b3a8` in dark / `#3a3630` in light)** for multi-line descriptions so warm stone copy clears WCAG AAA against `#0a0a0a` and `#f4f1ea`. | **Never use `#ffffff` on `#ff5a1f` for small body paragraphs** (`3.12:1` meets AA only for large display text or bold button controls; use `#0a0a0a` for `6.35:1` if small copy is required). |
| **Keep `--accent-primary` under 10% of viewport area** to preserve scanning hierarchy across dense LIMS tables and workflow steps. | **Never hardcode `#ffffff` or `#000000` backgrounds** on form inputs, chat bubbles, or quote cards—always use `--bg-elevated`. |
| **Verify new tokens in both modes** on `/styleguide` using the side-by-side Light/Dark comparison view before merging. | **Never strip legacy compatibility aliases** (`--black`, `--white`, `--gray-1..3`, `--red`, `--live`) while subpages and `lib/ascii.ts` read them. |

---

## 4. Typography System

Loaded via Google Fonts in [app/layout.tsx](../app/layout.tsx) with three purposeful font stacks:

| Role | Token / Class | Font Family | Fluid Size | Weight & Line-Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Mega** | `.mega`, `.st-line` | `Archivo` (`wdth` 62–125) | `clamp(48px, 8vw, 120px)` | `900` · `0.86`–`0.90` | `-0.02em` |
| **Hero Title** | `.hero-title` | `Geist` | `clamp(38px, 4.4vw, 80px)` | `600` · `0.98` | `-0.05em` |
| **Section H2** | `.h2` | `Geist` | `clamp(38px, 6.4vw, 104px)` | `600` · `0.98` | `-0.045em` |
| **Lede** | `.lede` | `Geist` | `clamp(18px, 1.6vw, 22px)` | `400` / `600` · `1.45` | `0` |
| **Body Default** | `body` | `Geist` | `17px` | `400` · `1.50` | `0` |
| **Mono Telemetry** | `.mono`, `.kicker`, `.tag` | `Geist Mono` | `11px`–`14px` | `400` / `700` · `1.50` | `0.06em`–`0.08em` (upper) |

- **Numeric Discipline:** Odometers (`.dl-count b`) and workflow step counters (`.install-steps > li::before`) enforce `font-variant-numeric: tabular-nums` so digits never jitter during animations or tabular quote comparisons.

---

## 5. Layout Grid, Spacing, Borders & Motion

| Token / Rule | Value | Purpose |
| :--- | :--- | :--- |
| **Container** | `.wrap { max-width: 1400px; padding-inline: var(--gutter); }` | Centered editorial measure |
| **Horizontal Gutter** | `--gutter: clamp(16px, 4vw, 64px)` | Scales smoothly from mobile to ultrawide |
| **Breakpoints** | `@media (max-width: 900px)` · `@media (max-width: 600px)` | Collapses hero, 4-col `.facts`, 2-col `.cta-grid`, and nav links into `.mobile-menu` |
| **Border Radius** | `--r: 0px`, `--r-sm: 0px` | Strict square edges on every interactive element |
| **Hairline Rule** | `--b: 1px solid var(--border-default)` | Replaces drop shadows inside flat layouts |
| **Elevation Shadows** | `--sh` (Light `0 16px 36px rgba(10,10,10,0.08)`, Dark `0 20px 48px rgba(0,0,0,0.8)`) | Used sparingly for floating menus/drawers |
| **Motion Curve** | `--ease: cubic-bezier(.2, 0, 0, 1)` | Fast-out deceleration; `prefers-reduced-motion` reduces animations to `0.01ms` |

---

## 6. Component Specifications

- **Buttons (`.btn`, `.btn.solid`, `.btn.ghost`, `.btn-sm`):** `0px` radius, `14px 22px` padding (`8px 16px`, `min-height: 38px` for `.btn-sm`), 1px border, inverted fill on `:hover`, and `2px solid var(--accent-primary)` `:focus-visible` ring with `3px` offset.
- **Sticky Navigation & Theme Preservation:** Header navigation in [app/layout.tsx](../app/layout.tsx) embeds [ThemeToggle.tsx](../components/ThemeToggle.tsx) (`.theme-btn`), persisting user preference in `localStorage` (`tandem-theme`) and synchronizing before first paint via the inline `<head>` script.
- **AI & LIMS Verification Card (`.ai-analysis-card`):** Layered `--bg-surface` container with `.ai-pulse-dot` and `.ai-confidence-pill` powered by `--status-success` (`#146c3a` light / `#4ade80` dark).
- **Quotation Approval Panel (`.panel`, `.quote`, `.quote-row.total`):** Uses `--bg-elevated` inside `--bg-surface` so line items stay legible in both Light (`#ffffff` in `#ebe6da`) and Dark (`#22201d` in `#181715`) modes, capped by a high-contrast `.total` inversion row.

---

## 7. Governance & Change Workflow

1. **Preview & Audit:** Visit `/styleguide` (local `http://localhost:3000/styleguide` or `https://cosmiq-os.vercel.app/styleguide`) to inspect swatches, test Light/Dark side-by-side, and verify WCAG 2.1 contrast ratios.
2. **Site-Wide Verification:** Toggle **Persist across site** on `/styleguide` and inspect `/`, `/demo`, `/contact`, and `/staff/enquiries`.
3. **Update Source Files Together:** When updating canonical colors, synchronize:
   - [app/globals.css](../app/globals.css) (Tier 1 primitives & Tier 2 semantic mappings)
   - [docs/design-tokens.json](./design-tokens.json) (W3C DTCG machine-readable tokens)
   - [components/StyleguideWorkbench.tsx](../components/StyleguideWorkbench.tsx) (`tandem-default` preset)
   - This handbook ([docs/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md))
4. **Ship:** Run `npm run check` and `npm run build` before committing and deploying.
