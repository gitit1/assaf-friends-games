import { getSettings, updateSettings, useSettings } from '../settings'
import { HE } from './he'
import { EN } from './en'
import type { Dict, Lang } from './types'

// The single source of truth for language: text (t), spoken text (say), the
// current language, the toggle (setLang), and the page direction.
const DICTS: Record<Lang, Dict> = { he: HE, en: EN }

export function dirFor(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'he' ? 'rtl' : 'ltr'
}
export function getLang(): Lang {
  return getSettings().lang
}

function entry(lang: Lang, key: string) {
  return DICTS[lang][key] ?? HE[key] // fall back to Hebrew, then to the key itself
}
function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s
  for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
  return s
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  return fill(entry(lang, key)?.text ?? key, vars)
}
export function sayTextFor(lang: Lang, key: string): string {
  const e = entry(lang, key)
  return e?.say ?? e?.text ?? key
}

export function setLang(lang: Lang) {
  updateSettings({ lang })
}

// hooks — subscribe to the language so components re-render on a toggle
export function useLang(): Lang {
  return useSettings().lang
}
export function useT() {
  const lang = useSettings().lang
  return {
    lang,
    t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    say: (key: string) => sayTextFor(lang, key),
  }
}
