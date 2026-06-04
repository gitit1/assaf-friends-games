import { useEffect, useRef, useState } from 'react'
import GameShell from '../components/GameShell'
import Confetti from '../components/Confetti'
import type { GameProps } from './registry'
import { playNudge, playPop, playWin, unlockAudio } from '../audio'
import { randInt, shuffle } from './util'
import { useT } from '../i18n'

// "What comes next?" — a repeating pattern of colourful tokens with the last one
// missing; the child completes it from a few choices. Great for a pattern-loving
// kid. No timer; a wrong tap just shakes gently (no penalty), the right one cheers.
const PALETTE = ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠', '⭐', '❤️']

type Puzzle = { seq: string[]; answer: string; choices: string[] }

function makePuzzle(): Puzzle {
  const L = randInt(2, 3) // unit length
  const R = randInt(2, 3) // repeats
  const pool = shuffle([...PALETTE])
  const unit = pool.slice(0, L)
  const N = L * R
  const seq = Array.from({ length: N }, (_, i) => unit[i % L])
  const answer = seq[N - 1]
  const choices = [...unit]
  if (pool.length > L) choices.push(pool[L]) // one distractor not in the pattern
  return { seq, answer, choices: shuffle(choices) }
}

export default function PatternGame({ onExit }: GameProps) {
  const { t } = useT()
  const [puz, setPuz] = useState<Puzzle>(makePuzzle)
  const [solved, setSolved] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])

  function pick(choice: string) {
    if (solved) return
    unlockAudio()
    if (choice === puz.answer) {
      setSolved(true)
      setWrong(null)
      playWin()
    } else {
      setWrong(choice)
      playNudge()
      timers.current.push(window.setTimeout(() => setWrong(null), 450))
    }
  }
  function next() {
    clear()
    setSolved(false)
    setWrong(null)
    setPuz(makePuzzle())
    playPop()
  }

  const last = puz.seq.length - 1

  return (
    <GameShell title={t('game.pattern')} emoji="🔵" onExit={onExit}>
      <Confetti active={solved} />
      <div className="pat-screen">
        <p className="pat-q">{t('pat.q')}</p>

        <div className="pat-seq" dir="ltr">
          {puz.seq.map((tok, i) =>
            i === last ? (
              <span key={i} className={`pat-slot ${solved ? 'is-filled' : ''}`}>
                {solved ? puz.answer : '❓'}
              </span>
            ) : (
              <span key={i} className="pat-token">
                {tok}
              </span>
            ),
          )}
        </div>

        {!solved ? (
          <div className="pat-choices">
            {puz.choices.map((ch) => (
              <button
                key={ch}
                className={`pat-choice ${wrong === ch ? 'is-wrong' : ''}`}
                onClick={() => pick(ch)}
                aria-label={t('pat.opt')}
              >
                {ch}
              </button>
            ))}
          </div>
        ) : (
          <button className="big-button" onClick={next}>
            🎲 {t('pat.new')}
          </button>
        )}
      </div>
    </GameShell>
  )
}
