import { useEffect, useMemo, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import { friendKindForIndex, friendMaxDim, friendPartCount } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playRise, playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendColor, friendName, friendSay } from '../friends'
import { numberWord, randInt } from './util'
import Confetti from '../components/Confetti'
import { useT } from '../i18n'

// "Draw the number" — the friend's number, drawn big from a 5×7 block font.
// Drag a finger to fill the blocks in (any path — no strict tracing, so no
// failure). When it's all filled it lights up and the friend says the number.
const FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
}

export default function DrawNumber({ onExit }: GameProps) {
  const { t } = useT()
  const [index, setIndex] = useState(() => randInt(0, FRIENDS.length - 1))
  const [filled, setFilled] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)
  const painting = useRef(false)
  // filledRef mirrors `filled` synchronously so we can pitch the climbing note
  // off the true count without a state-updater side effect; lastNote throttles it
  const filledRef = useRef<Set<number>>(new Set())
  const lastNote = useRef(0)

  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 360,
    h: typeof window !== 'undefined' ? window.innerHeight : 700,
  }))
  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const numStr = String(index + 1)
  // each digit → 7×5 grid of global cell indices (-1 = blank)
  const digits = useMemo(() => {
    let g = 0
    return numStr.split('').map((d) => FONT[d].map((row) => row.split('').map((ch) => (ch === '1' ? g++ : -1))))
  }, [numStr])
  const total = useMemo(() => digits.flat(2).filter((i) => i >= 0).length, [digits])

  const cols = numStr.length * 5 + (numStr.length - 1) // include 1-cell gaps between digits
  const cell = Math.max(20, Math.min(Math.floor((win.w * 0.9) / cols), Math.floor((win.h * 0.34) / 7), 54))
  const color = friendColor(index)

  useEffect(() => {
    if (!done && total > 0 && filled.size >= total) {
      setDone(true)
      playWin()
      speak(`${numberWord(index + 1)}! ${friendSay(index)}`)
    }
  }, [filled, total, done, index])

  function goTo(next: number) {
    setIndex(next)
    filledRef.current = new Set()
    setFilled(new Set())
    setDone(false)
    lastNote.current = 0
    playTap()
  }
  function clearAll() {
    filledRef.current = new Set()
    setFilled(new Set())
    setDone(false)
    lastNote.current = 0
    playTap()
  }

  function fillAt(x: number, y: number) {
    const el = document.elementFromPoint(x, y) as HTMLElement | null
    const ds = el?.dataset?.cell
    if (ds == null) return
    const i = Number(ds)
    if (filledRef.current.has(i)) return
    filledRef.current.add(i)
    const size = filledRef.current.size
    setFilled(new Set(filledRef.current))
    // a climbing note per block → drawing the number sounds like a rising tune.
    // throttle so a fast drag stays a pleasant arpeggio rather than a buzz.
    const t = typeof performance !== 'undefined' ? performance.now() : 0
    if (t - lastNote.current > 70) {
      playRise(size - 1)
      lastNote.current = t
    }
  }
  function down(e: React.PointerEvent) {
    unlockAudio()
    painting.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    fillAt(e.clientX, e.clientY)
  }
  function move(e: React.PointerEvent) {
    if (painting.current) fillAt(e.clientX, e.clientY)
  }
  function up() {
    painting.current = false
  }

  return (
    <GameShell title={t('game.drawnum')} emoji="✍️" onExit={onExit}>
      <Confetti active={done} />
      <div className="color-screen">
        <Stepper
          label={`${friendName(index)} · ${index + 1}`}
          onPrev={() => goTo((index + FRIENDS.length - 1) % FRIENDS.length)}
          onNext={() => goTo((index + 1) % FRIENDS.length)}
        />

        <div className="dn-stage">
          <span className={`dn-friend ${done ? 'is-done' : ''}`}>
            <Friend
              index={index}
              scale={72 / friendMaxDim(index)}
              showNumber={false}
              bouncing={done}
              litUnits={done ? undefined : Math.round((total ? filled.size / total : 0) * friendPartCount(friendKindForIndex(index)))}
            />
          </span>

          <div className={`dn-pad ${done ? 'is-done' : ''}`} dir="ltr" style={{ gap: cell }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            {digits.map((digit, di) => (
              <div key={di} className="dn-digit" style={{ gridTemplateColumns: `repeat(5, ${cell}px)`, gridAutoRows: `${cell}px` }}>
                {digit.flatMap((row, ri) =>
                  row.map((idx, ci) =>
                    idx >= 0 ? (
                      <span
                        key={`${ri}-${ci}`}
                        data-cell={idx}
                        className={`dn-cell on ${filled.has(idx) ? 'is-filled' : ''}`}
                        style={filled.has(idx) ? { background: color } : undefined}
                      />
                    ) : (
                      <span key={`${ri}-${ci}`} className="dn-cell blank" />
                    ),
                  ),
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="🧽" label={t('dots.restart')} onClick={clearAll} />
          <IconButton icon="🎲" label={t('pv.new')} onClick={() => goTo(randInt(0, FRIENDS.length - 1))} />
        </div>
      </div>
    </GameShell>
  )
}
