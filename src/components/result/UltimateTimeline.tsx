import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import type { PlannedUltimate } from '@/data/seasons'
import type { SolveResult } from '@/lib/solver'

/**
 * The ultimates on one day axis.
 *
 * The cards below give each gift's day precisely; what they cannot show is the
 * *spacing* — how long the wait is between one and the next, and how far the
 * last one sits from the first. That is exactly what redemption order changes,
 * so dragging a row has an effect here that a column of numbers hides.
 *
 * Labels stagger between two heights rather than sitting on one line: two
 * ultimates can land a day apart on a thirty-day axis, and centred labels would
 * then overlap into an unreadable smear. The pips stay at their true position —
 * nudging them apart would misreport the day, which is the one thing this must
 * not do.
 */
export function UltimateTimeline({ result, ultimates }: {
  result: SolveResult; ultimates: PlannedUltimate[]
}) {
  const { t, ordinal, formatDate } = useI18n()
  const { state } = useAppState()
  const { best, targetIdx } = result

  const span = Math.max(1, best.Tmax)
  const at = (d: number) => Math.min(100, Math.max(0, (d / span) * 100))
  const pct = (d: number) => `${at(d)}%`
  /**
   * A label centred on a pip at either end hangs half outside the card. Near
   * the edges it aligns to that edge instead, which keeps it whole and still
   * reads as belonging to the pip — the pip itself never moves.
   */
  const anchor = (d: number) => {
    const x = at(d)
    return x < 12 ? 'translate-x-0' : x > 88 ? '-translate-x-full' : '-translate-x-1/2'
  }

  // Where today falls, so the axis answers "how far along am I" too. Null
  // whenever today is outside the plan, which is most of a season's life.
  const [y, m, d] = state.startDate.split('-').map(Number)
  let today: number | null = null
  if (y && m && d) {
    const now = new Date()
    const diff = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)
    const n = Math.floor(diff / 86_400_000) + 1
    if (n >= 1 && n <= span) today = n
  }

  function dayDate(n: number) {
    try { return formatDate(addDays(state.startDate, n - 1)) } catch { return '' }
  }

  return (
    <div className="rounded-lg border bg-card p-4 pb-3">
      {/* padding on the positioned container insets the absolute children too,
          so the first and last pip sit inside the card rather than on its edge */}
      <div className="relative h-14 px-1.5">
        {/* two label lanes; index parity picks one, so neighbours never collide */}
        {best.Ts.map((T, i) => {
          const isTarget = i === targetIdx
          return (
            <div
              key={i}
              className={`absolute flex flex-col gap-0.5 ${anchor(T)}`}
              style={{ left: pct(T), top: i % 2 === 0 ? 0 : '1.35rem' }}
            >
              <span
                className={`text-xs whitespace-nowrap tabular-nums ${
                  isTarget ? 'font-bold text-[var(--ult-ink)]' : 'text-muted-foreground'
                }`}
              >
                {isTarget && '★ '}
                {t('ult_nth', { ord: ordinal((ultimates[i]?.id ?? i) + 1) })}
              </span>
            </div>
          )
        })}

        {/* the rail sits below both lanes */}
        <div className="absolute inset-x-0 bottom-4 h-0.5 rounded-full bg-muted" />

        {today !== null && (
          <div
            className={`absolute bottom-2.5 flex flex-col items-center ${anchor(today)}`}
            style={{ left: pct(today) }}
          >
            <span className="h-3 w-px bg-primary/60" />
            <span className="mt-0.5 text-[0.62rem] leading-none text-primary whitespace-nowrap">
              {t('badge_today')}
            </span>
          </div>
        )}

        {best.Ts.map((T, i) => (
          <span
            key={i}
            className={`absolute bottom-[0.82rem] -translate-x-1/2 rounded-full ${
              i === targetIdx
                ? 'size-2.5 bg-[var(--ult-fill)] ring-[3px] ring-[var(--ult-day)]'
                : 'size-2 bg-muted-foreground/60'
            }`}
            style={{ left: pct(T) }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="flex justify-between gap-2 border-t pt-1.5 text-[0.68rem] text-muted-foreground tabular-nums">
        <span>{t('day_prefix', { n: 1 })}</span>
        <span className="text-right">
          {t('day_prefix', { n: best.Tmax })} · {dayDate(best.Tmax)}
        </span>
      </div>

      <p className="sr-only">
        {best.Ts.map((T, i) =>
          `${t('ult_nth', { ord: ordinal((ultimates[i]?.id ?? i) + 1) })}: ${t('day_prefix', { n: T })}`
        ).join('; ')}
      </p>
    </div>
  )
}
