import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playTap, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendColor, friendName } from '../friends'
import { FRIEND_KINDS } from '../components/FriendArt'
import { numberWord } from './util'

const REAL_FRIENDS = FRIEND_KINDS.length // numbers up to here have a real friend

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

// Numbers with no real friend yet → a chunky friend made of connected circles
// (one per digit), with the number on it, that looks like it holds lots inside.
function BigFriend({ value, scale }: { value: number; scale: number }) {
  const digits = String(value).length
  const base = Math.round(72 * scale)
  // Shrink the bumps when there are many digits so big numbers still fit.
  const unit = Math.max(22, digits > 4 ? Math.round((base * 4) / digits) : base)
  return (
    <div className="bigf">
      <div className="bigf-body" style={{ '--u': `${unit}px` } as React.CSSProperties}>
        {Array.from({ length: digits }).map((_, i) => (
          <span className="bigf-circle" style={{ '--bc': friendColor(i % 10) } as React.CSSProperties} key={i} />
        ))}
        <span className="bigf-face">
          <i className="bigf-eye" />
          <i className="bigf-eye" />
          <span className="bigf-mouth" />
        </span>
      </div>
      <span className="bigf-num">{value}</span>
    </div>
  )
}

// What the friends panel shows for the number currently on the display.
function NumberView({ value, scale }: { value: number; scale: number }) {
  if (value >= 1 && value <= REAL_FRIENDS) return <Friend index={value - 1} scale={scale} />
  if (value > REAL_FRIENDS) return <BigFriend value={value} scale={scale} />
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
    setDisplay((p) => (p === '0' ? d : p + d))
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

  // "Back" — always works. If an operator was just chosen, cancel it and return
  // to the previous number; otherwise erase the last digit being typed.
  function back() {
    playTap()
    if (fresh && op !== null) {
      if (acc !== null) setDisplay(String(acc))
      setAcc(null)
      setOp(null)
      setFresh(false)
      return
    }
    setFresh(false)
    setDisplay((p) => {
      const next = p.slice(0, -1)
      return next === '' || next === '-' ? '0' : next
    })
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
    { label: '0', kind: 'num', onClick: () => digit('0') },
    { label: '⌫', kind: 'back', onClick: back },
    { label: 'C', kind: 'clear', onClick: clear },
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
