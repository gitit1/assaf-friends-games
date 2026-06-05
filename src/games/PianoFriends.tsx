import { useState } from 'react'
import GameShell from '../components/GameShell'
import { friendCount } from '../level'
import Friend from '../components/Friend'
import { friendMaxDim } from '../components/FriendArt'
import type { GameProps } from './registry'
import { playNudge, playPiano, playWin, unlockAudio } from '../audio'
import { speak } from '../speech'
import { friendColor } from '../friends'
import { numberWordNiqqud, randInt, shuffle } from './util'
import { screenScale, useViewport } from '../useViewport'
import Confetti from '../components/Confetti'
import { useT } from '../i18n'

// "Friends piano" — Guitar-Hero / Just-Dance style but SELF-PACED (no timer):
// the next note of a known kids' tune falls down its lane as a number, its key
// glows, and the child taps it to play. Tapping through plays the whole melody.
// A free-play mode lets them just make music. No losing. The friends on the
// keys are drawn at random from the whole roster (fresh each play).
const LANES = 6 // 6 lanes = Do Re Mi Fa Sol La (the pitch is fixed per lane)

function pickBand(): number[] {
  return shuffle(Array.from({ length: friendCount() }, (_, i) => i)).slice(0, LANES)
}

type Song = { key: string; emoji: string; notes: number[] } // notes = scale degrees 0..5
const SONGS: Song[] = [
  { key: 'twinkle', emoji: '⭐', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] }, // Twinkle / ABC
  { key: 'lamb', emoji: '🐑', notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4] }, // Mary Had a Little Lamb
  { key: 'boat', emoji: '🚣', notes: [0, 0, 0, 1, 2, 2, 1, 2, 3, 4] }, // Row Row Row Your Boat
  { key: 'frere', emoji: '😴', notes: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4] }, // Frère Jacques
  { key: 'drums', emoji: '🥁', notes: [2, 1, 0, 2, 1, 0, 0, 0, 0, 1, 1, 1, 2, 1, 0] }, // Hot Cross Buns
  { key: 'scale', emoji: '🪜', notes: [0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0] }, // up & down the scale
  { key: 'birthday', emoji: '🎂', notes: [0, 0, 1, 0, 3, 2, 0, 0, 1, 0, 4, 3] }, // Happy Birthday (opening)
  { key: 'london', emoji: '🌉', notes: [4, 5, 4, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4] }, // London Bridge
  { key: 'arp', emoji: '🎶', notes: [0, 2, 4, 2, 0, 0, 2, 4, 2, 0, 4, 3, 2, 1, 0] }, // playful arpeggio
]

export default function PianoFriends({ onExit }: GameProps) {
  const { t } = useT()
  const [songIdx, setSongIdx] = useState(() => randInt(0, SONGS.length - 1))
  const [free, setFree] = useState(false)
  const [pos, setPos] = useState(0)
  const [pressed, setPressed] = useState<number | null>(null)
  const [wrong, setWrong] = useState<number | null>(null)
  const [band, setBand] = useState<number[]>(pickBand) // which friends sit on the keys
  const [picker, setPicker] = useState(false) // song-list pop-up

  const vp = useViewport()
  const keyPx = 40 * screenScale(vp.w)
  const song = SONGS[songIdx]
  const done = !free && pos >= song.notes.length
  const current = !free && !done ? song.notes[pos] : null

  function bounce(i: number) {
    setPressed(i)
    window.setTimeout(() => setPressed((p) => (p === i ? null : p)), 350)
  }

  function chooseSong(i: number) {
    unlockAudio()
    setFree(false)
    setSongIdx(i)
    setPos(0)
    setWrong(null)
    setBand(pickBand())
    setPicker(false)
  }
  function chooseFree() {
    unlockAudio()
    setFree(true)
    setWrong(null)
    setBand(pickBand())
    setPicker(false)
  }
  function restart() {
    setPos(0)
    setWrong(null)
    setBand(pickBand())
  }
  function newRound() {
    unlockAudio()
    setFree(false)
    setSongIdx(randInt(0, SONGS.length - 1))
    setPos(0)
    setWrong(null)
    setBand(pickBand())
  }

  function tap(i: number) {
    unlockAudio()
    if (free) {
      playPiano(i)
      bounce(i)
      return
    }
    if (done) return
    if (i === current) {
      playPiano(i)
      bounce(i)
      const np = pos + 1
      setPos(np)
      if (np >= song.notes.length) window.setTimeout(() => { playWin(); speak('כל הכבוד!') }, 350)
    } else {
      setWrong(i)
      playNudge()
      if (current != null) speak(numberWordNiqqud(band[current] + 1)) // point to the right key
      window.setTimeout(() => setWrong(null), 350)
    }
  }

  return (
    <GameShell title={t('game.piano')} emoji="🎹" onExit={onExit}>
      <Confetti active={done} />
      <div className="gh-top">
        <button className="pill gh-choose" onClick={() => { unlockAudio(); setPicker(true) }}>
          🎵 {free ? t('piano.free') : `${song.emoji} ${t(`piano.song.${song.key}`)}`} ▾
        </button>
        <button className="pill" onClick={newRound}>
          🔄 {t('pop.new')}
        </button>
      </div>

      {!free && !done && <p className="gh-hint" aria-hidden="true">{t('piano.hintSong')}</p>}
      {free && <p className="gh-hint" aria-hidden="true">{t('piano.hintFree')}</p>}

      {/* a piano is laid out left-to-right (low → high) in both languages, so the
          falling note (positioned by --lane) lines up with its key */}
      <div className="gh-board" dir="ltr" style={{ '--lanes': LANES } as React.CSSProperties}>
        {current != null && (
          <span
            className="gh-note"
            key={pos}
            style={{ '--lane': current, '--c': friendColor(band[current]) } as React.CSSProperties}
          >
            <span className="gh-tile">{band[current] + 1}</span>
          </span>
        )}
        {done && <span className="gh-board-done" aria-hidden="true">🎉</span>}
      </div>

      <div className="gh-keys" dir="ltr">
        {Array.from({ length: LANES }).map((_, i) => (
          <button
            key={i}
            className={`gh-key ${current === i ? 'is-active' : ''} ${wrong === i ? 'is-wrong' : ''}`}
            onClick={() => tap(i)}
            aria-label={t('piano.keyAria', { n: i + 1 })}
          >
            <Friend index={band[i]} scale={keyPx / friendMaxDim(band[i])} showNumber={false} bouncing={pressed === i} />
          </button>
        ))}
      </div>

      {!free && (
        <div className="gh-foot">
          {done ? (
            <div className="counting-next">
              <div className="banner banner-success" role="status">
                {t('mem.win')}
              </div>
              <button className="big-button" onClick={restart}>
                🔁 {t('seq.again')}
              </button>
            </div>
          ) : (
            <span className="gh-progress" aria-hidden="true">
              ♪ {pos} / {song.notes.length}
            </span>
          )}
        </div>
      )}

      {picker && (
        <div className="song-overlay" onClick={() => setPicker(false)}>
          <div className="song-card" onClick={(e) => e.stopPropagation()}>
            <button className="hint-close" onClick={() => setPicker(false)} aria-label={t('seq.close')}>
              ✕
            </button>
            <h3 className="song-title">{t('piano.pick')}</h3>
            <div className="song-list">
              {SONGS.map((s, i) => (
                <button key={s.key} className="song-item" onClick={() => chooseSong(i)}>
                  <span className="song-item-emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  <span className="song-item-name">{t(`piano.song.${s.key}`)}</span>
                </button>
              ))}
              <button className="song-item" onClick={chooseFree}>
                <span className="song-item-emoji" aria-hidden="true">
                  🎶
                </span>
                <span className="song-item-name">{t('piano.free')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
