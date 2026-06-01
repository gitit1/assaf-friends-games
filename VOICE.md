# 🎙️ קול טבעי לחברים (במקום הקול הרובוטי)

המשפטים הקבועים (היכרות כל חבר, ספירה, "כיף/חיבוק/נשיקה") מתנגנים מקובץ-קול **טבעי** מוקלט-מראש. אם הקובץ חסר — האפליקציה מקריאה בקול-הדפדפן (אז הכול עובד גם בלי זה).

> ⚠️ **לא להשתמש ב-Gemini TTS לזה** — השכבה החינמית שלו מוגבלת ל-**10 בקשות ביום**, ויש לנו 63 קליפים. השתמשי באחת מהשתיים למטה.

---

## אופציה א׳ — ElevenLabs (הכי פשוט, בלי כרטיס אשראי) ✅ מומלץ

1. נרשמים ב-https://elevenlabs.io → בפרופיל מעתיקים **API key**.
   *(חינם ~10,000 תווים בחודש — מספיק לכל ה-63 בריצה אחת, בלי כרטיס.)*
2. מריצים:
   ```powershell
   $env:ELEVENLABS_API_KEY="המפתח_שלך"; node scripts/gen-voice.mjs
   ```
3. ```bash
   git add public/voice && git commit -m "voice clips" && git push
   ```

קול אחר: `$env:ELEVENLABS_VOICE_ID="..."` (מעתיקים מ-Voices באתר).

## אופציה ב׳ — Google Cloud TTS (העברית הכי טובה)

קולות עברית טבעיים ויציבים, שכבה חינמית נדיבה — אבל ייתכן שתתבקשי **להפעיל חיוב** על הפרויקט (לא תחויבי בתוך המכסה החינמית).

1. https://console.cloud.google.com → פרויקט → להפעיל **Cloud Text-to-Speech API** → **Credentials → API key**.
2. ```powershell
   $env:VOICE_PROVIDER="google"; $env:GOOGLE_TTS_KEY="המפתח"; node scripts/gen-voice.mjs
   ```
   קול אחר: `$env:GOOGLE_TTS_VOICE="he-IL-Wavenet-D"` (אפשרויות: `he-IL-Wavenet-A/B/C/D`).
3. `git add public/voice && git commit -m "voice clips" && git push`

---

## קול משלך
אפשר גם להניח קבצי `mp3` משלך ב-`public/voice/` עם אותם שמות:
`intro-0.mp3` … `intro-29.mp3`, `num-1.mp3` … `num-30.mp3`, `fx-five.mp3`, `fx-hug.mp3`, `fx-kiss.mp3`.
