import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import FriendArt, { bigBumpLayout, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playCount, playNudge, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { numberWord, randInt } from './util'

// "Connect the dots" — numbered dots sit on a friend's bumps. Tap them in
// order 1→N: a line is drawn and each bump lights up, until the whole friend
// is revealed. Counting practice (up to 30) + drawing. No timer, no losing.
// Uses friends 11–30 (their bump layout is computable, and they give lots of
// dots to count).
const FIRST = 10 // friend index 10 = friend #11 (first big friend)
const LAST = FRIENDS.length - 1

function randBig() {
  return randInt(FIRST, LAST)
}

export default function ConnectDots({ onExit }: GameProps) {
  const [index, setIndex] = useState(() => randBig())
  const [connected, setConnected] = useState(0)
  const [wrong, setWrong] = useState(false)

  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const kind = friendKindForIndex(index)
  const layout = bigBumpLayout(kind)! // always a big friend here
  const total = layout.centers.length
  const done = connected >= total

  // scale the board to fill the width nicely (capped by height)
  const s = Math.min((win.w * 0.92) / layout.w, (win.h * 0.5) / layout.h)

  function goTo(next: number) {
    setIndex(next)
    setConnected(0)
    setWrong(false)
    playCount(1)
  }

  function tapDot(n: number) {
    // n is 1-based
    if (done) return
    unlockAudio()
    if (n === connected + 1) {
      const now = n
      setConnected(now)
      if (now >= total) {
        playWin()
        speak(`${numberWord(total)}! ${friendSay(index)}`)
      } else {
        playCount(now)
        speak(numberWord(now))
      }
    } else {
      setWrong(true)
      playNudge()
      window.setTimeout(() => setWrong(false), 450)
    }
  }

  // the connected path, in natural (viewBox) coordinates
  const linePoints = layout.centers
    .slice(0, connected)
    .map((c) => `${c.x},${c.y}`)
    .join(' ')

  return (
    <GameShell title="חיבור נקודות" emoji="✏️" onExit={onExit}>
      <div className="color-screen">
        <Stepper
          label={`${friendName(index)} · ${index + 1}`}
          onPrev={() => goTo(index <= FIRST ? LAST : index - 1)}
          onNext={() => goTo(index >= LAST ? FIRST : index + 1)}
        />

        <div className="dots-stage">
          <div className={`dots-board ${wrong ? 'is-wrong' : ''} ${done ? 'is-done' : ''}`} style={{ width: layout.w * s, height: layout.h * s }}>
            <div
              className="dots-friend"
              style={{ width: layout.w, height: layout.h, transform: `scale(${s})`, transformOrigin: 'top left' }}
            >
              <FriendArt kind={kind} litUnits={connected} showHalo={false} />
            </div>

            <svg
              className="dots-svg"
              viewBox={`0 0 ${layout.w} ${layout.h}`}
              style={{ width: layout.w * s, height: layout.h * s }}
              aria-hidden="true"
            >
              {connected > 1 && <polyline className="dots-line" points={linePoints} vectorEffect="non-scaling-stroke" />}
            </svg>

            {layout.centers.map((c, i) => {
              const n = i + 1
              const state = n <= connected ? 'is-done' : n === connected + 1 ? 'is-next' : 'is-pending'
              return (
                <button
                  key={i}
                  type="button"
                  className={`dot ${state}`}
                  style={{ left: c.x * s, top: c.y * s }}
                  onClick={() => tapDot(n)}
                  aria-label={`נקודה ${n}`}
                >
                  {n <= connected ? '' : n}
                </button>
              )
            })}
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="🔄" label="מתחילים מחדש" onClick={() => goTo(index)} />
          <IconButton icon="🎲" label="חבר חדש" onClick={() => goTo(randBig())} />
        </div>
      </div>
    </GameShell>
  )
}
