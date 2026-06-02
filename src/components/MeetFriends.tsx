import { useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import { FRIENDS } from '../friends'
import { playTap, unlockAudio } from '../audio'

const PER_PAGE = 10

// Not a game — "meet the cast". The roster grows toward 100, so instead of one
// long wall of friends we chunk them into groups of ten. A number-range selector
// shows one decade at a time (Assaf reads numbers, so he picks a range himself),
// which keeps the page roomy and uncluttered no matter how big the cast gets.
// The group buttons are derived from FRIENDS.length, so adding the next ten
// friends makes a new button appear on its own. Tap any friend to enter its WORLD.
export default function MeetFriends({ onExit, onOpen }: { onExit: () => void; onOpen: (index: number) => void }) {
  const groups = Math.ceil(FRIENDS.length / PER_PAGE)
  const [group, setGroup] = useState(0)
  const start = group * PER_PAGE
  const end = Math.min(start + PER_PAGE, FRIENDS.length)

  return (
    <GameShell title="החברים שלי" emoji="⭐" onExit={onExit}>
      {groups > 1 && (
        // LTR so the ranges read like a number line: 1–10, 11–20, … left to right
        <div className="meet-decades" dir="ltr">
          {Array.from({ length: groups }, (_, g) => {
            const s = g * PER_PAGE
            const e = Math.min(s + PER_PAGE, FRIENDS.length)
            return (
              <button
                key={g}
                className={`pill meet-decade ${g === group ? 'pill-active' : ''}`}
                onClick={() => {
                  playTap()
                  setGroup(g)
                }}
              >
                {s + 1}–{e}
              </button>
            )
          })}
        </div>
      )}

      <p className="meet-intro">געו בחבר כדי להיכנס לעולם שלו! 👋</p>

      <div className="meet-grid">
        {FRIENDS.slice(start, end).map((friend, j) => {
          const i = start + j
          return (
            <button
              className="meet-friend"
              key={friend.name}
              onClick={() => {
                unlockAudio()
                playTap()
                onOpen(i)
              }}
              aria-label={friend.name}
            >
              <Friend index={i} scale={0.5} showNumber={false} />
              <span className="meet-name">{friend.name}</span>
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
