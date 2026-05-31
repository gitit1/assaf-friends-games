import { useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import CategoryScreen from './components/CategoryScreen'
import MeetFriends from './components/MeetFriends'
import DesignGallery from './components/DesignGallery'
import { GAMES, CATEGORIES } from './games/registry'

// Tiny hash router so a refresh keeps you on the same screen and the browser
// Back button works (handy for testing). Routes:
//   #/                home (category cubes)
//   #/meet            meet the friends
//   #/gallery         design gallery
//   #/cat/<id>        a category's game list
//   #/game/<id>       a game
type Route =
  | { kind: 'home' }
  | { kind: 'meet' }
  | { kind: 'gallery' }
  | { kind: 'cat'; id: string }
  | { kind: 'game'; id: string }

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  if (h === '') return { kind: 'home' }
  if (h === 'meet') return { kind: 'meet' }
  if (h === 'gallery') return { kind: 'gallery' }
  const [seg, id] = h.split('/')
  if (seg === 'cat' && id) return { kind: 'cat', id }
  if (seg === 'game' && id) return { kind: 'game', id }
  return { kind: 'home' }
}

function go(path: string) {
  window.location.hash = `#/${path}`
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  // scroll to top when the screen changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const home = () => go('')

  let view = <HomeScreen onOpen={(id) => go(id)} onOpenCategory={(id) => go(`cat/${id}`)} />

  if (route.kind === 'meet') {
    view = <MeetFriends onExit={home} />
  } else if (route.kind === 'gallery') {
    view = <DesignGallery onExit={home} />
  } else if (route.kind === 'game') {
    const game = GAMES.find((g) => g.id === route.id)
    if (game) view = <game.Component onExit={home} />
  } else if (route.kind === 'cat') {
    const category = CATEGORIES.find((c) => c.id === route.id)
    if (category) view = <CategoryScreen category={category} onPick={(id) => go(`game/${id}`)} onExit={home} />
  }

  return <div className="app-shell">{view}</div>
}
