import type { Rules, Spirit, Ultimate } from '@/data/seasons'

export interface LevelOpt {
  cost: number
  days: number
  buys: number[]
  skips: number[]
  k: 'none' | 'buy' | 'both' | 'cheap' | 'exp' | 'skip' | 'skipboth'
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

export function enumSpirit(spirit: Spirit, rules: Rules): Strategy[] {
  const lvlOpts: LevelOpt[][] = []
  for (let i = 0; i < 4; i++) {
    const items = (spirit.levels[i] || []).filter(x => x !== undefined && x !== null && !isNaN(x) && x !== 0)
    const fk = rules[('l' + (i + 1) + 'f') as keyof Rules] as number
    const hk = rules[('l' + (i + 1) + 'h') as keyof Rules] as number
    if (items.length === 0) {
      lvlOpts.push([{ cost: 0, days: 0, buys: [], skips: [], k: 'none', lvl: i + 1 }])
    } else if (items.length === 1) {
      const c = items[0]
      lvlOpts.push([
        { cost: c, days: 0, buys: [c], skips: [], k: 'buy', lvl: i + 1 },
        { cost: 0, days: fk, buys: [], skips: [c], k: 'skip', lvl: i + 1 },
      ])
    } else {
      const sorted = items.slice(0, 2).sort((a, b) => b - a)
      const exp = sorted[0], cheap = sorted[1]
      lvlOpts.push([
        { cost: exp + cheap, days: 0, buys: [exp, cheap], skips: [], k: 'both', lvl: i + 1 },
        { cost: cheap, days: hk, buys: [cheap], skips: [exp], k: 'cheap', lvl: i + 1 },
        { cost: exp, days: hk, buys: [exp], skips: [cheap], k: 'exp', lvl: i + 1 },
        { cost: 0, days: fk, buys: [], skips: [exp, cheap], k: 'skipboth', lvl: i + 1 },
      ])
    }
  }
  let strats: Strategy[] = [{ cost: rules.heart, days: 0, opts: [] }]
  for (let i = 0; i < 4; i++) {
    const next: Strategy[] = []
    for (const s of strats) for (const o of lvlOpts[i]) {
      next.push({ cost: s.cost + o.cost, days: s.days + o.days, opts: s.opts.concat([o]) })
    }
    strats = next
  }
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
