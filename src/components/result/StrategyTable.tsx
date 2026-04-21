import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import type { SolveResult, LevelOpt } from '@/lib/solver'

function StratBadge({ opt }: { opt: LevelOpt | undefined }) {
  const { t } = useI18n()
  if (!opt || (opt.k === 'none' && opt.buys.length === 0)) return <span className="text-muted-foreground">—</span>
  if (opt.k === 'buy' || opt.k === 'both') {
    return <Badge variant="buy">{t('badge_buy', { c: opt.buys.join('+') })}</Badge>
  }
  if (opt.k === 'skip' || opt.k === 'skipboth') {
    return <Badge variant="skip">{t('badge_skip', { d: opt.days })}</Badge>
  }
  return (
    <div className="flex flex-row flex-wrap gap-0.5 items-center justify-center">
      <Badge variant="buy">{t('badge_buy', { c: opt.buys.join('+') })}</Badge>
      <Badge variant="skip">{t('badge_skip', { d: opt.days })}</Badge>
    </div>
  )
}

export function StrategyTable({ result }: { result: SolveResult }) {
  const { t } = useI18n()
  const { state } = useAppState()
  const { best } = result

  const completedMap = new Map(
    best.picks.map((p, pi) => [p.spiritIdx, { orderInPlan: best.order.indexOf(pi), strat: p.strat }])
  )

  const usedSpirits = state.spirits
    .map((sp, idx) => ({ sp, idx, info: completedMap.get(idx) }))
    .filter(x => x.info)
    .sort((a, b) => a.info!.orderInPlan - b.info!.orderInPlan)

  const unusedSpirits = state.spirits
    .map((sp, idx) => ({ sp, idx }))
    .filter(({ idx }) => !completedMap.has(idx))

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_strategy')}</h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[32rem] text-sm border-collapse">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left font-medium py-2 pr-2 align-bottom">{t('th_spirit') as string}</th>
              {[0, 1, 2, 3].map(li => (
                <th key={li} className="text-center font-medium py-2 px-1 align-bottom wrap-anywhere">
                  {t(`th_lv${li + 1}` as Parameters<typeof t>[0])}
                </th>
              ))}
              <th className="text-center font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_cost') as string}</th>
              <th className="text-center font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_days') as string}</th>
            </tr>
          </thead>
          <tbody>
            {usedSpirits.map(({ sp, idx, info }) => (
              <tr key={idx} className="border-b last:border-0 align-middle">
                <td className="py-2 pr-2 font-medium wrap-anywhere break-words">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="order" className="shrink-0">#{info!.orderInPlan + 1}</Badge>
                    <span className="wrap-anywhere break-words">{sp.name}</span>
                  </div>
                </td>
                {[0, 1, 2, 3].map(li => (
                  <td key={li} className="py-2 px-1 text-center">
                    <div className="flex justify-center"><StratBadge opt={info!.strat.opts[li]} /></div>
                  </td>
                ))}
                <td className="py-2 px-2 text-center text-xs text-muted-foreground tabular-nums whitespace-nowrap">{info!.strat.cost}</td>
                <td className="py-2 px-2 text-center text-xs text-muted-foreground tabular-nums whitespace-nowrap">{info!.strat.days}</td>
              </tr>
            ))}
            {unusedSpirits.map(({ sp, idx }) => (
              <tr key={idx} className="border-b last:border-0 opacity-50">
                <td className="py-2 pr-2 wrap-anywhere break-words">{sp.name}</td>
                <td className="py-2 px-1 text-xs text-muted-foreground text-center" colSpan={4}>{t('not_used')}</td>
                <td className="py-2 pl-2" />
                <td className="py-2 pl-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t('note_lv5', { heart: state.rules.heart })}</p>
    </div>
  )
}
