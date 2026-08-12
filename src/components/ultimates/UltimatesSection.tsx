import { Plus, X, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { useDragOrder } from '@/hooks/useDragOrder'

export function UltimatesSection() {
  const { t, ordinal } = useI18n()
  const { state, dispatch, editing } = useAppState()
  // Reordering is a *query*, like prioritize: it says which order you intend to
  // redeem in, not what the season contains. So it stays live outside edit mode.
  const drag = useDragOrder(state.ultimates.length, (from, to) =>
    dispatch({ type: 'MOVE_ULTIMATE', from, to }))

  let acc = 0
  const cumHearts = state.ultimates.map(u => (acc += Math.max(0, u.hearts || 0)))
  const total = acc
  const tIdx = Math.max(0, Math.min(state.targetIdx, state.ultimates.length - 1))

  return (
    <section className="space-y-3 [container-type:inline-size]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold tracking-tight min-w-0 wrap-anywhere">{t('section_ultimates')}</h2>
        {editing && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => dispatch({ type: 'ADD_ULTIMATE' })}
          >
            <Plus className="h-3 w-3" />
            {t('btn_add_ult')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <div data-list className="flex flex-col gap-y-1.5">
            {state.ultimates.map((u, idx) => (
              <div
                key={u.id}
                data-row
                {...drag.rowProps(idx)}
                className={`flex items-center flex-wrap gap-x-3 gap-y-1.5 rounded-md px-1 -mx-1 ${
                  drag.dragging === idx ? 'bg-card shadow-lg' : ''
                }`}
              >
                <button
                  type="button"
                  data-handle
                  {...drag.handleProps(idx)}
                  aria-label={t('ult_reorder', { ord: ordinal(u.id + 1) })}
                  title={t('ult_reorder', { ord: ordinal(u.id + 1) })}
                  className="shrink-0 h-8 w-5 -ml-1 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
                  {t('ult_nth', { ord: ordinal(u.id + 1) })}
                </span>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 grow">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">+</span>
                    {editing ? (
                      <Input
                        type="number"
                        className="h-8 w-[6ch] min-w-[5ch] text-sm text-center shrink-0"
                        value={u.hearts || ''}
                        min={0}
                        onChange={e => dispatch({ type: 'SET_ULTIMATE_HEARTS', idx, value: +e.target.value || 0 })}
                      />
                    ) : (
                      <span className="text-sm font-medium tabular-nums shrink-0">{u.hearts}</span>
                    )}
                    <span className="text-xs text-muted-foreground min-w-0 wrap-anywhere">{t('ult_season_hearts')}</span>
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
                    {editing && state.ultimates.length > 1 && (
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
              </div>
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
                      // tIdx is a position; the reader needs the gift's own number.
                      ultNth: t('ult_nth', { ord: ordinal((state.ultimates[tIdx]?.id ?? tIdx) + 1) }),
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
