# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Locally

No build step is required. Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Architecture

The app is a single-page static calculator with four files:

- `index.html` — static shell; all dynamic content is rendered by JS into `#spirits-list`, `#ults-list`, `#ult-summary`, and `#result-out`
- `assets/seasons.js` — season data configuration; exposes `window.SEASONS` (array, newest first); loaded before `app.js`
- `assets/app.js` — all logic and rendering, wrapped in a single IIFE
- `assets/styles.css` — all styles using CSS custom properties for light/dark theming

**State model** (`app.js`): A single in-memory `state` object (season name, start date, rules, spirits array, ultimates array, target index). `defaultState()` clones the first entry in `window.SEASONS`. All inputs write back to `state` via event listeners and then call `scheduleRender()`, which debounces via `requestAnimationFrame`. The season picker dropdown (`#season-picker`) calls `cloneSeason()` to reset state to any season in `seasons.js`.

**Core algorithm** (`enumSpirit`): For each spirit, enumerates all possible buy/skip combinations across 4 levels and prunes Pareto-dominated strategies (cost vs. skip-days). The outer solver then combines per-spirit strategies to find the globally optimal plan given a candle budget and target ultimate gift.

**Rendering**: The result section renders a day-by-day schedule table plus a copyable post template. Spirit cards and ultimate rows are rendered imperatively into the DOM from state on every `renderResult()` call.

**Adding a season**: Prepend a new entry to `window.SEASONS` in `assets/seasons.js`. The picker and `defaultState()` pick it up automatically — no changes to `app.js` needed.
