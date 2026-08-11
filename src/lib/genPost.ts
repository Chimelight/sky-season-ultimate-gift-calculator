import type { Spirit, Rules } from '@/data/seasons'
import type { SolveResult } from './solver'
import { addDays, describeOpt } from './helpers'
import { buildSchedule } from './schedule'
import { formatDate, getOrdinal } from '@/i18n'

interface GenPostArgs {
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  best: SolveResult['best']
  cumHearts: number[]
  targetIdx: number
  lang: string
  t: (key: string, vars?: Record<string, string | number>) => string
}

function dayDate(startDate: string, n: number, lang: string): string {
  try { return formatDate(addDays(startDate, n - 1), lang) } catch { return '?' }
}

export function genPost({ seasonName, startDate, rules, spirits, best, cumHearts, targetIdx, lang, t }: GenPostArgs): string {
  const ordinal = getOrdinal(lang)
  const totalCost = best.picks.reduce((s, p) => s + p.strat.cost, 0)
  const totalDays = best.picks.reduce((s, p) => s + p.strat.days, 0)
  const earned = rules.pass + rules.cpd * best.Tmax

  let p = t('post_header', { name: seasonName }) + '\n\n'
  p += t('post_tldr', { ord: ordinal(targetIdx + 1) }) + '\n'
  best.Ts.forEach((T, i) => {
    const mark = i === targetIdx ? ' ★' : ''
    p += t('post_ult_line', { ord: ordinal(i + 1), hearts: cumHearts[i], day: T, date: dayDate(startDate, T, lang), mark }) + '\n'
  })
  p += '\n' + t('post_requires', { pass: rules.pass, spiritCount: spirits.length, totalHearts: cumHearts[cumHearts.length - 1] }) + '\n\n'
  p += t('post_per_spirit') + '\n'
  best.order.forEach((pi, i) => {
    const pick = best.picks[pi]
    const sp = spirits[pick.spiritIdx]
    const s = pick.strat
    p += '\n' + t('post_spirit_entry', { n: i + 1, name: sp.name, cost: s.cost, days: s.days })
    for (let li = 0; li < 4; li++) {
      const o = s.opts[li]
      if (o && o.k !== 'none') {
        const desc = describeOpt(o, t)
        if (desc) p += '\n' + t('post_lv_entry', { n: li + 1, desc })
      }
    }
    p += '\n' + t('post_lv5', { heart: rules.heart }) + '\n'
  })
  const usedSet = new Set(best.picks.map(pk => pk.spiritIdx))
  const unused = spirits.filter((_, i) => !usedSet.has(i))
  if (unused.length) p += '\n' + t('post_skipped', { names: unused.map(s => s.name).join(', ') }) + '\n'

  // The schedule is read straight off buildSchedule, the same source the daily
  // breakdown renders. Deriving it separately here is what let the post claim a
  // spirit was working on a level it had not reached yet.
  p += '\n' + t('post_schedule_header') + '\n```\n'
  const rows = buildSchedule({ best, cumHearts, targetIdx }, rules)
  const spiritName = (i: number | null) => (i === null ? '' : spirits[i]?.name ?? '')

  /**
   * A day with nothing but a plain invite folds into a range with its neighbours.
   * The run still breaks when `lvl` changes even though the label no longer
   * prints it — a stretch that crosses a level is a different stretch of the
   * plan, and merging across it would report a longer unbroken run than exists.
   */
  const plainInvite = (r: (typeof rows)[number]) => {
    const acts = r.steps.filter(s => s.kind !== 'collect')
    return acts.length === 1 && acts[0].kind === 'invite' &&
      acts[0].cleared.length === 0 && acts[0].skips.length === 0 && acts[0].ultimates.length === 0
      ? acts[0]
      : null
  }

  for (let i = 0; i < rows.length; i++) {
    const plain = plainInvite(rows[i])
    if (plain) {
      let j = i
      while (j + 1 < rows.length) {
        const nxt = plainInvite(rows[j + 1])
        if (!nxt || nxt.spiritIdx !== plain.spiritIdx || nxt.lvl !== plain.lvl) break
        j++
      }
      // A single day is not a run; collapsing it would only add a stray "x1".
      if (j > i) {
        p += t('post_sched_invites', {
          dayStr: t('post_day_range', { start: rows[i].day, end: rows[j].day }),
          name: spiritName(plain.spiritIdx), n: j - i + 1,
        }) + '\n'
        i = j
        continue
      }
    }

    const acts: string[] = []
    for (const s of rows[i].steps) {
      if (s.kind === 'collect') continue
      const who = spiritName(s.spiritIdx)
      if (s.kind === 'invite') acts.push(t('post_act_invite', { name: who }))
      else if (s.kind === 'heart') acts.push(t('post_act_heart', { name: who, c: -s.candles }))
      else acts.push(t('post_act_buy', { name: who, lv: s.lvl, c: -s.candles }))
      for (const sk of s.skips) acts.push(t('post_act_skip', { lv: sk.lvl, c: sk.cost }))
      for (const lv of s.cleared) acts.push(t('post_act_cleared', { lv }))
      if (s.completes) acts.push(t('post_act_complete', { name: who }))
      for (const u of s.ultimates) {
        acts.push(t('post_act_ult', {
          ord: ordinal(u + 1), date: dayDate(startDate, rows[i].day, lang),
        }))
      }
    }
    if (acts.length === 0) {
      p += t('post_accumulate', { dayStr: t('post_day_single', { day: rows[i].day }) }) + '\n'
      continue
    }
    p += t('post_sched_line', {
      dayStr: t('post_day_single', { day: rows[i].day }),
      actions: acts.join(' · '),
    }) + '\n'
  }
  p += '```\n\n'
  p += t('post_candle_header') + '\n'
  p += t('post_earned', { day: best.Tmax, earned, pass: rules.pass, cpd: rules.cpd, tmax: best.Tmax }) + '\n'
  p += t('post_spent', { cost: totalCost }) + '\n'
  p += t('post_surplus', { surplus: earned - totalCost }) + '\n'
  p += t('post_invite_used', { used: totalDays, avail: best.Tmax }) + '\n'
  return p
}
