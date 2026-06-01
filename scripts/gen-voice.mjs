// One-time generator for the natural-voice clips (replaces the robotic TTS for
// fixed lines), using Google's **Gemini TTS**. Writes .wav files to public/voice/
// which the app plays (see src/voice.ts). If a clip is missing the app simply
// falls back to the browser voice, so nothing breaks.
//
//   1) Get a free key (one click): https://aistudio.google.com/apikey
//   2) Run (PowerShell):  $env:GEMINI_API_KEY="YOUR_KEY"; node scripts/gen-voice.mjs
//      Run (bash):        GEMINI_API_KEY=YOUR_KEY node scripts/gen-voice.mjs
//   3) git add public/voice && git commit -m "voice clips" && git push
//
// Pick a voice with GEMINI_TTS_VOICE (default 'Leda', a bright young voice).
// Others: Aoede, Callirrhoe, Kore, Puck, Zephyr, Leda, Sulafat, Vindemiatrix…
import { writeFileSync, mkdirSync } from 'node:fs'

const KEY = process.env.GEMINI_API_KEY
const VOICE = process.env.GEMINI_TTS_VOICE || 'Leda'
const MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts'
const DELAY = Number(process.env.GEMINI_DELAY || 1500) // ms between calls (free-tier rate limits)
if (!KEY) {
  console.error('❌ חסר מפתח. הריצי:  GEMINI_API_KEY=... node scripts/gen-voice.mjs')
  process.exit(1)
}

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

function wavHeader(dataLen, rate = 24000, channels = 1, bits = 16) {
  const b = Buffer.alloc(44)
  b.write('RIFF', 0)
  b.writeUInt32LE(36 + dataLen, 4)
  b.write('WAVE', 8)
  b.write('fmt ', 12)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20)
  b.writeUInt16LE(channels, 22)
  b.writeUInt32LE(rate, 24)
  b.writeUInt32LE((rate * channels * bits) / 8, 28)
  b.writeUInt16LE((channels * bits) / 8, 32)
  b.writeUInt16LE(bits, 34)
  b.write('data', 36)
  b.writeUInt32LE(dataLen, 40)
  return b
}

async function synth(text, tries = 2) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Read aloud in a warm, cheerful, friendly voice for a small child:\n${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    },
  )
  if (res.status === 429 && tries > 0) {
    console.log('  …מחכה (rate limit)')
    await sleep(20000)
    return synth(text, tries - 1)
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  const json = await res.json()
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
  if (!part) throw new Error('no audio in response')
  const rate = Number((String(part.inlineData.mimeType).match(/rate=(\d+)/) || [])[1]) || 24000
  const pcm = Buffer.from(part.inlineData.data, 'base64')
  return Buffer.concat([wavHeader(pcm.length, rate), pcm])
}

mkdirSync('public/voice', { recursive: true })
let ok = 0
for (const l of lines) {
  try {
    const wav = await synth(l.text)
    writeFileSync(`public/voice/${l.id}.wav`, wav)
    ok++
    console.log(`✓ ${l.id}`)
  } catch (e) {
    console.error(`❌ ${l.id}: ${e.message}`)
  }
  await sleep(DELAY)
}
console.log(`\nנוצרו ${ok}/${lines.length} קליפים ב-public/voice/ עם הקול ${VOICE} (${MODEL})`)
