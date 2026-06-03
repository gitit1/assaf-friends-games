import { createContext, useContext } from 'react'

// Where the shared "back" button (in GameShell) should say it returns to. App
// fills this per route so a game returns to ITS category list — not all the way
// out to the main page — exactly like a friend's world returns to the friends
// list. Defaults to home when no provider sets it.
export type BackTarget = { emoji: string; label: string }

export const BackContext = createContext<BackTarget | null>(null)

export function useBackTarget(): BackTarget | null {
  return useContext(BackContext)
}
