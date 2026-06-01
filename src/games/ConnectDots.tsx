import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import FriendArt, { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playCount, playNudge, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { numberWord, randInt } from './util'

// "Connect the dots" — numbered dots sit on a friend's bumps. Tap them in order
// 1→N: a line is drawn and each bump lights up, until the whole friend is
// revealed. Counting practice + drawing. Works for every friend (1–30): the dot
// positions are MEASURED from the rendered friend, so no per-friend setup.
export default function ConnectDots({ onExit }: GameProps) {
  const [index, setIndex] = useState(() => randInt(0, FRIENDS.length - 1))
  const [connected, setConnected] = useState(0)
  const [wrong, setWrong] = useState(false)
  const [centers, setCenters] = useState<{ x: number; y: number }[]>([])

  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const boardRef = useRef<HTMLDivElement>(null)
  const friendRef = useRef<HTMLDivElement>(null)

  const kind = friendKindForIndex(index)
  const nat = FRIEND_NATURAL[kind]
  const s = Math.min((win.w * 0.88) / nat.w, (win.h * 0.46) / nat.h, 2.6)
  const total = centers.length
  const done = total > 0 && connected >= total

  // measure each bump's centre (in board pixels) once the friend has rendered,
  // and whenever the friend or the screen size changes
  useLayoutEffect(() => {
    const fr = friendRef.current
    const bd = boardRef.current
    if (!fr || !bd) return
    const br = bd.getBoundingClientRect()
    const bumps = fr.querySelectorAll('.bump, .lobe')
    const cs = Array.from(bumps).map((b) => {
      const r = (b as HTMLElement).getBoundingClientRect()
      return { x: r.left + r.width / 2 - br.left, y: r.top + r.height / 2 - br.top }
    })
    setCenters(cs)
  }, [index, s])

  function goTo(next: number) {
    setIndex(next)
    setConnected(0)
    setWrong(false)
    playCount(1)
  }

  function tapDot(n: number) {
    if (done) return
    unlockAudio()
    if (n === connected + 1) {
      setConnected(n)
      if (n >= total) {
        playWin()
        speak(`${numberWord(total)}! ${friendSay(index)}`)
      } else {
        playCount(n)
        speak(numberWord(n))
      }
    } else {
      setWrong(true)
      playNudge()
      window.setTimeout(() => setWrong(false), 450)
    }
  }

  const linePoints = centers
    .slice(0, connected)
    .map((c) => `${c.x},${c.y}`)
    .join(' ')

  return (
    <GameShell title="חיבור נקודות" emoji="✏️" onExit={onExit}>
      <div className="color-screen">
        <Stepper
          label={`${friendName(index)} · ${index + 1}`}
          onPrev={() => goTo((index + FRIENDS.length - 1) % FRIENDS.length)}
          onNext={() => goTo((index + 1) % FRIENDS.length)}
        />

        <div className="dots-stage">
          <div
            className={`dots-board ${wrong ? 'is-wrong' : ''} ${done ? 'is-done' : ''}`}
            ref={boardRef}
            style={{ width: nat.w * s, height: nat.h * s }}
          >
            <div
              className="dots-friend"
              ref={friendRef}
              style={{ width: nat.w, transform: `scale(${s})`, transformOrigin: 'top left', textAlign: 'center' }}
            >
              <FriendArt kind={kind} litUnits={connected} showHalo={false} />
            </div>

            <div className={`dots-overlay ${done ? 'is-hidden' : ''}`}>
              <svg className="dots-svg" width={nat.w * s} height={nat.h * s} aria-hidden="true">
                {connected > 1 && <polyline className="dots-line" points={linePoints} />}
              </svg>

              {centers.map((c, i) => {
                const n = i + 1
                const state = n <= connected ? 'is-done' : n === connected + 1 ? 'is-next' : 'is-pending'
                return (
                  <button
                    key={i}
                    type="button"
                    className={`dot ${state}`}
                    style={{ left: c.x, top: c.y }}
                    onClick={() => tapDot(n)}
                    aria-label={`נקודה ${n}`}
                  >
                    {n <= connected ? '' : n}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="🔄" label="מתחילים מחדש" onClick={() => goTo(index)} />
          <IconButton icon="🎲" label="חבר חדש" onClick={() => goTo(randInt(0, FRIENDS.length - 1))} />
        </div>
      </div>
    </GameShell>
  )
}
