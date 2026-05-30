import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import CategoryScreen from './components/CategoryScreen'
import MeetFriends from './components/MeetFriends'
import DesignGallery from './components/DesignGallery'
import { GAMES, CATEGORIES, type CategoryId } from './games/registry'

export default function App() {
  // What's open: a game / 'meet' / 'gallery' (activeId), or a category list
  // (activeCat). Home shows the category cubes when both are null.
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<CategoryId | null>(null)

  const game = GAMES.find((g) => g.id === activeId) ?? null
  const category = CATEGORIES.find((c) => c.id === activeCat) ?? null
  const goHome = () => {
    setActiveId(null)
    setActiveCat(null)
  }

  let view
  if (activeId === 'meet') {
    view = <MeetFriends onExit={goHome} />
  } else if (activeId === 'gallery') {
    view = <DesignGallery onExit={goHome} />
  } else if (game) {
    view = <game.Component onExit={goHome} />
  } else if (category) {
    view = <CategoryScreen category={category} onPick={setActiveId} onExit={() => setActiveCat(null)} />
  } else {
    view = <HomeScreen onOpen={setActiveId} onOpenCategory={setActiveCat} />
  }

  return <div className="app-shell">{view}</div>
}
