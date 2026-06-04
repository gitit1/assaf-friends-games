import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import type { GameProps } from './registry'
import { playPop, playWin, unlockAudio } from '../audio'
import { speakNumber } from '../voice'
import { useT } from '../i18n'
import Confetti from '../components/Confetti'

// Air hockey: drag your paddle (bottom) to knock the puck into the TOP goal.
// There's no opponent and the bottom wall bounces the puck back — so there's no
// way to lose, only goals to score (counted out loud). Pure physics fun.
export default function HockeyGame({ onExit }: GameProps) {
  const { t } = useT()
  const [score, setScore] = useState(0)
  const [party, setParty] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const puckRef = useRef<HTMLDivElement>(null)
  const paddleRef = useRef<HTMLDivElement>(null)
  const scoreRef = useRef(0)

  // mutable world state (kept in refs so the rAF loop never reads stale values)
  const size = useRef({ w: 320, h: 480 })
  const puck = useRef({ x: 160, y: 300, vx: 2, vy: -3 })
  const paddle = useRef({ x: 160, y: 420, px: 160, py: 420 })

  useEffect(() => {
    const table = tableRef.current
    if (!table) return
    const measure = () => {
      const r = table.getBoundingClientRect()
      size.current = { w: r.width, h: r.height }
      paddle.current.y = r.height - r.height * 0.16
      paddle.current.py = paddle.current.y
    }
    measure()
    window.addEventListener('resize', measure)

    let raf = 0
    const step = () => {
      const { w, h } = size.current
      const pr = Math.max(16, w * 0.085) // puck radius
      const dr = Math.max(22, w * 0.12) // paddle radius
      const goalW = w * 0.42
      const goalL = (w - goalW) / 2
      const goalR = goalL + goalW
      const p = puck.current

      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.992
      p.vy *= 0.992
      // keep it gently alive
      const sp = Math.hypot(p.vx, p.vy)
      if (sp < 0.5) {
        const a = Math.atan2(p.vy || -1, p.vx || 0)
        p.vx = Math.cos(a) * 0.5
        p.vy = Math.sin(a) * 0.5
      }
      // cap speed
      const max = w * 0.06
      if (sp > max) {
        p.vx = (p.vx / sp) * max
        p.vy = (p.vy / sp) * max
      }

      // side + bottom walls bounce
      if (p.x - pr < 0) {
        p.x = pr
        p.vx = Math.abs(p.vx)
      }
      if (p.x + pr > w) {
        p.x = w - pr
        p.vx = -Math.abs(p.vx)
      }
      if (p.y + pr > h) {
        p.y = h - pr
        p.vy = -Math.abs(p.vy)
      }
      // top wall: goal in the middle, else bounce
      if (p.y - pr < 0) {
        if (p.x > goalL && p.x < goalR) {
          scoreRef.current += 1
          const n = scoreRef.current
          setScore(n)
          playWin()
          speakNumber(n)
          setParty(true)
          window.setTimeout(() => setParty(false), 2200)
          // respawn in the middle, drifting down
          p.x = w / 2
          p.y = h * 0.55
          p.vx = (Math.random() - 0.5) * 4
          p.vy = 2.5
        } else {
          p.y = pr
          p.vy = Math.abs(p.vy)
        }
      }

      // paddle collision — push the puck away from the paddle centre
      const pad = paddle.current
      const dx = p.x - pad.x
      const dy = p.y - pad.y
      const dist = Math.hypot(dx, dy)
      const minD = pr + dr
      if (dist < minD && dist > 0.01) {
        const nx = dx / dist
        const ny = dy / dist
        p.x = pad.x + nx * minD
        p.y = pad.y + ny * minD
        const hit = Math.max(w * 0.02, Math.hypot(pad.x - pad.px, pad.y - pad.py))
        const boost = Math.min(w * 0.06, Math.max(w * 0.03, hit))
        p.vx = nx * boost
        p.vy = ny * boost
        playPop()
      }
      pad.px = pad.x
      pad.py = pad.y

      if (puckRef.current) puckRef.current.style.transform = `translate(${p.x - pr}px, ${p.y - pr}px)`
      if (puckRef.current) {
        puckRef.current.style.width = `${pr * 2}px`
        puckRef.current.style.height = `${pr * 2}px`
      }
      if (paddleRef.current) {
        paddleRef.current.style.transform = `translate(${pad.x - dr}px, ${pad.y - dr}px)`
        paddleRef.current.style.width = `${dr * 2}px`
        paddleRef.current.style.height = `${dr * 2}px`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [])

  function onMove(e: React.PointerEvent) {
    unlockAudio()
    const table = tableRef.current
    if (!table) return
    const r = table.getBoundingClientRect()
    const { w, h } = size.current
    const dr = Math.max(22, w * 0.12)
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    // the paddle stays in the lower half of the table
    paddle.current.x = Math.min(w - dr, Math.max(dr, x))
    paddle.current.y = Math.min(h - dr, Math.max(h * 0.5, y))
  }

  return (
    <GameShell title={t('game.hockey')} emoji="🏒" onExit={onExit}>
      <Confetti active={party} />
      <div className="sport-screen">
        <div className="sport-score" aria-live="polite">
          <span aria-hidden="true">🏒</span> {score}
        </div>

        <div
          className="hockey-table"
          ref={tableRef}
          onPointerDown={onMove}
          onPointerMove={onMove}
          style={{ touchAction: 'none' }}
        >
          <span className="hockey-goal" aria-hidden="true" />
          <span className="hockey-mid" aria-hidden="true" />
          <span className="hockey-circle" aria-hidden="true" />
          <div className="hockey-puck" ref={puckRef} aria-hidden="true" />
          <div className="hockey-paddle" ref={paddleRef} aria-hidden="true" />
        </div>

        <p className="sport-hint">{t('hockey.hint')}</p>
      </div>
    </GameShell>
  )
}
