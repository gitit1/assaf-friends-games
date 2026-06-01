import GameShell from './GameShell'
import Friend from './Friend'
import { FRIENDS } from '../friends'
import { playTap, unlockAudio } from '../audio'

// Not a game — "meet the cast". Tap any friend to enter its own little WORLD
// (it introduces itself, and you can give it a high-five / hug / kiss).
export default function MeetFriends({ onExit, onOpen }: { onExit: () => void; onOpen: (index: number) => void }) {
  return (
    <GameShell title="החברים שלי" emoji="⭐" onExit={onExit}>
      <p className="meet-intro">געו בחבר כדי להיכנס לעולם שלו! 👋</p>

      <div className="meet-grid">
        {FRIENDS.map((friend, i) => (
          <button
            className="meet-friend"
            key={friend.name}
            onClick={() => {
              unlockAudio()
              playTap()
              onOpen(i)
            }}
            aria-label={friend.name}
          >
            <Friend index={i} scale={0.5} showNumber={false} />
            <span className="meet-name">{friend.name}</span>
          </button>
        ))}
      </div>
    </GameShell>
  )
}
