import { X, Plus, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StaticField } from '@/components/ui/static-field'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import type { Spirit } from '@/data/seasons'

interface SpiritCardProps {
  spirit: Spirit
  idx: number
  canRemove: boolean
}

export function SpiritCard({ spirit, idx, canRemove }: SpiritCardProps) {
  const { t } = useI18n()
  const { dispatch, editing, maxItemsPerLevel } = useAppState()

  return (
    <Card className="transition-shadow hover:shadow-md [container-type:inline-size]">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <Input
              className="h-8 font-medium min-w-0"
              value={spirit.name}
              placeholder={t('spirit_name_default', { n: idx + 1 })}
              onChange={e => dispatch({ type: 'SET_SPIRIT_NAME', idx, value: e.target.value })}
            />
          ) : (
            <StaticField className="flex-1 font-medium bg-transparent px-0">
              {spirit.name || t('spirit_name_default', { n: idx + 1 })}
            </StaticField>
          )}
          {editing && canRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              title={t('spirit_remove')}
              onClick={() => dispatch({ type: 'REMOVE_SPIRIT', idx })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {/* Highest level first, so the card reads in the same direction as
              the in-game tree and the TreeMap below the results. */}
          {[3, 2, 1, 0].map(li => {
            const items = spirit.levels[li] ?? []
            const count = Math.max(1, items.length)
            return (
              <div key={li} className="flex flex-col @[20rem]:flex-row @[20rem]:items-center gap-1 @[20rem]:gap-2">
                <span className="text-xs text-muted-foreground shrink-0 min-w-[3ch] wrap-anywhere">
                  {t('lv_label', { n: li + 1 })}
                </span>
                {editing ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(3.5rem,100%),1fr))] gap-2 flex-1 min-w-0">
                      {Array.from({ length: count }, (_, pos) => (
                        <Input
                          key={pos}
                          type="number"
                          className="h-8 text-sm min-w-0 text-center"
                          value={items[pos] || ''}
                          placeholder={t('cost_placeholder')}
                          onChange={e => dispatch({ type: 'SET_SPIRIT_COST', spiritIdx: idx, lvl: li, pos, value: e.target.value })}
                        />
                      ))}
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground disabled:opacity-30"
                        disabled={count <= 1}
                        title={t('item_remove')}
                        onClick={() => dispatch({ type: 'REMOVE_SPIRIT_ITEM', spiritIdx: idx, lvl: li })}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground disabled:opacity-30"
                        disabled={count >= maxItemsPerLevel}
                        title={t('item_add')}
                        onClick={() => dispatch({ type: 'ADD_SPIRIT_ITEM', spiritIdx: idx, lvl: li })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <StaticField className="flex-1 tabular-nums gap-2">
                    {items.filter(Boolean).length > 0
                      ? items.filter(Boolean).map((c, i) => (
                          <span key={i} className="tabular-nums">
                            {i > 0 && <span className="text-muted-foreground mr-2">·</span>}
                            {c}
                          </span>
                        ))
                      : <span className="text-muted-foreground">—</span>}
                  </StaticField>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
