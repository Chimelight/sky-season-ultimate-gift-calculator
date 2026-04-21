import type { LevelOpt } from './solver'

export function shortName(n: string, idx: number): string {
  if (!n) return 'S' + (idx + 1)
  const w = n.split(/\s+/).filter(Boolean)
  if (w.length === 1) return w[0].length <= 10 ? w[0] : w[0].slice(0, 9) + '.'
  return w.map(x => x[0].toUpperCase()).join('')
}

export function addDays(s: string, n: number): Date {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt
}

export function describeOpt(
  o: LevelOpt | undefined,
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
