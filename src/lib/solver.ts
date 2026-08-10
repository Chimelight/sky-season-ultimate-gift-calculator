import type { Rules, Spirit, Ultimate } from '@/data/seasons'

export interface LevelOpt {
  cost: number
  days: number
  buys: number[]
  skips: number[]
  k: 'none' | 'all' | 'some' | 'skipall'
  lvl: number
}

export interface Strategy {
  cost: number
  days: number
  opts: LevelOpt[]
}

export interface Pick {
  spiritIdx: number
  strat: Strategy
}

export interface SolveResult {
  best: {
    tScore: number
    Tmax: number
    Ts: number[]
    picks: Pick[]
    order: number[]
  }
  cumHearts: number[]
  targetIdx: number
}

export interface SolveError {
  error: string
}

interface LevelInfo {
  items: number[]
  req: number
}

// Friendship arrives in exact thirds when a level holds 3 items, so binary
// floats undershoot: 3 * (8/3) === 7.999999999999999. Without the tolerance a
// fully-bought level would demand a phantom invite day.
const EPS = 1e-9

function ceilDays(x: number): number {
  return Math.max(0, Math.ceil(x - EPS))
}

function levelInfos(spirit: Spirit, rules: Rules): LevelInfo[] {
  const out: LevelInfo[] = []
  for (let i = 0; i < 4; i++) {
    const items = (spirit.levels[i] || [])
      .filter(x => x !== undefined && x !== null && !isNaN(x) && x !== 0)
      .sort((a, b) => a - b)
    out.push({ items, req: rules[('l' + (i + 1) + 'f') as keyof Rules] as number })
  }
  return out
}

/**
 * Walk the four levels accumulating exact friendship, and attribute invite days
 * to the level that forces them.
 *
 * A level worth `req` friendship splits it evenly across its items, so buying
 * `b` of `m` yields `b * req / m`. Invites add 1/day. Friendship never resets,
 * so the thresholds are cumulative and any fractional surplus rolls forward —
 * which is why days are derived from a running maximum here rather than summed
 * per level.
 */
function buildStrategy(levels: LevelInfo[], counts: number[], rules: Rules): Strategy {
  let cost = rules.heart
  let friend = 0
  let cumReq = 0
  let prevDays = 0
  const opts: LevelOpt[] = []

  for (let i = 0; i < 4; i++) {
    const { items, req } = levels[i]
    const lvl = i + 1
    if (items.length === 0) {
      opts.push({ cost: 0, days: 0, buys: [], skips: [], k: 'none', lvl })
      continue
    }
    const b = counts[i]
    const buys = items.slice(0, b)
    const skips = items.slice(b)
    const levelCost = buys.reduce((s, c) => s + c, 0)

    cost += levelCost
    cumReq += req
    friend += (b * req) / items.length

    const totalDays = Math.max(prevDays, ceilDays(cumReq - friend))
    opts.push({
      cost: levelCost,
      days: totalDays - prevDays,
      buys,
      skips,
      k: skips.length === 0 ? 'all' : buys.length === 0 ? 'skipall' : 'some',
      lvl,
    })
    prevDays = totalDays
  }

  return { cost, days: prevDays, opts }
}

export function enumSpirit(spirit: Spirit, rules: Rules): Strategy[] {
  const levels = levelInfos(spirit, rules)
  const strats: Strategy[] = []
  const counts: number[] = []

  // Friendship depends only on how many items a level gives up, so for each
  // count the cheapest items are always the ones worth buying.
  function rec(i: number) {
    if (i === 4) {
      strats.push(buildStrategy(levels, counts, rules))
      return
    }
    for (let b = 0; b <= levels[i].items.length; b++) {
      counts.push(b)
      rec(i + 1)
      counts.pop()
    }
  }
  rec(0)

  return strats.filter(s => !strats.some(x => x !== s && x.cost <= s.cost && x.days <= s.days && (x.cost < s.cost || x.days < s.days)))
}

function priorityOrder(targetIdx: number, n: number): number[] {
  const out = [targetIdx]
  for (let i = targetIdx + 1; i < n; i++) out.push(i)
  for (let i = targetIdx - 1; i >= 0; i--) out.push(i)
  return out
}

function lessByPriority(a: number[], b: number[] | null, prio: number[]): boolean {
  if (!b) return true
  for (const i of prio) {
    if (a[i] < b[i]) return true
    if (a[i] > b[i]) return false
  }
  return false
}

function bestFirstGroup(picks: Pick[], k: number, rules: Rules): { T: number; idxs: number[] } {
  const K = picks.length
  if (k <= 0) return { T: 0, idxs: [] }
  let totalC = 0, totalD = 0
  for (const p of picks) { totalC += p.strat.cost; totalD += p.strat.days }
  if (k >= K) {
    return { T: Math.max(Math.ceil((totalC - rules.pass) / rules.cpd), totalD), idxs: picks.map((_, i) => i) }
  }
  let best: { T: number; idxs: number[] } | null = null
  const combo: number[] = []
  function rec(start: number, cnt: number, sc: number, sd: number) {
    if (cnt === k) {
      const T = Math.max(Math.ceil((sc - rules.pass) / rules.cpd), sd)
      if (!best || T < best.T) best = { T, idxs: combo.slice() }
      return
    }
    if (K - start < k - cnt) return
    for (let i = start; i < K; i++) {
      combo.push(i)
      rec(i + 1, cnt + 1, sc + picks[i].strat.cost, sd + picks[i].strat.days)
      combo.pop()
    }
  }
  rec(0, 0, 0, 0)
  return best!
}

function computeTs(picks: Pick[], order: number[], cumHearts: number[], rules: Rules): number[] {
  const Ts: number[] = []
  let cumC = 0, cumD = 0, p = 0
  for (const k of cumHearts) {
    while (p < k && p < order.length) {
      cumC += picks[order[p]].strat.cost
      cumD += picks[order[p]].strat.days
      p++
    }
    Ts.push(Math.max(Math.ceil((cumC - rules.pass) / rules.cpd), cumD))
  }
  return Ts
}

function bestPermutation(
  arr: number[], prefix: number[], suffix: number[],
  picks: Pick[], cumHearts: number[], rules: Rules, prio: number[]
): { order: number[]; Ts: number[] } {
  if (arr.length <= 1) {
    const order = prefix.concat(arr, suffix)
    return { order: arr.slice(), Ts: computeTs(picks, order, cumHearts, rules) }
  }
  let bestArr: number[] | null = null, bestTs: number[] | null = null
  const a = arr.slice()
  function perm(start: number) {
    if (start === a.length) {
      const order = prefix.concat(a, suffix)
      const Ts = computeTs(picks, order, cumHearts, rules)
      if (!bestTs || lessByPriority(Ts, bestTs, prio)) { bestArr = a.slice(); bestTs = Ts }
      return
    }
    for (let i = start; i < a.length; i++) {
      ;[a[start], a[i]] = [a[i], a[start]]
      perm(start + 1)
      ;[a[start], a[i]] = [a[i], a[start]]
    }
  }
  perm(0)
  return { order: bestArr!, Ts: bestTs! }
}

function orderingForTarget(picks: Pick[], cumHearts: number[], targetIdx: number, rules: Rules) {
  const K = picks.length
  if (K === 0) return { Ts: cumHearts.map(() => 0), order: [] }
  const prio = priorityOrder(targetIdx, cumHearts.length)
  const targetCount = Math.min(cumHearts[targetIdx], K)
  const fg = bestFirstGroup(picks, targetCount, rules)
  const firstSet = new Set(fg.idxs)
  const firstArr = fg.idxs.slice()
  const restArr: number[] = []
  for (let i = 0; i < K; i++) if (!firstSet.has(i)) restArr.push(i)
  const restRes = bestPermutation(restArr, firstArr, [], picks, cumHearts, rules, prio)
  const firstRes = bestPermutation(firstArr, [], restRes.order, picks, cumHearts, rules, prio)
  const order = firstRes.order.concat(restRes.order)
  const Ts = computeTs(picks, order, cumHearts, rules)
  return { Ts, order }
}

export function solve(
  spirits: Spirit[],
  ultimates: Ultimate[],
  rules: Rules,
  targetIdx: number,
  tFn: (key: string, vars?: Record<string, string | number>) => string
): SolveResult | SolveError {
  const N = spirits.length
  const cumHearts: number[] = []
  let acc = 0
  for (const u of ultimates) { acc += Math.max(0, +u.hearts || 0); cumHearts.push(acc) }
  const K = acc
  if (ultimates.length === 0 || K === 0) return { error: tFn('err_no_ult') }
  if (N === 0) return { error: tFn('err_no_spirit') }
  if (K > N) return { error: tFn('err_hearts', { hearts: K, count: N, more: K - N }) }

  const tIdx = Math.max(0, Math.min(targetIdx, ultimates.length - 1))
  const targetCount = Math.min(cumHearts[tIdx], K)
  const prio = priorityOrder(tIdx, ultimates.length)
  const perSpirit = spirits.map(s => enumSpirit(s, rules))

  const minCostOf = perSpirit.map(arr => { let m = Infinity; for (const s of arr) if (s.cost < m) m = s.cost; return m })
  const minDaysOf = perSpirit.map(arr => { let m = Infinity; for (const s of arr) if (s.days < m) m = s.days; return m })

  let best: SolveResult['best'] | null = null
  const picks: Pick[] = []

  function lowerBoundT(nextI: number): number {
    if (targetCount <= 0) return 0
    const costs: number[] = [], days: number[] = []
    for (const p of picks) { costs.push(p.strat.cost); days.push(p.strat.days) }
    for (let j = nextI; j < N; j++) { costs.push(minCostOf[j]); days.push(minDaysOf[j]) }
    if (costs.length < targetCount) return 0
    costs.sort((a, b) => a - b); days.sort((a, b) => a - b)
    let sumC = 0, sumD = 0
    for (let t = 0; t < targetCount; t++) { sumC += costs[t]; sumD += days[t] }
    return Math.max(Math.ceil((sumC - rules.pass) / rules.cpd), sumD)
  }

  function rec(i: number, used: number, cost: number, days: number) {
    if (used > K) return
    if (N - i + used < K) return
    if (best) {
      const lb = lowerBoundT(i)
      if (lb > best.tScore) return
      if (lb === best.tScore) {
        const partialTmax = Math.max(Math.ceil((cost - rules.pass) / rules.cpd), days)
        if (partialTmax > best.Tmax) return
      }
    }
    if (i === N) {
      if (used !== K) return
      const r = orderingForTarget(picks, cumHearts, tIdx, rules)
      const tScore = r.Ts[tIdx]
      const Tmax = r.Ts[r.Ts.length - 1]
      if (!best || tScore < best.tScore || (tScore === best.tScore && lessByPriority(r.Ts, best.Ts, prio))) {
        best = { tScore, Tmax, Ts: r.Ts, picks: picks.slice(), order: r.order }
      }
      return
    }
    if (N - (i + 1) + used >= K) rec(i + 1, used, cost, days)
    if (used < K) {
      for (const s of perSpirit[i]) {
        picks.push({ spiritIdx: i, strat: s })
        rec(i + 1, used + 1, cost + s.cost, days + s.days)
        picks.pop()
      }
    }
  }

  rec(0, 0, 0, 0)
  if (!best) return { error: tFn('err_no_plan') }
  return { best, cumHearts, targetIdx: tIdx }
}
