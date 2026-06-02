import { useSyncExternalStore } from 'react'
import { setMuted } from './audio'
import { setNamesEnabled, setSpeechEnabled } from './speech'

// Small persisted settings store. Parents can turn the Hebrew voice or the
// sound effects on/off; choices survive a refresh via localStorage.

export type Settings = {
  voice: boolean
  sound: boolean
  /** Say a friend's name/number out loud when tapped. */
  sayNames: boolean
  /** Seconds between switching the "catch" target friend (30 or 60). */
  catchSeconds: number
  /** Default difficulty every game opens at (0 קל · 1 בינוני · 2 קשה · 3 אלוף). */
  difficulty: number
}

const STORAGE_KEY = 'assaf-games:settings'
const DEFAULTS: Settings = { voice: true, sound: true, sayNames: true, catchSeconds: 30, difficulty: 1 }

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

let current = load()
const listeners = new Set<() => void>()

function applySideEffects() {
  setMuted(!current.sound)
  setSpeechEnabled(current.voice)
  setNamesEnabled(current.sayNames)
}

// Reflect persisted settings into the audio/speech modules at startup.
applySideEffects()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Private-mode / storage-disabled: settings just won't persist. No crash.
  }
}

export function getSettings() {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  persist()
  applySideEffects()
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, getSettings)
}
