import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { t as tFn, getOrdinal, formatDate as fmtDate, getSavedLang, LANGS } from '@/i18n'

interface I18nContextValue {
  lang: string
  setLang: (code: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  ordinal: (n: number) => string
  formatDate: (dt: Date) => string
  langs: typeof LANGS
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getSavedLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code: string) => {
    setLangState(code)
    try { localStorage.setItem('lang', code) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => tFn(lang, key, vars), [lang])
  const ordinal = useCallback((n: number) => getOrdinal(lang)(n), [lang])
  const formatDate = useCallback((dt: Date) => fmtDate(dt, lang), [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, ordinal, formatDate, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
