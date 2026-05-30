import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendColor, friendName } from '../friends'
import { numberWord } from './util'

type Op = '+' | '-' | '×'

function compute(a: number, op: Op, b: number) {
  if (op === '+') return a + b
  if (op === '-') return a - b
  return a * b
}

// Layout switches to a side-by-side split on wider screens (e.g. iPad).
function useIsWide() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 720px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 720px)')
    const onChange = () => setWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return wide
}

// Numbers 11–20 with no friend yet are shown as a pile of smiley balloons.
function BalloonPile({ count }: { count: number }) {
  return (
    <div className="calc-balloons">
      {Array.from({ length: count }).map((_, i) => (
        <span className="calc-balloon" style={{ '--bc': friendColor(i % 10) } as React.CSSProperties} key={i}>
          <i className="be l" />
          <i className="be r" />
          <span className="bm" />
        </span>
      ))}
    </div>
  )
}

// What the friends panel shows for the number currently on the display.
function NumberView({ value, scale }: { value: number; scale: number }) {
  if (value >= 1 && value <= 10) return <Friend index={value - 1} scale={scale} />
  if (value > 10 && value <= 20) return <BalloonPile count={value} />
  return <span className="calc-bignum">{value}</span>
}

export default function CalcFriends({ onExit }: GameProps) {
  const wide = useIsWide()
  const [display, setDisplay] = useState('0')
  const [acc, setAcc] = useState<number | null>(null)
  const [op, setOp] = useState<Op | null>(null)
  const [fresh, setFresh] = useState(true)

  const value = Number(display)

  function digit(d: string) {
    unlockAudio()
    playTap()
    if (fresh) {
      setDisplay(d)
      setFresh(false)
      return
    }
    setDisplay((p) => (p === '0' ? d : p.replace('-', '').length >= 3 ? p : p + d))
  }

  function chooseOp(next: Op) {
    unlockAudio()
    playTap()
    const cur = Number(display)
    if (acc !== null && op !== null && !fresh) {
      const r = compute(acc, op, cur)
      setAcc(r)
      setDisplay(String(r))
    } else if (acc === null) {
      setAcc(cur)
    }
    setOp(next)
    setFresh(true)
  }

  function equals() {
    if (op === null || acc === null || fresh) return
    unlockAudio()
    const r = compute(acc, op, Number(display))
    setDisplay(String(r))
    setAcc(null)
    setOp(null)
    setFresh(true)
    playWin()
    if (r >= 1 && r <= 10) speak(`${numberWord(r)}. ${friendName(r - 1)}`)
  }

  function clear() {
    playTap()
    setDisplay('0')
    setAcc(null)
    setOp(null)
    setFresh(true)
  }

  function backspace() {
    if (fresh) return
    playTap()
    setDisplay((p) => (p.length > 1 ? p.slice(0, -1) : '0'))
  }

  const keys: { label: string; kind: string; onClick: () => void }[] = [
    { label: '7', kind: 'num', onClick: () => digit('7') },
    { label: '8', kind: 'num', onClick: () => digit('8') },
    { label: '9', kind: 'num', onClick: () => digit('9') },
    { label: '✖️', kind: 'op', onClick: () => chooseOp('×') },
    { label: '4', kind: 'num', onClick: () => digit('4') },
    { label: '5', kind: 'num', onClick: () => digit('5') },
    { label: '6', kind: 'num', onClick: () => digit('6') },
    { label: '➖', kind: 'op', onClick: () => chooseOp('-') },
    { label: '1', kind: 'num', onClick: () => digit('1') },
    { label: '2', kind: 'num', onClick: () => digit('2') },
    { label: '3', kind: 'num', onClick: () => digit('3') },
    { label: '➕', kind: 'op', onClick: () => chooseOp('+') },
    { label: 'C', kind: 'clear', onClick: clear },
    { label: '0', kind: 'num', onClick: () => digit('0') },
    { label: '⌫', kind: 'back', onClick: backspace },
    { label: '=', kind: 'eq', onClick: equals },
  ]

  return (
    <GameShell title="מחשבון" emoji="🧮" onExit={onExit}>
      <div className={`calc-layout ${wide ? 'is-wide' : ''}`}>
        <div className="calc-panel">
          <NumberView value={value} scale={wide ? 0.85 : 0.5} />
        </div>

        <div className="calc-pad">
          <div className="calc-display">
            <span className="calc-history">{acc !== null && op ? `${acc} ${op}` : ''}</span>
            <span className="calc-current">{display}</span>
          </div>
          <div className="calc-grid">
            {keys.map((k) => (
              <button key={k.label} className={`calc-key calc-key-${k.kind}`} onClick={k.onClick}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameShell>
  )
}
