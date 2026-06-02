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
import { MORE_COLORS } from './palette'

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
  const stampsRef = useRef<Stamp[]>([])
  const dragStamp = useRef<{ id: number; moved: boolean; sx: number; sy: number } | null>(null)

  const [color, setColor] = useState(COLORS[0])
  const [size, setSize] = useState(BRUSHES[1])
  const [stamp, setStamp] = useState<'friend' | string | null>(null) // null = pen
  const [stampFriend, setStampFriend] = useState(0)
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [more, setMore] = useState(false)
  stampsRef.current = stamps // latest stamps, for the pointer handlers below

  // undo / redo — a list of {canvas image, stamps} snapshots with a cursor
  type Snap = { img: string | null; stamps: Stamp[] }
  const hist = useRef<Snap[]>([{ img: null, stamps: [] }])
  const cursor = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  function flags() {
    setCanUndo(cursor.current > 0)
    setCanRedo(cursor.current < hist.current.length - 1)
  }
  function commit(nextStamps: Stamp[]) {
    const img = canvasRef.current?.toDataURL() ?? null
    hist.current = hist.current.slice(0, cursor.current + 1)
    hist.current.push({ img, stamps: nextStamps })
    if (hist.current.length > 30) hist.current.shift()
    cursor.current = hist.current.length - 1
    flags()
  }
  function restoreCanvas(dataUrl: string | null) {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (dataUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      img.src = dataUrl
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }
  function restore(i: number) {
    const snap = hist.current[i]
    setStamps(snap.stamps)
    restoreCanvas(snap.img)
  }
  function undo() {
    if (cursor.current <= 0) return
    cursor.current -= 1
    restore(cursor.current)
    flags()
    playTap()
  }
  function redo() {
    if (cursor.current >= hist.current.length - 1) return
    cursor.current += 1
    restore(cursor.current)
    flags()
    playTap()
  }

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
      const next = [...stamps, s]
      setStamps(next)
      commit(next)
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
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    commit(stamps) // a completed stroke
  }

  // a placed sticker can be dragged to move it, or tapped to remove it (↺ undoes)
  function stampDown(e: React.PointerEvent, s: Stamp) {
    e.stopPropagation()
    unlockAudio()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    dragStamp.current = { id: s.id, moved: false, sx: e.clientX, sy: e.clientY }
  }
  function stampMove(e: React.PointerEvent) {
    const d = dragStamp.current
    if (!d) return
    e.stopPropagation()
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return
    d.moved = true
    const p = pos(e)
    setStamps((prev) => prev.map((st) => (st.id === d.id ? { ...st, x: p.x, y: p.y } : st)))
  }
  function stampUp(e: React.PointerEvent) {
    const d = dragStamp.current
    if (!d) return
    e.stopPropagation()
    dragStamp.current = null
    if (d.moved) {
      commit(stampsRef.current)
      playTap()
    } else {
      const next = stampsRef.current.filter((st) => st.id !== d.id)
      setStamps(next)
      commit(next)
      playPop()
    }
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
    commit([])
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
          <button
            className={`color-swatch color-more-btn ${!stamp && !COLORS.includes(color) ? 'is-active' : ''}`}
            style={!stamp && !COLORS.includes(color) ? { background: color } : undefined}
            onClick={() => {
              playTap()
              setMore(true)
            }}
            aria-label="עוד צבעים"
          >
            <span aria-hidden="true">➕</span>
          </button>
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
          <div className="draw-stamps">
            {stamps.map((s) => (
              <span
                key={s.id}
                className={`draw-stamp ${s.emoji ? 'draw-stamp-emoji' : ''}`}
                style={{ left: s.x, top: s.y }}
                onPointerDown={(e) => stampDown(e, s)}
                onPointerMove={stampMove}
                onPointerUp={stampUp}
                onPointerCancel={stampUp}
              >
                {s.emoji ?? <Friend index={s.friend!} scale={66 / friendMaxDim(s.friend!)} showNumber={false} />}
              </span>
            ))}
          </div>
        </div>

        <div className="color-actions">
          <IconButton icon="↺" label="ביטול" onClick={undo} disabled={!canUndo} />
          <IconButton icon="↻" label="חזרה" onClick={redo} disabled={!canRedo} />
          <IconButton icon="🧽" label="מנקים הכול" onClick={clearAll} />
          <IconButton
            icon="🎲"
            label="חבר אקראי למדבקה"
            onClick={() => {
              setStampFriend(randInt(0, FRIENDS.length - 1))
              setStamp('friend')
              playTap()
            }}
          />
        </div>
      </div>

      {more && (
        <div className="color-more-overlay" onClick={() => setMore(false)}>
          <div className="color-more-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setMore(false)} aria-label="סגור">
              ✕
            </button>
            <h3 className="color-more-title">🌈 עוד צבעים</h3>
            <div className="color-more-grid">
              {MORE_COLORS.map((p, i) => (
                <button
                  key={`${p.color}-${i}`}
                  type="button"
                  className={`color-swatch ${!stamp && color === p.color ? 'is-active' : ''}`}
                  style={{ background: p.color }}
                  onClick={() => {
                    pickColor(p.color)
                    setMore(false)
                  }}
                  aria-label={p.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
