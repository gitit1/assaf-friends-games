// One-time generator for the natural-voice clips (replaces the robotic TTS for
// fixed lines). Writes .mp3 files to public/voice/ which the app plays
// (src/voice.ts). Missing clips just fall back to the browser voice.
//
// Pick a provider with VOICE_PROVIDER (default: elevenlabs). Slow/speed with
// VOICE_SPEED (default 0.85 = a bit slower; ElevenLabs range 0.7–1.2).
//
//  ── hear the voices first (ElevenLabs) ──
//     $env:ELEVENLABS_API_KEY="KEY"; node scripts/gen-voice.mjs samples
//     → makes public/voice/_sample-<name>.mp3 for each FEMALE voice + prints IDs.
//       Listen, then regenerate with your pick:
//     $env:ELEVENLABS_VOICE_ID="THE_ID"; $env:ELEVENLABS_API_KEY="KEY"; node scripts/gen-voice.mjs
//
//  ── google (best Hebrew) ──
//     $env:VOICE_PROVIDER="google"; $env:GOOGLE_TTS_KEY="KEY"; node scripts/gen-voice.mjs
//     female Hebrew voices: he-IL-Wavenet-A or he-IL-Wavenet-C (set GOOGLE_TTS_VOICE)
//
// Then:  git add public/voice; git commit -m "voice clips"; git push
import { writeFileSync, mkdirSync } from 'node:fs'

const PROVIDER = process.env.VOICE_PROVIDER || 'elevenlabs'
const MODE = process.argv[2] // 'samples' (optional)
const SPEED = Number(process.env.VOICE_SPEED || 0.85)
const DELAY = Number(process.env.VOICE_DELAY || 500)

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
const SAMPLE_TEXT = 'שלום! אני חבר מספר חמש. בואו נשחק ביחד, יהיה ממש כיף!'
mkdirSync('public/voice', { recursive: true })

let synth

if (PROVIDER === 'google') {
  const KEY = process.env.GOOGLE_TTS_KEY
  const VOICE = process.env.GOOGLE_TTS_VOICE || 'he-IL-Wavenet-C' // C/A = female, B/D = male
  if (!KEY) throw new Error('חסר GOOGLE_TTS_KEY')
  console.log(`ספק: Google Cloud TTS · קול ${VOICE} · מהירות ${SPEED}`)
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
  const KEY = process.env.ELEVENLABS_API_KEY
  if (!KEY) throw new Error('חסר ELEVENLABS_API_KEY')
  const speed = Math.min(1.2, Math.max(0.7, SPEED))
  const make = (voiceId) => async (text) => {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed } }),
    })
    if (res.status === 429) throw new Error('429 rate limit')
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    return Buffer.from(await res.arrayBuffer())
  }

  // "samples" mode: make one Hebrew sample per female voice in the account
  if (MODE === 'samples') {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': KEY } })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
    const all = (await res.json()).voices || []
    const females = all.filter((v) => String(v.labels?.gender || '').toLowerCase() === 'female')
    const list = females.length ? females : all
    console.log(`קולות אישה (${list.length}) — מייצר דוגמה לכל אחד · מהירות ${speed}:\n`)
    for (const v of list) {
      try {
        writeFileSync(`public/voice/_sample-${v.name}.mp3`, await make(v.voice_id)(SAMPLE_TEXT))
        console.log(`✓  ${v.name}   →   ${v.voice_id}`)
      } catch (e) {
        console.error(`❌ ${v.name}: ${e.message}`)
      }
      await sleep(DELAY)
    }
    console.log('\nפתחי את הקבצים public/voice/_sample-*.mp3, בחרי קול, ואז הריצי שוב עם:')
    console.log('  $env:ELEVENLABS_VOICE_ID="<המזהה_שבחרת>"; $env:ELEVENLABS_API_KEY="..."; node scripts/gen-voice.mjs')
    process.exit(0)
  }

  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' // "Sarah" (female)
  console.log(`ספק: ElevenLabs · voice ${VOICE_ID} · מהירות ${speed}`)
  synth = make(VOICE_ID)
}

let ok = 0
for (const l of lines) {
  let done = false
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    try {
      writeFileSync(`public/voice/${l.id}.mp3`, await synth(l.text))
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
