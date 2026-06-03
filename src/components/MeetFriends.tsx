import { useEffect, useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import { FRIEND_KINDS, FRIEND_NATURAL } from './FriendArt'
import { FRIENDS } from '../friends'
import { playTap, unlockAudio } from '../audio'
import { useT } from '../i18n'

const PER_PAGE = 10
// widest friend in the whole cast — used to size them all so the biggest reaches
// ~90% of the screen width (the smaller numbers stay proportionally smaller, so
// the "bigger number = bigger friend" staircase is kept).
const MAX_W = Math.max(...FRIEND_KINDS.map((k) => FRIEND_NATURAL[k].w))

// Not a game — "meet the cast". The roster grows toward 100, so instead of one
// long wall of friends we chunk them into groups of ten. A number-range selector
// shows one decade at a time (Assaf reads numbers, so he picks a range himself),
// which keeps the page roomy and uncluttered no matter how big the cast gets.
// The group buttons are derived from FRIENDS.length, so adding the next ten
// friends makes a new button appear on its own. Tap any friend to enter its WORLD.
export default function MeetFriends({ onExit, onOpen }: { onExit: () => void; onOpen: (index: number) => void }) {
  const { t } = useT()
  const groups = Math.ceil(FRIENDS.length / PER_PAGE)
  const [group, setGroup] = useState(0)
  const start = group * PER_PAGE
  const end = Math.min(start + PER_PAGE, FRIENDS.length)

  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 360))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // biggest friend fills ~90% of the available width (.meet-grid maxes at 560)
  const scale = (0.9 * Math.min(vw - 16, 560)) / MAX_W

  return (
    <GameShell title={t('home.meet.title')} emoji="⭐" onExit={onExit}>
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

      <p className="meet-intro">{t('meet.intro')}</p>

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
              <Friend index={i} scale={scale} showNumber={false} />
              <span className="meet-name">{friend.name}</span>
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
