import { useMemo, useState } from 'react'
import GameShell from '../../components/GameShell'
import { useT } from '../../i18n'
import type { GameProps } from '../registry'
import { playDice, playNudge, playPop, playSuccess, playTap, playWin, unlockAudio } from '../../audio'
import { LEVELS } from './levels'
import type { GameState } from './gameTypes'
import { applyMove, getHint, initState, isLegalMove, shuffleBoard, undo } from './engine'

// ── "מכולת" — a calm shelf-sorting puzzle. NO timer, no countdown, no time loss.
// Pick ANY good off a shelf, move it onto another shelf; 3 identical on one shelf
// clear. Win = the whole board is tidied. Challenge is planning + space. ──

export default function SortShelf({ onExit }: GameProps) {
  const { t } = useT()
  const [levelIdx, setLevelIdx] = useState(0)
  const [state, setState] = useState<GameState>(() => initState(LEVELS[0]))
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [hint, setHint] = useState<{ sourceId: string; itemId: string; targetId: string } | null>(null)
  const [comboPop, setComboPop] = useState(0)
  const [paused, setPaused] = useState(false)
  // polish: a good that flies from shelf to shelf, + sparkle bursts where a triple clears
  const [flying, setFlying] = useState<{ icon: string; left: number; top: number; dx: number; dy: number; id: number } | null>(null)
  const [hideId, setHideId] = useState<string | null>(null)
  const [sparkles, setSparkles] = useState<{ id: number; left: number; top: number }[]>([])
  const level = LEVELS[levelIdx]

  // which shelves are legal targets for the currently-picked good (for highlights)
  const legalTargets = useMemo(() => {
    const set = new Set<string>()
    if (state.selected) {
      for (const s of state.shelves) if (isLegalMove(state.shelves, state.selected.shelfId, s.id)) set.add(s.id)
    }
    return set
  }, [state.selected, state.shelves])

  // a sparkle burst centred on a shelf's goods area
  function burstAt(shelfId: string) {
    const el = document.querySelector(`[data-goods="${shelfId}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const id = state.moves * 100 + Math.floor(r.left)
    setSparkles((s) => [...s, { id, left: r.left + r.width / 2, top: r.top + r.height / 2 }])
    window.setTimeout(() => setSparkles((s) => s.filter((x) => x.id !== id)), 700)
  }

  // apply the move to the board + all the feedback (sound, combo, sparkles, win)
  function applyAndFeedback(sourceId: string, itemId: string, targetId: string) {
    const beforeCombo = state.combo
    const res = applyMove(state, sourceId, itemId, targetId)
    setState(res.state)
    if (res.cleared > 0) {
      playSuccess()
      res.clearedShelfIds.forEach((sid) => burstAt(sid)) // sparkle where each triple cleared
      if (res.state.combo > beforeCombo && res.state.combo >= 2) {
        setComboPop(res.state.combo)
        window.setTimeout(() => setComboPop(0), 900)
      }
      if (res.state.status === 'won') window.setTimeout(playWin, 250)
    } else {
      playPop()
    }
  }

  // move the picked good onto a target shelf — flies smoothly, then lands
  function moveTo(targetId: string) {
    const sel = state.selected
    if (!sel) return
    if (!isLegalMove(state.shelves, sel.shelfId, targetId)) {
      playNudge() // illegal → a little shake, keep the good in hand
      setShakeId(targetId)
      window.setTimeout(() => setShakeId(null), 420)
      return
    }
    const good = state.shelves.find((s) => s.id === sel.shelfId)?.items.find((i) => i.id === sel.itemId)
    const srcEl = document.querySelector(`[data-good="${sel.itemId}"]`)
    const tgtEl = document.querySelector(`[data-goods="${targetId}"]`)
    if (good && srcEl && tgtEl) {
      const f = (srcEl as HTMLElement).getBoundingClientRect()
      const t = (tgtEl as HTMLElement).getBoundingClientRect()
      setHideId(sel.itemId) // hide the real good while its ghost flies
      setFlying({ icon: good.icon, left: f.left, top: f.top, dx: t.right - 42 - f.left, dy: t.bottom - 44 - f.top, id: Date.now() })
      window.setTimeout(() => {
        setFlying(null)
        setHideId(null)
        applyAndFeedback(sel.shelfId, sel.itemId, targetId)
      }, 250)
    } else {
      applyAndFeedback(sel.shelfId, sel.itemId, targetId)
    }
  }

  // tapping a specific good: pick it up / swap which one is held / or move onto it
  function tapGood(shelfId: string, itemId: string) {
    if (state.status === 'won' || paused) return
    setHint(null)
    if (!state.selected) {
      unlockAudio()
      playTap()
      setState({ ...state, selected: { shelfId, itemId } })
      return
    }
    if (state.selected.shelfId === shelfId) {
      // same shelf → switch to this good, or put it down if it's the same one
      if (state.selected.itemId === itemId) setState({ ...state, selected: null })
      else {
        playTap()
        setState({ ...state, selected: { shelfId, itemId } })
      }
      return
    }
    moveTo(shelfId) // good is on another shelf → drop the held good there
  }

  // tapping the shelf itself (its empty area / plank) → a drop target
  function tapShelf(shelfId: string) {
    if (state.status === 'won' || paused) return
    setHint(null)
    if (!state.selected) return
    if (state.selected.shelfId === shelfId) {
      setState({ ...state, selected: null })
      return
    }
    moveTo(shelfId)
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
    <GameShell title={t('game.sortshelf')} emoji="🛒" onExit={onExit}>
      {/* ── top bar (no timer!) ── */}
      <div className="ss-top">
        <span className="ss-chip">{t('ss.level')} {level.id}</span>
        <span className="ss-chip ss-score">⭐ {state.score}</span>
        <span className="ss-chip">{t('ss.moves')} {state.moves}</span>
        <button className="ss-chip ss-pause" onClick={() => setPaused(true)} aria-label={t('ss.pause')}>
          ⏸️
        </button>
      </div>
      <div className="ss-progress">
        <span className="ss-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {comboPop >= 2 && <div className="ss-combo-pop">{t('ss.combo')} ×{comboPop}! 🔥</div>}

      {level.tutorial && <p className="ss-tutorial">{t('ss.tutorial')}</p>}

      {/* ── the shelves ── */}
      <div className="ss-board">
        {state.shelves.map((shelf) => {
          const isSource = state.selected?.shelfId === shelf.id
          const isTarget = !!state.selected && legalTargets.has(shelf.id)
          const isHintTarget = hint?.targetId === shelf.id
          return (
            <div
              key={shelf.id}
              role="button"
              tabIndex={0}
              className={`ss-shelf ${isSource ? 'is-source' : ''} ${isTarget ? 'is-target' : ''} ${
                isHintTarget ? 'is-hint' : ''
              } ${shelf.locked ? 'is-locked' : ''} ${shakeId === shelf.id ? 'is-shake' : ''}`}
              onClick={() => tapShelf(shelf.id)}
            >
              <span className="ss-goods" data-goods={shelf.id}>
                {/* mystery goods queued behind the visible ones */}
                {shelf.hiddenItems?.map((h) => (
                  <span className="ss-good is-hidden" key={h.id} aria-hidden="true">
                    📦
                  </span>
                ))}
                {/* every visible good is tappable — pick ANY one */}
                {shelf.items.map((it) => {
                  const isPicked = state.selected?.shelfId === shelf.id && state.selected?.itemId === it.id
                  return (
                    <button
                      className={`ss-good ${isPicked ? 'is-picked' : ''} ${hint?.itemId === it.id ? 'is-hint-good' : ''}`}
                      key={it.id}
                      data-good={it.id}
                      style={hideId === it.id ? { visibility: 'hidden' } : undefined}
                      onClick={(e) => {
                        e.stopPropagation()
                        tapGood(shelf.id, it.id)
                      }}
                    >
                      {it.icon}
                    </button>
                  )
                })}
              </span>
              <span className="ss-plank" />
              {shelf.locked && <span className="ss-lock" aria-hidden="true">🔒</span>}
            </div>
          )
        })}
      </div>

      {/* flying good (smooth move) + sparkle bursts where triples clear */}
      {flying && (
        <span
          className="ss-fly"
          key={flying.id}
          style={{ left: flying.left, top: flying.top, '--dx': `${flying.dx}px`, '--dy': `${flying.dy}px` } as React.CSSProperties}
        >
          {flying.icon}
        </span>
      )}
      {sparkles.map((s) => (
        <span className="ss-sparkle" key={s.id} style={{ left: s.left, top: s.top }} aria-hidden="true">
          {[
            ['-24px', '-18px'],
            ['24px', '-18px'],
            ['-28px', '8px'],
            ['28px', '8px'],
            ['0px', '-30px'],
            ['0px', '22px'],
          ].map(([sx, sy], i) => (
            <i key={i} style={{ '--sx': sx, '--sy': sy } as React.CSSProperties} />
          ))}
        </span>
      ))}

      {/* ── boosters ── */}
      <div className="ss-boosters">
        <button className="ss-booster" onClick={doUndo} disabled={!state.history.length}>
          ↩️<span>{t('ss.undo')}</span>
        </button>
        <button className="ss-booster" onClick={doHint}>
          💡<span>{t('ss.hint')}</span>
        </button>
        <button className="ss-booster" onClick={doShuffle}>
          🔀<span>{t('ss.shuffle')}</span>
        </button>
        <button className="ss-booster" onClick={restart}>
          🔄<span>{t('ss.restart')}</span>
        </button>
      </div>

      {state.status === 'no_moves' && (
        <div className="ss-banner">
          <span>{t('ss.noMoves')}</span>
        </div>
      )}

      {/* ── win modal ── */}
      {state.status === 'won' && (
        <div className="ss-overlay">
          <div className="ss-modal">
            <h3>{t('ss.win')}</h3>
            <div className="ss-stars">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
            <p className="ss-modal-score">⭐ {state.score} · {state.moves} {t('ss.moves')}</p>
            <div className="ss-modal-btns">
              <button className="big-button" onClick={goNext}>
                {levelIdx < LEVELS.length - 1 ? t('ss.next') : `${t('ss.restart')} 🔄`}
              </button>
              <button className="ss-ghost-btn" onClick={restart}>
                {t('ss.again')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── pause modal ── */}
      {paused && (
        <div className="ss-overlay" onClick={() => setPaused(false)}>
          <div className="ss-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('ss.pause')} ⏸️</h3>
            <div className="ss-modal-btns">
              <button className="big-button" onClick={() => setPaused(false)}>
                {t('ss.resume')}
              </button>
              <button className="ss-ghost-btn" onClick={() => { setPaused(false); restart() }}>
                {t('ss.restart')} 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
