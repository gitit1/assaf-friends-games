// One-time generator for the natural-voice clips (replaces the robotic TTS for
// fixed lines). Writes .mp3 files to public/voice/ which the app plays
// (src/voice.ts). Missing clips just fall back to the browser voice.
//
// Pick a provider with VOICE_PROVIDER (default: elevenlabs).
//
//  ── elevenlabs ──  (no credit card, free ~10k chars/month, one run does all)
//     key: https://elevenlabs.io  →  Profile → API key
//     PowerShell:  $env:ELEVENLABS_API_KEY="KEY"; node scripts/gen-voice.mjs
//     (optional voice: $env:ELEVENLABS_VOICE_ID="...")
//
//  ── google ──  (best Hebrew; may require enabling billing on the project,
//     but stays within the free tier — no charge)
//     key: https://console.cloud.google.com → enable "Cloud Text-to-Speech API"
//          → Credentials → API key
//     PowerShell:  $env:VOICE_PROVIDER="google"; $env:GOOGLE_TTS_KEY="KEY"; node scripts/gen-voice.mjs
//     (optional voice: $env:GOOGLE_TTS_VOICE="he-IL-Wavenet-D")
//
// Then:  git add public/voice && git commit -m "voice clips" && git push
import { writeFileSync, mkdirSync } from 'node:fs'

const PROVIDER = process.env.VOICE_PROVIDER || 'elevenlabs'
const DELAY = Number(process.env.VOICE_DELAY || 500) // ms between calls

// keep these in sync with the app (friends.ts / util.ts / FriendWorld.tsx)
const SAY = ['לוּלוּ','טוּקִי','בּוּבִּי','גוּגוּ','מִימִי','נוּנִי','פִּיקוֹ','דוּדִי','זוּזוּ','קוּקוֹ','טוֹטוֹ','לִילִי','מוֹמוֹ','רִיקִי','שׁוּשׁוּ','גִילִי','רוֹנִי','יוֹיוֹ','סוֹפִי','קִיקִי','רוֹמִי','נִינִי','פּוּפִּי','תּוּתִי','מִישִׁי','בּוּזִי','דַּגִּי','לַאלָה','חוּמִי','צוּצִי']
const COLOR = ['אדום','כתום','צהוב','ירוק','טורקיז','תכלת','כחול','סגול','ורוד','ורוד','אדום','כתום','צהוב','ירוק','טורקיז','תכלת','כחול','סגול','ורוד','אדום','ורוד','כתום','צהוב','ירוק','ירוק','טורקיז','כחול','סגול','ורוד','אדום']
const NUM = ['אחת','שתיים','שלוש','ארבע','חמש','שש','שבע','שמונה','תשע','עשר','אחת עשרה','שתים עשרה','שלוש עשרה','ארבע עשרה','חמש עשרה','שש עשרה','שבע עשרה','שמונה עשרה','תשע עשרה','עשרים','עשרים ואחת','עשרים ושתיים','עשרים ושלוש','עשרים וארבע','עשרים וחמש','עשרים ושש','עשרים ושבע','עשרים ושמונה','עשרים ותשע','שלושים']
const LIKES = ['לקפוץ','לרקוד','לצחוק','להתחבק','לשיר','לספור','לשחק מחבואים','לאכול גלידה','לצייר','לעשות בועות','לשחק בכדור','לחלק נשיקות']

const lines = []
for (let i = 0; i < 30; i++) {
  lines.push({ id: `intro-${i}`, text: `שלום! אני ${SAY[i]}, אני המספר ${NUM[i]}! הצבע שלי ${COLOR[i]}. הכי כיף לי ${LIKES[i % LIKES.length]}. בואו נשחק!` })
}
for (let k = 1; k <= 30; k++) lines.push({ id: `num-${k}`, text: NUM[k - 1] })
lines.push({ id: 'fx-five', text: 'כיף!' }, { id: 'fx-hug', text: 'חיבוק גדול!' }, { id: 'fx-kiss', text: 'מְמְמוּאָה! נשיקה!' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let synth
if (PROVIDER === 'google') {
  const KEY = process.env.GOOGLE_TTS_KEY
  const VOICE = process.env.GOOGLE_TTS_VOICE || 'he-IL-Wavenet-B'
  if (!KEY) throw new Error('חסר GOOGLE_TTS_KEY')
  console.log(`ספק: Google Cloud TTS · קול ${VOICE}`)
  synth = async (text) => {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text }, voice: { languageCode: 'he-IL', name: VOICE }, audioConfig: { audioEncoding: 'MP3', speakingRate: 0.96 } }),
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    return Buffer.from((await res.json()).audioContent, 'base64')
  }
} else {
  const KEY = process.env.ELEVENLABS_API_KEY
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // "Sarah"
  if (!KEY) throw new Error('חסר ELEVENLABS_API_KEY')
  console.log(`ספק: ElevenLabs · voice ${VOICE_ID}`)
  synth = async (text) => {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    })
    if (res.status === 429) throw new Error('429 rate limit')
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    return Buffer.from(await res.arrayBuffer())
  }
}

mkdirSync('public/voice', { recursive: true })
let ok = 0
for (const l of lines) {
  let done = false
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    try {
      const mp3 = await synth(l.text)
      writeFileSync(`public/voice/${l.id}.mp3`, mp3)
      ok++
      done = true
      console.log(`✓ ${l.id}`)
    } catch (e) {
      if (String(e.message).includes('429') && attempt < 2) {
        console.log('  …מחכה (rate limit)')
        await sleep(15000)
      } else {
        console.error(`❌ ${l.id}: ${e.message}`)
        done = true
      }
    }
  }
  await sleep(DELAY)
}
console.log(`\nנוצרו ${ok}/${lines.length} קליפים ב-public/voice/`)
