import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { SEASONS } from '@/data/seasons'
import type { Rules } from '@/data/seasons'
import { useState } from 'react'

const SKIP_KEYS = ['l1f', 'l1h', 'l2f', 'l2h', 'l3f', 'l3h', 'l4f', 'l4h'] as const

export function RulesCard() {
  const { t } = useI18n()
  const { state, dispatch } = useAppState()
  const [pickerIdx, setPickerIdx] = useState('0')

  function handleRule(key: keyof Rules, value: string) {
    dispatch({ type: 'SET_RULE', key, value: +value || 0 })
  }

  return (
    <Card className="[container-type:inline-size]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">{t('section_rules')}</CardTitle>
          {SEASONS.length > 1 && (
            <div className="flex items-center flex-wrap gap-2 min-w-0">
              <Select value={pickerIdx} onValueChange={setPickerIdx}>
                <SelectTrigger className="h-8 text-xs w-auto min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s, i) => (
                    <SelectItem key={s.id} value={String(i)}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs whitespace-nowrap shrink-0"
                onClick={() => dispatch({ type: 'LOAD_SEASON', season: SEASONS[+pickerIdx] })}
              >
                {t('btn_load_season')}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
          {(['cpd', 'pass', 'heart'] as const).map(key => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`r-${key}`} className="text-xs">{t(`label_${key}` as Parameters<typeof t>[0])}</Label>
              <Input
                id={`r-${key}`}
                type="number"
                className="h-8"
                value={state.rules[key] || ''}
                onChange={e => handleRule(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('note_skip_days')}</p>
          {(['f', 'h'] as const).map((type) => (
            <div key={type} className="flex flex-col @[32rem]:flex-row @[32rem]:items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 min-w-[12ch] max-w-[20ch] wrap-anywhere">
                {type === 'f' ? t('fullskip_days') : t('halfskip_days')}
              </span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(5rem,100%),1fr))] gap-2 flex-1 min-w-0">
                {([1, 2, 3, 4] as const).map(n => (
                  <div key={n} className="space-y-1 min-w-0">
                    <p className="text-xs text-center text-muted-foreground @[32rem]:hidden">
                      {t(`th_lv${n}` as Parameters<typeof t>[0])}
                    </p>
                    <Input
                      type="number"
                      className="h-8 w-full text-center text-xs"
                      value={state.rules[`l${n}${type}` as keyof Rules] || ''}
                      onChange={e => handleRule(`l${n}${type}` as keyof Rules, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { SKIP_KEYS }
