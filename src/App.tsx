import { useState } from 'react'
import HomeScreen from './components/HomeScreen'
import MeetFriends from './components/MeetFriends'
import DesignGallery from './components/DesignGallery'
import { GAMES } from './games/registry'

export default function App() {
  const [activeId, setActiveId] = useState<string | null>(null)

  const game = GAMES.find((g) => g.id === activeId) ?? null
  const exit = () => setActiveId(null)

  return (
    <div className="app-shell">
      {activeId === 'meet' ? (
        <MeetFriends onExit={exit} />
      ) : activeId === 'gallery' ? (
        <DesignGallery onExit={exit} />
      ) : game ? (
        <game.Component onExit={exit} />
      ) : (
        <HomeScreen onPick={setActiveId} />
      )}
    </div>
  )
}
