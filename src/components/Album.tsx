import { useEffect, useState } from 'react'
import GameShell from './GameShell'
import Friend from './Friend'
import { FRIEND_KINDS, FRIEND_NATURAL } from './FriendArt'
import { FRIENDS } from '../friends'
import { rosterCount } from '../level'
import { useMetFriends } from '../friendsMet'
import { playTap } from '../audio'
import { useT } from '../i18n'

const PER_PAGE = 10

// The friends ALBUM — a self-paced sticker book of the whole cast. Friends you've
// MET in the swallow game appear in full colour; the rest are faint silhouettes
// you haven't collected yet. A gentle "X / total" meter shows how close you are to
// "collecting them all" — no pressure, never lost (see friendsMet). Tap a met
// friend to hear its little voice. Decade pages keep it roomy like Meet Friends.
export default function Album({ onExit }: { onExit: () => void }) {
  const { t } = useT()
  const total = rosterCount()
  const groups = Math.ceil(total / PER_PAGE)
  const [group, setGroup] = useState(0)
  const start = group * PER_PAGE
  const end = Math.min(start + PER_PAGE, total)

  const metList = useMetFriends()
  const metSet = new Set(metList)
  const collected = metList.filter((i) => i < total).length

  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 360))
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // size so the widest friend in this decade is ~30% of the row → ≥3 per row
  const rowW = Math.min(vw - 16, 560)
  const decadeMaxW = Math.max(...FRIENDS.slice(start, end).map((_, j) => FRIEND_NATURAL[FRIEND_KINDS[start + j]].w))
  const scale = (rowW * 0.3) / decadeMaxW

  return (
    <GameShell title={t('album.title')} emoji="📖" onExit={onExit}>
      <div className="album-meter">
        <span className="album-count" dir="ltr">{collected} / {total}</span>
        <span className="album-bar"><span className="album-fill" style={{ width: `${(collected / Math.max(1, total)) * 100}%` }} /></span>
      </div>

      {groups > 1 && (
        <div className="meet-decades" dir="ltr">
          {Array.from({ length: groups }, (_, g) => {
            const s = g * PER_PAGE
            const e = Math.min(s + PER_PAGE, total)
            return (
              <button key={g} className={`pill meet-decade ${g === group ? 'pill-active' : ''}`} onClick={() => { playTap(); setGroup(g) }}>
                {s + 1}–{e}
              </button>
            )
          })}
        </div>
      )}

      <p className="meet-intro">{t('album.intro')}</p>

      <div className="meet-grid">
        {FRIENDS.slice(start, end).map((friend, j) => {
          const i = start + j
          const got = metSet.has(i)
          return (
            <div className={`album-card ${got ? 'got' : 'locked'}`} key={friend.name} style={{ animationDelay: `${j * 0.04}s` }}>
              {got ? (
                <Friend index={i} scale={scale} showNumber={false} interactive />
              ) : (
                <span className="album-slot" aria-hidden="true">
                  <span className="album-silhouette"><Friend index={i} scale={scale} showNumber={false} /></span>
                  <span className="album-q">?</span>
                </span>
              )}
              <span className="meet-name">{got ? friend.name : '?'}</span>
            </div>
          )
        })}
      </div>
    </GameShell>
  )
}
