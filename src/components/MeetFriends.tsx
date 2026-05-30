import GameShell from './GameShell'
import Friend from './Friend'
import { FRIENDS } from '../friends'
import type { GameProps } from '../games/registry'

// Not a game — a calm "meet the cast" screen. Tap any friend and it jumps,
// makes its sound, and says its name. Names also shown for the grown-ups.
export default function MeetFriends({ onExit }: GameProps) {
  return (
    <GameShell title="החברים שלי" emoji="⭐" onExit={onExit}>
      <p className="meet-intro">געו בחברים — הם יגידו שלום! 👋</p>

      <div className="meet-grid">
        {FRIENDS.map((friend, i) => (
          <div className="meet-friend" key={friend.name}>
            <Friend index={i} scale={0.5} interactive />
            <span className="meet-name">{friend.name}</span>
          </div>
        ))}
      </div>
    </GameShell>
  )
}
