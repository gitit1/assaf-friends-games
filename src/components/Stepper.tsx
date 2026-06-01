import type { ReactNode } from 'react'

// A shared "◀ label ▶" stepper for browsing between things (e.g. friends).
// The row forces direction:ltr so the arrows always sit on the correct side
// and point the right way, even inside the RTL (Hebrew) layout — the label
// itself stays RTL.
type Props = {
  label: ReactNode
  onPrev: () => void
  onNext: () => void
  prevLabel?: string
  nextLabel?: string
}

export default function Stepper({ label, onPrev, onNext, prevLabel = 'הקודם', nextLabel = 'הבא' }: Props) {
  return (
    <div className="stepper">
      <button type="button" className="stepper-arrow" onClick={onPrev} aria-label={prevLabel}>
        ◀
      </button>
      <span className="stepper-label">{label}</span>
      <button type="button" className="stepper-arrow" onClick={onNext} aria-label={nextLabel}>
        ▶
      </button>
    </div>
  )
}
