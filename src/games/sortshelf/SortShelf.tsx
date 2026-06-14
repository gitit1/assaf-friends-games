import { useMemo, useState } from 'react'
import GameShell from '../../components/GameShell'
import type { GameProps } from '../registry'
import { playDice, playNudge, playPop, playSuccess, playTap, playWin, unlockAudio } from '../../audio'
import { LEVELS } from './levels'
import type { GameState, ShelfSlot } from './gameTypes'
import { applyMove, getHint, initState, isLegalMove, shuffleBoard, undo } from './engine'

// ── "מכולת" — a calm shelf-sorting puzzle. NO timer, no countdown, no time loss.
// Pick the front good of a shelf, move it onto another shelf; 3 identical on one
// shelf clear. Win = the whole board is tidied. Challenge is planning + space. ──

const frontId = (s: ShelfSlot) => (s.items.length ? s.items[s.items.length - 1].id : null)

export default function SortShelf({ onExit }: GameProps) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [state, setState] = useState<GameState>(() => initState(LEVELS[0]))
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [hint, setHint] = useState<{ sourceId: string; targetId: string } | null>(null)
  const [comboPop, setComboPop] = useState(0)
  const [paused, setPaused] = useState(false)
  const level = LEVELS[levelIdx]

  // which shelves are legal targets for the currently-picked good (for highlights)
  const legalTargets = useMemo(() => {
    const set = new Set<string>()
    if (state.selected) {
      for (const s of state.shelves) if (isLegalMove(state.shelves, state.selected.shelfId, s.id)) set.add(s.id)
    }
    return set
  }, [state.selected, state.shelves])

  function tapShelf(shelfId: string) {
    if (state.status === 'won' || paused) return
    setHint(null)
    const shelf = state.shelves.find((s) => s.id === shelfId)!
    // nothing picked yet → pick this shelf's front good (if any)
    if (!state.selected) {
      const fid = frontId(shelf)
      if (fid) {
        unlockAudio()
        playTap()
        setState({ ...state, selected: { shelfId, itemId: fid } })
      }
      return
    }
    // tapping the same shelf again → put it back down
    if (state.selected.shelfId === shelfId) {
      setState({ ...state, selected: null })
      return
    }
    // move it — if legal
    if (isLegalMove(state.shelves, state.selected.shelfId, shelfId)) {
      const beforeCombo = state.combo
      const res = applyMove(state, state.selected.shelfId, shelfId)
      setState(res.state)
      if (res.cleared > 0) {
        playSuccess()
        if (res.state.combo > beforeCombo && res.state.combo >= 2) {
          setComboPop(res.state.combo)
          window.setTimeout(() => setComboPop(0), 900)
        }
        if (res.state.status === 'won') window.setTimeout(playWin, 250)
      } else {
        playPop()
      }
    } else {
      // illegal → a little shake, keep the good in hand
      playNudge()
      setShakeId(shelfId)
      window.setTimeout(() => setShakeId(null), 420)
    }
  }

  const doUndo = () => {
    if (!state.history.length) return
    playTap()
    setState(undo(state))
  }
  const doHint = () => {
    playTap()
    const h = getHint(state.shelves)
    if (h) {
      setHint(h)
      window.setTimeout(() => setHint(null), 1700)
    }
  }
  const doShuffle = () => {
    playDice()
    setState({ ...state, shelves: shuffleBoard(state.shelves), selected: null })
  }
  const restart = () => {
    playTap()
    setState(initState(level))
  }
  const goNext = () => {
    const ni = (levelIdx + 1) % LEVELS.length
    playTap()
    setLevelIdx(ni)
    setState(initState(LEVELS[ni]))
  }

  const stars = state.score >= state.total * 110 ? 3 : state.score >= state.total * 70 ? 2 : 1
  const progress = state.total ? Math.round((state.cleared / state.total) * 100) : 0

  return (
    <GameShell title="מכולת" emoji="🛒" onExit={onExit}>
      {/* ── top bar (no timer!) ── */}
      <div className="ss-top">
        <span className="ss-chip">שלב {level.id}</span>
        <span className="ss-chip ss-score">⭐ {state.score}</span>
        <span className="ss-chip">צעדים {state.moves}</span>
        <button className="ss-chip ss-pause" onClick={() => setPaused(true)} aria-label="הפסקה">
          ⏸️
        </button>
      </div>
      <div className="ss-progress">
        <span className="ss-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {comboPop >= 2 && <div className="ss-combo-pop">קומבו ×{comboPop}! 🔥</div>}

      {level.tutorial && (
        <p className="ss-tutorial">בחרו מצרך מהמדף והעבירו אותו. 3 זהים על מדף אחד — נעלמים! 🎉 בלי שעון, בלי לחץ.</p>
      )}

      {/* ── the shelves ── */}
      <div className="ss-board">
        {state.shelves.map((shelf) => {
          const isSource = state.selected?.shelfId === shelf.id
          const isTarget = !!state.selected && legalTargets.has(shelf.id)
          const isHint = hint?.sourceId === shelf.id || hint?.targetId === shelf.id
          return (
            <button
              key={shelf.id}
              className={`ss-shelf ${isSource ? 'is-source' : ''} ${isTarget ? 'is-target' : ''} ${
                isHint ? 'is-hint' : ''
              } ${shelf.locked ? 'is-locked' : ''} ${shakeId === shelf.id ? 'is-shake' : ''}`}
              onClick={() => tapShelf(shelf.id)}
            >
              <span className="ss-goods">
                {/* mystery goods queued behind the visible ones */}
                {shelf.hiddenItems?.map((h) => (
                  <span className="ss-good is-hidden" key={h.id} aria-hidden="true">
                    📦
                  </span>
                ))}
                {shelf.items.map((it, idx) => {
                  const isFront = idx === shelf.items.length - 1
                  return (
                    <span
                      className={`ss-good ${isFront ? 'is-front' : ''} ${
                        isSource && isFront ? 'is-picked' : ''
                      }`}
                      key={it.id}
                    >
                      {it.icon}
                    </span>
                  )
                })}
              </span>
              <span className="ss-plank" />
              {shelf.locked && <span className="ss-lock" aria-hidden="true">🔒</span>}
            </button>
          )
        })}
      </div>

      {/* ── boosters ── */}
      <div className="ss-boosters">
        <button className="ss-booster" onClick={doUndo} disabled={!state.history.length}>
          ↩️<span>אחורה</span>
        </button>
        <button className="ss-booster" onClick={doHint}>
          💡<span>רמז</span>
        </button>
        <button className="ss-booster" onClick={doShuffle}>
          🔀<span>ערבוב</span>
        </button>
        <button className="ss-booster" onClick={restart}>
          🔄<span>מהתחלה</span>
        </button>
      </div>

      {state.status === 'no_moves' && (
        <div className="ss-banner">
          <span>אין מהלך טוב כרגע — נסו ערבוב, אחורה, או מהתחלה 🙂</span>
        </div>
      )}

      {/* ── win modal ── */}
      {state.status === 'won' && (
        <div className="ss-overlay">
          <div className="ss-modal">
            <h3>סידרתם הכל! 🎉</h3>
            <div className="ss-stars">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
            <p className="ss-modal-score">⭐ {state.score} · {state.moves} צעדים</p>
            <div className="ss-modal-btns">
              <button className="big-button" onClick={goNext}>
                {levelIdx < LEVELS.length - 1 ? 'השלב הבא ➡️' : 'מהתחלה 🔄'}
              </button>
              <button className="ss-ghost-btn" onClick={restart}>
                שוב
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── pause modal ── */}
      {paused && (
        <div className="ss-overlay" onClick={() => setPaused(false)}>
          <div className="ss-modal" onClick={(e) => e.stopPropagation()}>
            <h3>הפסקה ⏸️</h3>
            <div className="ss-modal-btns">
              <button className="big-button" onClick={() => setPaused(false)}>
                ממשיכים ▶️
              </button>
              <button className="ss-ghost-btn" onClick={() => { setPaused(false); restart() }}>
                מהתחלה 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
