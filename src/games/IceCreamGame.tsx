import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { FRIEND_NATURAL, friendKindForIndex } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playSuccess, playMunch, playNudge, playTap, unlockAudio } from '../audio'
import { randFriendIndex, friendCount } from '../level'
import { randInt } from './util'
import { useT } from '../i18n'

// Ice-cream stand: Assaf scoops "flavours" (which are really colours) onto a cone
// and serves them to a friend. Two modes — OPEN (free play) and CLOSED, a real
// little game: a QUEUE of friends comes to the stand, each ORDERS some scoops,
// and Assaf builds the matching cone and serves. No harsh fail — a wrong cone
// just gets a gentle nudge so he can fix it.
const FLAVORS = [
  { key: 'vanilla', color: '#f3e4ba' },
  { key: 'choc', color: '#7a5234' },
  { key: 'straw', color: '#f7a8c4' },
  { key: 'mint', color: '#9ee8b6' },
  { key: 'blue', color: '#8fc2f0' },
  { key: 'lemon', color: '#f6df5e' },
]
const MAX_SCOOPS = 4

function makeOrder() {
  return Array.from({ length: randInt(2, 3) }, () => randInt(0, FLAVORS.length - 1))
}
function nextFriend(prev: number) {
  let n = randFriendIndex()
  if (friendCount() > 1) while (n === prev) n = randFriendIndex()
  return n
}
function sameMulti(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.every((v, i) => v === sb[i])
}
const scaleFor = (idx: number, h: number) => h / FRIEND_NATURAL[friendKindForIndex(idx)].h

export default function IceCreamGame({ onExit, friend }: GameProps) {
  const { t } = useT()
  const [mode, setMode] = useState<'open' | 'closed'>('closed')
  const [scoops, setScoops] = useState<number[]>([])
  const [customer, setCustomer] = useState(() => friend ?? randFriendIndex())
  const [order, setOrder] = useState<number[]>(() => makeOrder())
  const [queue, setQueue] = useState<number[]>([])
  const [happy, setHappy] = useState(false)
  const [served, setServed] = useState(0)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => {
    // initial waiting line
    const q: number[] = []
    let last = customer
    for (let i = 0; i < 3; i++) {
      last = nextFriend(last)
      q.push(last)
    }
    setQueue(q)
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addScoop(i: number) {
    if (happy || scoops.length >= MAX_SCOOPS) return
    unlockAudio()
    playPop()
    setScoops((s) => [...s, i])
  }
  function undo() {
    if (happy || !scoops.length) return
    playTap()
    setScoops((s) => s.slice(0, -1))
  }

  function nextCustomer() {
    setQueue((q) => {
      const [next, ...rest] = q
      const nc = next ?? nextFriend(customer)
      setCustomer(nc)
      setOrder(makeOrder())
      const tailFrom = rest.length ? rest[rest.length - 1] : nc
      return [...rest, nextFriend(tailFrom)]
    })
  }

  function serve() {
    if (happy || !scoops.length) return
    unlockAudio()
    if (mode === 'closed' && !sameMulti(scoops, order)) {
      playNudge() // gentle — let him fix the cone
      return
    }
    playSuccess()
    setHappy(true)
    setServed((n) => n + 1)
    timers.current.push(window.setTimeout(() => playMunch(), 350))
    timers.current.push(
      window.setTimeout(() => {
        setHappy(false)
        setScoops([])
        if (mode === 'closed') nextCustomer()
        else setCustomer((c) => nextFriend(c))
      }, 1500),
    )
  }

  function switchMode(m: 'open' | 'closed') {
    if (m === mode) return
    playTap()
    clearTimers()
    setMode(m)
    setScoops([])
    setHappy(false)
    if (m === 'closed') setOrder(makeOrder())
  }

  return (
    <GameShell title={t('game.icecream')} emoji="🍦" onExit={onExit}>
      <div className="ice-screen">
        {/* mode toggle */}
        <div className="ice-modes">
          <button className={`ice-mode-btn ${mode === 'open' ? 'on' : ''}`} onClick={() => switchMode('open')}>
            🍨 {t('ice.open')}
          </button>
          <button className={`ice-mode-btn ${mode === 'closed' ? 'on' : ''}`} onClick={() => switchMode('closed')}>
            📋 {t('ice.closed')}
          </button>
          <span className="ice-score" aria-hidden="true">
            🍦 {served}
          </span>
        </div>

        {/* the customer + their order (closed) or a free-play prompt (open) */}
        <div className="ice-top">
          {mode === 'closed' && (
            <div className="ice-queue" aria-hidden="true">
              {queue.map((q, i) => (
                <span key={`${q}-${i}`} className="ice-q">
                  <Friend index={q} scale={scaleFor(q, 46)} />
                </span>
              ))}
            </div>
          )}
          <div className="ice-counter-row">
            <div className={`ice-customer ${happy ? 'happy' : ''}`}>
              <Friend index={customer} scale={scaleFor(customer, 96)} lively bouncing={happy} />
            </div>
            <div className="ice-bubble">
              {happy ? (
                <span className="ice-yum">😋</span>
              ) : mode === 'closed' ? (
                <span className="ice-order">
                  {order.map((f, i) => (
                    <span key={i} className="ice-dot" style={{ background: FLAVORS[f].color }} />
                  ))}
                </span>
              ) : (
                <span className="ice-free">{t('ice.free')}</span>
              )}
            </div>
          </div>
        </div>

        {/* the cone being built */}
        <div className="ice-cone">
          <div className="ice-scoops">
            {scoops
              .map((f, i) => ({ f, i }))
              .reverse()
              .map(({ f, i }) => (
                <span key={i} className="ice-scoop" style={{ background: FLAVORS[f].color }} />
              ))}
          </div>
          <span className="ice-cone-base" aria-hidden="true" />
        </div>

        {/* the stand: tap a tub to scoop that flavour (colour) */}
        <div className="ice-stand">
          {FLAVORS.map((fl, i) => (
            <button key={fl.key} className="ice-tub" onClick={() => addScoop(i)} aria-label={fl.key}>
              <span className="ice-tub-scoop" style={{ background: fl.color }} />
            </button>
          ))}
        </div>

        {/* actions */}
        <div className="ice-actions">
          <button className="dance-ctrl" onClick={undo} disabled={happy || !scoops.length} aria-label={t('ice.undo')}>
            <span aria-hidden="true">↩️</span>
          </button>
          <button className="big-button ice-serve" onClick={serve} disabled={happy || !scoops.length}>
            {t('ice.serve')} 🍦
          </button>
        </div>
      </div>
    </GameShell>
  )
}
