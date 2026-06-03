import type { ReactNode } from 'react'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { useT } from '../i18n'
import { useBackTarget } from '../nav'

type GameShellProps = {
  title: string
  emoji: string
  onExit: () => void
  children: ReactNode
}

// Shared frame for every game: a calm header with one big, obvious "back" button.
// The button returns one level up (a game → its category, a friend → the friends
// list, …) — App says where via the back-target context, so it never dumps you
// all the way out to the main page.
export default function GameShell({ title, emoji, onExit, children }: GameShellProps) {
  const { t } = useT()
  const back = useBackTarget()
  const backEmoji = back?.emoji ?? '🏠'
  const backLabel = back?.label ?? t('nav.home')
  return (
    <div className="game-screen">
      <header className="game-top-bar">
        <button
          className="back-button"
          onClick={() => {
            unlockAudio()
            stopSpeech()
            playTap()
            onExit()
          }}
          aria-label={backLabel}
        >
          <span aria-hidden="true">{backEmoji}</span>
          <span>{backLabel}</span>
        </button>
        <h1 className="game-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h1>
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
