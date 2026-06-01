import { CATEGORIES, gamesInCategory, type CategoryId } from '../games/registry'
import Friend from './Friend'
import SettingsPanel from './SettingsPanel'
import FullscreenButton from './FullscreenButton'
import { playTap, unlockAudio } from '../audio'
import { stopSpeech } from '../speech'

type HomeScreenProps = {
  // open a special screen: 'meet' (meet the friends) or 'gallery'
  onOpen: (id: string) => void
  // open a category's game list
  onOpenCategory: (id: CategoryId) => void
}

export default function HomeScreen({ onOpen, onOpenCategory }: HomeScreenProps) {
  function tap() {
    unlockAudio()
    stopSpeech()
    playTap()
  }
  function open(id: string) {
    tap()
    onOpen(id)
  }
  function openCategory(id: CategoryId) {
    tap()
    onOpenCategory(id)
  }

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="home-controls">
          <button className="gallery-button" aria-label="גלריית עיצובים" onClick={() => open('gallery')}>
            🎨
          </button>
          <FullscreenButton />
          <SettingsPanel />
        </div>
        <h1 className="home-title">
          <span aria-hidden="true">🌟</span> עולם החברים
        </h1>
      </header>

      {/* Featured: meet the friends */}
      <button className="featured-card" onClick={() => open('meet')}>
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

      {/* Category cubes — tap one to see its games */}
      <nav className="category-grid" aria-label="קטגוריות">
        {CATEGORIES.map((category) => {
          if (gamesInCategory(category.id).length === 0) return null
          return (
            <button
              key={category.id}
              className="category-card"
              style={{ background: category.color }}
              onClick={() => openCategory(category.id)}
            >
              <span className="category-cover" aria-hidden="true">
                <span className="category-cover-emoji">{category.emoji}</span>
              </span>
              <span className="category-title">{category.title}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
