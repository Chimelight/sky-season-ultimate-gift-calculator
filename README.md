# Sky Season Ultimate Gift Calculator

A static web calculator for planning the fastest ultimate gift route in **Sky: Children of the Light** seasons.

Live site: [chimelight.github.io/sky-season-ultimate-gift-calculator](https://chimelight.github.io/sky-season-ultimate-gift-calculator/)

## Preview

<p align="center">
  <img
    src="./preview.png"
    alt="Sky Season Ultimate Gift Calculator — social preview card"
    width="800"
  />
</p>

## Project Structure

- `index.html`: page structure
- `assets/seasons.js`: season data (spirits, costs, rules) — add new seasons here
- `assets/styles.css`: all styles (CSS custom properties for light/dark theming)
- `assets/app.js`: all logic and rendering

## Run Locally

Open `index.html` directly in a browser, or use a simple local server:

```bash
cd sky-season-ultimate-gift-calculator
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Adding a New Season

Edit `assets/seasons.js` and prepend a new entry to the `window.SEASONS` array (newest first). Each entry needs:

```js
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
  ultimates: [{ hearts: N }, …],    // one entry per ultimate gift
  targetIdx: 0,                     // index of the ultimate to target by default
}
```

## Notes

- No build step is required.
- State is in-memory only (refresh resets to the first season in `seasons.js`).

