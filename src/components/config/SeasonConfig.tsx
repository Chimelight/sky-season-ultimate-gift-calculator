import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'

export function SeasonConfig() {
  const { t } = useI18n()
  const { state, dispatch } = useAppState()

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(14rem,100%),1fr))] gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-name">{t('label_season_name')}</Label>
            <Input
              id="s-name"
              value={state.seasonName}
              onChange={e => dispatch({ type: 'SET_SEASON_NAME', value: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-start">{t('label_start_date')}</Label>
            <Input
              id="s-start"
              type="date"
              value={state.startDate}
              onChange={e => dispatch({ type: 'SET_START_DATE', value: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
