import { useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playFriend, unlockAudio } from '../audio'

// "Friends piano" — each friend is a note. Tap to play its sound and make it
// hop. Pure free play: no goal, no losing, no timer. The first 8 friends form
// a rising musical scale, so tapping left→right sounds like a scale.
const KEYS = 8
const KEY_PX = 66

export default function PianoFriends({ onExit }: GameProps) {
  const [pressed, setPressed] = useState<number | null>(null)

  function play(i: number) {
    unlockAudio()
    playFriend(i)
    setPressed(i)
    window.setTimeout(() => setPressed((p) => (p === i ? null : p)), 420)
  }

  return (
    <GameShell title="פסנתר חברים" emoji="🎹" onExit={onExit}>
      <p className="piano-hint" aria-hidden="true">
        געו בחברים כדי לנגן 🎵
      </p>
      <div className="piano-keys">
        {Array.from({ length: KEYS }).map((_, i) => (
          <button key={i} className="piano-key" onClick={() => play(i)} aria-label={`צליל ${i + 1}`}>
            <Friend index={i} scale={KEY_PX / friendMaxDim(i)} showNumber={false} bouncing={pressed === i} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
