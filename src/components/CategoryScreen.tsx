import { gamesInCategory, type Category } from '../games/registry'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'

type Props = {
  category: Category
  onPick: (id: string) => void
  onExit: () => void
}

// The games inside one category. Reuses the game-screen frame so it feels like
// any other screen, with the big "home" button.
export default function CategoryScreen({ category, onPick, onExit }: Props) {
  function tap() {
    unlockAudio()
    stopSpeech()
    playTap()
  }
  const games = gamesInCategory(category.id)

  return (
    <div className="game-screen">
      <header className="game-top-bar">
        <button
          className="back-button"
          onClick={() => {
            tap()
            onExit()
          }}
          aria-label="חזרה למסך הבית"
        >
          <span aria-hidden="true">🏠</span>
          <span>בית</span>
        </button>
        <h1 className="game-title">
          <span aria-hidden="true">{category.emoji}</span> {category.title}
        </h1>
      </header>
      <main className="game-body">
        <nav className="game-grid" aria-label={category.title}>
          {games.map((game) => (
            <button
              key={game.id}
              className="game-card"
              style={{ background: game.color }}
              onClick={() => {
                tap()
                onPick(game.id)
              }}
            >
              <span className="game-card-emoji" aria-hidden="true">
                {game.emoji}
              </span>
              <span className="game-card-title">{game.title}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  )
}
