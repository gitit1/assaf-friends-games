import type { ReactNode } from 'react'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { useT } from '../i18n'
import { useNav } from '../nav'
import MuteButton from './MuteButton'

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
  const { t, lang } = useT()
  const nav = useNav()
  const backLabel = nav?.back.label ?? t('nav.home')
  const showBack = nav ? !nav.backIsHome : true
  // back points toward where you came from: the start side, which is the RIGHT
  // in RTL Hebrew and the LEFT in LTR English
  const backArrow = lang === 'he' ? '→' : '←'
  return (
    <div className="game-screen">
      <header className="game-top-bar">
        {/* round icon buttons in a row above the title — same as the home page.
            DOM order = back, then home: a flex row honours the document `dir`, so
            in RTL the back arrow sits on the right (the leading edge) and in LTR
            on the left — both correct without any manual mirroring. */}
        <div className="game-controls">
          {showBack && (
            <button
              className="control-btn"
              onClick={() => {
                unlockAudio()
                stopSpeech()
                playTap()
                onExit()
              }}
              aria-label={backLabel}
            >
              <span aria-hidden="true">{backArrow}</span>
            </button>
          )}
          <button
            className="control-btn"
            onClick={() => {
              unlockAudio()
              stopSpeech()
              playTap()
              if (nav) nav.goHome()
              else onExit()
            }}
            aria-label={t('nav.home.aria')}
          >
            <span aria-hidden="true">🏠</span>
          </button>
          <MuteButton />
        </div>
        <h1 className="game-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h1>
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
