import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SpiritCard } from './SpiritCard'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'

export function SpiritsSection() {
  const { t } = useI18n()
  const { state, dispatch, maxSpirits } = useAppState()
  const atMax = state.spirits.length >= maxSpirits

  function handleAdd() {
    const tmpl = state.spirits[state.spirits.length - 1]
    const defaultLevels = tmpl ? tmpl.levels.map(l => l.slice()) : [[4], [19, 7], [24, 10], [28]]
    dispatch({ type: 'ADD_SPIRIT', defaultLevels })
  }

  return (
    <section className="space-y-3 [container-type:inline-size]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold min-w-0 wrap-anywhere">
          {t('section_spirits')}{' '}
          <span className="font-normal text-muted-foreground text-xs">
            {t('spirit_count', { count: state.spirits.length, max: maxSpirits })}
          </span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={atMax}
          title={atMax ? t('spirit_capped', { max: maxSpirits }) : ''}
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
          {t('btn_add_spirit')}
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] gap-3">
        {state.spirits.map((sp, idx) => (
          <SpiritCard
            key={idx}
            spirit={sp}
            idx={idx}
            canRemove={state.spirits.length > 1}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t('note_spirit_levels')}</p>
    </section>
  )
}
