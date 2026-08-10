import { translations as en, ordinal as ordinalEn, dateLocale as dateLocaleEn } from './en'
import { translations as zhCN, ordinal as ordinalZhCN, dateLocale as dateLocaleZhCN } from './zh-CN'
import { translations as bn, ordinal as ordinalBn, dateLocale as dateLocaleBn } from './bn'

export type TranslationKey = keyof typeof en

type Translations = Record<string, string>

const TRANSLATIONS: Record<string, Translations> = { en, 'zh-CN': zhCN, bn }
const ORDINALS: Record<string, (n: number) => string> = { en: ordinalEn, 'zh-CN': ordinalZhCN, bn: ordinalBn }
const DATE_LOCALES: Record<string, string> = { en: dateLocaleEn, 'zh-CN': dateLocaleZhCN, bn: dateLocaleBn }

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文(简体)' },
  { code: 'bn', label: 'বাংলা' },
]

export function t(lang: string, key: string, vars?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS['en']
  let str = dict[key] ?? TRANSLATIONS['en'][key]
  if (str === undefined) return '⚠️' + key
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '{' + k + '}'))
  }
  return str
}

export function getOrdinal(lang: string): (n: number) => string {
  return ORDINALS[lang] ?? ORDINALS['en']
}

export function getDateLocale(lang: string): string {
  return DATE_LOCALES[lang] ?? 'en-US'
}

export function formatDate(dt: Date, lang: string): string {
  const locale = getDateLocale(lang)
  if (lang === 'zh-CN') {
    return (dt.getUTCMonth() + 1) + ' 月 ' + dt.getUTCDate() + ' 日'
  }
  return dt.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }) + ' ' + dt.getUTCDate()
}

export function getSavedLang(): string {
  try {
    const saved = localStorage.getItem('lang') ?? 'en'
    return TRANSLATIONS[saved] ? saved : 'en'
  } catch {
    return 'en'
  }
}
