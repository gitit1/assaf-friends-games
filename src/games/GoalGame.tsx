import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import type { GameProps } from './registry'
import { playNudge, playPop, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { randInt } from './util'
import { useT } from '../i18n'
import Confetti from '../components/Confetti'

// Soccer — a REAL kick: flick with your finger toward the goal and the ball
// shoots with that strength + direction. A friend stands in goal as the keeper,
// sliding side to side; beat the keeper to score (counted aloud). Miss or a save
// just resets the ball — no fail. The number is the kicker; a real ball is kicked.
export default function GoalGame({ onExit }: GameProps) {
  const { t } = useT()
  const [score, setScore] = useState(0)
  const [party, setParty] = useState(false)
  const [kicker, setKicker] = useState(() => randInt(0, 9))
  const [keeper, setKeeper] = useState(() => randInt(0, 9))
  const fieldRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const keeperRef = useRef<HTMLSpanElement>(null)

  const size = useRef({ w: 340, h: 480 })
  const ball = useRef({ x: 170, y: 400, vx: 0, vy: 0, r: 22, live: false })
  const keep = useRef({ x: 170, phase: 0 })
  const done = useRef(false)
  const scoreRef = useRef(0)
  const samples = useRef<{ x: number; y: number; t: number }[]>([])
  const raf = useRef(0)

  const goalHalf = () => size.current.w * 0.36
  const goalY = () => size.current.h * 0.15
  const keeperR = () => Math.max(26, size.current.w * 0.11)

  const drawBall = () => {
    const b = ball.current
    const el = ballRef.current
    if (!el) return
    el.style.width = `${b.r * 2}px`
    el.style.height = `${b.r * 2}px`
    el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`
  }
  const drawKeeper = () => {
    const el = keeperRef.current
    if (el) el.style.transform = `translate(${keep.current.x - keeperR()}px, ${goalY() - keeperR()}px)`
  }
  const rest = () => {
    const { w, h } = size.current
    const b = ball.current
    b.r = Math.max(16, w * 0.06)
    b.x = w * 0.5
    b.y = h * 0.82
    b.vx = 0
    b.vy = 0
    b.live = false
    done.current = false
    drawBall()
  }

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    const measure = () => {
      const r = field.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
      if (!ball.current.live) rest()
      drawKeeper()
    }
    measure()
    window.addEventListener('resize', measure)
    // the keeper always patrols the goal, even before the first kick
    const patrol = () => {
      const k = keep.current
      k.phase += 0.028
      k.x = size.current.w / 2 + Math.sin(k.phase) * (goalHalf() - keeperR() * 0.7)
      drawKeeper()
      if (!ball.current.live) raf.current = requestAnimationFrame(patrol)
    }
    raf.current = requestAnimationFrame(patrol)
    return () => {
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loop() {
    const b = ball.current
    const { w, h } = size.current
    // keeper keeps patrolling during the shot
    const k = keep.current
    k.phase += 0.028
    k.x = w / 2 + Math.sin(k.phase) * (goalHalf() - keeperR() * 0.7)
    drawKeeper()

    // aim-assist: curve the ball toward the OPEN side of the goal (kid-friendly)
    const openX = k.x < w / 2 ? w / 2 + goalHalf() * 0.5 : w / 2 - goalHalf() * 0.5
    b.vx += (openX - b.x) * 0.004

    b.x += b.vx
    b.y += b.vy
    b.vx *= 0.994
    b.vy *= 0.994

    if (b.x < b.r) {
      b.x = b.r
      b.vx = Math.abs(b.vx)
    }
    if (b.x > w - b.r) {
      b.x = w - b.r
      b.vx = -Math.abs(b.vx)
    }

    // reaching the goal line (moving up)
    if (!done.current && b.vy < 0 && b.y - b.r <= goalY()) {
      const inMouth = Math.abs(b.x - w / 2) < goalHalf()
      const saved = Math.abs(b.x - k.x) < w * 0.06 + b.r // small block zone — easy to beat
      if (inMouth && !saved) {
        done.current = true
        scoreRef.current += 1
        setScore(scoreRef.current)
        playWin()
        speakNumber(scoreRef.current)
        setParty(true)
        window.setTimeout(() => setParty(false), 2200)
        // let it sail into the net, then reset
      } else {
        // a save or a hit off the post → bounce back down
        b.y = goalY() + b.r
        b.vy = Math.abs(b.vy) * 0.6
        if (inMouth) playNudge()
      }
    }

    drawBall()

    const speed = Math.hypot(b.vx, b.vy)
    const off = b.y < -160 || b.y > h + 140
    const stopped = !done.current && speed < 0.6
    if (off || (done.current && b.y < -40) || stopped) {
      rest()
      setKicker(randInt(0, 9))
      setKeeper(randInt(0, 9))
      // hand back to the idle keeper-patrol loop
      raf.current = requestAnimationFrame(function patrol() {
        const kk = keep.current
        kk.phase += 0.028
        kk.x = size.current.w / 2 + Math.sin(kk.phase) * (goalHalf() - keeperR() * 0.7)
        drawKeeper()
        if (!ball.current.live) raf.current = requestAnimationFrame(patrol)
      })
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
    const GAIN = 14
    let vx = ((z.x - a.x) / dt) * GAIN
    let vy = ((z.y - a.y) / dt) * GAIN
    const { w, h } = size.current
    const b = ball.current
    const cap = w * 0.2
    // always kick toward the goal with enough power to reach it — so even a weak
    // or sideways flick gets there. A harder flick still shoots faster.
    const reach = (b.y - h * 0.15) / 90
    vy = -Math.max(Math.abs(vy), reach)
    vy = Math.max(-cap, vy)
    vx = Math.max(-cap, Math.min(cap, vx))
    b.vx = vx
    b.vy = vy
    b.live = true
    playPop()
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(loop)
  }

  return (
    <GameShell title={t('game.goal')} emoji="⚽" onExit={onExit}>
      <Confetti active={party} />
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          <span aria-hidden="true">⚽</span> {score}
        </div>

        <div
          className="phys-court goal-field2"
          ref={fieldRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: 'none' }}
        >
          <div className="goal-frame" aria-hidden="true">
            <span className="goal-post l" />
            <span className="goal-post r" />
            <span className="goal-bar" />
            <span className="goal-mesh" />
          </div>
          <span className="phys-keeper" ref={keeperRef} aria-hidden="true">
            <Friend index={keeper} scale={0.4} showNumber={false} />
          </span>
          <span className="phys-player" aria-hidden="true">
            <Friend index={kicker} scale={0.42} showNumber />
          </span>
          <div className="phys-ball goal-real" ref={ballRef} aria-hidden="true" />
        </div>

        <p className="sport-hint">{t('goal.hint')}</p>
      </div>
    </GameShell>
  )
}
