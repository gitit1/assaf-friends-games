import { useSyncExternalStore } from 'react'

// How far the child has reached in the swallow game's world map. `maxLevel` is the
// highest UNLOCKED level (starts at 1). Finishing a level unlocks the next. Saved
// so the journey persists; never goes backward. No-fail — a "how far have I come"
// progress surface, not a gate that can be lost.

const KEY = 'assaf-games:holeMaxLevel'

function load(): number {
  try {
    const raw = localStorage.getItem(KEY)
    const n = raw ? parseInt(raw, 10) : 1
    return Number.isFinite(n) && n >= 1 ? n : 1
  } catch {
    return 1
  }
}

let maxLevel = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, String(maxLevel))
  } catch {
    // storage off — just won't persist
  }
}

export function getMaxLevel(): number {
  return maxLevel
}

/** Unlock up to `n` (idempotent; only ever grows). */
export function reachLevel(n: number) {
  if (n <= maxLevel) return
  maxLevel = n
  persist()
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useMaxLevel(): number {
  return useSyncExternalStore(subscribe, getMaxLevel, getMaxLevel)
}
