# CosmIQ Web Design System & Color Specification

This document defines the industry-standard color architecture, accessibility thresholds, and styling conventions for `cosmiq-os-web`.

---

## 1. Design Philosophy

CosmIQ automates laboratory WhatsApp enquiries and deterministic LIMS quotations. Its visual system communicates **analytical precision, auditability, and calm editorial authority**:

- **60–30–10 Color Balance**
  - **60% Dominant (Neutral Surfaces):** `--bg-canvas` and `--bg-surface` establish low-glare reading surfaces without clinical sterility.
  - **30% Structural (Ink & Hairlines):** `--text-primary`, `--text-secondary`, and `--border-default` create strong typographic hierarchy and crisp 1px grid boundaries.
  - **10% Accent (Focal Action & Telemetry):** `--accent-primary` is reserved exclusively for primary CTAs, focus rings, highlight claims, and active indicators—never large decorative fills.
- **Sharp Geometry:** Zero border radius (`--r: 0px`, `--r-sm: 0px`) across buttons, cards, inputs, and panels.
- **Typography Pairing:**
  - `--display`: `Archivo` (variable width `62..125`) for hero display statements.
  - `--text`: `Geist` for headings, UI controls, and body copy.
  - `--mono`: `Geist Mono` for LIMS payloads, pricing rows, quotes, and telemetry pills.

---

## 2. Three-Tier Token Architecture

Colors are never hardcoded in components. All styling reads **Tier 2 Semantic Tokens** defined in `app/globals.css`, which automatically switch between Light (`:root`) and Dark (`:root[data-theme="dark"]`) modes.

### Tier 1 → Tier 2 Semantic Token Mapping (Baseline: Tandem Warm Paper)

| Category | Semantic Token | Legacy Aliases in `app/globals.css` | Light (`:root`) | Dark (`[data-theme="dark"]`) | Usage Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Surface** | `--bg-canvas` | `--black`, `--paper` | `#f4f1ea` | `#0a0a0a` | Primary page & viewport canvas |
| **Surface** | `--bg-surface` | `--gray-3`, `--paper2` | `#ebe6da` | `#181715` | Cards, workflow terminals, alternating bands |
| **Surface** | `--bg-elevated` | — | `#ffffff` | `#22201d` | Form inputs, WhatsApp chat bubbles, quote rows |
| **Text** | `--text-primary` | `--white`, `--ink`, `--ink-pure` | `#0a0a0a` | `#f4f1ea` | Headings, primary copy, inverted section fills |
| **Text** | `--text-secondary` | `--gray-1` | `#2d2b27` | `#b8b3a8` | Lede copy, descriptions, table details |
| **Text** | `--text-muted` | `--mut` | `#4a4740` | `#8f8a80` | Metadata, kickers, subtle labels |
| **Border** | `--border-default` | `--gray-2`, `--line` | `#d8d2c4` | `#2e2b27` | 1px card rules, grid dividers, table hairlines |
| **Border** | `--border-strong` | — | `#0a0a0a` | `#f4f1ea` | High-contrast button borders & active frames |
| **Accent** | `--accent-primary` | `--red`, `--acc` | `#ff5a1f` | `#ff5a1f` | Primary CTA fills, focus outlines, highlight spans |
| **Accent** | `--accent-ink` | `--acc-ink` | `#ffffff` | `#ffffff` | Text & icons rendered on `--accent-primary` |
| **Status** | `--status-success` | `--live`, `--ok` | `#146c3a` | `#4ade80` | LIMS verified badges, active pulse indicators |
| **Status** | `--status-warning` | `--hi` | `#ffd400` | `#ffd400` | Highlighted callouts & pending caution states |
| **Status** | `--status-danger` | `--err` | `#c81e1e` | `#f87171` | Form validation errors & critical alerts |

> **Compatibility Note:** Legacy variable names (`--black`, `--white`, `--red`, `--gray-1..3`, `--paper`, `--ink`, etc.) remain wired to the semantic tokens in `app/globals.css` so existing routes (`/`, `/demo`, `/staff`, `/contact`) stay synchronized without breaking changes.

### Tier 3 Component-Specific Overrides

- **Inverted Sections (`.secure`, `.nav.inv`):** Swap canvas and primary ink (`background: var(--white); color: var(--black);`) to create high-contrast visual breaks for guardrail messaging.
- **Interactive States:**
  - `focus-visible`: `2px solid var(--red)` with `3px` offset.
  - `disabled`: `opacity: 0.5; cursor: wait;`.

---

## 3. Accessibility & Contrast Standards (WCAG 2.1)

All foreground/background token combinations are audited against **WCAG 2.1** relative luminance rules:

| Requirement | Minimum Ratio | Baseline Light Result | Baseline Dark Result |
| :--- | :--- | :--- | :--- |
| Primary text (`--text-primary` on `--bg-canvas`) | **7.0:1 (AAA)** | `17.55:1` (AAA) | `17.55:1` (AAA) |
| Secondary text (`--text-secondary` on `--bg-canvas`) | **4.5:1 (AA)** | `12.52:1` (AAA) | `9.48:1` (AAA) |
| Muted text (`--text-muted` on `--bg-canvas`) | **4.5:1 (AA)** | `8.21:1` (AAA) | `5.77:1` (AA) |
| Success status (`--status-success` on `--bg-canvas`) | **4.5:1 (AA)** | `5.75:1` (AA) | `11.36:1` (AAA) |
| Danger status (`--status-danger` on `--bg-canvas`) | **4.5:1 (AA)** | `5.09:1` (AA) | `7.16:1` (AAA) |
| Accent button ink (`#ffffff` on `#ff5a1f`) | **3.0:1 (AA Large)** | `3.12:1` (Large/Bold only) | `3.12:1` (Large/Bold only) |

> **Accent Ink Guidance:** `#ffffff` on `#ff5a1f` yields `3.12:1`, which passes WCAG AA only for large text ($\ge 18\text{px}$ bold or $\ge 24\text{px}$) and bold UI controls—never use white text on `#ff5a1f` for small body paragraphs. Switching `--accent-ink` to `#0a0a0a` increases contrast on `#ff5a1f` to `6.35:1` (AA normal text).

---

## 4. Testing & Updating Colors with `/styleguide`

CosmIQ includes a live interactive color workbench at **`/styleguide`** (`app/styleguide/page.tsx` & `components/StyleguideWorkbench.tsx`):

1. **Start the dev server** (`npm run dev`) and open `http://localhost:3000/styleguide`.
2. **Compare Presets:** Switch between 5 built-in industry presets (*Tandem Warm Paper*, *Radix Sand & Aerospace*, *ISO Precision Lab*, *Bio-LIMS Botanical*, and *Technical Stone*) in Light or Dark mode.
3. **Customize Tokens Live:** Adjust any individual semantic token via the color picker or HEX input and monitor the live **Accessibility & Contrast Matrix**.
4. **Preview Across Pages:** Toggle **Persist across site** in the sticky toolbar, then navigate to `/`, `/demo`, or `/contact` to inspect the candidate palette on real routes.
5. **Ship Changes:** Open Section **05 · Production Export**, copy the generated **CSS Variables (`:root`)** block, and paste it into the top of `app/globals.css`. You can also export **W3C Design Tokens (JSON)** or a **Markdown Spec** table.
