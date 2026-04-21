import type { Spirit, Rules } from '@/data/seasons'
import type { Pick } from './solver'
import { addDays } from './helpers'
import { formatDate, getOrdinal } from '@/i18n'

interface GenPostArgs {
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  best: { Ts: number[]; Tmax: number; picks: Pick[]; order: number[] }
  cumHearts: number[]
  targetIdx: number
  lang: string
  t: (key: string, vars?: Record<string, string | number>) => string
}

function dayDate(startDate: string, n: number, lang: string): string {
  try { return formatDate(addDays(startDate, n - 1), lang) } catch { return '?' }
}

function describeOpt(
  o: Pick['strat']['opts'][number] | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string
): string | null {
  if (!o || o.k === 'none') return null
  if (o.k === 'buy') return t('desc_buy', { c: o.buys[0] })
  if (o.k === 'both') return t('desc_buy_both', { exp: o.buys[0], cheap: o.buys[1] })
  if (o.k === 'cheap') return t('desc_buy_cheap', { cheap: o.buys[0], exp: o.skips[0], d: o.days })
  if (o.k === 'exp') return t('desc_buy_exp', { exp: o.buys[0], cheap: o.skips[0], d: o.days })
  if (o.k === 'skip') return t('desc_skip', { c: o.skips[0], d: o.days })
  if (o.k === 'skipboth') return t('desc_skip_both', { d: o.days })
  return null
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

  p += '\n' + t('post_schedule_header') + '\n```\n'
  let day = 1, nextUlt = 0, cumDone = 0
  for (let oi = 0; oi < best.order.length; oi++) {
    const pi = best.order[oi]
    const pick = best.picks[pi]
    const s = pick.strat
    const nm = spirits[pick.spiritIdx].name
    const phases: [number, number][] = []
    for (let li = 0; li < 4; li++) {
      if (s.opts[li] && s.opts[li].days) phases.push([s.opts[li].lvl, s.opts[li].days])
    }
    if (phases.length === 0) {
      p += t('post_no_invites', { name: nm }) + '\n'
    } else {
      for (const ph of phases) {
        const end = day + ph[1] - 1
        const dayStr = day === end ? t('post_day_single', { day }) : t('post_day_range', { start: day, end })
        p += t('post_invite_line', { dayStr, name: nm, d: ph[1], lv: ph[0] }) + '\n'
        day = end + 1
      }
    }
    cumDone++
    while (nextUlt < cumHearts.length && cumDone >= cumHearts[nextUlt]) {
      const T = best.Ts[nextUlt]
      p += t('post_ult_milestone', { ord: ordinal(nextUlt + 1), day: T, date: dayDate(startDate, T, lang) }) + '\n'
      nextUlt++
    }
  }
  if (day <= best.Tmax) {
    const dayStr = day === best.Tmax ? t('post_day_single', { day }) : t('post_day_range', { start: day, end: best.Tmax })
    p += t('post_accumulate', { dayStr }) + '\n'
  }
  p += '```\n\n'
  p += t('post_candle_header') + '\n'
  p += t('post_earned', { day: best.Tmax, earned, pass: rules.pass, cpd: rules.cpd, tmax: best.Tmax }) + '\n'
  p += t('post_spent', { cost: totalCost }) + '\n'
  p += t('post_surplus', { surplus: earned - totalCost }) + '\n'
  p += t('post_invite_used', { used: totalDays, avail: best.Tmax }) + '\n'
  return p
}
