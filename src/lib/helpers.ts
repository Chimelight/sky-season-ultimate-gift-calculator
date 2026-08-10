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
  if (o.k === 'all') return t('desc_buy_all', { c: o.buys.join('+') })
  // Carried-over surplus friendship can cover a skipped level outright, so a
  // skip does not always cost invite days.
  const suffix = o.days > 0 ? t('desc_days_suffix', { d: o.days }) : ''
  if (o.k === 'skipall') return t('desc_skip_all', { c: o.skips.join('+'), suffix })
  return t('desc_buy_some', { buy: o.buys.join('+'), skip: o.skips.join('+'), suffix })
}
