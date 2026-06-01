// One-time generator for the natural-voice clips (replaces the robotic TTS for
// fixed lines). Runs locally with a free Google Cloud Text-to-Speech API key.
// Writes mp3 files to public/voice/ which the app plays (see src/voice.ts).
//
//   1) Get a free key:  https://console.cloud.google.com  →  create a project
//      →  enable "Cloud Text-to-Speech API"  →  Credentials → create API key.
//   2) Run (PowerShell):   $env:GOOGLE_TTS_KEY="YOUR_KEY"; node scripts/gen-voice.mjs
//      Run (bash):         GOOGLE_TTS_KEY=YOUR_KEY node scripts/gen-voice.mjs
//   3) git add public/voice && git commit -m "voice clips" && git push
//
// Choose a voice with GOOGLE_TTS_VOICE (default he-IL-Wavenet-B, a warm voice).
// Hebrew options: he-IL-Wavenet-A/B/C/D, he-IL-Standard-A..D.
import { writeFileSync, mkdirSync } from 'node:fs'

const KEY = process.env.GOOGLE_TTS_KEY
const VOICE = process.env.GOOGLE_TTS_VOICE || 'he-IL-Wavenet-B'
if (!KEY) {
  console.error('❌ חסר מפתח. הריצי:  GOOGLE_TTS_KEY=... node scripts/gen-voice.mjs')
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

mkdirSync('public/voice', { recursive: true })
let ok = 0
for (const l of lines) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: l.text },
      voice: { languageCode: 'he-IL', name: VOICE },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.96, pitch: 1.0 },
    }),
  })
  if (!res.ok) {
    console.error(`❌ ${l.id}: ${res.status} ${await res.text()}`)
    continue
  }
  const { audioContent } = await res.json()
  writeFileSync(`public/voice/${l.id}.mp3`, Buffer.from(audioContent, 'base64'))
  ok++
  console.log(`✓ ${l.id}`)
}
console.log(`\nנוצרו ${ok}/${lines.length} קליפים ב-public/voice/ עם הקול ${VOICE}`)
