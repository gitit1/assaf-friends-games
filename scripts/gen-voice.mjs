// One-time generator for the natural-voice clips. Writes .mp3 files to
// public/voice/ which the app plays (src/voice.ts); a missing clip falls back to
// the browser voice, so everything works with or without these.
//
// DEFAULT provider is 'edge' — Microsoft's NATURAL neural voices via the Edge
// Read-Aloud service: FREE, no key, no card. Hebrew = he-IL-HilaNeural (natural,
// not robotic). Just run:
//     node scripts/gen-voice.mjs                     // Hebrew (voice/he)
//     $env:VOICE_LANG="en"; node scripts/gen-voice.mjs   // English (voice/en)
// then:  git add public/voice && git commit -m "voice clips" && git push
//
// Other providers stay available: 'gtx' (Google-translate free, robotic),
// 'azure' (needs key), 'google' (needs key). Pick a voice with EDGE_VOICE.
import { writeFileSync, mkdirSync } from 'node:fs'

const PROVIDER = process.env.VOICE_PROVIDER || 'edge'
const LANG = process.env.VOICE_LANG || 'he' // writes to public/voice/<LANG>/
const SPEED = Number(process.env.VOICE_SPEED || 0.9)
const DELAY = Number(process.env.VOICE_DELAY || 600)

// ── data (kept in sync with friends.ts / FriendWorld.tsx), 1–50 ──
const NAME = ['לולו','טוקי','בובי','גוגו','מימי','נוני','פיקו','דודי','זוזו','קוקו','טוטו','לילי','מומו','ריקי','שושו','גילי','רוני','יויו','סופי','קיקי','רומי','ניני','פופי','תותי','מישי','בוזי','דגי','לאלה','חומי','צוצי','טינו','רוזי','ליאו','מיקה','גוזי','בינו','טופי','קימי','שומי','דיני','פפו','ניבי','לוקי','ריו','מיו','גוני','בובא','קלי','שיר','דנה']
const COLOR = ['אדום','כתום','צהוב','ירוק','טורקיז','תכלת','כחול','סגול','ורוד','ורוד','אדום','כתום','צהוב','ירוק','טורקיז','תכלת','כחול','סגול','ורוד','אדום','ורוד','כתום','צהוב','ירוק','ירוק','טורקיז','כחול','סגול','ורוד','אדום','אדום','כתום','צהוב','ירוק','ירוק','טורקיז','תכלת','כחול','סגול','ורוד','ורוד','כתום','צהוב','ירוק','ירוק','טורקיז','תכלת','כחול','סגול','ורוד']
const LIKES = ['לקפוץ','לרקוד','לצחוק','להתחבק','לשיר','לספור','לשחק מחבואים','לאכול גלידה','לצייר','לעשות בועות','לשחק בכדור','לחלק נשיקות']

const ONES = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע']
const TEENS = ['עשר', 'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה', 'שבע עשרה', 'שמונה עשרה', 'תשע עשרה']
const TENS = { 20: 'עשרים', 30: 'שלושים', 40: 'ארבעים', 50: 'חמישים' }
function numWord(n) {
  if (n <= 9) return ONES[n]
  if (n <= 19) return TEENS[n - 10]
  const t = n - (n % 10)
  const u = n % 10
  if (TENS[t]) return u === 0 ? TENS[t] : `${TENS[t]} ו${ONES[u]}`
  return String(n)
}

const lines = []
for (let k = 1; k <= 50; k++) lines.push({ id: `num-${k}`, text: numWord(k) })
for (let i = 0; i < 50; i++) {
  lines.push({ id: `intro-${i}`, text: `שלום! אני ${NAME[i]}, אני המספר ${numWord(i + 1)}! הצבע שלי ${COLOR[i]}. הכי כיף לי ${LIKES[i % LIKES.length]}. בואו נשחק!` })
}
lines.push({ id: 'fx-five', text: 'כיף!' }, { id: 'fx-hug', text: 'חיבוק גדול!' }, { id: 'fx-kiss', text: 'נשיקה!' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const OUT = `public/voice/${LANG}`
mkdirSync(OUT, { recursive: true })

let synth
if (PROVIDER === 'edge') {
  // Microsoft Edge neural voices — natural, free, no key.
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts')
  const VOICE = process.env.EDGE_VOICE || (LANG === 'he' ? 'he-IL-HilaNeural' : 'en-US-AvaNeural')
  console.log(`ספק: Edge Neural (חינם, בלי מפתח) · קול ${VOICE} · שפה ${LANG} · ${lines.length} קליפים`)
  const connect = async () => {
    const t = new MsEdgeTTS()
    await t.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    return t
  }
  let tts = await connect()
  synth = async (text) => {
    let lastErr
    for (let i = 0; i < 2; i++) {
      try {
        const { audioStream } = await tts.toStream(text)
        const chunks = []
        await new Promise((res, rej) => {
          audioStream.on('data', (c) => chunks.push(c))
          audioStream.on('end', res)
          audioStream.on('error', rej)
        })
        const buf = Buffer.concat(chunks)
        if (buf.length < 800) throw new Error('empty')
        return buf
      } catch (e) {
        lastErr = e
        tts = await connect() // reconnect and retry once
      }
    }
    throw lastErr
  }
} else if (PROVIDER === 'gtx') {
  console.log(`ספק: Google Translate (חינם, בלי מפתח) · ${lines.length} קליפים`)
  synth = async (text) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=he&client=tw-ob&total=1&idx=0&textlen=${text.length}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) throw new Error(`${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 800) throw new Error('clip too small')
    return buf
  }
} else if (PROVIDER === 'azure') {
  // Microsoft Azure Neural TTS — natural Hebrew (Hila/Avri) + English. Free tier
  // 500K chars/month. Needs an Azure Speech resource: key + region.
  //   $env:VOICE_PROVIDER="azure"; $env:AZURE_TTS_KEY="KEY"; $env:AZURE_TTS_REGION="westeurope"; node scripts/gen-voice.mjs
  const KEY = process.env.AZURE_TTS_KEY
  const REGION = process.env.AZURE_TTS_REGION
  if (!KEY || !REGION) throw new Error('חסר AZURE_TTS_KEY / AZURE_TTS_REGION')
  const VOICE = process.env.AZURE_TTS_VOICE || (LANG === 'he' ? 'he-IL-HilaNeural' : 'en-US-JennyNeural')
  const XML_LANG = LANG === 'he' ? 'he-IL' : 'en-US'
  const rate = `${Math.round((SPEED - 1) * 100)}%`
  console.log(`ספק: Azure Neural · קול ${VOICE} · שפה ${LANG}`)
  synth = async (text) => {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const ssml = `<speak version='1.0' xml:lang='${XML_LANG}'><voice name='${VOICE}'><prosody rate='${rate}'>${esc}</prosody></voice></speak>`
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      },
      body: ssml,
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    return Buffer.from(await res.arrayBuffer())
  }
} else if (PROVIDER === 'google') {
  const KEY = process.env.GOOGLE_TTS_KEY
  const VOICE = process.env.GOOGLE_TTS_VOICE || 'he-IL-Wavenet-C'
  if (!KEY) throw new Error('חסר GOOGLE_TTS_KEY')
  console.log(`ספק: Google Cloud TTS · קול ${VOICE}`)
  synth = async (text) => {
    const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text }, voice: { languageCode: 'he-IL', name: VOICE }, audioConfig: { audioEncoding: 'MP3', speakingRate: SPEED } }),
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    return Buffer.from((await res.json()).audioContent, 'base64')
  }
} else {
  throw new Error(`ספק לא מוכר: ${PROVIDER}`)
}

let ok = 0
for (const l of lines) {
  let done = false
  for (let attempt = 0; attempt < 4 && !done; attempt++) {
    try {
      writeFileSync(`${OUT}/${l.id}.mp3`, await synth(l.text))
      ok++
      done = true
      if (ok % 10 === 0 || ok === lines.length) console.log(`  …${ok}/${lines.length}`)
    } catch (e) {
      const code = String(e.message)
      if ((code.includes('429') || code.includes('too small')) && attempt < 3) {
        await sleep(4000 * (attempt + 1))
      } else {
        console.error(`❌ ${l.id}: ${e.message}`)
        done = true
      }
    }
  }
  await sleep(DELAY)
}
console.log(`\nנוצרו ${ok}/${lines.length} קליפים ב-public/voice/`)
