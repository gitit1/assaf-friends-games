import { useState, type CSSProperties } from 'react'
import { playFriend, unlockAudio } from '../audio'
import { speakName } from '../speech'
import { friendName, friendNumber, friendSay } from '../friends'
import FriendArt, { FRIEND_KINDS, FRIEND_NATURAL, type Outfit } from './FriendArt'

type Props = {
  /** 0-based position → fixed friend identity (name + number + look + voice). */
  index: number
  /** Multiplier on the friend's natural size. */
  scale?: number
  /** How many parts are "awake". If given and below the number, the friend is dimmed/asleep. */
  litUnits?: number
  /** Externally-driven jump. */
  bouncing?: boolean
  /** Tapping makes it jump, sound off, and say its name. */
  interactive?: boolean
  /** Show the friend's number above its head (default true). */
  showNumber?: boolean
  /** Open + chew the mouth (for the eating animation). */
  eating?: boolean
  /** Dress-up items worn on the friend (a filled slot replaces its built-in accessory). */
  outfit?: Outfit
  /** "Alive" — gentle blink (for a featured friend, not the whole grid). */
  lively?: boolean
  /** A one-shot gesture: hug / high-five / kiss (arms + pseudo-3D lean). */
  action?: 'five' | 'hug' | 'kiss' | null
}

// The little moves a friend can do when tapped (besides jumping).
const MOVES = ['jump', 'wiggle', 'spin', 'nod', 'tada'] as const

export default function Friend({
  index,
  scale = 1,
  litUnits,
  bouncing = false,
  interactive = false,
  showNumber = true,
  eating = false,
  outfit,
  lively = false,
  action = null,
}: Props) {
  const [move, setMove] = useState<string | null>(null)
  const kind = FRIEND_KINDS[index % FRIEND_KINDS.length]
  const n = friendNumber(index)
  const nat = FRIEND_NATURAL[kind]

  function poke() {
    unlockAudio()
    playFriend(index)
    speakName(friendSay(index))
    // a different little move each tap, so the friends feel alive (not just jump)
    const pick = MOVES[Math.floor(Math.random() * MOVES.length)]
    setMove(pick)
    window.setTimeout(() => setMove(null), 850)
  }

  const holderStyle: CSSProperties = { width: nat.w * scale, height: nat.h * scale }
  const scaleStyle: CSSProperties = { width: nat.w, transform: `scale(${scale})`, transformOrigin: 'top left' }
  const moveClass = move ? `move-${move}` : bouncing ? 'move-jump' : ''
  const className = `friend-holder ${moveClass}`

  const inner = (
    <span className="friend-scale" style={scaleStyle}>
      <FriendArt
        kind={kind}
        number={n}
        showHalo={showNumber}
        litUnits={litUnits}
        eating={eating}
        outfit={outfit}
        lively={lively}
        action={action}
      />
    </span>
  )

  if (interactive) {
    return (
      <button className={className} style={holderStyle} onClick={poke} aria-label={friendName(index)}>
        {inner}
      </button>
    )
  }
  return (
    <div className={className} style={holderStyle} aria-hidden="true">
      {inner}
    </div>
  )
}
