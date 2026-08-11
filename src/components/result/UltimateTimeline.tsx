import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import type { PlannedUltimate } from '@/data/seasons'
import type { SolveResult } from '@/lib/solver'

/**
 * The ultimates on one day axis.
 *
 * The metric cards give each gift's day exactly; what a column of numbers
 * cannot show is the *spacing* — how long the wait is between one and the next.
 * That spacing is what redemption order changes, so dragging a row has an
 * effect here that the numbers alone hide.
 *
 * The marker carries its own number instead of a caption beside it. Two gifts
 * can land a day apart on a thirty-day axis, and captions that long have to be
 * staggered to avoid colliding, which reads as scattered and leaves the label
 * visually detached from its point. A numbered dot has nothing to detach from,
 * and stays narrow enough that even a cluster is legible — a cluster is the
 * truth in that case. Positions are never nudged to make room: moving a marker
 * off its day is the one thing this must not do.
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
  /** Near an end, anchor to that edge; a centred label there hangs outside. */
  const anchor = (d: number) => {
    const x = at(d)
    return x < 6 ? 'translate-x-0' : x > 94 ? '-translate-x-full' : '-translate-x-1/2'
  }

  // Today, when it falls inside the plan — so the axis also answers "how far
  // along am I", which is most of why anyone opens this.
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
    <div className="space-y-2">
      <h3 id="timeline-heading" className="text-sm font-semibold">{t('section_timeline')}</h3>
      <div className="rounded-lg border bg-card px-4 pt-5 pb-3">
        {/* Today sits above the track and the day numbers below it, so the two
            never compete for the same line — at 380px they were touching. */}
        <div className="relative h-[3.4rem] px-2.5">
          <div className="absolute inset-x-0 top-[1.5rem] h-1 rounded-full bg-muted" />
          {today !== null && (
            <div
              className="absolute left-0 top-[1.5rem] h-1 rounded-full bg-foreground/25"
              style={{ width: pct(today) }}
            />
          )}

          {today !== null && (
            <div
              className={`absolute top-0 flex flex-col items-center ${anchor(today)}`}
              style={{ left: pct(today) }}
            >
              <span className="text-[0.62rem] leading-tight text-primary whitespace-nowrap">
                {t('badge_today')}
              </span>
              <span className="h-3 w-px bg-primary/50" />
            </div>
          )}

          {best.Ts.map((T, i) => {
            const isTarget = i === targetIdx
            const n = (ultimates[i]?.id ?? i) + 1
            return (
              <div
                key={i}
                className="absolute top-[1rem] -translate-x-1/2"
                style={{ left: pct(T) }}
                title={`${t('ult_nth', { ord: ordinal(n) })} · ${t('day_prefix', { n: T })}`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[0.62rem] font-bold tabular-nums ${
                    isTarget
                      ? 'bg-[var(--ult-fill)] text-[var(--ult-on)] ring-2 ring-[var(--ult-day)]'
                      : 'border bg-card text-muted-foreground'
                  }`}
                >
                  {n}
                </span>
              </div>
            )
          })}

          {best.Ts.map((T, i) => (
            <span
              key={i}
              className={`absolute top-[2.6rem] text-[0.65rem] leading-none tabular-nums whitespace-nowrap ${
                anchor(T)
              } ${i === targetIdx ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              style={{ left: pct(T) }}
            >
              {T}
            </span>
          ))}
        </div>

        <div className="flex justify-between gap-2 border-t pt-1.5 text-[0.68rem] text-muted-foreground tabular-nums">
          <span>{t('day_prefix', { n: 1 })}</span>
          <span className="text-right">
            {t('day_prefix', { n: best.Tmax })} · {dayDate(best.Tmax)}
          </span>
        </div>

        {/* the dots are graphics; this is the same content as text */}
        <p className="sr-only">
          {best.Ts.map((T, i) =>
            `${t('ult_nth', { ord: ordinal((ultimates[i]?.id ?? i) + 1) })}: ${t('day_prefix', { n: T })}`
          ).join('; ')}
        </p>
      </div>
    </div>
  )
}
