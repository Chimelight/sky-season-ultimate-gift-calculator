# Sky Season Ultimate Gift Calculator

A web calculator for planning the fastest ultimate gift route in **Sky: Children of the Light** seasons.

Live site: [chimelight.github.io/sky-season-ultimate-gift-calculator](https://chimelight.github.io/sky-season-ultimate-gift-calculator/)

## Preview

<p align="center">
  <img
    src="./preview.png"
    alt="Sky Season Ultimate Gift Calculator — social preview card"
    width="800"
  />
</p>

## Tech Stack

React + TypeScript SPA built with Vite. UI from shadcn/ui (Radix UI + Tailwind CSS). Theme switching via `next-themes`.

## Project Structure

```
src/
  main.tsx                  entry point
  App.tsx                   root: mounts Theme/State/I18n providers
  index.css                 Tailwind base + shadcn CSS variables
  data/seasons.ts           SEASONS array — add new seasons here
  i18n/
    index.ts                t(), setLang(), LANGS, formatDate, ordinal
    en.ts, zh-CN.ts          per-language translations + ordinal rules
  lib/
    solver.ts               enumSpirit + solve (pure, no React)
    schedule.ts             buildSchedule — per-day event log (pure, no React)
    genPost.ts              Discord post string generator
    helpers.ts, utils.ts    shared helpers, cn()
  context/
    StateContext.tsx        useAppState() — useReducer over AppState
    I18nContext.tsx         useI18n() — t, setLang, ordinal, formatDate
  components/
    layout/Header.tsx
    config/SeasonConfig.tsx, RulesCard.tsx
    spirits/SpiritCard.tsx, SpiritsSection.tsx
    ultimates/UltimatesSection.tsx
    result/ResultSection.tsx, MetricsSummary.tsx, StrategyTable.tsx, TreeMap.tsx,
            DailyTable.tsx, DiscordPost.tsx
    ui/                     shadcn primitives (button, input, card, badge, select, table,
                            alert, label) + static-field (read-only stand-in for Input)
```

## Run Locally

```bash
npm install --legacy-peer-deps
npm run dev
# then open http://localhost:5173
```

Build for production:

```bash
npm run build
```

## Adding a New Season

Prepend a new entry to the `SEASONS` array in [`src/data/seasons.ts`](src/data/seasons.ts) (newest first). Each entry needs:

```ts
{
  id: 'season-of-example',          // unique key
  label: '2026 Season of Example',  // shown in the picker dropdown
  seasonName: 'Season of Example',  // shown in page title and copy post
  startDate: 'YYYY-MM-DD',          // Day 1 of the season
  rules: { cpd, pass, heart, l1f, l2f, l3f, l4f },  // l*f = friendship per level
  spirits: [
    { name: 'Spirit Name', levels: [[cost], [cost, cost], [cost, cost, cost], [cost]] },
    // … up to 6 spirits; a level may hold any number of items
  ],
  ultimates: [{ hearts: N } /* … */],  // one entry per ultimate gift
  targetIdx: 0,                        // default-targeted ultimate
}
```

The season picker and default state pick it up automatically — no other changes needed.

## Friendship Model

A spirit advances on friendship, which never resets, so level thresholds are
cumulative. Friendship has two interchangeable sources, and you choose the mix:

- **Unlocking items** — a level worth `l*f` friendship splits it evenly across
  its items, so each of `m` items pays `l*f / m`. Costs candles.
- **Daily invites** — 1 point per day, once per day. Costs days.

Neither source is primary; the two substitute for each other, and their relative
cost varies from node to node. The solver enumerates the buy/skip combinations
per spirit, discards the Pareto-dominated ones, and selects the plan that
reaches the target ultimate soonest.

A level with 3 items pays `8 / 3` each, which does not divide evenly. Invites
only come in whole days, so a shortfall rounds up — but the leftover fraction
carries into later levels rather than being discarded. Two levels that each
leave a `2/3` deficit cost 6 invite days together, not the 7 that rounding each
level separately would suggest.

`npm run check:model` asserts these rules, including the binary-float case where
`3 * (8/3)` lands just under 8.

## Daily Breakdown

The result also expands into a day-by-day event log: the dailies that bank the
day's candles, each invite, and each item purchase, with the running balance and
the spirit's friendship progress after every step. Items are scheduled as early
as candles allow without delaying any ultimate, so the log doubles as a to-do
list. Milestones — a level reached, a spirit finished, an ultimate becoming
claimable — are badged inline.

## Internationalization

Currently available: **English**, **Simplified Chinese (简体中文)**. The selected language is persisted to `localStorage`.

To add a new language:

1. Create [`src/i18n/<code>.ts`](src/i18n/) following the structure of an existing file — export `translations`, `ordinal`, and `dateLocale`.
2. In [`src/i18n/index.ts`](src/i18n/index.ts), import the new file and add entries to `TRANSLATIONS`, `ORDINALS`, `DATE_LOCALES`, and `LANGS`.

All user-visible strings go through `t()` from `useI18n()`.

## Responsive Regression Check

```bash
npm run check:responsive
```

Renders the app across 8 viewport widths (280-1920px) x 3 languages and asserts
two things per cell: no horizontal page overflow, and no truncation ellipsis on
user-entered or translated content. It is an assertion run, not a visual
snapshot diff -- `scripts/__snapshots__/` only receives a PNG when a cell fails,
as a diagnostic. Needs Playwright's browsers (`npx playwright install chromium`).
See [CLAUDE.md](CLAUDE.md) for the full responsive design rules.

## Notes

- State is in-memory only — refresh resets to the first season in `seasons.ts`.
- Design tokens (spacing, control heights, typography, colors) are documented in [CLAUDE.md](CLAUDE.md) — follow them when contributing.
