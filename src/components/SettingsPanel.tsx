import { useState } from 'react'
import { updateSettings, useSettings } from '../settings'
import { hasHebrewVoice, speak } from '../speech'
import { playTap, unlockAudio } from '../audio'

// A toggle row with a big, finger-friendly switch.
function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      className="settings-row"
      role="switch"
      aria-checked={value}
      onClick={() => {
        playTap()
        onChange(!value)
      }}
    >
      <span className="settings-row-text">
        <span className="settings-row-label">{label}</span>
        {hint && <span className="settings-row-hint">{hint}</span>}
      </span>
      <span className={`switch ${value ? 'switch-on' : ''}`} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  )
}

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const settings = useSettings()
  const voiceMissing = settings.voice && !hasHebrewVoice()

  return (
    <>
      <button
        className="settings-gear"
        aria-label="הגדרות"
        onClick={() => {
          unlockAudio()
          playTap()
          setOpen(true)
        }}
      >
        ⚙️
      </button>

      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="settings-title">הגדרות</h2>

            <Toggle
              label="🔊 קול בעברית"
              hint="הקראה ועידוד לאסף"
              value={settings.voice}
              onChange={(next) => {
                updateSettings({ voice: next })
                if (next) speak('שלום אסף')
              }}
            />

            {voiceMissing && (
              <p className="settings-warning">
                לא נמצא קול עברי במכשיר הזה. אפשר להתקין קול עברית בהגדרות הטלפון, או להמשיך עם צלילים בלבד.
              </p>
            )}

            <Toggle
              label="🎵 צלילים"
              hint="צלילי מגע והצלחה"
              value={settings.sound}
              onChange={(next) => updateSettings({ sound: next })}
            />

            <Toggle
              label="🗣️ שמות החברים"
              hint="להשמיע את שם/מספר החבר בלחיצה"
              value={settings.sayNames}
              onChange={(next) => updateSettings({ sayNames: next })}
            />

            <div className="settings-row settings-row-static">
              <span className="settings-row-text">
                <span className="settings-row-label">⏱️ החלפת חבר</span>
                <span className="settings-row-hint">במשחק "תופסים חבר"</span>
              </span>
              <span className="settings-choice">
                {[30, 60].map((sec) => (
                  <button
                    key={sec}
                    className={`pill pill-small ${settings.catchSeconds === sec ? 'pill-active' : ''}`}
                    onClick={() => {
                      playTap()
                      updateSettings({ catchSeconds: sec })
                    }}
                  >
                    {sec === 30 ? 'חצי דקה' : 'דקה'}
                  </button>
                ))}
              </span>
            </div>

            <button className="big-button settings-close" onClick={() => setOpen(false)}>
              סגירה
            </button>
          </div>
        </div>
      )}
    </>
  )
}
