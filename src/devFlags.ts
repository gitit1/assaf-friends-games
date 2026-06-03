// Developer-only flags, controlled by the .env / .env.local files (Vite VITE_*).
// These are evaluated at startup; restart the dev server after editing .env*.

/**
 * Touch / kiosk lock. When on, the app blocks the browser's default touch
 * behaviour (focus stealing, text selection, zoom, scroll, ghost clicks) while
 * keeping buttons working. See src/useTouchLock.ts for what it actually does.
 *
 * Gated on `import.meta.env.DEV` as well as the flag, so it is ONLY ever active
 * in `npm run dev` — a production build (`vite build`) always leaves it off,
 * no matter what .env says. Toggle it via VITE_TOUCH_LOCK in .env.
 */
export const TOUCH_LOCK = import.meta.env.DEV && import.meta.env.VITE_TOUCH_LOCK === 'true'
