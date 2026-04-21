import { useMemo } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { solve } from '@/lib/solver'
import { MetricsSummary } from './MetricsSummary'
import { StrategyTable } from './StrategyTable'
import { TreeMap } from './TreeMap'
import { DiscordPost } from './DiscordPost'

export function ResultSection() {
  const { t } = useI18n()
  const { state } = useAppState()

  const result = useMemo(() => {
    try {
      return solve(state.spirits, state.ultimates, state.rules, state.targetIdx, t)
    } catch (e) {
      return { error: t('err_solver') + (e instanceof Error ? e.message : String(e)) }
    }
  }, [state, t])

  if ('error' in result) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <MetricsSummary result={result} />
      <StrategyTable result={result} />
      <TreeMap result={result} />
      <DiscordPost result={result} />
    </div>
  )
}
