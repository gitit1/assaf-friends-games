import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import IconButton from '../components/IconButton'
import Stepper from '../components/Stepper'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playPop, playTap, unlockAudio } from '../audio'
import { FRIENDS, friendName } from '../friends'
import { randInt } from './util'

// Free-draw board: draw with your finger in any colour + brush size, and stamp
// friends (= numbers) or fun stickers anywhere on the page. No timer, no rules.
const COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#111827']
const BRUSHES = [5, 12, 22]
const EMOJI = ['⭐', '❤️', '🌈', '🌟', '🎈', '🌸']

type Stamp = { id: number; x: number; y: number; friend?: number; emoji?: string }

export default function DrawBoard({ onExit }: GameProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const idRef = useRef(0)

  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(BRUSHES[1])
  const [stamp, setStamp] = useState<'friend' | string | null>(null) // null = pen
  const [stampFriend, setStampFriend] = useState(0)
  const [stamps, setStamps] = useState<Stamp[]>([])

  // size the canvas to the board (crisp on retina)
  useEffect(() => {
    const board = boardRef.current
    const canvas = canvasRef.current
    if (!board || !canvas) return
    const setup = () => {
      const r = board.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      canvas.style.width = `${r.width}px`
      canvas.style.height = `${r.height}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
    }
    setup()
    const ro = new ResizeObserver(setup)
    ro.observe(board)
    return () => ro.disconnect()
  }, [])

  function pos(e: React.PointerEvent) {
    const r = boardRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function stroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = ctxRef.current
    if (!ctx) return
    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  function down(e: React.PointerEvent) {
    unlockAudio()
    boardRef.current?.setPointerCapture?.(e.pointerId)
    const p = pos(e)
    if (stamp) {
      const s: Stamp = { id: idRef.current++, x: p.x, y: p.y, ...(stamp === 'friend' ? { friend: stampFriend } : { emoji: stamp }) }
      setStamps((prev) => [...prev, s])
      playPop()
      return
    }
    drawing.current = true
    last.current = p
    stroke(p, { x: p.x + 0.01, y: p.y }) // a dot on a single tap
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current || !last.current) return
    const p = pos(e)
    stroke(last.current, p)
    last.current = p
  }
  function up() {
    drawing.current = false
    last.current = null
  }

  function clearAll() {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (ctx && canvas) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    setStamps([])
    playTap()
  }

  function pickColor(c: string) {
    setColor(c)
    setStamp(null)
    playTap()
  }
  function pickBrush(b: number) {
    setSize(b)
    setStamp(null)
    playTap()
  }

  return (
    <GameShell title="ציור חופשי" emoji="🖍️" onExit={onExit}>
      <div className="draw-screen">
        <div className="draw-palette">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-swatch ${!stamp && color === c ? 'is-active' : ''}`}
              style={{ background: c }}
              onClick={() => pickColor(c)}
              aria-label="צבע"
            />
          ))}
          {BRUSHES.map((b, i) => (
            <button
              key={b}
              className={`brush-btn ${!stamp && size === b ? 'is-active' : ''}`}
              onClick={() => pickBrush(b)}
              aria-label={`עובי ${i + 1}`}
            >
              <span className="brush-dot" style={{ width: 6 + i * 7, height: 6 + i * 7 }} />
            </button>
          ))}
        </div>

        <div className="draw-stampbar">
          <Stepper
            label={
              <button
                className={`stamp-friend ${stamp === 'friend' ? 'is-active' : ''}`}
                onClick={() => {
                  setStamp('friend')
                  playTap()
                }}
                aria-label={`מדבקת ${friendName(stampFriend)}`}
              >
                <Friend index={stampFriend} scale={52 / friendMaxDim(stampFriend)} showNumber={false} />
              </button>
            }
            onPrev={() => setStampFriend((p) => (p + FRIENDS.length - 1) % FRIENDS.length)}
            onNext={() => setStampFriend((p) => (p + 1) % FRIENDS.length)}
          />
          <div className="emoji-stamps">
            {EMOJI.map((em) => (
              <button
                key={em}
                className={`emoji-stamp ${stamp === em ? 'is-active' : ''}`}
                onClick={() => {
                  setStamp(em)
                  playTap()
                }}
                aria-label="מדבקה"
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div
          className="draw-board"
          ref={boardRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <canvas ref={canvasRef} className="draw-canvas" />
          <div className="draw-stamps" aria-hidden="true">
            {stamps.map((s) => (
              <span key={s.id} className={`draw-stamp ${s.emoji ? 'draw-stamp-emoji' : ''}`} style={{ left: s.x, top: s.y }}>
                {s.emoji ?? <Friend index={s.friend!} scale={66 / friendMaxDim(s.friend!)} showNumber={false} />}
              </span>
            ))}
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="🧽" label="מנקים הכול" onClick={clearAll} />
          <IconButton icon="🎲" label="חבר אקראי למדבקה" onClick={() => { setStampFriend(randInt(0, FRIENDS.length - 1)); setStamp('friend'); playTap() }} />
        </div>
      </div>
    </GameShell>
  )
}
