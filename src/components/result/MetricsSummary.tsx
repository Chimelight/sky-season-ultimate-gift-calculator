import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import type { SolveResult } from '@/lib/solver'

export function MetricsSummary({ result }: { result: SolveResult }) {
  const { t, ordinal, formatDate } = useI18n()
  const { state } = useAppState()
  const { best, cumHearts, targetIdx } = result

  const totalCost = best.picks.reduce((s, p) => s + p.strat.cost, 0)
  const totalDays = best.picks.reduce((s, p) => s + p.strat.days, 0)
  const earned = state.rules.pass + state.rules.cpd * best.Tmax

  function dayDate(n: number) {
    try { return formatDate(addDays(state.startDate, n - 1)) } catch { return '?' }
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(11rem,100%),1fr))] gap-2">
      {best.Ts.map((T, i) => (
        <Card key={i} className={i === targetIdx ? 'ring-1 ring-primary' : ''}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between flex-wrap gap-1.5">
              <div className="min-w-[6ch]">
                <div className="text-xs font-medium text-muted-foreground wrap-anywhere">
                  {t('ult_hearts_label', { ord: ordinal(i + 1), hearts: cumHearts[i] })}
                </div>
                <div className="text-fluid-xl font-bold tabular-nums leading-tight">{t('day_prefix', { n: T })}</div>
                <div className="text-xs text-muted-foreground wrap-anywhere">{dayDate(T)}</div>
              </div>
              {i === targetIdx && (
                <Badge variant="order" className="shrink-0">{t('target_badge')}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="p-3 min-w-0">
          <div className="text-xs font-medium text-muted-foreground wrap-anywhere">{t('total_candles')}</div>
          <div className="text-fluid-xl font-bold tabular-nums min-w-[6ch] leading-tight">{totalCost}C</div>
          <div className="text-xs text-muted-foreground wrap-anywhere">
            {t('earned_surplus', { day: best.Tmax, earned, surplus: earned - totalCost })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 min-w-0">
          <div className="text-xs font-medium text-muted-foreground wrap-anywhere">{t('invite_days')}</div>
          <div className="text-fluid-xl font-bold tabular-nums min-w-[6ch] leading-tight">{totalDays} / {best.Tmax}</div>
          <div className="text-xs text-muted-foreground wrap-anywhere">{t('invite_rate')}</div>
        </CardContent>
      </Card>
    </div>
  )
}
