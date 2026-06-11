import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playSuccess, playWin, playTap, unlockAudio } from '../audio'
import { speakEn } from '../speech'
import { shuffle } from './util'
import { useT } from '../i18n'
import { LetterGuy } from './LetterGuy'

// "Rhyme Machine" (English) — a word-family / pattern toy. The ENDING stays the
// same (e.g. -AT) and the child swaps the FIRST letter to make a new rhyming word:
// CAT → HAT → BAT → RAT, and the picture morphs each time. Pure pattern play, no
// timer, no losing — every onset makes a real word. A star ticks for each new
// word discovered; finding the whole family cheers. Reuses the living-letter
// characters so it matches "Spell the Word".
type FamilyWord = { onset: string; word: string; emoji: string }
type Family = { rime: string; words: FamilyWord[] }
const FAMILIES: Family[] = [
  { rime: 'AT', words: [
    { onset: 'C', word: 'CAT', emoji: '🐱' }, { onset: 'H', word: 'HAT', emoji: '🎩' },
    { onset: 'B', word: 'BAT', emoji: '🦇' }, { onset: 'R', word: 'RAT', emoji: '🐀' },
  ] },
  { rime: 'OG', words: [
    { onset: 'D', word: 'DOG', emoji: '🐶' }, { onset: 'L', word: 'LOG', emoji: '🪵' },
    { onset: 'F', word: 'FOG', emoji: '🌫️' }, { onset: 'H', word: 'HOG', emoji: '🐗' },
  ] },
  { rime: 'UN', words: [
    { onset: 'S', word: 'SUN', emoji: '☀️' }, { onset: 'B', word: 'BUN', emoji: '🥐' },
    { onset: 'R', word: 'RUN', emoji: '🏃' },
  ] },
  { rime: 'EN', words: [
    { onset: 'H', word: 'HEN', emoji: '🐔' }, { onset: 'P', word: 'PEN', emoji: '🖊️' },
    { onset: 'T', word: 'TEN', emoji: '🔟' },
  ] },
  { rime: 'OX', words: [
    { onset: 'F', word: 'FOX', emoji: '🦊' }, { onset: 'B', word: 'BOX', emoji: '📦' },
  ] },
  { rime: 'AR', words: [
    { onset: 'C', word: 'CAR', emoji: '🚗' }, { onset: 'J', word: 'JAR', emoji: '🫙' },
  ] },
]

export default function RhymeMachine({ onExit }: GameProps) {
  const { t } = useT()
  const [famIdx, setFamIdx] = useState(() => Math.floor(Math.random() * FAMILIES.length))
  const fam = FAMILIES[famIdx]
  const [options, setOptions] = useState<FamilyWord[]>(() => shuffle(fam.words))
  const [onset, setOnset] = useState(() => fam.words[0].onset)
  const [found, setFound] = useState<Set<string>>(() => new Set([fam.words[0].onset]))
  const [party, setParty] = useState(false)
  const timers = useRef<number[]>([])

  const cur = fam.words.find((w) => w.onset === onset) ?? fam.words[0]
  const complete = found.size === fam.words.length
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  // say the current word whenever it changes (start of family + each swap)
  useEffect(() => {
    const id = window.setTimeout(() => speakEn(cur.word), 300)
    timers.current.push(id)
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [famIdx, onset])

  function newFamily() {
    clear()
    playTap()
    const next = FAMILIES.length <= 1 ? famIdx : (famIdx + 1 + Math.floor(Math.random() * (FAMILIES.length - 1))) % FAMILIES.length
    setFamIdx(next)
    setOptions(shuffle(FAMILIES[next].words))
    setOnset(FAMILIES[next].words[0].onset)
    setFound(new Set([FAMILIES[next].words[0].onset]))
    setParty(false)
  }

  function choose(w: FamilyWord) {
    if (w.onset === onset) {
      speakEn(w.word) // re-hear the same word
      return
    }
    unlockAudio()
    setOnset(w.onset)
    playSuccess()
    setFound((f) => {
      if (f.has(w.onset)) return f
      const nf = new Set(f).add(w.onset)
      if (nf.size === fam.words.length) {
        setParty(true)
        later(() => setParty(false), 2400)
        later(() => playWin(), 250)
      }
      return nf
    })
  }

  return (
    <GameShell title={t('game.rhyme')} emoji="🎡" onExit={onExit}>
      <Confetti active={party} />
      <div className="memory-controls">
        <span className="qty-score" dir="ltr" aria-label={t('rm.found', { n: found.size, total: fam.words.length })}>
          ⭐ {found.size} / {fam.words.length}
        </span>
        <button className="pill" onClick={newFamily}>
          🎡 {t('rm.newfam')}
        </button>
      </div>

      <div className="spell-screen">
        <button className="spell-pic" onClick={() => { unlockAudio(); speakEn(cur.word) }} aria-label={t('spell.hear')}>
          {/* key on the word so it remounts with a little morph each swap */}
          <span key={cur.word} className="rm-pic" aria-hidden="true">{cur.emoji}</span>
        </button>

        {/* the word: a changeable onset guy + the fixed family ending */}
        <div className="spell-slots rm-word" dir="ltr">
          <span className="rm-cell is-onset" key={onset}>
            <LetterGuy ch={cur.onset} />
          </span>
          {fam.rime.split('').map((ch, i) => (
            <span className="rm-cell" key={i}>
              <LetterGuy ch={ch} />
            </span>
          ))}
        </div>

        <p className="fl-q" aria-hidden="true">{t('rm.q')}</p>

        {/* pick the first letter — each makes a rhyming word */}
        <div className="spell-tray ll-tray" dir="ltr">
          {options.map((w) => (
            <button
              key={w.onset}
              className={`ll-tile ${w.onset === onset ? 'is-picked' : ''} ${found.has(w.onset) ? 'is-found' : ''}`}
              onClick={() => choose(w)}
              aria-label={w.word}
            >
              <LetterGuy ch={w.onset} className="idle" />
            </button>
          ))}
        </div>

        {complete && (
          <button className="big-button" onClick={newFamily}>
            🎡 {t('rm.newfam')}
          </button>
        )}
      </div>
    </GameShell>
  )
}
