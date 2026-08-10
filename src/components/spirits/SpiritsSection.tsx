import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SpiritCard } from './SpiritCard'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'

export function SpiritsSection() {
  const { t } = useI18n()
  const { state, dispatch, maxSpirits, editing } = useAppState()
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
        {editing && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            disabled={atMax}
            title={atMax ? t('spirit_capped', { max: maxSpirits }) : ''}
            onClick={handleAdd}
          >
            <Plus className="h-3 w-3" />
            {t('btn_add_spirit')}
          </Button>
        )}
      </div>
      {/* Read mode shows a label and a few digits per level and fits four
          across. Edit mode also has to seat the +/- pair and up to three number
          inputs on that line — the label and buttons alone eat half a 235px
          card — so it takes a wider floor and lands on three. Same auto-fit
          rule, different minimum. */}
      <div
        className={
          editing
            ? 'grid grid-cols-[repeat(auto-fit,minmax(min(17rem,100%),1fr))] gap-3'
            : 'grid grid-cols-[repeat(auto-fit,minmax(min(13rem,100%),1fr))] gap-3'
        }
      >
        {state.spirits.map((sp, idx) => (
          <SpiritCard
            key={idx}
            spirit={sp}
            idx={idx}
            canRemove={state.spirits.length > 1}
          />
        ))}
      </div>
      {editing && <p className="text-xs text-muted-foreground">{t('note_spirit_levels')}</p>}
    </section>
  )
}
