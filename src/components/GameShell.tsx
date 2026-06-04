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

// Shared frame for every game: a calm header. A small 🏠 button is ALWAYS there
// (a consistent anchor — one tap to the main page from any screen). When the
// screen sits deeper than one level (a game → its category, a friend → the
// friends list) we ALSO show the labeled "back" button that goes just one level
// up. On a one-level screen, "back" would be home anyway, so only 🏠 shows — we
// never replace a real back-to-previous button, and never duplicate it.
export default function GameShell({ title, emoji, onExit, children }: GameShellProps) {
  const { t } = useT()
  const nav = useNav()
  const backEmoji = nav?.back.emoji ?? '🏠'
  const backLabel = nav?.back.label ?? t('nav.home')
  const showBack = nav ? !nav.backIsHome : true
  return (
    <div className="game-screen">
      <header className="game-top-bar">
        <button
          className="back-button home-button"
          onClick={() => {
            unlockAudio()
            stopSpeech()
            playTap()
            nav ? nav.goHome() : onExit()
          }}
          aria-label={t('nav.home.aria')}
        >
          <span aria-hidden="true">🏠</span>
        </button>
        {showBack && (
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
        )}
        <h1 className="game-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h1>
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
