import { useEffect, useState } from 'react'
import GameShell from '../components/GameShell'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playSuccess, playWin, playTap, unlockAudio } from '../audio'
import { speak } from '../speech'
import { FRIENDS, friendName, friendSay } from '../friends'
import { randInt, shuffle } from './util'
import { speakNumber } from '../voice'
import { screenScale, useViewport } from '../useViewport'

// "Which friend?" — a Hebrew letter is shown and spoken; tap the friend whose
// NAME starts with it. Teaches letter↔sound through friends the child knows.
// No timer; a wrong pick gives a gentle nudge.
const LETTER_NAMES: Record<string, string> = {
  א: 'אָלֶף', ב: 'בֵּית', ג: 'גִּימֶל', ד: 'דָּלֶת', ה: 'הֵא', ו: 'וָו', ז: 'זַיִן',
  ח: 'חֵית', ט: 'טֵית', י: 'יוּד', כ: 'כָּף', ל: 'לָמֶד', מ: 'מֵם', נ: 'נוּן',
  ס: 'סָמֶךְ', ע: 'עַיִן', פ: 'פֵּא', צ: 'צָדִי', ק: 'קוּף', ר: 'רֵישׁ', ש: 'שִׁין', ת: 'תָּו',
}

type Round = { target: number; options: number[]; letter: string }
function newRound(): Round {
  const target = randInt(0, FRIENDS.length - 1)
  const letter = FRIENDS[target].name[0]
  const others = shuffle(FRIENDS.map((_, i) => i).filter((i) => i !== target && FRIENDS[i].name[0] !== letter)).slice(0, 2)
  const options = shuffle([target, ...others])
  return { target, options, letter }
}

export default function WhichFriend({ onExit }: GameProps) {
  const vp = useViewport()
  const [round, setRound] = useState<Round>(newRound)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const [solved, setSolved] = useState(false)

  const letterName = LETTER_NAMES[round.letter] ?? round.letter

  useEffect(() => {
    speak(letterName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  function pick(i: number) {
    if (solved) return
    unlockAudio()
    if (i === round.target) {
      setSolved(true)
      const ns = score + 1
      setScore(ns)
      if (ns % 5 === 0) {
        playWin()
        speakNumber(ns) // calm milestone: announce the running count
      } else {
        playSuccess()
        speak(`${letterName}! ${friendSay(round.target)}`)
      }
      window.setTimeout(() => {
        setRound(newRound())
        setSolved(false)
      }, 1300)
    } else {
      setWrong(i)
      playNudge()
      window.setTimeout(() => setWrong(null), 450)
    }
  }

  return (
    <GameShell title="איזה חבר?" emoji="🔤" onExit={onExit}>
      <div className="which-head">
        <span className="qty-score" aria-label={`ניקוד ${score}`}>
          ⭐ {score}
        </span>
      </div>

      <p className="which-q">מי מתחיל באות הזאת?</p>

      <div className="which-prompt">
        <span className="which-letter" aria-hidden="true">
          {round.letter}
        </span>
        <button className="pill which-say" onClick={() => { playTap(); speak(letterName) }} aria-label="שמע שוב">
          🔊
        </button>
      </div>

      <div className="which-options">
        {round.options.map((i) => (
          <div
            key={i}
            className={`which-opt ${wrong === i ? 'is-wrong' : ''} ${solved && i === round.target ? 'is-win' : ''}`}
          >
            <button className="which-pick" onClick={() => pick(i)} disabled={solved} aria-label={friendName(i)}>
              <Friend index={i} scale={Math.min(78 * screenScale(vp.w), vp.w * 0.27) / friendMaxDim(i)} showNumber={false} bouncing={solved && i === round.target} />
              <span className="which-name">{friendName(i)}</span>
            </button>
            <button
              className="which-hear"
              onClick={() => {
                unlockAudio()
                speak(friendSay(i))
              }}
              aria-label={`שמע את ${friendName(i)}`}
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </GameShell>
  )
}
