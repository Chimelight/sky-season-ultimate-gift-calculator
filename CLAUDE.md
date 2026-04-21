# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Locally

```bash
npm install --legacy-peer-deps
npm run dev
# then open http://localhost:5173
```

Build for production:
```bash
npm run build
```

## Architecture

React + TypeScript SPA, built with Vite. UI components from shadcn/ui (Radix UI + Tailwind CSS). Theme switching via next-themes.

### Key files

- `src/main.tsx` — entry point
- `src/App.tsx` — root: mounts ThemeProvider, StateProvider, I18nProvider, then renders layout
- `src/index.css` — Tailwind base + shadcn CSS variables (light/dark)
- `tailwind.config.js` — Tailwind config with shadcn color tokens

### Data & Logic (`src/data/`, `src/lib/`, `src/i18n/`)

- `src/data/seasons.ts` — `SEASONS` array (newest first); add new seasons here
- `src/i18n/index.ts` — i18n core: `t(lang, key, vars)`, `getOrdinal(lang)`, `formatDate(dt, lang)`, `LANGS`
- `src/i18n/en.ts`, `zh-CN.ts`, `bn.ts` — translation objects + ordinal functions per language
- `src/lib/solver.ts` — `enumSpirit` + `solve`: core algorithm, pure functions, no React dependency
- `src/lib/genPost.ts` — `genPost`: generates the copyable Discord post string
- `src/lib/helpers.ts` — `shortName`, `addDays`, `describeOpt`
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)

### State (`src/context/`)

- `src/context/StateContext.tsx` — `useAppState()` hook; `useReducer` manages `AppState` (seasonName, startDate, rules, spirits[], ultimates[], targetIdx). `dispatch` actions: `SET_SEASON_NAME`, `SET_START_DATE`, `SET_RULE`, `SET_SPIRIT_NAME`, `SET_SPIRIT_COST`, `ADD_SPIRIT`, `REMOVE_SPIRIT`, `SET_ULTIMATE_HEARTS`, `ADD_ULTIMATE`, `REMOVE_ULTIMATE`, `SET_TARGET_IDX`, `LOAD_SEASON`
- `src/context/I18nContext.tsx` — `useI18n()` hook; exposes `t()`, `setLang()`, `lang`, `ordinal()`, `formatDate()`, `langs`

### Components (`src/components/`)

```
layout/Header.tsx          — sticky header: title, lang select, theme toggle, GitHub link
config/SeasonConfig.tsx    — season name + start date inputs
config/RulesCard.tsx       — cpd/pass/heart inputs + skip-days table + season picker/load
spirits/SpiritCard.tsx     — single spirit card (name + 4-level cost inputs)
spirits/SpiritsSection.tsx — spirit grid + add button
ultimates/UltimatesSection.tsx — ultimate list + summary
result/ResultSection.tsx   — runs solve(), distributes result to sub-components
result/MetricsSummary.tsx  — Day/Candle metric cards
result/StrategyTable.tsx   — per-spirit Lv1–4 strategy table with Buy/Skip badges
result/TreeMap.tsx         — SVG tree map (bottom-up, used spirits only)
result/DiscordPost.tsx     — copyable Discord post textarea + copy button
```

### shadcn/ui components (`src/components/ui/`)

`button`, `input`, `label`, `card`, `badge`, `select`, `table`, `alert` — all hand-scaffolded following shadcn patterns.

**Core algorithm** (`src/lib/solver.ts`): For each spirit, `enumSpirit` enumerates all buy/skip combinations across 4 levels and prunes Pareto-dominated strategies (cost vs. skip-days). `solve` combines per-spirit strategies to find the globally optimal plan given a candle budget and target ultimate.

**Adding a season**: Prepend a new entry to `SEASONS` in `src/data/seasons.ts`. The season picker and default state pick it up automatically.

**Adding a language**: Create `src/i18n/<code>.ts` following the structure of an existing file (export `translations`, `ordinal`, `dateLocale`). Then add an import and entry in `src/i18n/index.ts` (`TRANSLATIONS`, `ORDINALS`, `DATE_LOCALES`, `LANGS`).

## Design Tokens

These conventions are intentional — do not deviate without a reason.

### Spacing

| Level | Usage | Classes |
|-------|-------|---------|
| Tight | Within a component (between siblings) | `gap-2`, `space-y-2` |
| Normal | Inside a card / between form groups | `gap-3`, `space-y-3`, `p-4` |
| Loose | Between page-level sections | `space-y-6` |

`CardContent` and `CardHeader` default to `p-4`. Do not add `pt-*`/`pb-*` overrides unless truly necessary.

### Control Heights

| Height | Usage |
|--------|-------|
| `h-9` (36px) | Standalone buttons (primary actions) |
| `h-8` (32px) | All inline controls: inputs inside cards, compact buttons, selects |

Never use `h-7` for interactive controls — too small for touch targets.

### Typography Roles

| Role | Classes | Used for |
|------|---------|----------|
| Section title | `text-sm font-semibold tracking-tight` | `<h2>` section headings |
| Form label | `text-xs font-medium text-muted-foreground` | Labels above inputs |
| Body | `text-sm` | General content |
| Caption | `text-xs text-muted-foreground` | Helper text, table headers |
| Metric value | `text-2xl font-bold tabular-nums` | Large number displays |

### Layout Rules

- **No inline `style={}`** for layout — use Tailwind arbitrary values (e.g. `[grid-template-columns:max-content_1fr_1fr]`).
- **Lists of variable-length items** (e.g. UltimatesSection): use `flex flex-wrap` per row, not a single CSS grid spanning all rows. This prevents long translations from breaking cross-row column alignment.
- Always add `shrink-0` to labels and icons inside flex rows; `min-w-0` to text containers that may truncate.
- Horizontal overflow on tables: wrap with `overflow-x-auto`.

### Colors

Palette is shadcn zinc — do not add custom hex colors. Use semantic tokens (`text-muted-foreground`, `border-input`, etc.) so dark mode works automatically.

Badge variants for strategy display: `buy` (green), `skip` (amber), `order` (primary/10). These are defined in `src/components/ui/badge.tsx` and must stay consistent with the SVG TreeMap colors in `src/components/result/TreeMap.tsx`.

### Responsive Rules

Layouts must remain usable across viewports (280px–2560px) and all languages (including languages with 1.6×+ text expansion vs English, e.g. Bengali). The design is **container-query driven**, not viewport-breakpoint driven. Rules:

1. **No new named breakpoints.** New responsive variants use `@container` queries or intrinsic sizing (`grid-cols-[repeat(auto-fit,minmax(min(Xrem,100%),1fr))]`). Legacy `sm:` is grandfathered but not to be extended.
2. **Truncation is forbidden** on user-entered content or translated strings. Use `wrap-anywhere` + `break-words`. `line-clamp-N` only when content is recoverable elsewhere and visually required.
3. **No `hidden sm:*`** hiding. Content must be reachable at every supported viewport; hide only decorative affordances (tooltips, hover hints).
4. **Text widths use `ch`**: `min-w-[12ch]`, `w-[6ch]`. Never `w-16` / `w-28` on slots holding text or translated labels.
5. **Grids of unknown count** use `grid-cols-[repeat(auto-fit,minmax(min(Xrem,100%),1fr))]`, not `grid-cols-N sm:grid-cols-M`.
6. **Sections that host cards** declare `[container-type:inline-size]` so nested cards react to their own width, not viewport.
7. **Dynamic-content font sizes** use `text-fluid-*` tokens (`fluid-xs`, `fluid-sm`, `fluid-base`, `fluid-2xl`), not static `text-2xl`.
8. **Supported viewport range: 280px–2560px.** Below 280px, `body` enables horizontal scroll (honest degradation). Do not design for sub-280px rendering.
9. **New language checklist**: at 280/360/480px, inspect RulesCard skip labels, UltimatesSection row, Header title, StrategyTable badges. Run `npm run check:responsive` for automated regression.
