#!/usr/bin/env node
/**
 * Friendship-model regression checker.
 *
 * The solver treats each level's friendship as split evenly across its items,
 * topped up by invites at 1/day, accumulating across levels without ever
 * resetting. That makes the arithmetic fractional (a 3-item level pays 8/3 per
 * item) and the day counts interdependent, so these assertions pin the rules
 * that are easy to break silently:
 *
 *   1. Buying / skipping everything costs the expected days.
 *   2. Partial buys on a 3-item level round up to whole invite days.
 *   3. Fractional surplus carries forward instead of rounding up per level.
 *   4. Binary-float error never invents a phantom invite day.
 *   5. 1- and 2-item levels still behave exactly as the old half/full-skip model.
 *
 * Exits non-zero on any failure.
 */
import { enumSpirit, solve } from '../src/lib/solver.ts'
import { buildSchedule } from '../src/lib/schedule.ts'
import { SEASONS } from '../src/data/seasons.ts'

const RULES = { cpd: 6, pass: 30, heart: 3, l1f: 4, l2f: 6, l3f: 8, l4f: 10 }
const HEART = RULES.heart

let failed = 0
function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failed++
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label}${ok ? '' : ` — expected ${expected}, got ${actual}`}`)
}

/** Days for the strategy that buys `counts[i]` cheapest items on each level. */
function daysFor(levels, counts) {
  const strat = enumSpirit({ name: 'T', levels }, RULES).find(s =>
    s.opts.every((o, i) => o.buys.length === Math.min(counts[i], (levels[i] || []).length))
  )
  if (!strat) throw new Error(`no strategy on the Pareto front for counts ${counts.join(',')}`)
  return strat.days
}

/** Cheapest strategy that needs no invite days at all. */
function costAtZeroDays(levels) {
  return Math.min(...enumSpirit({ name: 'T', levels }, RULES).filter(s => s.days === 0).map(s => s.cost))
}

console.log('\nBaselines')
const one = [[4], [6], [10], [15]]
check('buy every item → 0 invite days', daysFor(one, [1, 1, 1, 1]), 0)
check('skip every item → 4+6+8+10 = 28 days', daysFor(one, [0, 0, 0, 0]), 28)
check('buy every item → cost is heart + items', costAtZeroDays(one), HEART + 4 + 6 + 10 + 15)

console.log('\nThree items on Lv3 (8 friendship ÷ 3 = 8/3 each)')
const three = [[4], [6], [10, 20, 30], [15]]
check('buy 3 of 3 → 0 days', daysFor(three, [1, 1, 3, 1]), 0)
check('buy 2 of 3 → ceil(8/3) = 3 days', daysFor(three, [1, 1, 2, 1]), 3)
check('buy 1 of 3 → ceil(16/3) = 6 days', daysFor(three, [1, 1, 1, 1]), 6)
check('buy 0 of 3 → 8 days', daysFor(three, [1, 1, 0, 1]), 8)

console.log('\nFractional surplus carries forward')
// Lv3 and Lv4 each leave a 2/3 deficit. Rounding up per level would bill
// 3 + 4 = 7 days; carrying the surplus settles it at 6.
const twoFractional = [[4], [6], [10, 20, 30], [12, 22, 32]]
check('two fractional levels → 6 days, not 7', daysFor(twoFractional, [1, 1, 2, 2]), 6)
check('surplus is spent, not banked twice', daysFor(twoFractional, [1, 1, 1, 1]), 12)

console.log('\nFloat safety')
// 3 * (8/3) === 7.999999999999999 in binary floating point.
for (const [lvl, req] of [[0, 4], [1, 6], [2, 8], [3, 10]]) {
  const levels = [[], [], [], []].map((_, i) => (i === lvl ? [1, 2, 3] : [1]))
  check(`fully bought 3-item Lv${lvl + 1} (req ${req}) costs no phantom day`, daysFor(levels, levels.map(l => l.length)), 0)
}

console.log('\nBlank slots are not items')
// The editor stores an added-but-unfilled slot as 0. It must not count toward
// the divisor, or a 2-item level with a spare slot would pay 8/3 instead of 4.
check('a blank 3rd slot leaves a 2-item level alone',
  daysFor([[4], [6], [10, 20, 0], [15]], [1, 1, 1, 1]),
  daysFor([[4], [6], [10, 20]], [1, 1, 1, 1]))
// An all-blank level is "not filled in", not "a real level with no items", so
// it costs nothing — the same as omitting it, which is how it behaved before.
check('a level of only blanks is treated as absent',
  daysFor([[4], [6], [0, 0], [15]], [1, 1, 0, 1]),
  daysFor([[4], [6], [], [15]], [1, 1, 0, 1]))

console.log('\nLegacy parity (1- and 2-item levels)')
const two = [[4], [19, 7], [24, 10], [28]]
check('buy 1 of 2 on Lv2 → 6/2 = 3 days', daysFor(two, [1, 1, 2, 1]), 3)
check('buy 1 of 2 on Lv3 → 8/2 = 4 days', daysFor(two, [1, 2, 1, 1]), 4)
check('half-skip Lv2 and Lv3 → 3 + 4 = 7 days', daysFor(two, [1, 1, 1, 1]), 7)
check('cheapest item is the one bought', costAtZeroDays(two), HEART + 4 + 19 + 7 + 24 + 10 + 28)
// Lv1 priced high so that skipping it survives the Pareto filter.
check('skip a 1-item Lv1 → 4 days', daysFor([[40], [19, 7], [24, 10], [28]], [0, 2, 2, 1]), 4)

console.log('\nDaily schedule reconciles with the solve')
for (const season of SEASONS) {
  const res = solve(season.spirits, season.ultimates, season.rules, season.targetIdx)
  if (res.errorKey) { console.log(`  FAIL ${season.id} — solver: ${res.errorKey}`); failed++; continue }
  const { best } = res
  const rows = buildSchedule(res, season.rules)
  const r = season.id.padEnd(26)

  const totalCost = best.picks.reduce((s, p) => s + p.strat.cost, 0)
  const totalDays = best.picks.reduce((s, p) => s + p.strat.days, 0)
  const last = rows[rows.length - 1]

  check(`${r} rows span day 1..Tmax`, rows.length, best.Tmax)
  check(`${r} income totals pass + cpd×Tmax`, last.cumEarned, season.rules.pass + season.rules.cpd * best.Tmax)
  check(`${r} spend totals the plan cost`, last.cumSpent, totalCost)
  check(`${r} invite steps equal invite days`, rows.flatMap(x => x.steps).filter(s => s.kind === "invite").length, totalDays)
  check(`${r} every spirit completes once`, rows.reduce((s, x) => s + x.completed.length, 0), best.order.length)
  // A negative balance would mean candles were spent before they were earned —
  // i.e. the day a cost is charged disagrees with the solver's own accounting.
  check(`${r} balance never goes negative`, rows.every(x => x.cumEarned - x.cumSpent >= 0), true)
  // Ultimates must surface on exactly the days the metric cards advertise...
  check(`${r} ultimate days match Ts`,
    rows.flatMap(x => x.ultimates.map(() => x.day)).join(','), best.Ts.join(','))
  // ...and the hearts must actually be in hand by then. Matching the advertised
  // day means nothing if the spirits paying for it have not finished yet.
  let done = 0
  const shortfall = []
  for (const row of rows) {
    done += row.completed.length
    for (const u of row.ultimates) if (done < res.cumHearts[u]) shortfall.push(`ult${u + 1}@d${row.day}`)
  }
  check(`${r} ultimates only unlock once their hearts exist`, shortfall.join(','), '')
  // Every step must land the spirit at or above the level it is working on by
  // the time that level is cleared, or the sequence is telling a false story.
  const badClear = rows.flatMap(x => x.steps).filter(s => s.cleared.length > 0 && s.after < s.required - 1e-9)
  check(`${r} a level only clears once its threshold is met`, badClear.length, 0)

  // Every item the plan buys or skips has to surface exactly once, or the
  // breakdown would quietly drop an item the user is meant to act on.
  const tally = arr => arr.slice().sort((a, b) => a - b).join(',')
  const planBuys = [], planSkips = []
  for (const pi of best.order) {
    for (const o of best.picks[pi].strat.opts) {
      if (!o || o.k === 'none') continue
      planBuys.push(...o.buys)
      planSkips.push(...o.skips)
    }
  }
  const steps = rows.flatMap(x => x.steps)
  check(`${r} every bought item is listed once`,
    tally(steps.filter(s => s.kind === "buy").map(s => -s.candles)), tally(planBuys))
  check(`${r} every skipped item is listed once`,
    tally(steps.flatMap(s => s.skips.map(x => x.cost))), tally(planSkips))
  check(`${r} step costs add up to the spend`, steps.reduce((a, s) => a + Math.max(0, -s.candles), 0), totalCost)

  // Per spirit the sequence must read as a real playthrough: friendship only
  // grows, purchases climb the tree in order, and the Lv5 heart is last.
  for (const pi of best.order) {
    const si = best.picks[pi].spiritIdx
    const mine = steps.filter(s => s.spiritIdx === si)
    const nm = `${r} ${String(season.spirits[si].name).slice(0, 14).padEnd(14)}`
    check(`${nm} friendship never decreases`,
      mine.every((s, i) => i === 0 || s.after >= mine[i - 1].after - 1e-9), true)
    const buys = mine.filter(s => s.kind === 'buy' || s.kind === 'heart')
    check(`${nm} purchases climb levels in order`,
      buys.every((s, i) => i === 0 || s.lvl >= buys[i - 1].lvl), true)
    check(`${nm} the heart is the last purchase`,
      buys.length > 0 && buys[buys.length - 1].kind === 'heart', true)
    // Buying into a level requires the level below it to be cleared already,
    // so friendship before the step must already cover that lower threshold.
    const reqs = []
    let acc = 0
    for (const o of best.picks[pi].strat.opts) {
      if (!o || o.k === 'none') continue
      acc += season.rules[`l${o.lvl}f`]
      reqs.push({ lvl: o.lvl, cumReq: acc })
    }
    const entryReq = lvl => {
      const below = reqs.filter(x => x.lvl < lvl)
      return below.length ? below[below.length - 1].cumReq : 0
    }
    check(`${nm} never buys into a level not yet reached`,
      mine.filter(s => s.kind !== 'invite' && s.after - s.gain < entryReq(s.lvl) - 1e-9).length, 0)
    // An invite labelled "Lv 3" has to mean the spirit really is working on
    // Lv 3 — the mismatch a reader spots instantly if items settle too late.
    const byLvl = Object.fromEntries(reqs.map(x => [x.lvl, x.cumReq]))
    check(`${nm} invite labels match the level in progress`,
      mine.filter(s => s.kind === 'invite' && s.required !== byLvl[s.lvl]).length, 0)

    // `unlocked` is what the reader is told just became buyable, so it has to be
    // the next level that actually exists — not cleared+1, which a season with
    // an empty level would make a lie — and the last one has to name the Lv5
    // heart, whose entry requirement is the full cumulative total.
    const present = reqs.map(x => x.lvl)
    const expectedUnlock = lvl => present[present.indexOf(lvl) + 1] ?? 5
    const unlockPairs = mine.flatMap(s => s.cleared.map((lvl, k) => [lvl, s.unlocked[k]]))
    check(`${nm} unlocked names the next level that exists`,
      unlockPairs.filter(([lvl, got]) => got !== expectedUnlock(lvl)).length, 0)
    check(`${nm} every cleared level reports exactly one unlock`,
      mine.filter(s => s.cleared.length !== s.unlocked.length).length, 0)
    // Whatever it names must be a level the spirit can now afford to enter.
    check(`${nm} the unlocked level is genuinely reachable when announced`,
      mine.filter(s => s.unlocked.some(lv => s.after < entryReq(lv) - 1e-9)).length, 0)
  }
}

// ---------------------------------------------------------------------------
// Redemption order. The ultimates array *is* the order the player intends to
// redeem in — cumHearts is a prefix sum over it — so reordering needs no solver
// change. What has to hold is that the meaning does not drift: the identity
// order must still produce what it always did, and a gift moved to the front
// must owe only its own hearts rather than everything ahead of it.
// ---------------------------------------------------------------------------
for (const season of SEASONS) {
  const nm = season.id
  const H = season.ultimates.map(u => Math.max(0, +u.hearts || 0))
  const identity = [...H.keys()]
  const solveOrder = (order, tPos) =>
    solve(season.spirits, order.map(i => ({ hearts: H[i] })), season.rules, tPos)

  const basis = solveOrder(identity, 0)
  if (basis.errorKey) continue

  check(`${nm} cumHearts is the prefix sum of the order given`,
    JSON.stringify(basis.cumHearts),
    JSON.stringify(H.reduce((a, h) => (a.push((a.at(-1) ?? 0) + h), a), [])))

  for (let t = 0; t < H.length; t++) {
    const moved = [t, ...identity.filter(i => i !== t)]
    const r = solveOrder(moved, 0)
    if (r.errorKey) continue

    // The whole point: first in line owes only itself.
    check(`${nm} ult ${t + 1} moved first owes only its own hearts`, r.cumHearts[0], H[t])
    // And it can never land later than it did when it had to queue.
    check(`${nm} ult ${t + 1} moved first is never later than in order`,
      r.best.Ts[0] <= basis.best.Ts[t], true)
    // Hearts are spent, so the full clear still costs the same total.
    check(`${nm} ult ${t + 1} reordering does not change the total hearts owed`,
      r.cumHearts.at(-1), basis.cumHearts.at(-1))
  }

  // Position k of Ts belongs to the gift at position k of the array passed in.
  // Every label in the app depends on this, and nothing else enforces it.
  const rot = [...identity.slice(1), identity[0]]
  const rotated = solveOrder(rot, 0)
  if (!rotated.errorKey) {
    check(`${nm} cumHearts follows the array it was given, not the season order`,
      JSON.stringify(rotated.cumHearts),
      JSON.stringify(rot.reduce((a, i) => (a.push((a.at(-1) ?? 0) + H[i]), a), [])))
  }
}

console.log(failed === 0 ? '\n✅ friendship model behaves as specified\n' : `\n❌ ${failed} assertion(s) failed\n`)
process.exit(failed === 0 ? 0 : 1)
