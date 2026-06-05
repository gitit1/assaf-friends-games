// Registers the offline service worker (see public/sw.js). Production only, so
// dev never caches. Updates apply on the next launch — no surprise reloads,
// which keeps things calm for a sensory-sensitive child.
export function registerSW() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a bonus — never block the app on it */
    })
  })
}
