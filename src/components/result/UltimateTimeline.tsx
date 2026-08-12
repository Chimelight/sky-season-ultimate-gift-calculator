import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import type { PlannedUltimate } from '@/data/seasons'
import type { SolveResult } from '@/lib/solver'

/**
 * The ultimates on one day axis.
 *
 * No axis end-labels: every marker carries its own day and date, so a "Day 1 ·
 * Jul 17" caption underneath only restated what the markers already say, and
 * once the right end went (Tmax is by definition the last marker's own day) the
 * left one was an orphan row with a rule above it.
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
      <div className="rounded-lg border bg-card px-4 pt-5 pb-4">
        {/* Today sits above the track and the day numbers below it, so the two
            never compete for the same line — at 380px they were touching. */}
        {/* Margin, not padding: `left: X%` on an absolutely positioned child
            resolves against the containing block's *padding box*, which
            includes the padding — so px-* does not inset these at all, and the
            last label hung outside the card. Margin narrows the box itself. */}
        <div className="relative h-[4.1rem] mx-7">
          <div className="absolute inset-x-0 top-[1.5rem] h-1 rounded-full bg-muted" />
          {today !== null && (
            <div
              className="absolute left-0 top-[1.5rem] h-1 rounded-full bg-foreground/25"
              style={{ width: pct(today) }}
            />
          )}

          {today !== null && (
            <div
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
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

          {/* Centred like the marker above it — anchoring these to the card edge
              instead put the last one out of line with its own dot. */}
          {best.Ts.map((T, i) => (
            <span
              key={i}
              className={`absolute top-[2.55rem] flex -translate-x-1/2 flex-col items-center leading-tight whitespace-nowrap ${
                i === targetIdx ? 'text-foreground' : 'text-muted-foreground'
              }`}
              style={{ left: pct(T) }}
            >
              <span className={`text-[0.68rem] tabular-nums ${i === targetIdx ? 'font-bold' : 'font-medium'}`}>
                {t('day_prefix', { n: T })}
              </span>
              <span className="text-[0.62rem] text-muted-foreground">{dayDate(T)}</span>
            </span>
          ))}
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
