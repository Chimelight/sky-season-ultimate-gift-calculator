import type { Rules } from '@/data/seasons'
import type { SolveResult } from './solver'

const EPS = 1e-9

/** `collect` is the dailies that bank the day's candles; it opens every day. */
export type StepKind = 'collect' | 'buy' | 'invite' | 'heart'

/** One event. Rows in the breakdown map 1:1 onto these. */
export interface Step {
  kind: StepKind
  day: number
  /** Null on `collect`, which belongs to no particular spirit. */
  spiritIdx: number | null
  lvl: number
  /** Signed: positive when candles come in, negative when spent. */
  candles: number
  /** Friendship this step adds. */
  gain: number
  /** Friendship the spirit holds after this step. */
  after: number
  /** Cumulative friendship the level being worked on needs. */
  required: number
  /**
   * Friendship the spirit needs in total, so a bar can be drawn on one scale
   * for the whole run rather than rescaling at every level. Per spirit, not
   * global: a strategy that skips a level entirely never owes that level's
   * friendship, so its total is genuinely smaller.
   */
  total: number
  /** Cumulative threshold of each level the spirit actually has, for ticks. */
  marks: readonly number[]
  /** Levels whose cumulative threshold this step met, in order. */
  cleared: number[]
  /**
   * The levels those thresholds opened — what the player can actually act on.
   * Not `cleared + 1`: a season may leave a level with no items at all, and
   * that level never enters the chain. The last one opens Lv5, the heart,
   * whose entryReq is the full cumulative total.
   *
   * Kept beside `cleared` rather than replacing it because the two are not
   * interchangeable — a level's threshold can be met with its own items
   * skipped, so meeting it is not the same as owning that level.
   */
  unlocked: number[]
  /** Items given up, tagged with the level whose clearing gave them up. */
  skips: { lvl: number; cost: number }[]
  /** Set on the step that finishes the spirit. */
  completes: boolean
  /** Candle balance once this step has settled. */
  balance: number
  /** Ultimate indices unlocked by this step. */
  ultimates: number[]
}

export interface DayRow {
  day: number
  earned: number
  spent: number
  cumEarned: number
  cumSpent: number
  /** Everything that happens this day, in order. */
  steps: Step[]
  /** Spirits finished this day. */
  completed: number[]
  /** Ultimate indices that become claimable this day. */
  ultimates: number[]
}

interface Group {
  spiritIdx: number
  lvl: number
  costs: number[]
  isHeart: boolean
  /** Friendship these items contribute once paid for. */
  friendship: number
  /**
   * Last day these items may be owned. A level with invites still to come must
   * have them by its phase end, since those later invite counts assume it.
   * Past a spirit's last invite phase nothing in the tree depends on them, but
   * the spirit is not finished until they are bought — so the deadline becomes
   * the spirit's completion day, which is what an ultimate waits on.
   */
  deadline: number
  /** True past the spirit's last invite phase: nothing in the tree waits on it. */
  isTail: boolean
  /** Cumulative friendship needed to reach this level and be able to buy in. */
  entryReq: number
  /** Filled in during settlement. */
  day: number
}

/**
 * Expand a solved plan into one row per day, each holding the ordered events
 * inside it: the dailies that bank candles, then invites and purchases.
 *
 * The solver only produces per-spirit totals, so everything about *when* is
 * derived here. Invites are fixed — packed consecutively in plan order, the
 * schedule the Discord post prints. Purchases are the hard part:
 *
 * - Every item is wanted as early as possible; owning it sooner is strictly
 *   better for the player. So each group is first pinned to its deadline, a
 *   baseline that is feasible because it is what the solver costed, and then
 *   pulled back to the earliest day that is both reachable in the tree and
 *   affordable. Pulling one group only raises spend between its new day and its
 *   old one, so checking that window proves nothing else has to move — no
 *   completion, and therefore no ultimate, can slip.
 *
 * - Deadline-bound items are pulled before any tail. A tail merely has to exist
 *   by the ultimate it gates; an item with invites still ahead of it has to
 *   exist *before* them.
 *
 * - Candles still run out, and then an item genuinely cannot be bought when the
 *   plan would like it. Invites are therefore labelled with the level the spirit
 *   has actually reached rather than the plan's phase, so the sequence never
 *   claims progress that has not happened.
 */
export function buildSchedule(result: SolveResult, rules: Rules): DayRow[] {
  const { best } = result

  interface InviteSlot { day: number; spiritIdx: number }
  const invites: InviteSlot[] = []
  /** Items given up at each level, surfaced when that level finally clears. */
  const skipsAt = new Map<number, Map<number, number[]>>()
  const groups: Group[] = []
  /** Per spirit, the cumulative friendship each present level demands. */
  const thresholds = new Map<number, { lvl: number; cumReq: number }[]>()
  let day = 0

  // When each spirit's tail must be paid off. Not its own earliest finish — an
  // ultimate only waits on the spirits it counts, so a spirit sitting between
  // two checkpoints may finish any time before the next one. Holding it to its
  // own earliest day would pointlessly reserve candles that a later spirit's
  // items could be using now.
  const finishBy = best.order.map((_, k) => {
    const gate = result.cumHearts.findIndex(h => h >= k + 1)
    return gate >= 0 ? Math.max(1, best.Ts[gate]) : Math.max(1, best.Tmax)
  })

  best.order.forEach((pi, orderIdx) => {
    const { spiritIdx, strat } = best.picks[pi]
    const lastInviteLevel = strat.opts.reduce((m, o) => (o && o.days > 0 ? o.lvl : m), 0)
    const pending: Group[] = []
    const levelReqs: { lvl: number; cumReq: number }[] = []
    let cumReq = 0

    for (let i = 0; i < 4; i++) {
      const opt = strat.opts[i]
      if (!opt || opt.k === 'none') continue
      const req = rules[`l${i + 1}f` as keyof Rules] as number
      const items = opt.buys.length + opt.skips.length
      cumReq += req
      levelReqs.push({ lvl: opt.lvl, cumReq })

      if (opt.skips.length > 0) {
        const m = skipsAt.get(spiritIdx) ?? new Map<number, number[]>()
        m.set(opt.lvl, opt.skips)
        skipsAt.set(spiritIdx, m)
      }
      for (let k = 0; k < opt.days; k++) invites.push({ day: ++day, spiritIdx })
      if (opt.buys.length > 0) {
        pending.push({
          spiritIdx,
          lvl: opt.lvl,
          costs: opt.buys,
          isHeart: false,
          friendship: items > 0 ? (opt.buys.length * req) / items : 0,
          deadline: opt.lvl <= lastInviteLevel ? 0 : finishBy[orderIdx],
          isTail: opt.lvl > lastInviteLevel,
          entryReq: cumReq - req,
          day: 0,
        })
      }
    }
    pending.push({
      spiritIdx,
      lvl: 5,
      costs: [rules.heart],
      isHeart: true,
      friendship: 0,
      deadline: finishBy[orderIdx],
      isTail: true,
      entryReq: cumReq,
      day: 0,
    })

    // A level's items are needed by the end of the spirit's whole invite block,
    // not its own phase: the running-max that sets the day count binds at the
    // deepest level, and every item below feeds it. Pinning them per phase is
    // tighter than the plan requires and makes the baseline unaffordable.
    const blockEnd = Math.max(1, day)
    for (const g of pending) if (g.deadline === 0) g.deadline = Math.min(blockEnd, finishBy[orderIdx])
    thresholds.set(spiritIdx, levelReqs)
    groups.push(...pending)
  })

  // Settle the groups. An item is worth having as soon as it can be had, so
  // each group takes the earliest day that is both reachable in the tree and
  // affordable. Groups are processed in plan order — spirit by spirit, level by
  // level — so a later spirit can never bid candles away from an earlier one
  // and push its ultimate back; whatever is already assigned is accounted for
  // at every day the capacity test looks at.
  const cost = (g: Group) => g.costs.reduce((a, b) => a + b, 0)
  const totalCost = groups.reduce((s, g) => s + cost(g), 0)
  const cpd = Math.max(1, rules.cpd)
  const horizon = Math.max(best.Tmax, day) + Math.ceil(totalCost / cpd) + 2
  const earnedBy = (d: number) => rules.pass + rules.cpd * d

  /** Friendship events per spirit: fixed invites plus purchases as they settle. */
  const gains = new Map<number, { day: number; gain: number }[]>()
  for (const v of invites) {
    gains.set(v.spiritIdx, [...(gains.get(v.spiritIdx) ?? []), { day: v.day, gain: 1 }])
  }
  /** Earliest day the spirit's friendship covers `need`. */
  const reachedBy = (spiritIdx: number, need: number) => {
    if (need <= EPS) return 1
    const evs = [...(gains.get(spiritIdx) ?? [])].sort((a, b) => a.day - b.day)
    let acc = 0
    for (const e of evs) {
      acc += e.gain
      if (acc >= need - EPS) return e.day
    }
    return horizon
  }

  // Start with every group pinned to its deadline. That baseline is feasible by
  // construction — it is the schedule the solver itself costed — so pulling
  // purchases earlier can only ever be an improvement, never a risk.
  const committed = new Array(horizon + 2).fill(0)
  for (const g of groups) {
    g.day = Math.min(g.deadline, horizon)
    for (let dd = g.day; dd <= horizon; dd++) committed[dd] += cost(g)
    gains.set(g.spiritIdx, [...(gains.get(g.spiritIdx) ?? []), { day: g.day, gain: g.friendship }])
  }

  // Now pull each one as early as it will go. An item is worth having the moment
  // it can be had. Moving a group from its deadline to day d only raises spend
  // on the days in between, so checking just that window is enough to know
  // nothing else has to give — no other group moves, so no completion, and
  // therefore no ultimate, can slip.
  // Deadline-bound items go first, ahead of every tail regardless of dates.
  // A tail only has to exist by its ultimate; an item with invites still to
  // come has to exist before them, or the level those invites are labelled
  // with is not the level the spirit is actually on.
  const order = groups
    .map((g, i) => ({ g, i }))
    .sort((a, b) =>
      Number(a.g.isTail) - Number(b.g.isTail) || a.g.deadline - b.g.deadline || a.i - b.i)
    .map(x => x.g)
  const prevDay = new Map<number, number>()
  for (const g of order) {
    const c = cost(g)
    const floor = Math.max(1, reachedBy(g.spiritIdx, g.entryReq), prevDay.get(g.spiritIdx) ?? 0)
    let target = g.day
    for (let d = floor; d < g.day; d++) {
      let fits = true
      for (let dd = d; dd < g.day; dd++) {
        if (committed[dd] + c > earnedBy(dd)) { fits = false; break }
      }
      if (fits) { target = d; break }
    }
    if (target < g.day) {
      for (let dd = target; dd < g.day; dd++) committed[dd] += c
      const evs = gains.get(g.spiritIdx) ?? []
      const at = evs.findIndex(e => e.day === g.day && e.gain === g.friendship)
      if (at >= 0) evs[at] = { day: target, gain: g.friendship }
      g.day = target
    }
    prevDay.set(g.spiritIdx, g.day)
  }

  // Replay each spirit chronologically to get friendship and level unlocks.
  const stepsByDay = new Map<number, Step[]>()
  const completedByDay = new Map<number, number[]>()

  for (const pi of best.order) {
    const { spiritIdx } = best.picks[pi]
    const levelReqs = thresholds.get(spiritIdx) ?? []
    const myInvites = invites.filter(v => v.spiritIdx === spiritIdx)
    const myGroups = groups.filter(g => g.spiritIdx === spiritIdx)
    const days = [...new Set([...myInvites.map(v => v.day), ...myGroups.map(g => g.day)])].sort((a, b) => a - b)

    const mySkips = skipsAt.get(spiritIdx) ?? new Map<number, number[]>()
    // Shared by every step of this spirit: the bar's scale and its tick marks.
    const total = levelReqs[levelReqs.length - 1]?.cumReq ?? 0
    const marks: readonly number[] = levelReqs.map(l => l.cumReq)
    let friendship = 0
    let clearedIdx = 0
    /** The level the spirit is actually on — the lowest it has not cleared. */
    const workingLvl = () =>
      clearedIdx < levelReqs.length
        ? levelReqs[clearedIdx].lvl
        : levelReqs[levelReqs.length - 1]?.lvl ?? 0
    const required = () =>
      clearedIdx < levelReqs.length
        ? levelReqs[clearedIdx].cumReq
        : levelReqs[levelReqs.length - 1]?.cumReq ?? 0

    function absorb(gain: number) {
      friendship += gain
      const cleared: number[] = []
      const unlocked: number[] = []
      const skips: { lvl: number; cost: number }[] = []
      while (clearedIdx < levelReqs.length && friendship >= levelReqs[clearedIdx].cumReq - EPS) {
        const lvl = levelReqs[clearedIdx].lvl
        cleared.push(lvl)
        unlocked.push(levelReqs[clearedIdx + 1]?.lvl ?? 5)
        for (const cost of mySkips.get(lvl) ?? []) skips.push({ lvl, cost })
        clearedIdx++
      }
      return { cleared, unlocked, skips }
    }

    const remaining = new Set(myGroups)
    for (const d of days) {
      const hasInvite = myInvites.some(v => v.day === d)
      const todays = myGroups.filter(g => g.day === d).sort((a, b) => a.lvl - b.lvl)
      const out: Step[] = []
      const blank = { day: d, balance: 0, ultimates: [] as number[], total, marks }

      // One step per item, not per level: each unlock is its own action with its
      // own share of the level's friendship, which is what the sequence is for.
      const pushBuy = (g: Group) => {
        const perItem = g.friendship / g.costs.length
        remaining.delete(g)
        g.costs.forEach((c, idx) => {
          const req = required()
          const { cleared, unlocked, skips } = absorb(perItem)
          out.push({
            ...blank,
            kind: g.isHeart ? 'heart' : 'buy',
            spiritIdx,
            lvl: g.lvl,
            candles: -c,
            gain: perItem,
            after: friendship,
            required: req,
            cleared,
            unlocked,
            skips,
            completes: remaining.size === 0 && idx === g.costs.length - 1,
          })
        })
      }

      const pushInvite = () => {
        // Labelled by the level the spirit is genuinely on, not the plan phase:
        // when candles run short an item can settle after the invites it was
        // meant to precede, and a phase label would then name the wrong level.
        const lvl = workingLvl()
        const req = required()
        const { cleared, unlocked, skips } = absorb(1)
        out.push({
          ...blank,
          kind: 'invite',
          spiritIdx,
          lvl,
          candles: 0,
          gain: 1,
          after: friendship,
          required: req,
          cleared,
          unlocked,
          skips,
          completes: false,
        })
      }

      // Slot the invite exactly where it is needed: right before the first
      // purchase whose level is still out of reach without it.
      let invited = false
      for (const g of todays) {
        if (!invited && hasInvite && friendship < g.entryReq - EPS) {
          pushInvite()
          invited = true
        }
        pushBuy(g)
      }
      if (hasInvite && !invited) pushInvite()

      stepsByDay.set(d, [...(stepsByDay.get(d) ?? []), ...out])
      if (out.some(s => s.completes)) {
        completedByDay.set(d, [...(completedByDay.get(d) ?? []), spiritIdx])
      }
    }
  }

  const ultByDay = new Map<number, number[]>()
  best.Ts.forEach((T, i) => {
    const d = Math.max(1, T)
    ultByDay.set(d, [...(ultByDay.get(d) ?? []), i])
  })

  const lastDay = Math.max(1, best.Tmax, day, ...groups.map(g => g.day))
  const rows: DayRow[] = []
  let cumEarned = 0
  let cumSpent = 0
  let balance = 0
  for (let d = 1; d <= lastDay; d++) {
    const earned = rules.cpd + (d === 1 ? rules.pass : 0)
    // The dailies open the day: candles are banked before anything is spent.
    const collect: Step = {
      kind: 'collect',
      day: d,
      spiritIdx: null,
      lvl: 0,
      candles: earned,
      gain: 0,
      after: 0,
      required: 0,
      total: 0,
      marks: [],
      cleared: [],
      unlocked: [],
      skips: [],
      completes: false,
      balance: 0,
      ultimates: [],
    }
    const steps = [collect, ...(stepsByDay.get(d) ?? [])]
    for (const s of steps) {
      balance += s.candles
      s.balance = balance
    }

    // Hang each ultimate on the step that finished the spirit unlocking it, so
    // the badge sits on the event that earned it rather than floating on the day.
    const unlocked = ultByDay.get(d) ?? []
    if (unlocked.length) {
      const host = [...steps].reverse().find(s => s.completes) ?? steps[steps.length - 1]
      host.ultimates = unlocked
    }

    const spent = steps.reduce((s, x) => s + Math.max(0, -x.candles), 0)
    cumEarned += earned
    cumSpent += spent
    rows.push({
      day: d,
      earned,
      spent,
      cumEarned,
      cumSpent,
      steps,
      completed: completedByDay.get(d) ?? [],
      ultimates: unlocked,
    })
  }
  return rows
}

/** Friendship is fractional when a level splits unevenly; keep it readable. */
export function formatFriendship(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
}
