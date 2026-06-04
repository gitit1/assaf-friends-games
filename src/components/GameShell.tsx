import type { ReactNode } from 'react'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { useT } from '../i18n'
import { useNav } from '../nav'

type GameShellProps = {
  title: string
  emoji: string
  onExit: () => void
  children: ReactNode
}

// Shared frame for every game: a calm header with one big, obvious "back" button.
// The button returns one level up (a game → its category, a friend → the friends
// list, …) — App says where via the nav context, so it never dumps you all the
// way out to the main page. On screens that sit deeper than one level (a game,
// a friend's world) we ALSO show a small 🏠 button that jumps straight home.
export default function GameShell({ title, emoji, onExit, children }: GameShellProps) {
  const { t } = useT()
  const nav = useNav()
  const backEmoji = nav?.back.emoji ?? '🏠'
  const backLabel = nav?.back.label ?? t('nav.home')
  const showHome = nav ? !nav.backIsHome : false
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
        {showHome && (
          <button
            className="back-button home-button"
            onClick={() => {
              stopSpeech()
              playTap()
              nav!.goHome()
            }}
            aria-label={t('nav.home.aria')}
          >
            <span aria-hidden="true">🏠</span>
          </button>
        )}
        <h1 className="game-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h1>
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
