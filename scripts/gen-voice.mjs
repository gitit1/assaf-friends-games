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

// ── data (Hebrew, fully NIQQUD so the neural voice pronounces it right;
//    kept in sync with friends.ts / FriendWorld.tsx), 1–50.
//    No colours: many friends are multi-coloured, so a single colour is wrong. ──
const NAME = ['לוּלוּ','טוּקִי','בּוּבִּי','גוּגוּ','מִימִי','נוּנִי','פִּיקוֹ','דוּדִי','זוּזוּ','קוּקוֹ','טוֹטוֹ','לִילִי','מוֹמוֹ','רִיקִי','שׁוּשׁוּ','גִילִי','רוֹנִי','יוֹיוֹ','סוֹפִי','קִיקִי','רוֹמִי','נִינִי','פּוּפִּי','תּוּתִי','מִישִׁי','בּוּזִי','דַּגִּי','לַאלָה','חוּמִי','צוּצִי','טִינוֹ','רוֹזִי','לֵיאוֹ','מִיקָה','גוּזִי','בִּינוֹ','טוֹפִי','קִימִי','שׁוּמִי','דִּינִי','פַּפּוֹ','נִיבִּי','לוּקִי','רִיוֹ','מִיוֹ','גוֹנִי','בּוּבָּה','קָלִי','שִׁיר','דָּנָה']
const LIKES = ['לִקְפּוֹץ','לִרְקוֹד','לִצְחוֹק','לְהִתְחַבֵּק','לָשִׁיר','לִסְפּוֹר','לְשַׂחֵק מַחֲבוֹאִים','לֶאֱכוֹל גְּלִידָה','לְצַיֵּיר','לַעֲשׂוֹת בּוּעוֹת','לְשַׂחֵק בְּכַדּוּר','לְחַלֵּק נְשִׁיקוֹת']
// short exclamation said when a friend's own "special" button is tapped (like-<n>);
// order matches LIKES / FriendWorld.tsx
const LIKE_FX = ['קְפִיצָה!','רִיקוּד!','צְחוֹק!','חִיבּוּק!','שִׁיר!','סְפִירָה!','מַחֲבוֹאִים!','גְּלִידָה!','צִיּוּר!','בּוּעוֹת!','כַּדּוּר!','נְשִׁיקוֹת!']

// Several intro shapes so not every friend says the exact same sentence. Each is
// short + exclamatory (energy) and avoids the bare word "כיף" (it clashed with the
// high-five button). Picked by index so a friend's intro is stable but varied.
const TEMPLATES = [
  (name, num, like) => `שָׁלוֹם!! אֲנִי ${name}, הַמִּסְפָּר ${num}! אֲנִי מַמָּשׁ אוֹהֵב ${like}! בּוֹאוּ נְשַׂחֵק יַחַד!`,
  (name, num, like) => `הֵיי! קוֹרְאִים לִי ${name}, וַאֲנִי הַמִּסְפָּר ${num}! בּוֹאוּ ${like} אִתִּי!`,
  (name, num, like) => `וָואוּ, מָצָאתֶם אוֹתִי! אֲנִי ${name}, הַמִּסְפָּר ${num}! אֲנִי נֶהֱנֶה ${like} כָּל הַיּוֹם!`,
  (name, num, like) => `שָׁלוֹם שָׁלוֹם! ${name} כָּאן, הַמִּסְפָּר ${num}! אֲנִי אוֹהֵב ${like}, בּוֹאוּ אִתִּי!`,
  (name, num, like) => `הִינֵה אֲנִי, ${name}! הַמִּסְפָּר ${num}! יוֹתֵר מִכֹּל אֲנִי אוֹהֵב ${like}! נֵצֵא לְשַׂחֵק?`,
]

const ONES = ['', 'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע']
const TEENS = ['עֶשֶׂר', 'אַחַת עֶשְׂרֵה', 'שְׁתֵּים עֶשְׂרֵה', 'שְׁלוֹשׁ עֶשְׂרֵה', 'אַרְבַּע עֶשְׂרֵה', 'חֲמֵשׁ עֶשְׂרֵה', 'שֵׁשׁ עֶשְׂרֵה', 'שְׁבַע עֶשְׂרֵה', 'שְׁמוֹנֶה עֶשְׂרֵה', 'תְּשַׁע עֶשְׂרֵה']
const TENS = { 20: 'עֶשְׂרִים', 30: 'שְׁלוֹשִׁים', 40: 'אַרְבָּעִים', 50: 'חֲמִשִּׁים' }
function numWord(n) {
  if (n <= 9) return ONES[n]
  if (n <= 19) return TEENS[n - 10]
  const t = n - (n % 10)
  const u = n % 10
  if (TENS[t]) return u === 0 ? TENS[t] : `${TENS[t]} ${u === 2 || u === 8 ? 'וּ' : 'וְ'}${ONES[u]}`
  return String(n)
}

const lines = []
for (let k = 1; k <= 50; k++) lines.push({ id: `num-${k}`, text: numWord(k) })
for (let i = 0; i < 50; i++) {
  const intro = TEMPLATES[i % TEMPLATES.length](NAME[i], numWord(i + 1), LIKES[i % LIKES.length])
  lines.push({ id: `intro-${i}`, text: intro })
}
for (let i = 0; i < LIKE_FX.length; i++) lines.push({ id: `like-${i}`, text: LIKE_FX[i] })
lines.push({ id: 'fx-five', text: 'כֵּיף!' }, { id: 'fx-hug', text: 'חִיבּוּק גָּדוֹל!' }, { id: 'fx-kiss', text: 'נְשִׁיקָה!' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const OUT = `public/voice/${LANG}`
mkdirSync(OUT, { recursive: true })

let synth
if (PROVIDER === 'edge') {
  // Microsoft Edge neural voices — natural, free, no key.
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts')
  const VOICE = process.env.EDGE_VOICE || (LANG === 'he' ? 'he-IL-HilaNeural' : 'en-US-AvaNeural')
  // A touch higher + a touch faster = lively/energetic, not robotic (for a kid).
  const PROSODY = { pitch: process.env.EDGE_PITCH || '+12%', rate: process.env.EDGE_RATE || '+6%' }
  console.log(`ספק: Edge Neural (חינם, בלי מפתח) · קול ${VOICE} · pitch ${PROSODY.pitch} rate ${PROSODY.rate} · שפה ${LANG} · ${lines.length} קליפים`)
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
        const { audioStream } = await tts.toStream(text, PROSODY)
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
} else if (PROVIDER === 'narakeet') {
  // Narakeet — native Israeli-accent Hebrew voices, paid (cheap, one-time).
  // Pick the voice she liked: Ayelet / Tamar / Nurit / Hadas / Yael (female),
  // Lior / Erez / Doron / Oren (male). Speed + (optional) niqqud stripping.
  const KEY = process.env.NARAKEET_API_KEY
  if (!KEY) throw new Error('צריך NARAKEET_API_KEY (מההגדרות של חשבון Narakeet)')
  const VOICE = process.env.NARAKEET_VOICE || (LANG === 'he' ? 'Yael' : 'Brian')
  const NSPEED = process.env.VOICE_SPEED || '0.9' // a touch slow for a young child
  // Niqqud helps these voices say מִימִי / נְשַׂחֵק / הַמִּסְפָּר correctly, so KEEP it
  // by default; strip only if a future test shows a voice prefers plain text.
  const stripNiq = (s) => s.replace(/[֑-ׇ]/g, '')
  const dropNiq = process.env.STRIP_NIQQUD === '1'
  console.log(`ספק: Narakeet · קול ${VOICE} · speed ${NSPEED} · ניקוד ${dropNiq ? 'מוסר' : 'נשמר'} · שפה ${LANG} · ${lines.length} קליפים`)
  synth = async (text) => {
    const body = dropNiq ? stripNiq(text) : text
    const url = `https://api.narakeet.com/text-to-speech/mp3?voice=${encodeURIComponent(VOICE)}&voice-speed=${NSPEED}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': KEY, 'content-type': 'text/plain', accept: 'application/octet-stream' },
      body: Buffer.from(body, 'utf-8'),
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 800) throw new Error('empty')
    return buf
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
