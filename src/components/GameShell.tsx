import type { ReactNode } from 'react'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'
import { useT } from '../i18n'

type GameShellProps = {
  title: string
  emoji: string
  onExit: () => void
  children: ReactNode
}

// Shared frame for every game: a calm header with one big, obvious "back home" button.
export default function GameShell({ title, emoji, onExit, children }: GameShellProps) {
  const { t } = useT()
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
          aria-label={t('nav.home.aria')}
        >
          <span aria-hidden="true">🏠</span>
          <span>{t('nav.home')}</span>
        </button>
        <h1 className="game-title">
          <span aria-hidden="true">{emoji}</span> {title}
        </h1>
      </header>
      <main className="game-body">{children}</main>
    </div>
  )
}
