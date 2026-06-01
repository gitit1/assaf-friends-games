# 🎙️ קול טבעי לחברים (במקום הקול הרובוטי)

המשפטים הקבועים (היכרות כל חבר, ספירה, "כיף/חיבוק/נשיקה") יכולים להתנגן מקובץ-קול **טבעי** מוקלט-מראש. אם הקובץ חסר — האפליקציה פשוט מקריאה בקול-הדפדפן (אז הכול עובד גם בלי זה).

## איך מייצרים את הקליפים (פעם אחת, חינם)

1. נכנסים ל-https://console.cloud.google.com → יוצרים פרויקט.
2. מפעילים את **Cloud Text-to-Speech API** (Enable).
3. **Credentials → Create credentials → API key** → מעתיקים את המפתח.
   *(נפח הקליפים שלנו זעיר — בתוך השכבה החינמית של גוגל.)*
4. מריצים מהתיקייה של הפרויקט:

   **Windows / PowerShell:**
   ```powershell
   $env:GOOGLE_TTS_KEY="המפתח_שלך"; node scripts/gen-voice.mjs
   ```

   **Mac / Linux:**
   ```bash
   GOOGLE_TTS_KEY=המפתח_שלך node scripts/gen-voice.mjs
   ```

5. מעלים את הקליפים:
   ```bash
   git add public/voice && git commit -m "voice clips" && git push
   ```
   Netlify יפרוס אוטומטית, והקול הטבעי יחליף את הרובוטי.

## בחירת קול

ברירת המחדל היא `he-IL-Wavenet-B`. אפשר לבחור אחר:
```powershell
$env:GOOGLE_TTS_VOICE="he-IL-Wavenet-D"; $env:GOOGLE_TTS_KEY="..."; node scripts/gen-voice.mjs
```
קולות עבריים: `he-IL-Wavenet-A/B/C/D` (טבעיים) · `he-IL-Standard-A/B/C/D`.

## אם תעדיפי קול שלך / קול אחר

אפשר גם פשוט להניח קבצי `mp3` משלך בתיקייה `public/voice/` עם אותם שמות (`intro-0.mp3` … `intro-29.mp3`, `num-1.mp3` … `num-30.mp3`, `fx-five.mp3`, `fx-hug.mp3`, `fx-kiss.mp3`) — האפליקציה תנגן אותם כמו שהם.
