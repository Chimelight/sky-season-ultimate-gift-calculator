import { Fragment } from 'react'
import { Plus, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'

export function UltimatesSection() {
  const { t, ordinal } = useI18n()
  const { state, dispatch } = useAppState()

  let acc = 0
  const cumHearts = state.ultimates.map(u => (acc += Math.max(0, u.hearts || 0)))
  const total = acc
  const tIdx = Math.max(0, Math.min(state.targetIdx, state.ultimates.length - 1))

  return (
    <section className="space-y-3 [container-type:inline-size]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold tracking-tight min-w-0 wrap-anywhere">{t('section_ultimates')}</h2>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          onClick={() => dispatch({ type: 'ADD_ULTIMATE' })}
        >
          <Plus className="h-3 w-3" />
          {t('btn_add_ult')}
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-1.5 items-center">
            {state.ultimates.map((u, idx) => (
              <Fragment key={idx}>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('ult_nth', { ord: ordinal(idx + 1) })}
                </span>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-sm text-muted-foreground">+</span>
                    <Input
                      type="number"
                      className="h-8 w-[6ch] min-w-[5ch] text-sm text-center"
                      value={u.hearts || ''}
                      min={0}
                      onChange={e => dispatch({ type: 'SET_ULTIMATE_HEARTS', idx, value: +e.target.value || 0 })}
                    />
                    <span className="text-xs text-muted-foreground">{t('ult_season_hearts')}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs whitespace-nowrap">
                    <input
                      type="radio"
                      name="tgt-ult"
                      checked={tIdx === idx}
                      onChange={() => dispatch({ type: 'SET_TARGET_IDX', idx })}
                      className="accent-primary"
                    />
                    {t('ult_prioritize')}
                  </label>
                  <div className="ml-auto">
                    {state.ultimates.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        title={t('ult_remove')}
                        onClick={() => dispatch({ type: 'REMOVE_ULTIMATE', idx })}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="pt-2">
            <p
              className="text-xs text-muted-foreground pt-1"
              dangerouslySetInnerHTML={{
                __html: state.ultimates.length > 0
                  ? t('ult_summary', {
                      cumStr: cumHearts.join(', '),
                      done: total,
                      total: state.spirits.length,
                      ultNth: t('ult_nth', { ord: ordinal(tIdx + 1) }),
                    })
                  : t('ult_summary_empty'),
              }}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
