// A reusable burst of confetti that rains over the WHOLE app (fixed, full-screen,
// never blocks taps). Render <Confetti active={done} /> in any game — when `active`
// turns true it falls once. Deterministic per-index variety (no re-render jitter),
// and it's automatically calmed away by the global reduce-motion rule.
const COLORS = ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#fb7185', '#4ade80']
const PIECES = 42

export default function Confetti({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: PIECES }).map((_, i) => {
        const left = (i * 829) % 100 // spread across the width
        const delay = ((i * 53) % 70) / 100 // 0–0.7s
        const dur = 2.1 + ((i * 31) % 13) / 10 // 2.1–3.3s
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              background: COLORS[i % COLORS.length],
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        )
      })}
    </div>
  )
}
