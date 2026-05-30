import { CATEGORIES, gamesInCategory } from '../games/registry'
import Friend from './Friend'
import SettingsPanel from './SettingsPanel'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'

type HomeScreenProps = {
  // id is a game id, or 'meet' for the meet-the-friends screen.
  onPick: (id: string) => void
}

export default function HomeScreen({ onPick }: HomeScreenProps) {
  function pick(id: string) {
    unlockAudio()
    stopSpeech()
    playTap()
    onPick(id)
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <SettingsPanel />
        <button className="gallery-button" aria-label="גלריית עיצובים" onClick={() => pick('gallery')}>
          🎨
        </button>
        <h1 className="home-title">
          <span aria-hidden="true">🌟</span> עולם החברים
        </h1>
        <p className="home-subtitle">המשחקים של אסף</p>
      </header>

      {/* Featured: meet the friends */}
      <button className="featured-card" onClick={() => pick('meet')}>
        <span className="friend-cluster" aria-hidden="true">
          <Friend index={0} scale={0.32} showNumber={false} />
          <Friend index={1} scale={0.32} showNumber={false} />
          <Friend index={2} scale={0.32} showNumber={false} />
        </span>
        <span className="featured-text">
          <span className="featured-title">החברים שלי</span>
          <span className="featured-sub">בואו להכיר 👋</span>
        </span>
      </button>

      {CATEGORIES.map((category) => {
        const games = gamesInCategory(category.id)
        if (games.length === 0) return null
        return (
          <section key={category.id} className="home-section">
            <h2 className="home-section-title">{category.title}</h2>
            <nav className="game-grid" aria-label={category.title}>
              {games.map((game) => (
                <button
                  key={game.id}
                  className="game-card"
                  style={{ background: game.color }}
                  onClick={() => pick(game.id)}
                >
                  <span className="game-card-emoji" aria-hidden="true">
                    {game.emoji}
                  </span>
                  <span className="game-card-title">{game.title}</span>
                </button>
              ))}
            </nav>
          </section>
        )
      })}
    </div>
  )
}
