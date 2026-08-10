import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import type { Rules, Spirit } from '@/data/seasons'
import type { SolveResult, LevelOpt } from '@/lib/solver'

function StratBadge({ opt }: { opt: LevelOpt | undefined }) {
  const { t } = useI18n()
  if (!opt || opt.k === 'none') return <span className="text-muted-foreground">—</span>

  const buy = opt.buys.length > 0
    ? <Badge variant="buy">{t('badge_buy', { c: opt.buys.join('+') })}</Badge>
    : null
  // A skipped level can still cost 0 days once carried-over friendship covers
  // it; label it by what was given up rather than by a misleading "0D".
  const skip = opt.skips.length > 0
    ? <Badge variant="skip">{opt.days > 0 ? t('badge_skip', { d: opt.days }) : t('badge_skip_free')}</Badge>
    : null

  if (buy && !skip) return buy
  if (skip && !buy) return skip
  return (
    <div className="flex flex-row flex-wrap gap-0.5 items-center justify-center">
      {buy}
      {skip}
    </div>
  )
}

export function StrategyTable({ result, spirits, rules }: { result: SolveResult; spirits: Spirit[]; rules: Rules }) {
  const { t } = useI18n()
  const { best } = result

  const completedMap = new Map(
    best.picks.map((p, pi) => [p.spiritIdx, { orderInPlan: best.order.indexOf(pi), strat: p.strat }])
  )

  const usedSpirits = spirits
    .map((sp, idx) => ({ sp, idx, info: completedMap.get(idx) }))
    .filter(x => x.info)
    .sort((a, b) => a.info!.orderInPlan - b.info!.orderInPlan)

  const unusedSpirits = spirits
    .map((sp, idx) => ({ sp, idx }))
    .filter(({ idx }) => !completedMap.has(idx))

  return (
    <div className="space-y-2">
      <h3 id="strategy-heading" className="text-sm font-semibold">{t('section_strategy')}</h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table aria-labelledby="strategy-heading" className="w-full min-w-[32rem] text-sm border-collapse">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="text-left font-medium py-2 pr-2 align-bottom">{t('th_spirit') as string}</th>
              {[0, 1, 2, 3].map(li => (
                <th key={li} scope="col" className="text-center font-medium py-2 px-1 align-bottom wrap-anywhere">
                  {t(`th_lv${li + 1}` as Parameters<typeof t>[0])}
                </th>
              ))}
              <th scope="col" className="text-center font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_cost') as string}</th>
              <th scope="col" className="text-center font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_days') as string}</th>
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
      <p className="text-xs text-muted-foreground">{t('note_lv5', { heart: rules.heart })}</p>
    </div>
  )
}
