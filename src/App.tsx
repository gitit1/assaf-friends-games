import { lazy, Suspense, useEffect, useState } from 'react'
import HomeScreen from './components/HomeScreen'
import CategoryScreen from './components/CategoryScreen'
import MeetFriends from './components/MeetFriends'
import FriendWorld from './components/FriendWorld'
import { GAMES, CATEGORIES } from './games/registry'
import { FRIENDS } from './friends'

// 3D screen pulls in Three.js — load it only when opened, so it never weighs
// down the first paint of the rest of the app.
const Friend3D = lazy(() => import('./components/Friend3D'))

// Tiny hash router so a refresh keeps you on the same screen and the browser
// Back button works (handy for testing). Routes:
//   #/                home (category cubes)
//   #/meet            meet the friends
//   #/gallery         3D friend (Three.js)
//   #/cat/<id>        a category's game list
//   #/game/<id>       a game
type Route =
  | { kind: 'home' }
  | { kind: 'meet' }
  | { kind: 'gallery' }
  | { kind: 'friend'; id: string }
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
  if (seg === 'friend' && id) return { kind: 'friend', id }
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
    view = <MeetFriends onExit={home} onOpen={(i) => go(`friend/${i}`)} />
  } else if (route.kind === 'friend') {
    const i = Number(route.id)
    if (i >= 0 && i < FRIENDS.length)
      view = <FriendWorld index={i} onExit={() => go('meet')} onNavigate={(j) => go(`friend/${j}`)} />
  } else if (route.kind === 'gallery') {
    view = (
      <Suspense fallback={<p className="three-loading">טוען תלת מימד… 🧊</p>}>
        <Friend3D onExit={home} />
      </Suspense>
    )
  } else if (route.kind === 'game') {
    const game = GAMES.find((g) => g.id === route.id)
    if (game) view = <game.Component onExit={home} />
  } else if (route.kind === 'cat') {
    const category = CATEGORIES.find((c) => c.id === route.id)
    if (category) view = <CategoryScreen category={category} onPick={(id) => go(`game/${id}`)} onExit={home} />
  }

  return <div className="app-shell">{view}</div>
}
