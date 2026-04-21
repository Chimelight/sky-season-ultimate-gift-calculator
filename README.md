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
    en.ts, zh-CN.ts, bn.ts  per-language translations + ordinal rules
  lib/
    solver.ts               enumSpirit + solve (pure, no React)
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
    result/ResultSection.tsx, MetricsSummary.tsx, StrategyTable.tsx, TreeMap.tsx, DiscordPost.tsx
    ui/                     shadcn primitives (button, input, card, badge, select, table, alert, label)
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
  rules: { cpd, pass, heart, l1f, l1h, l2f, l2h, l3f, l3h, l4f, l4h },
  spirits: [
    { name: 'Spirit Name', levels: [[cost], [cost, cost], [cost, cost], [cost]] },
    // … up to 6 spirits
  ],
  ultimates: [{ hearts: N } /* … */],  // one entry per ultimate gift
  targetIdx: 0,                        // default-targeted ultimate
}
```

The season picker and default state pick it up automatically — no other changes needed.

## Internationalization

Currently available: **English**, **Simplified Chinese (简体中文)**, **Bengali (বাংলা)**. The selected language is persisted to `localStorage`.

To add a new language:

1. Create [`src/i18n/<code>.ts`](src/i18n/) following the structure of an existing file — export `translations`, `ordinal`, and `dateLocale`.
2. In [`src/i18n/index.ts`](src/i18n/index.ts), import the new file and add entries to `TRANSLATIONS`, `ORDINALS`, `DATE_LOCALES`, and `LANGS`.

All user-visible strings go through `t()` from `useI18n()`.

## Responsive Regression Check

```bash
npm run check:responsive
```

Renders the app at 280/360/480px widths and compares against snapshots in [`scripts/__snapshots__/`](scripts/__snapshots__/). See [CLAUDE.md](CLAUDE.md) for the full responsive design rules.

## Notes

- State is in-memory only — refresh resets to the first season in `seasons.ts`.
- Design tokens (spacing, control heights, typography, colors) are documented in [CLAUDE.md](CLAUDE.md) — follow them when contributing.
