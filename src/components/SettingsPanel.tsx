import { useState } from 'react'
import { updateSettings, useSettings } from '../settings'
import { DIFFICULTY_TIERS } from '../difficulty'
import { setLang, useT } from '../i18n'
import { LANGS } from '../i18n/types'
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
  const { t, say } = useT()
  const voiceMissing = settings.voice && settings.lang === 'he' && !hasHebrewVoice()

  return (
    <>
      <button
        className="settings-gear"
        aria-label={t('settings.title')}
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
            <h2 className="settings-title">{t('settings.title')}</h2>

            <div className="settings-row settings-row-static">
              <span className="settings-row-text">
                <span className="settings-row-label">🌍 {t('settings.lang')}</span>
              </span>
              <span className="settings-choice">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    className={`pill pill-small ${settings.lang === l.id ? 'pill-active' : ''}`}
                    onClick={() => {
                      playTap()
                      setLang(l.id)
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </span>
            </div>

            <Toggle
              label={t('settings.voice')}
              hint={t('settings.voice.hint')}
              value={settings.voice}
              onChange={(next) => {
                updateSettings({ voice: next })
                if (next) speak(say('settings.hi'))
              }}
            />

            {voiceMissing && <p className="settings-warning">{t('settings.voiceMissing')}</p>}

            <Toggle
              label={t('settings.sound')}
              hint={t('settings.sound.hint')}
              value={settings.sound}
              onChange={(next) => updateSettings({ sound: next })}
            />

            <Toggle
              label={t('settings.names')}
              hint={t('settings.names.hint')}
              value={settings.sayNames}
              onChange={(next) => updateSettings({ sayNames: next })}
            />

            <Toggle
              label={t('settings.motion')}
              hint={t('settings.motion.hint')}
              value={settings.reduceMotion}
              onChange={(next) => updateSettings({ reduceMotion: next })}
            />

            <div className="settings-row settings-row-static settings-row-stack">
              <span className="settings-row-text">
                <span className="settings-row-label">{t('settings.difficulty')}</span>
                <span className="settings-row-hint">{t('settings.difficulty.hint')}</span>
              </span>
              <span className="settings-choice settings-choice-wide">
                {DIFFICULTY_TIERS.map((_, i) => (
                  <button
                    key={i}
                    className={`pill pill-small ${settings.difficulty === i ? 'pill-active' : ''}`}
                    onClick={() => {
                      playTap()
                      updateSettings({ difficulty: i })
                    }}
                  >
                    {t(`diff.${i}`)}
                  </button>
                ))}
              </span>
            </div>

            <div className="settings-row settings-row-static">
              <span className="settings-row-text">
                <span className="settings-row-label">{t('settings.catch')}</span>
                <span className="settings-row-hint">{t('settings.catch.hint')}</span>
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
                    {sec === 30 ? t('settings.catch.half') : t('settings.catch.min')}
                  </button>
                ))}
              </span>
            </div>

            <button className="big-button settings-close" onClick={() => setOpen(false)}>
              {t('settings.close')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
