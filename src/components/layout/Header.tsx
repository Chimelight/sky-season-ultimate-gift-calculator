import { Moon, Sun, Github, Pencil, Check, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { SEASONS } from '@/data/seasons'
import { useState } from 'react'

export function Header() {
  const { t, lang, setLang, langs } = useI18n()
  const { state, dispatch, editing, setEditing } = useAppState()
  const { theme, setTheme } = useTheme()
  // Start on whichever season the state came from, so a restored edit does not
  // show the picker pointing at an unrelated season.
  const [pickerIdx, setPickerIdx] = useState(() => {
    const i = SEASONS.findIndex(s => s.id === state.seasonId)
    return String(i >= 0 ? i : 0)
  })

  // Picking a season loads it straight away; re-loading the one already picked
  // is how Reset discards edits.
  function loadSeason(idx: string) {
    setPickerIdx(idx)
    dispatch({ type: 'LOAD_SEASON', season: SEASONS[+idx] })
  }

  const title = t('page_title', { name: state.seasonName || t('season_fallback') })

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[min(64rem,100%-2rem)] px-[clamp(0.75rem,2vw,1.5rem)] py-3 flex items-start justify-between flex-wrap gap-x-2 gap-y-2 [container-type:inline-size]">
        <div className="min-w-0 flex-1 [flex-basis:12ch]">
          <h1 className="text-lg font-semibold leading-tight tracking-tight wrap-anywhere break-words">{title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden @[28rem]:block">{t('subtitle')}</p>
        </div>
        <div className="flex items-center justify-end gap-1.5 flex-wrap min-w-0">
          {SEASONS.length > 1 && (
            <Select value={pickerIdx} onValueChange={loadSeason}>
              <SelectTrigger className="h-8 w-auto min-w-0 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map((s, i) => (
                  <SelectItem key={s.id} value={String(i)}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {editing && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              title={t('btn_reset_hint')}
              onClick={() => loadSeason(pickerIdx)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('btn_reset')}
            </Button>
          )}
          <Button
            variant={editing ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setEditing(!editing)}
          >
            {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editing ? t('btn_done_editing') : t('btn_edit_data')}
          </Button>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="h-8 w-auto text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {langs.map(l => (
                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? t('theme_to_light') : t('theme_to_dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href="https://github.com/Chimelight/sky-season-ultimate-gift-calculator"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('aria_github')}
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
