import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playSuccess, playNudge, playWin, playTap, unlockAudio } from '../audio'
import { speakEn } from '../speech'
import { shuffle } from './util'
import { useT } from '../i18n'

// "Spell the word" (English) — a picture appears and the child builds its English
// word by tapping the letter tiles into the slots, left-to-right. The tiles are
// exactly the word's letters, shuffled, so it's an ordering/spelling challenge.
// No timer, no losing: a wrong tile gives a gentle nudge and simply isn't placed;
// the right next letter snaps in, says its name, and when the word is whole the
// picture cheers and says the word. Built for a number-loving non-reader who
// already knows his ABC by heart and wants a real game.
type Word = { word: string; emoji: string }
const WORDS: Word[] = [
  { word: 'CAT', emoji: '🐱' },
  { word: 'DOG', emoji: '🐶' },
  { word: 'SUN', emoji: '☀️' },
  { word: 'BUS', emoji: '🚌' },
  { word: 'PIG', emoji: '🐷' },
  { word: 'COW', emoji: '🐄' },
  { word: 'HAT', emoji: '🎩' },
  { word: 'CAR', emoji: '🚗' },
  { word: 'BEE', emoji: '🐝' },
  { word: 'FOX', emoji: '🦊' },
  { word: 'EGG', emoji: '🥚' },
  { word: 'BED', emoji: '🛏️' },
  { word: 'CUP', emoji: '🥤' },
  { word: 'HEN', emoji: '🐔' },
  { word: 'OWL', emoji: '🦉' },
  { word: 'ANT', emoji: '🐜' },
  { word: 'BAT', emoji: '🦇' },
]

type Tile = { id: number; ch: string; used: boolean }

// the word's letters as shuffled tiles (re-shuffle until not already in order so
// there's always something to do)
function makeTiles(word: string): Tile[] {
  const chars = word.split('')
  let order = shuffle(chars.map((_, i) => i))
  if (chars.length > 1) {
    let guard = 0
    while (order.every((pos, i) => chars[pos] === chars[i]) && guard++ < 8) order = shuffle(order)
  }
  return order.map((pos, id) => ({ id, ch: chars[pos], used: false }))
}

export default function SpellWord({ onExit }: GameProps) {
  const { t } = useT()
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WORDS.length))
  const item = WORDS[idx]
  const [placed, setPlaced] = useState<string[]>([]) // letters locked into the slots, in order
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(item.word))
  const [wrong, setWrong] = useState<number | null>(null) // a tile id that was tapped out of order
  const timers = useRef<number[]>([])

  const done = placed.length === item.word.length
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  // say the word at the start of each round so a non-reader knows what to build
  useEffect(() => {
    const id = window.setTimeout(() => speakEn(item.word), 350)
    timers.current.push(id)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  function newWord(next = (idx + 1 + Math.floor(Math.random() * (WORDS.length - 1))) % WORDS.length) {
    clear()
    playTap()
    setIdx(next)
    setPlaced([])
    setTiles(makeTiles(WORDS[next].word))
    setWrong(null)
  }

  function sayWord() {
    unlockAudio()
    speakEn(item.word)
  }

  function tapTile(tile: Tile) {
    if (done || tile.used) return
    unlockAudio()
    const need = item.word[placed.length] // the next letter the word wants
    if (tile.ch === need) {
      setTiles((ts) => ts.map((x) => (x.id === tile.id ? { ...x, used: true } : x)))
      const next = [...placed, tile.ch]
      setPlaced(next)
      playSuccess()
      speakEn(tile.ch) // say the letter's name
      if (next.length === item.word.length) {
        later(() => {
          playWin()
          speakEn(item.word) // cheer the whole word
        }, 550)
      }
    } else {
      setWrong(tile.id)
      playNudge()
      later(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title={t('game.spell')} emoji="🔠" onExit={onExit}>
      <Confetti active={done} />
      <div className="spell-screen">
        <button className="spell-pic" onClick={sayWord} aria-label={t('spell.hear')}>
          <span aria-hidden="true">{item.emoji}</span>
        </button>

        {/* the word builds left-to-right (English is LTR) */}
        <div className="spell-slots" dir="ltr">
          {item.word.split('').map((_, i) => (
            <span key={i} className={`spell-slot ${placed[i] ? 'is-filled' : ''} ${i === placed.length && !done ? 'is-next' : ''}`}>
              {placed[i] ?? ''}
            </span>
          ))}
        </div>

        {done ? (
          <div className="spell-foot">
            <button className="pill spell-say" onClick={sayWord} aria-label={t('spell.hear')}>
              🔊
            </button>
            <button className="big-button" onClick={() => newWord()}>
              🔄 {t('spell.next')}
            </button>
          </div>
        ) : (
          <>
            <div className="spell-tray" dir="ltr">
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  className={`spell-tile ${tile.used ? 'is-used' : ''} ${wrong === tile.id ? 'is-wrong' : ''}`}
                  onClick={() => tapTile(tile)}
                  disabled={tile.used}
                  aria-label={tile.ch}
                >
                  {tile.ch}
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
