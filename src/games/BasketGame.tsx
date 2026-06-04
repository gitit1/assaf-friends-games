import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playPop, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { randInt } from './util'
import { useT } from '../i18n'
import Confetti from '../components/Confetti'

// Basketball — a REAL throw: flick anywhere with your finger, and the ball flies
// with that exact strength + direction (a hard flick = a hard throw) and arcs
// down under gravity. Sink it through the hoop and the basket is counted aloud.
// The number is the player who throws; the ball is a real ball. No fail.
export default function BasketGame({ onExit }: GameProps) {
  const { t } = useT()
  const [score, setScore] = useState(0)
  const [party, setParty] = useState(false)
  const [player, setPlayer] = useState(() => randInt(0, 9))
  const courtRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)

  const size = useRef({ w: 340, h: 520 })
  const ball = useRef({ x: 170, y: 430, vx: 0, vy: 0, r: 24, live: false })
  const scored = useRef(false)
  const scoreRef = useRef(0)
  const samples = useRef<{ x: number; y: number; t: number }[]>([])
  const raf = useRef(0)

  const draw = () => {
    const b = ball.current
    const el = ballRef.current
    if (!el) return
    el.style.width = `${b.r * 2}px`
    el.style.height = `${b.r * 2}px`
    el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`
  }
  const rest = () => {
    const { w, h } = size.current
    const b = ball.current
    b.r = Math.max(18, w * 0.07)
    b.x = w * 0.5
    b.y = h * 0.84
    b.vx = 0
    b.vy = 0
    b.live = false
    scored.current = false
    draw()
  }

  useEffect(() => {
    const court = courtRef.current
    if (!court) return
    const measure = () => {
      const r = court.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
      if (!ball.current.live) rest()
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const GRAV = 0.5
  function loop() {
    const b = ball.current
    const { w, h } = size.current
    const hoopX = w * 0.5
    const py = b.y
    b.vy += GRAV
    // gentle aim-assist: the ball drifts toward the hoop as it flies (kid-friendly)
    b.vx += (hoopX - b.x) * 0.006
    b.vx *= 0.99
    b.x += b.vx
    b.y += b.vy
    // a wide, forgiving rim — score whenever the ball crosses the rim line within
    // it (works even for a hard flick that skips many px per frame)
    const hoopY = h * 0.17
    const rim = Math.max(48, w * 0.2)
    const crossedRim = (py - hoopY) * (b.y - hoopY) <= 0
    if (!scored.current && crossedRim && Math.abs(b.x - hoopX) < rim) {
      scored.current = true
      scoreRef.current += 1
      setScore(scoreRef.current)
      playWin()
      speakNumber(scoreRef.current)
      setParty(true)
      window.setTimeout(() => setParty(false), 2200)
    }
    // side walls bounce gently
    if (b.x < b.r) {
      b.x = b.r
      b.vx = Math.abs(b.vx) * 0.6
    }
    if (b.x > w - b.r) {
      b.x = w - b.r
      b.vx = -Math.abs(b.vx) * 0.6
    }
    draw()
    // gone off the court → put a fresh ball back in the player's hands
    if (b.y > h + 120 || b.y < -160) {
      rest()
      setPlayer(randInt(0, 9))
      return
    }
    raf.current = requestAnimationFrame(loop)
  }

  function onDown(e: React.PointerEvent) {
    if (ball.current.live) return
    unlockAudio()
    samples.current = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]
  }
  function onMove(e: React.PointerEvent) {
    if (ball.current.live || samples.current.length === 0) return
    samples.current.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
    if (samples.current.length > 6) samples.current.shift()
  }
  function onUp() {
    if (ball.current.live) return
    const s = samples.current
    samples.current = []
    if (s.length < 2) return
    const a = s[0]
    const z = s[s.length - 1]
    const dt = Math.max(16, z.t - a.t)
    const GAIN = 13
    let vx = ((z.x - a.x) / dt) * GAIN
    let vy = ((z.y - a.y) / dt) * GAIN
    const { w, h } = size.current
    const b = ball.current
    const cap = w * 0.16
    // ALWAYS shoot upward, with at least enough power to reach the hoop — so even
    // a weak or sideways flick scores. A harder flick still makes a bigger arc.
    const reach = Math.sqrt(2 * GRAV * Math.max(60, b.y - h * 0.17))
    vy = -Math.max(Math.abs(vy), reach * 1.02)
    vy = Math.max(-cap * 2.4, vy)
    vx = Math.max(-cap, Math.min(cap, vx))
    b.vx = vx
    b.vy = vy
    b.live = true
    playPop()
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(loop)
  }

  return (
    <GameShell title={t('game.basket')} emoji="🏀" onExit={onExit}>
      <Confetti active={party} />
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          <span aria-hidden="true">🏀</span> {score}
        </div>

        <div
          className="phys-court basket-court2"
          ref={courtRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: 'none' }}
        >
          <div className="basket-hoop" aria-hidden="true">
            <span className="basket-board" />
            <span className="basket-rim" />
            <span className="basket-net" />
          </div>
          <span className="phys-player" aria-hidden="true">
            <Friend index={player} scale={0.42} showNumber />
          </span>
          <div className="phys-ball basket-real" ref={ballRef} aria-hidden="true" />
        </div>

        <p className="sport-hint">{t('basket.hint')}</p>
      </div>
    </GameShell>
  )
}
