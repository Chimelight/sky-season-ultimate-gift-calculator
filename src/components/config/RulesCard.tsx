import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StaticField } from '@/components/ui/static-field'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import type { Rules } from '@/data/seasons'

export function RulesCard() {
  const { t } = useI18n()
  const { state, dispatch, editing } = useAppState()

  function handleRule(key: keyof Rules, value: string) {
    dispatch({ type: 'SET_RULE', key, value: +value || 0 })
  }

  return (
    <Card className="[container-type:inline-size]">
      <CardHeader>
        <CardTitle className="text-base">{t('section_rules')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
          {(['cpd', 'pass', 'heart'] as const).map(key => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`r-${key}`} className="text-xs">{t(`label_${key}` as Parameters<typeof t>[0])}</Label>
              {editing ? (
                <Input
                  id={`r-${key}`}
                  type="number"
                  className="h-8"
                  value={state.rules[key] || ''}
                  onChange={e => handleRule(key, e.target.value)}
                />
              ) : (
                <StaticField className="tabular-nums">{state.rules[key]}</StaticField>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t('note_friendship')}</p>
          <div className="flex flex-col @[32rem]:flex-row @[32rem]:items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 min-w-[12ch] max-w-[20ch] wrap-anywhere">
              {t('friendship_per_level')}
            </span>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(5rem,100%),1fr))] gap-2 flex-1 min-w-0">
              {([1, 2, 3, 4] as const).map(n => (
                <div key={n} className="space-y-1 min-w-0">
                  <p className="text-xs text-center text-muted-foreground @[32rem]:hidden">
                    {t(`th_lv${n}` as Parameters<typeof t>[0])}
                  </p>
                  {editing ? (
                    <Input
                      type="number"
                      className="h-8 w-full text-center text-xs"
                      value={state.rules[`l${n}f` as keyof Rules] || ''}
                      onChange={e => handleRule(`l${n}f` as keyof Rules, e.target.value)}
                    />
                  ) : (
                    <StaticField className="justify-center tabular-nums text-xs">
                      {state.rules[`l${n}f` as keyof Rules]}
                    </StaticField>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
