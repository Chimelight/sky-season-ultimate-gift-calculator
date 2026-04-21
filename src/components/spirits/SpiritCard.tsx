import React from 'react'
import { X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  const { dispatch } = useAppState()

  return (
    <Card className="transition-shadow hover:shadow-md [container-type:inline-size]">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            className="h-8 font-medium min-w-0"
            value={spirit.name}
            placeholder={t('spirit_name_default', { n: idx + 1 })}
            onChange={e => dispatch({ type: 'SET_SPIRIT_NAME', idx, value: e.target.value })}
          />
          {canRemove && (
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
        <div className="grid gap-x-2 gap-y-2 items-center grid-cols-[minmax(3ch,max-content)_minmax(0,1fr)_minmax(0,1fr)] @[20rem]:grid-cols-[minmax(3ch,max-content)_minmax(0,1fr)_minmax(0,1fr)] [@container(max-width:20rem)]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {[0, 1, 2, 3].map(li => {
            const c1 = spirit.levels[li]?.[0] ?? ''
            const c2 = spirit.levels[li]?.[1] ?? ''
            return (
              <React.Fragment key={li}>
                <span className="text-xs text-muted-foreground wrap-anywhere [@container(max-width:20rem)]:col-span-2 [@container(max-width:20rem)]:pt-1">
                  {t('lv_label', { n: li + 1 })}
                </span>
                <Input
                  type="number"
                  className="h-8 text-sm min-w-0"
                  value={c1}
                  placeholder={t('cost_placeholder')}
                  onChange={e => dispatch({ type: 'SET_SPIRIT_COST', spiritIdx: idx, lvl: li, pos: 0, value: e.target.value })}
                />
                <Input
                  type="number"
                  className="h-8 text-sm min-w-0"
                  value={c2}
                  placeholder={t('cost2_placeholder')}
                  onChange={e => dispatch({ type: 'SET_SPIRIT_COST', spiritIdx: idx, lvl: li, pos: 1, value: e.target.value })}
                />
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
