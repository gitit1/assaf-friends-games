# 🎙️ קול טבעי לחברים (במקום הקול הרובוטי)

המשפטים הקבועים (היכרות כל חבר, ספירה, "כיף/חיבוק/נשיקה") יכולים להתנגן מקובץ-קול **טבעי** מוקלט-מראש, בעזרת **Gemini TTS**. אם הקובץ חסר — האפליקציה פשוט מקריאה בקול-הדפדפן (אז הכול עובד גם בלי זה).

## איך מייצרים את הקליפים (פעם אחת, חינם)

1. נכנסים ל-**https://aistudio.google.com/apikey** → לוחצים **Get API key** → מעתיקים.
   *(זהו — בלי פרויקט/חיוב בענן. הנפח שלנו זעיר, בתוך השכבה החינמית.)*
2. מריצים מהתיקייה של הפרויקט:

   **Windows / PowerShell:**
   ```powershell
   $env:GEMINI_API_KEY="המפתח_שלך"; node scripts/gen-voice.mjs
   ```

   **Mac / Linux:**
   ```bash
   GEMINI_API_KEY=המפתח_שלך node scripts/gen-voice.mjs
   ```

3. מעלים את הקליפים:
   ```bash
   git add public/voice && git commit -m "voice clips" && git push
   ```
   Netlify יפרוס אוטומטית, והקול הטבעי יחליף את הרובוטי.

## בחירת קול

ברירת המחדל היא `Leda` (קול צעיר ובהיר). אפשר לבחור אחר:
```powershell
$env:GEMINI_TTS_VOICE="Aoede"; $env:GEMINI_API_KEY="..."; node scripts/gen-voice.mjs
```
קולות לדוגמה: `Leda` · `Aoede` · `Callirrhoe` · `Kore` · `Puck` · `Zephyr` · `Sulafat`.
(אם השכבה החינמית מגבילה קצב — הסקריפט ממתין אוטומטית; אפשר להאריך עם `GEMINI_DELAY=3000`.)

## אם תעדיפי קול שלך / קול אחר

אפשר גם להניח קבצי `wav` משלך בתיקייה `public/voice/` עם אותם שמות:
`intro-0.wav` … `intro-29.wav`, `num-1.wav` … `num-30.wav`, `fx-five.wav`, `fx-hug.wav`, `fx-kiss.wav` — האפליקציה תנגן אותם כמו שהם.
