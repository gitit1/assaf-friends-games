import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playSuccess, playNudge, playWin, playTap, unlockAudio } from '../audio'
import { speakEn } from '../speech'
import { shuffle } from './util'
import { getSettings } from '../settings'
import { levelForTier } from '../difficulty'
import { useT } from '../i18n'
import { POOLS, LEVEL_TIERS, pickWord } from './englishWords'

// "Living Letters" (English, Alphablocks-style) — the letters are little
// CHARACTERS (a coloured body with googly eyes) that the child taps into place to
// build the word, left-to-right. When the word is whole the letters do a happy
// jump and the picture springs to life (big bounce + sparkles + the word spoken).
// A spiritual sibling of our number-friends, for a Numberblocks-loving child.
// No timer, no losing — a wrong letter wobbles and isn't placed. Shared cumulative
// word pools (englishWords.ts); אלוף draws from everything.

// a cheerful colour (light→dark gradient) per letter, so each is its own little guy
const LL_COLORS: [string, string][] = [
  ['#fb7185', '#e11d48'], ['#fbbf24', '#d97706'], ['#34d399', '#059669'],
  ['#38bdf8', '#0284c7'], ['#a78bfa', '#7c3aed'], ['#f472b6', '#db2777'],
  ['#facc15', '#ca8a04'], ['#2dd4bf', '#0d9488'], ['#60a5fa', '#4338ca'],
  ['#f87171', '#b91c1c'],
]
const colorFor = (ch: string) => LL_COLORS[(ch.charCodeAt(0) - 65 + 26) % LL_COLORS.length]

function LetterGuy({ ch, className = '' }: { ch: string; className?: string }) {
  const [c1, c2] = colorFor(ch)
  return (
    <span className={`ll-guy ${className}`} style={{ '--c1': c1, '--c2': c2 } as React.CSSProperties}>
      <span className="ll-eyes" aria-hidden="true">
        <span className="ll-eye"><span className="ll-pupil" /></span>
        <span className="ll-eye"><span className="ll-pupil" /></span>
      </span>
      <span className="ll-ch">{ch}</span>
    </span>
  )
}

type Tile = { id: number; ch: string; used: boolean }
function makeTiles(word: string): Tile[] {
  const chars = word.split('')
  let order = shuffle(chars.map((_, i) => i))
  if (chars.length > 1) {
    let guard = 0
    while (order.every((pos, i) => chars[pos] === chars[i]) && guard++ < 8) order = shuffle(order)
  }
  return order.map((pos, id) => ({ id, ch: chars[pos], used: false }))
}

export default function LivingLetters({ onExit }: GameProps) {
  const { t } = useT()
  const [lvl, setLvl] = useState(() => levelForTier(LEVEL_TIERS, getSettings().difficulty))
  const [idx, setIdx] = useState(() => pickWord(lvl))
  const item = POOLS[lvl][idx]
  const [placed, setPlaced] = useState<string[]>([])
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(item.word))
  const [wrong, setWrong] = useState<number | null>(null)
  const [alive, setAlive] = useState(false) // finale: the word has come to life
  const timers = useRef<number[]>([])

  const done = placed.length === item.word.length
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  useEffect(() => {
    const id = window.setTimeout(() => speakEn(item.word), 350)
    timers.current.push(id)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lvl, idx])

  function load(nextLvl: number, nextIdx: number) {
    clear()
    playTap()
    setLvl(nextLvl)
    setIdx(nextIdx)
    setPlaced([])
    setTiles(makeTiles(POOLS[nextLvl][nextIdx].word))
    setWrong(null)
    setAlive(false)
  }
  function newWord() {
    const n = POOLS[lvl].length
    load(lvl, n <= 1 ? idx : (idx + 1 + Math.floor(Math.random() * (n - 1))) % n)
  }
  function chooseLevel(nextLvl: number) {
    load(nextLvl, pickWord(nextLvl))
  }
  function sayWord() {
    unlockAudio()
    speakEn(item.word)
  }
  function tapSlot(i: number) {
    unlockAudio()
    if (i < placed.length) speakEn(placed[i])
    else if (!done) speakEn(item.word[placed.length])
  }

  function tapTile(tile: Tile) {
    if (done || tile.used) return
    unlockAudio()
    if (tile.ch === item.word[placed.length]) {
      setTiles((ts) => ts.map((x) => (x.id === tile.id ? { ...x, used: true } : x)))
      const next = [...placed, tile.ch]
      setPlaced(next)
      playSuccess()
      speakEn(tile.ch)
      if (next.length === item.word.length) {
        // finale: the letters merge and the picture comes to life
        later(() => {
          setAlive(true)
          playWin()
          speakEn(item.word)
        }, 650)
      }
    } else {
      setWrong(tile.id)
      playNudge()
      later(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title={t('game.liveletters')} emoji="🆎" onExit={onExit}>
      <Confetti active={alive} />
      <div className="memory-controls">
        {LEVEL_TIERS.map((_, i) => (
          <button key={i} className={`pill ${i === lvl ? 'pill-active' : ''}`} onClick={() => chooseLevel(i)}>
            {t(`diff.${i}`)}
          </button>
        ))}
      </div>

      <div className="spell-screen">
        <button className={`spell-pic ${alive ? 'is-alive' : ''}`} onClick={sayWord} aria-label={t('spell.hear')}>
          <span aria-hidden="true">{item.emoji}</span>
        </button>

        {/* the word builds left-to-right; when whole, the row of letter-guys jumps */}
        <div className={`spell-slots ll-slots ${done ? 'is-merged' : ''}`} dir="ltr">
          {item.word.split('').map((_, i) => (
            <button
              key={i}
              className={`spell-slot ll-slot ${placed[i] ? 'is-filled' : ''} ${i === placed.length && !done ? 'is-next' : ''}`}
              onClick={() => tapSlot(i)}
              style={{ '--n': i } as React.CSSProperties}
              aria-label={placed[i] ?? t('spell.hear')}
            >
              {placed[i] ? <LetterGuy ch={placed[i]} /> : ''}
            </button>
          ))}
        </div>

        {done ? (
          <div className="spell-foot">
            <button className="pill spell-say" onClick={sayWord} aria-label={t('spell.hear')}>
              🔊
            </button>
            <button className="big-button" onClick={newWord}>
              🔄 {t('spell.next')}
            </button>
          </div>
        ) : (
          <>
            <div className="spell-tray ll-tray" dir="ltr">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  className={`ll-tile ${tile.used ? 'is-used' : ''} ${wrong === tile.id ? 'is-wrong' : ''}`}
                  onClick={() => tapTile(tile)}
                  disabled={tile.used}
                  aria-label={tile.ch}
                >
                  <LetterGuy ch={tile.ch} className="idle" />
                </button>
              ))}
            </div>
            <button className="pill spell-say" onClick={sayWord}>
              🔊 {t('spell.hear')}
            </button>
          </>
        )}
      </div>
    </GameShell>
  )
}
