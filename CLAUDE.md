# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Locally

```bash
npm install --legacy-peer-deps
npm run dev
# then open http://localhost:5173
```

Build for production — and the only real typecheck, since `tsc -b` uses the project references that `tsc --noEmit` skips:
```bash
npm run build
```

Checks:
```bash
npm run check:model       # friendship/day arithmetic + redemption order, in src/lib/solver.ts
npm run check:responsive  # viewport × language layout regression (needs Playwright browsers)
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
- `src/i18n/en.ts`, `zh-CN.ts` — translation objects + ordinal functions per language
- `src/lib/solver.ts` — `enumSpirit` + `solve`: core algorithm, pure functions, no React dependency
- `src/lib/genPost.ts` — `genPost`: generates the copyable Discord post string
- `src/lib/schedule.ts` — `buildSchedule`: expands a solved plan into `DayRow[]`, each holding the ordered `Step[]` for that day (dailies / invite / buy / heart, with candles, running balance, friendship progress and milestones); `formatFriendship` trims the fractional values. Each `Step` also carries `total` and `marks` — that spirit's final cumulative requirement and each level's threshold — so the progress bar can be drawn on one scale for the whole run. Both are per spirit, not global: a strategy that skips a level entirely never owes that level's friendship
- `src/lib/helpers.ts` — `shortName`, `addDays`, `describeOpt`
- `src/lib/spiritTheme.ts` — `spiritClass(idx)`: maps a spirit onto one of the six identity ramps (see Colors)
- `src/hooks/useDragOrder.ts` — `useDragOrder(count, onDrop)`: pointer + keyboard reordering for a vertical list (see Redemption order)
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge)

### State (`src/context/`)

- `src/context/StateContext.tsx` — `useAppState()` hook; `useReducer` manages `AppState` (seasonName, startDate, rules, spirits[], ultimates[], targetIdx). `dispatch` actions: `SET_SEASON_NAME`, `SET_START_DATE`, `SET_RULE`, `SET_SPIRIT_NAME`, `SET_SPIRIT_COST`, `ADD_SPIRIT_ITEM`, `REMOVE_SPIRIT_ITEM`, `ADD_SPIRIT`, `REMOVE_SPIRIT`, `SET_ULTIMATE_HEARTS`, `ADD_ULTIMATE`, `REMOVE_ULTIMATE`, `SET_TARGET_IDX`, `LOAD_SEASON`. Also exposes `editing` / `setEditing` (see Edit Mode) and the `maxSpirits` / `maxItemsPerLevel` caps.
- `src/context/I18nContext.tsx` — `useI18n()` hook; exposes `t()`, `setLang()`, `lang`, `ordinal()`, `formatDate()`, `langs`

### Components (`src/components/`)

```
layout/Header.tsx          — sticky header + toolbar: title, season picker, Reset (edit mode only), Edit/Done toggle, lang select, theme toggle, GitHub link
config/SeasonConfig.tsx    — season name + start date
config/RulesCard.tsx       — cpd/pass/heart + friendship-per-level
spirits/SpiritCard.tsx     — single spirit card; levels run Lv4→Lv1 to match the tree map, per-level +/− in edit mode
spirits/SpiritsSection.tsx — spirit grid + add button
ultimates/UltimatesSection.tsx — ultimate list in redemption order (draggable) + prioritize + summary
result/ResultSection.tsx   — runs solve(), distributes result to sub-components
result/MetricsSummary.tsx  — Day/Candle metric cards
result/StrategyTable.tsx   — per-spirit Lv1–4 strategy table with Buy/Skip badges
result/TreeMap.tsx         — SVG tree map (bottom-up, used spirits only); colours come from CSS vars, so it takes no theme prop
result/DailyTable.tsx      — one row per event from buildSchedule(), date cell spans the day, milestone badges
result/UltimateTimeline.tsx— every ultimate on one day axis, with today; shows the spacing the metric cards cannot
result/FriendshipBar.tsx   — the two-segment progress bar: already-held vs what this step added, ticked at level thresholds
result/DiscordPost.tsx     — copyable Discord post textarea + copy button
```

### shadcn/ui components (`src/components/ui/`)

`button`, `input`, `label`, `card`, `badge`, `select`, `table`, `alert` — all hand-scaffolded following shadcn patterns.

**Core algorithm** (`src/lib/solver.ts`): For each spirit, `enumSpirit` enumerates all buy/skip combinations across 4 levels and prunes Pareto-dominated strategies (cost vs. invite days). `solve` combines per-spirit strategies to find the globally optimal plan given a candle budget and target ultimate.

**Friendship model**: Friendship has two interchangeable sources — buying items (spends candles) and daily invites (spends days) — and selecting the mix is the optimization this app performs. A level is worth `rules.l{n}f` friendship, split evenly across however many items it holds (so 3 items pay `8/3` each); invites pay 1/day. Do not describe invites as "filling the gap left by items": neither source is primary, and that framing misstates the problem. Friendship never resets, so thresholds are cumulative and fractional surplus carries into later levels — invite days come from a running maximum over the per-level deficits, *not* a per-level sum. `LevelOpt.days` is the increment attributed to that level, which is why the increments still add up to `Strategy.days`. A level may hold any number of items; there is no half/full-skip special case. Guard the arithmetic with `npm run check:model` — it covers the fractional carry and the `3 * (8/3) === 7.999…` float trap.

**Redemption order**: `state.ultimates` is ordered by *when the player intends to redeem*, which is what the solver has always consumed — `cumHearts` is a prefix sum over that array, so putting a gift first makes it owe only its own hearts. Reordering therefore needed no solver change at all; the array order was already the claim order, nobody could just change it. Seasons used to unlock their quests one at a time, forcing the season's own order; a season that unlocks them all at once does not, and rather than model that per season, the list is simply draggable everywhere and the player decides what is legal.

Two rules keep it honest:

- **`PlannedUltimate.id` is the gift; the array index is only its place in the queue.** Every label — the card rows, MetricsSummary, the daily table badge, the Discord post — must render `ultimates[pos].id`, never the position. Rendering the position makes a reordered plan silently renumber, so it describes a different gift while looking correct. `ADD_ULTIMATE` takes the next unused id rather than the array length, and `SET_ULTIMATE_HEARTS` must spread the existing entry — dropping `id` there was a real bug the build caught.
- **`targetIdx` is a position, so `MOVE_ULTIMATE` has to carry it.** It follows the gift it pointed at; without that, dragging silently re-targets the plan.

`useDragOrder` (`src/hooks/useDragOrder.ts`) drives it with pointer events, not HTML5 drag-and-drop, which has no usable touch story. The commit happens outside the state updater: updaters are pure and StrictMode calls them twice, so dispatching from inside fired the move twice and the two cancelled out. Arrow keys on the handle do the same job — dragging alone would lock out keyboard users on a row whose other control is a radio.

**Edit Mode**: Season data is read-only on load — a first-time user should read a plan, not face a wall of inputs. `editing` (in `StateContext`) gates every config control: SeasonConfig, RulesCard, spirit cards, ultimate heart counts, and the add/remove buttons all swap between `Input` and `StaticField` (`src/components/ui/static-field.tsx`, which matches the `h-8` control height so toggling does not reflow). The "prioritize" radio in UltimatesSection stays live in both modes — it selects which result to optimize for, so it is a query, not season data.

**Header toolbar**: The season picker loads on change — there is no separate load button; `loadSeason()` sets the picker index and dispatches `LOAD_SEASON` together. Reset re-dispatches `LOAD_SEASON` for the *already-selected* index, which is what makes it discard edits without changing season. It only renders in edit mode, since outside it there is nothing to discard.

**Items per level**: A level holds any number of items up to `maxItemsPerLevel`. The stored array length *is* the slot count — `ADD_SPIRIT_ITEM` appends a `0`, `REMOVE_SPIRIT_ITEM` pops. A `0` means "blank slot", and the solver filters those out before dividing friendship, so a blank never inflates the divisor. Do not re-introduce trailing-blank trimming in `SET_SPIRIT_COST`: it would delete a freshly added slot the moment the user typed in an earlier one.

**Daily breakdown** (`src/lib/schedule.ts`): The solver only produces per-spirit totals, so every question of *when* is derived here. `buildSchedule` emits one `Step` per event — `collect` (the dailies, which open every day), `invite`, `buy`, `heart` — grouped into a `DayRow`. `DailyTable` renders one table row per step with the date cell spanning the day.

Four rules make the sequence honest; each was a bug before it was a rule, and `npm run check:model` pins all of them:

1. **Buy as early as possible.** Owning an item sooner is strictly better, so each purchase group is pinned to its deadline first — a baseline that is feasible because it is what the solver costed — then pulled back to the earliest reachable, affordable day. Pulling a group only raises spend between its new day and its old one, so checking that window proves nothing else must move and no ultimate can slip.
2. **Deadline-bound items outrank tails.** A tail (anything past a spirit's last invite phase, including the Lv5 heart) only needs to exist by the ultimate it gates; an item with invites still ahead of it must exist *before* them. A tail's deadline is its gating ultimate's day, not the spirit's own earliest finish — otherwise it reserves candles a later spirit's items could be using.
3. **A level's items are due by the end of the spirit's whole invite block**, not its own phase. The running-max that sets the day count binds at the deepest level and every item below feeds it; pinning per phase is tighter than the plan requires and makes the baseline unaffordable.
4. **Invites are labelled by the level the spirit has actually reached**, computed from friendship — never the solver's phase. Candles do run out, and an item can genuinely settle after the invites it was meant to precede; a phase label would then name a level the spirit is not on.

Do not attribute a spirit's whole cost to its completion day. It reads plausibly and the totals still balance, but the friendship column then implies purchases the spend column says never happened.

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
| Metric value | `text-fluid-xl font-bold tabular-nums` | Large number displays |

### Layout Rules

- **No inline `style={}`** for layout — use Tailwind arbitrary values (e.g. `[grid-template-columns:max-content_1fr_1fr]`).
- **Lists of variable-length items** (e.g. UltimatesSection): use `flex flex-wrap` per row, not a single CSS grid spanning all rows. This prevents long translations from breaking cross-row column alignment.
- Always add `shrink-0` to labels and icons inside flex rows; `min-w-0` to text containers that may truncate.
- Horizontal overflow on tables: wrap with `overflow-x-auto`.

### Colors

The chrome is shadcn zinc — use semantic tokens (`text-muted-foreground`, `border-input`, etc.) so dark mode works automatically. The three exceptions below are the only places hex belongs, and they all live in `src/index.css`.

**Hue means *which spirit*, never *what happened*.** Six ramps `--s1-*`…`--s6-*` (red, amber, emerald, cyan, blue, violet — round the wheel from red, so no two neighbours collide) cover `MAX_SPIRITS`. Each is a ramp, not a colour: `bg` tints a row and fills the soft badge, `br` outlines it and fills the accrued part of a progress bar, `fg` carries text, `bar` fills what a step just added, `solid`/`on` are the emphatic badge. `spiritClass(idx)` in `src/lib/spiritTheme.ts` returns `spirit-N`, which binds one ramp to the generic `--sp-*` names; every descendant then reads `--sp-*` without knowing which spirit it is. Those `.spirit-N` rules sit **outside `@layer`** deliberately — Tailwind purges class selectors it cannot find in the source, and the names are built as `` `spirit-${n}` `` at runtime, so inside a layer the whole block is stripped and every colour silently resolves to nothing.

**Every badge role must stay separable, because they all share one hue now.** With hue reassigned to spirit identity, nothing is distinguished by colour any more — the burden fell on fill, edge and weight, and two roles quietly collapsed into the buy style before this was noticed. The current set, all reading the ambient `--sp-*`:

| variant | ground | edge | weight | role |
|---|---|---|---|---|
| `identity` | `--sp-fg`, reversed text | none | semibold | the `#N` anchor — the one place a fully saturated block belongs, since it is the smallest mark on the page |
| `buy` | `--sp-solid` | none | semibold | an item bought |
| `soft` | `--sp-bg` | hairline `--sp-br` | normal | an invite |
| `skip` | `--sp-bg` | dashed `--sp-fg` | normal | an item given up |
| `milestone` | `--sp-bg` | solid `--sp-fg` | semibold | a spirit finished |
| `ult` | `--ult-fill` | none | bold | an ultimate — the loudest thing in the app |

**Buy vs skip is carried by weight, in three steps.** `buy` is the denser block (`solid`/`on`), `soft` the quiet one for the many invite rows, `skip` is soft with a dashed edge for the item given up; the TreeMap says the same with a solid vs dashed stroke. Two rules the variants exist to hold:

- **Nothing is hollow, and no glyph carries meaning.** An earlier version used outlined badges with ●/○ dots; the dots were there only because both states shared a lightness. Solid blocks at different densities separate on lightness alone, which already survives greyscale and colour blindness.
- **The emphatic badge is carried by its ink, not its ground.** In light, `solid` is only just denser than `bg` — a 1.07–1.13 luminance step — and the standing-out is done by dropping the ink to the 900 rung plus semibold. Three attempts overshot before this: a reversed 700 block, then a 200 ground, both of which pulled the eye to the badge's *background*, so a purchase read as a coloured rectangle before it read as a number. In dark the light-theme fix inverts wrongly — a lighter ground there is *louder* — so the ground sheds chroma instead (S 63–88% down to 29–41%) at the same lightness rung. Contrast after all this: 8.14–9.23 light, 4.88–7.27 dark.
- **The dark ramps are not the light ones inverted — their chroma is cut.** Everything carrying text runs at 60% of the light-theme saturation and 93% of the lightness, because high-chroma light text on a dark ground halates and reads as glaring even when every contrast ratio is nominally fine. `bar` keeps more chroma (80%) than the text does: it must stay legible as a *graphic* against both the track and the accrued segment, and cutting it as hard as the text drops that under 3:1. Floors after the cut are text 4.83 and graphics 3.47 — check both before touching a dark value.
- **Chroma scales inversely with area.** `--sN-bg` in dark is cut furthest of all, to a barely-hued dark band (S 13–23%), because it is the only token covering a large area. The breakdown alternates untinted Dailies rows with tinted spirit rows, so dozens of bands stack up at a regular pitch and two spirits' blocks often abut directly; opponent hues meeting at similar luminance vibrate at the boundary regardless of contrast ratio, and readers described the result as an optical-illusion image. Identity survives on the small dense marks — swatch, badge, name, bar — so the tint only has to say *this row belongs to a spirit*. Never restore chroma to a large field to make it "clearer".

Do not reintroduce green=buy / amber=skip — that spends hue on an axis that no longer owns it, and collides with spirits #2 and #3.

The milestone day is marked on the date cell too — `--ult-day` wash plus an `--ult-line` rule — because an ultimate is reached by the *day*, not by the cell its badge lands in. Gold there is the **ground, never the ink**: at its real lightness (H46 S65 L52) gold measures 2.10:1 on white, and darkening it until small text passes lands at L34, which reads as mud rather than gold. The day number stays in the page foreground. `today` wins the rule when the two coincide, since that is the marker the table gets opened for, but the gold wash stays so the milestone is never lost.

**One saturated fill in the whole app**, `--ult-fill` (`#ffd400`) with `--ult-on` text, for the ultimate marker. Everything around it sits at 90–100% lightness and low chroma, so prominence has to come from *chroma*, not from going dark: earlier attempts used mid-dark golds (33–53% lightness) and read as a dirty hole in the table rather than an achievement. Bright yellow also sits far enough from spirit #2's amber (50° vs 32°) to stay distinct, and carries a ★ so the distinction is not hue alone.

Candles keep a fixed direction pair, since direction is the same for every spirit: `GAIN` (green) in, `SPEND` (rose) out, declared at the top of `DailyTable.tsx`. Rose appears nowhere else, so it never reads as an error the way `destructive` would. Friendship gets no flow colour — its gain is already drawn on the bar in the spirit's own hue.

The TreeMap takes its colours from the same CSS variables through `style="fill:var(--sN-fg)"`, so it can no longer disagree with the page around it; that is why it no longer receives a theme prop. Its legend uses `soft`, not `buy`, because it describes the map above — whose cells are large enough that making every bought one denser would turn the grid into a wall of blocks.

Today is marked **once**, on the date cell that spans the whole day. Never per row: a `<tr>`-level outline or border draws rules *between* the steps inside the day, which reads as structure that is not there.

### Responsive Rules

Layouts must remain usable across viewports (280px–2560px) and all languages. Assume up to 1.6× text expansion vs English: a future language can bring it back even though none shipped today does. The design is **container-query driven**, not viewport-breakpoint driven. Rules:

1. **No new named breakpoints.** New responsive variants use `@container` queries or intrinsic sizing (`grid-cols-[repeat(auto-fit,minmax(min(Xrem,100%),1fr))]`). Legacy `sm:` is grandfathered but not to be extended.
2. **Truncation is forbidden** on user-entered content or translated strings. Use `wrap-anywhere` + `break-words`. `line-clamp-N` only when content is recoverable elsewhere and visually required. `whitespace-nowrap` is not truncation and is the right call inside a table that already scrolls horizontally — the spirit name in DailyTable uses it so it sizes its own column, because a name broken across two lines on every row of a run is far noisier than a slightly wider column. Nothing is hidden either way.
3. **No `hidden sm:*`** hiding. Content must be reachable at every supported viewport; hide only decorative affordances (tooltips, hover hints).
4. **Text widths use `ch`**: `min-w-[12ch]`, `w-[6ch]`. Never `w-16` / `w-28` on slots holding text or translated labels.
5. **Grids of unknown count** use `grid-cols-[repeat(auto-fit,minmax(min(Xrem,100%),1fr))]`, not `grid-cols-N sm:grid-cols-M`.
6. **Sections that host cards** declare `[container-type:inline-size]` so nested cards react to their own width, not viewport.
7. **Dynamic-content font sizes** use `text-fluid-*` tokens (`fluid-xs`, `fluid-sm`, `fluid-base`, `fluid-2xl`), not static `text-2xl`.
8. **Supported viewport range: 280px–2560px.** Below 280px, `body` enables horizontal scroll (honest degradation). Do not design for sub-280px rendering.
9. **New language checklist**: at 280/360/480px, inspect RulesCard skip labels, UltimatesSection row, Header title, StrategyTable badges. Add the code to `LANGS` in `scripts/check-responsive.mjs` too, or the automated pass silently skips it. Run `npm run check:responsive`.
