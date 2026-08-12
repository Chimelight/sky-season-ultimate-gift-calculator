import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { useSolve } from '@/hooks/useSolve'
import { MetricsSummary } from './MetricsSummary'
import { UltimateTimeline } from './UltimateTimeline'
import { StrategyTable } from './StrategyTable'
import { TreeMap } from './TreeMap'
import { DailyTable } from './DailyTable'
import { DiscordPost } from './DiscordPost'

export function ResultSection() {
  const { t } = useI18n()
  const { state } = useAppState()
  const { spirits, ultimates, rules, targetIdx } = state
  const { outcome, input, pending } = useSolve({ spirits, ultimates, rules, targetIdx })

  // Nothing computed yet — the very first solve, before any result exists.
  if (!outcome || !input) {
    return <p className="text-sm text-muted-foreground">{t('solving')}</p>
  }

  if ('errorKey' in outcome) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t(outcome.errorKey as Parameters<typeof t>[0], outcome.vars)}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    // While a new solve is in flight the previous plan stays readable rather
    // than blanking; it is dimmed so nobody mistakes it for the fresh answer.
    <div
      className={`space-y-6 animate-in fade-in duration-150 transition-opacity ${
        pending ? 'opacity-50' : ''
      }`}
      aria-busy={pending}
    >
      {/* Children read spirits and rules from the snapshot the result was
          computed against, never from live state. A worker reply arrives after
          the state may already have moved on — switching seasons mid-solve used
          to index a 5-spirit result into a 4-spirit list and blank the page. */}
      <UltimateTimeline result={outcome} ultimates={input.ultimates} />
      <MetricsSummary result={outcome} rules={input.rules} ultimates={input.ultimates} />
      <StrategyTable result={outcome} spirits={input.spirits} rules={input.rules} />
      <TreeMap result={outcome} spirits={input.spirits} rules={input.rules} />
      <DailyTable result={outcome} spirits={input.spirits} rules={input.rules} ultimates={input.ultimates} />
      <DiscordPost result={outcome} spirits={input.spirits} rules={input.rules} ultimates={input.ultimates} />
    </div>
  )
}
