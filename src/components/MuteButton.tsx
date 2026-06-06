import { getSettings, updateSettings, useSettings } from '../settings'
import { playTap } from '../audio'
import { useT } from '../i18n'

// Quick voice on/off, on every screen's top bar. The spoken clips can get
// repetitive ("חופר") — one tap silences just the VOICE (sound effects stay),
// without digging into Settings. Mirrors the `voice` setting, so it persists.
export default function MuteButton({ className = 'control-btn' }: { className?: string }) {
  const s = useSettings()
  const { t } = useT()
  return (
    <button
      className={className}
      onClick={() => {
        playTap()
        updateSettings({ voice: !getSettings().voice })
      }}
      aria-label={s.voice ? t('mute.silence') : t('mute.unmute')}
      aria-pressed={!s.voice}
    >
      <span aria-hidden="true">{s.voice ? '🔊' : '🔇'}</span>
    </button>
  )
}
