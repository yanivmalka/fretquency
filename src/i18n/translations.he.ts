// Hebrew (he) dictionary, keyed by the English source string. A full RTL
// translation. Loaded on demand like every other language (see
// loadDictionary in translations.ts), so it never weighs on an English launch.

export const he: Record<string, string> = {
  // Instrument / title
  'Guitar': 'גיטרה',
  'Bass': 'בס',
  'Fret Practice': 'תרגול סריגים',

  // Instrument picker — roadmap instruments (admin-only "coming soon" tiles)
  'Coming soon': 'בקרוב',
  'Ukulele': 'יוקולילי',
  'Mandolin': 'מנדולינה',
  'Banjo': "בנג'ו",

  // Settings — section titles / labels / help
  'Instrument': 'כלי נגינה',
  'Playing': 'נגינה',
  'Instruments': 'כלים',
  'Strings': 'מיתרים',
  'Frets': 'סריגים',
  'Type': 'סוג',
  'Acoustic': 'אקוסטית',
  'Electric': 'חשמלית',
  'Soprano': 'סופרן',
  'Concert': 'קונצרט',
  'Tenor': 'טנור',
  'Baritone': 'בריטון',
  '5-String Standard': "5 מיתרים · סטנדרטי",
  '5-String Parlor': "5 מיתרים · פארלור",
  '5-String Long Neck': "5 מיתרים · צוואר ארוך",
  '4-String Tenor (Irish, short scale)': "4 מיתרים · טנור (אירי, סקאלה קצרה)",
  '4-String Tenor': "4 מיתרים · טנור",
  '4-String Plectrum': "4 מיתרים · פלקטרום",
  '6-String (Guitar-Banjo)': "6 מיתרים · גיטרה-בנג'ו",
  'Notes': 'תווים',
  'Switches tuning, string count and fret range, then reloads the note samples.':
    'כאן ניתן לשנות את הכיוון, את מספר המיתרים ואת טווח הסריגים. לאחר מכן דגימות התווים ייטענו מחדש.',
  'Note names': 'שמות התווים',
  'Written as': 'מוצגים כ־',
  "Display only — the drill itself doesn't change.":
    'שינוי התצוגה בלבד — התרגול עצמו אינו משתנה.',
  'Letters (A, B, C…) or solfège syllables (Do, Re, Mi…).':
    'אותיות (A, B, C…) או שמות סולפג׳ (דו, רה, מי…).',
  'A sharp (♯) is a half-step higher; a flat (♭) is a half-step lower. The same pitch can be written either way — C♯ and D♭ are one note. Pick which sign you see.':
    'שארפ (♯) גבוה בחצי טון; פלט (♭) נמוך בחצי טון. אפשר לכתוב את אותו גובה צליל בשתי הצורות — ‏C♯ ו־D♭ הם אותו תו. בחר באיזה סימן לראות אותו.',
  'A dièse (♯) is a half-step higher; a bémol (♭) is a half-step lower. The same pitch can be written either way — Do♯ and Re♭ are one note. Pick which sign you see.':
    'דיאז (♯) גבוה בחצי טון; במול (♭) נמוך בחצי טון. אפשר לכתוב את אותו גובה צליל בשתי הצורות — ‏Do♯ ו־Re♭ הם אותו תו. בחר באיזה סימן לראות אותו.',
  'Sharps or flats': 'שארפ או פלט',
  'Sharp (♯)': 'שארפ (♯)',
  'Flat (♭)': 'פלט (♭)',
  'Dièse (♯)': 'דיאז (♯)',
  'Bémol (♭)': 'במול (♭)',
  'Score': 'ניקוד',
  'Score & celebrations': 'ניקוד וחגיגות',
  'Live score, streak multiplier and celebrations are shown.':
    'במהלך התרגול יוצגו הניקוד, מכפיל הרצף והחגיגות.',
  'Every answer is still recorded to your stats and personal bests either way.':
    'בכל מקרה, כל תשובה עדיין נרשמת בסטטיסטיקות ובשיאים האישיים שלך.',

  // Daily reminder
  'Daily reminder': 'תזכורת יומית',
  'A notification at the time you pick, reminding you to practice.':
    'התראה בשעה שתבחרו, שמזכירה לכם לתרגל.',
  'A browser notification at the time you pick — only while this app is open in a tab. For a reminder that works with the app closed, install the Android app.':
    'התראת דפדפן בשעה שתבחרו — רק כשהאפליקציה פתוחה בלשונית. לתזכורת שעובדת גם כשהאפליקציה סגורה, התקינו את אפליקציית האנדרואיד.',
  'Finish one more round first — then we can ask for notification permission.':
    'סיימו עוד סבב אחד — ואז נוכל לבקש הרשאה להתראות.',
  'Notifications are blocked — turn them on for this app in your device/browser settings.':
    'ההתראות חסומות — הפעילו אותן לאפליקציה הזו בהגדרות המכשיר או הדפדפן.',
  'Reminder time': 'שעת התזכורת',
  'Time to practice': 'הגיע הזמן לתרגל',
  "A couple of minutes keeps your streak alive — don't lose it today.":
    'כמה דקות שומרות על הרצף שלכם — אל תאבדו אותו היום.',
  'Want a daily reminder?': 'רוצים תזכורת יומית?',
  "A quick nudge at a time you pick, so your streak doesn't slip. You can change or turn it off anytime in Settings.":
    'תזכורת קצרה בשעה שתבחרו, כדי שהרצף שלכם לא יישבר. אפשר לשנות או לכבות בכל שלב בהגדרות.',
  'Remind me': 'תזכירו לי',

  'On': 'פעיל',
  'Off': 'כבוי',
  'Silent mode': 'מצב שקט',
  'Sound & vibration': 'צליל ורטט',
  'Sound': 'קול',
  'Vibrate': 'רטט',
  'Silent': 'שקט',
  'How the drill answers back, on one ladder from quietest to loudest. Silent: no sound and no per-button buzz, just a buzz on right / wrong answers plus the on-screen celebrations. Vibrate: no sound — a buzz on every button press and on right / wrong answers instead. Sound 1–5: note playback, chimes and tap sounds, louder each step; the limiter keeps even the loudest from distorting. Silent and Vibrate are great for practising with headphones off or a guitar in hand.':
    'איך התרגול מגיב, בסולם אחד מהשקט ביותר לחזק ביותר. שקט: בלי צליל ובלי רטט על לחיצות כפתור, רק רטט על תשובה נכונה / שגויה ובנוסף החגיגות על המסך. רטט: בלי צליל — במקום זה רטט על כל לחיצת כפתור ועל תשובה נכונה / שגויה. קול 1–5: השמעת התו, צלילי "נכון" וצלילי הקשה, חזק יותר בכל דרגה; המגביל מונע עיוות גם ברמה החזקה ביותר. שקט ורטט מצוינים לתרגול בלי אוזניות או עם גיטרה אמיתית ביד.',
  'Theme': 'ערכת נושא',
  'Dark': 'כהה',
  'Night': 'לילה',
  'Day': 'יום',
  'Night is a warmer, dimmer palette for a dark room. Day is a light palette.':
    'לילה היא ערכת צבעים חמה ועמומה יותר לחדר חשוך. יום היא ערכת צבעים בהירה.',
  'Appearance': 'מראה',
  'Theme sets how light or dark the app is: Night is a warmer, dimmer palette for a dark room, Day is a light one. Season sets the colours layered over it — Winter is the original look. Auto follows your clock (Day from 07:00 to 19:00, Night after) and the real season where you are; picking a season by hand holds until that season ends.':
    'ערכת הנושא קובעת כמה האפליקציה בהירה או כהה: לילה היא ערכה חמה ועמומה לחדר חשוך, ויום היא ערכה בהירה. העונה קובעת את הצבעים שמונחים מעליה — חורף הוא המראה המקורי. אוטומטי עוקב אחרי השעון (יום מ־07:00 עד 19:00, לילה אחר כך) ואחרי העונה האמיתית במקום שבו אתה נמצא; בחירה ידנית של עונה נשארת עד סוף אותה עונה.',
  'Season': 'עונה',
  'Winter': 'חורף',
  'Spring': 'אביב',
  'Summer': 'קיץ',
  'Autumn': 'סתיו',
  'A seasonal colour palette layered over the theme. Winter is the original look.':
    'פלטת צבעים עונתית מעל ערכת הנושא. חורף הוא המראה המקורי.',
  'Mastery on the fretboard': 'שליטה בצוואר',
  'The per-note / per-fret accuracy bars drawn over the circle and grid while stopped or paused.':
    'פסי הדיוק לכל תו ולכל סריג, המוצגים על גבי הגלגל והרשת בזמן עצירה או השהיה.',
  'Mastery keeps being tracked and shows on the Stats screen either way.':
    'מדד השליטה ממשיך להיאסף ויוצג במסך הסטטיסטיקות בכל מקרה.',
  'Questions counted': 'כמות שאלות בספירה',
  'How many of your most recent questions the mastery bars are computed from. Free accounts use the last 250.':
    'מכמה מהשאלות האחרונות שלך מחושבים פסי השליטה. חשבונות חינמיים משתמשים ב־250 האחרונות.',
  'Choose how many recent questions the mastery bars are counted from':
    'בחירת כמות השאלות האחרונות שמהן נספרים פסי השליטה',
  'Mastery time window': 'חלון זמן לשליטה',
  'Point the mastery bars at a recent-question count, a single day, or a date range':
    'כיוונון פסי השליטה לכמות שאלות אחרונות, ליום מסוים או לטווח תאריכים',
  'What slice of your history the mastery bars are computed from. Free accounts use the last 250 questions. Older history saved without a date is not counted for a specific day or range.':
    'מאיזה חלק מההיסטוריה שלך מחושבים פסי השליטה. חשבונות חינמיים משתמשים ב־250 השאלות האחרונות. היסטוריה ישנה שנשמרה ללא תאריך אינה נספרת ליום או לטווח מסוימים.',
  'Recent': 'אחרונות',
  'A day': 'יום',
  'A range': 'טווח',
  'From': 'מ־',
  'To': 'עד',
  'showing': 'מוצג',
  'showing last': 'מוצגות אחרונות',
  'showing all questions': 'מוצגות כל השאלות',
  'All': 'הכל',
  'Stats & progress': 'סטטיסטיקות והתקדמות',
  'Answer mode': 'מצב מענה',
  'How you answer': 'איך עונים',
  'Voice mode asks for microphone permission the first time.':
    'במצב קול תתבקש לאשר גישה למיקרופון בפעם הראשונה.',
  'Speak clearly and pause briefly between words — for sharp/flat notes, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'דברו ברור והשהו רגע קצר בין מילים — בתווי דיאז/במול, אמרו את האות, השהו רגע, ואז "דיאז"/"במול" כשתי מילים נפרדות.',
  'Tap': 'הקשה',
  'Voice': 'קול',
  'Play the target note on your guitar instead of tapping — the app listens through the microphone. Only works for “by fret” questions — a played note can’t say which string it came from, so “by note” questions stay on tap.':
    'מנגנים את התו המבוקש על הגיטרה במקום להקיש עליו — האפליקציה מקשיבה דרך המיקרופון. עובד רק בשאלות מסוג "לפי פרט" — תו שמנגנים לא יכול להעיד על המיתר שממנו הגיע, ולכן שאלות מסוג "לפי תו" נשארות בהקשה.',
  '🎸 Microphone blocked — enable it or switch to tap': '🎸 הגישה למיקרופון חסומה — אפשרו אותה או עברו להקשה',
  '🎸 Pitch detection isn’t available on this device — use tap': '🎸 זיהוי גובה הצליל לא זמין במכשיר הזה — השתמשו בהקשה',
  '🎸 Didn’t catch that': '🎸 לא זוהה בבירור',
  '🎸 Play the note on your guitar': '🎸 נגנו את התו על הגיטרה',
  'Voice engine': 'מנוע זיהוי קולי',
  'Auto picks the best available. Personal uses your calibrated profile; General uses the built-in model.':
    'אוטומטי בוחר את האפשרות הטובה ביותר הזמינה. אישי משתמש בפרופיל הקול שכיילת; כללי משתמש במודל המובנה.',
  'Auto': 'אוטומטי',
  'Personal': 'אישי',
  'General': 'כללי',
  'Your voice profile': 'פרופיל הקול שלך',
  'Calibrating your own voice improves recognition when answering by voice.':
    'כיול הקול שלך משפר את הזיהוי כשעונים באמצעות קול.',
  'recordings': 'הקלטות',
  'enabled': 'מופעל',
  'Add / review recordings': 'הוספה / סקירת הקלטות',
  'Calibrate my voice': 'כיול הקול שלי',
  'Feedback board': 'לוח המשוב',
  'Leaderboard': 'טבלת המובילים',
  'Account': 'חשבון',
  'Signed in': 'מחובר',
  'Keeps your preferences and data in sync across devices.':
    'שומר על ההעדפות והנתונים שלך מסונכרנים בין המכשירים.',
  'Sign out': 'התנתקות',
  'Sign in with Google to keep your preferences and data across devices.':
    'התחבר באמצעות Google כדי לשמור על ההעדפות והנתונים שלך מסונכרנים בין המכשירים.',
  'Sign in with Google': 'התחברות באמצעות Google',

  // Account → About tile + live community counts
  'About': 'אודות',
  'Fretquency is a small labor of love — built to turn learning the fretboard into a game instead of a chore. Made by an independent developer, with patient help from family and friends.':
    'Fretquency נבנתה מתוך אהבה — כדי להפוך את לימוד הגריף למשחק ולא למטלה. פותחה באופן עצמאי, בעזרתם הסבלנית של משפחה וחברים.',
  'Registered users': 'משתמשים רשומים',
  'Active now': 'פעילים כעת',
  'Guests online': 'אורחים מחוברים',
  // Account → App update tile (Android app only)
  'App update': 'עדכון לאפליקציה',
  'A new version of the app is ready to install.': 'גרסה חדשה של האפליקציה מוכנה להתקנה.',
  'Update to version': 'עדכון לגרסה',
  'Downloading…': 'מוריד…',
  'Allow installs from this app in Android settings, then try again.': 'יש לאשר התקנות מהאפליקציה הזו בהגדרות של אנדרואיד, ולנסות שוב.',
  'The update could not be installed. Check your connection and try again.': 'לא ניתן היה להתקין את העדכון. בדוק את החיבור ונסה שוב.',
  'See the full list and what earns each one': 'לצפייה ברשימה המלאה ובדרכים לזכות בכל תג',
  'Badges': 'תגים',
  'Language': 'שפה',
  'Downloading the language…': 'מוריד את השפה…',
  'Could not download the language. Check your connection and try again.': 'לא ניתן היה להוריד את השפה. בדוק את החיבור ונסה שוב.',
  'Left-handed': 'שמאלי',
  'Seasonal background': 'רקע עונתי',
  'Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season': 'פתיתי שלג, כלניות, חמניות או עלי שלכת ברקע האפליקציה, לפי העונה',
  'Light seasonal decorations behind the app: snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn. They follow the season above. Off keeps the background plain.':
    'קישוטים עדינים לפי העונה מאחורי האפליקציה: פתיתי שלג בחורף, כלניות באביב, חמניות בקיץ ועלי שלכת בסתיו. הם הולכים לפי העונה שנבחרה למעלה. כבוי משאיר רקע נקי.',
  'Button depth': 'נפח לכפתורים',
  'Gives the buttons a raised, 3D look: a light rim on top, a solid edge underneath, and they sink a little when pressed. Off keeps them flat.': 'נותן לכפתורים מראה תלת-ממדי בולט: קו בהיר למעלה, קצה מלא למטה, והם שוקעים מעט כשלוחצים עליהם. כבוי משאיר אותם שטוחים.',
  'Mirrors the app for a left-handed player: the fretboard flips (nut on the right), and the menu, Quick Access and back buttons move to the left. Independent of language — it stays mirrored in Hebrew too.':
    'הופך את האפליקציה כמראה עבור מנגן שמאלי: הצוואר מתהפך (האוכף מימין), והתפריט, הגישה המהירה וכפתורי החזרה עוברים לצד שמאל. בלתי תלוי בשפה — נשאר הפוך גם בעברית.',
  'Colour-blind heatmap markers': 'סימוני מפת חום לעיוורי צבעים',
  'Adds a ✓ / • mark on the Stats-screen fretboard heatmap cells, on top of colour, so known vs. needs-work reads without relying on hue.':
    'מוסיף סימון ✓ / • על תאי מפת החום בצוואר הגיטרה במסך הסטטיסטיקה, בנוסף לצבע, כדי שההבדל בין "שולט" ל"דורש תרגול" יהיה ברור גם בלי להסתמך על גוון הצבע.',

  // Hamburger drawer / dialogs
  'Settings': 'הגדרות',
  'Close settings': 'סגירת ההגדרות',
  'Open settings': 'פתיחת ההגדרות',
  'Game settings': 'הגדרות המשחק',
  'Back': 'חזרה',
  'Microphone access': 'גישה למיקרופון',
  'Answer out loud': 'מענה בקול',
  'Voice mode listens for the note or fret you say instead of a tap.':
    'במצב קול, אמור את התו או את הסריג במקום להקיש עליהם.',
  'Your browser will ask to use the microphone next — audio stays on your device and is never recorded or uploaded.':
    'הדפדפן שלך יבקש כעת גישה למיקרופון — השמע נשאר במכשיר שלך ואינו מוקלט או מועלה.',
  'Allow microphone': 'אישור גישה למיקרופון',
  'Not now': 'לא עכשיו',
  'Microphone is blocked': 'המיקרופון חסום',
  "Your browser is refusing microphone access for this site, so voice answers can't work yet. Tap the 🔒 / 🎤 icon beside the address bar, set the microphone to":
    'הדפדפן חוסם את הגישה למיקרופון עבור האתר הזה. הקש על הסמל 🔒 / 🎤 שליד שורת הכתובת והגדר את המיקרופון ל־',
  ', then reload the page.': ', ולאחר מכן טען מחדש את הדף.',
  'Allow': 'אפשר',
  'Got it': 'הבנתי',
  'Use tap instead': 'השתמש בהקשה במקום',
  'Sign in': 'התחברות',
  'Save your progress': 'שמור את ההתקדמות שלך',
  'Sign in to keep your history, badges and personal bests across devices. You can keep playing as a guest — everything still works, it just stays on this device.':
    'התחבר כדי לשמור את ההיסטוריה, התגים והשיאים האישיים שלך בין המכשירים. אפשר גם להמשיך לשחק כאורח — הכול ימשיך לעבוד, אבל הנתונים יישארו במכשיר הזה.',
  'Maybe later': 'אולי מאוחר יותר',
  'Press back again to exit': 'לחץ שוב כדי לצאת',

  // In-game
  'STAGE COMPLETE': 'השלב הושלם',
  'Retry': 'נסה שוב',
  '🎤 Microphone blocked — enable it or switch to tap': '🎤 המיקרופון חסום — אפשר גישה או עבור להקשה',
  '🎤 Voice needs a connection': '🎤 מצב קול דורש חיבור לרשת',
  '🎤 Voice isn’t working in this browser — try Chrome, or use tap':
    '🎤 מצב קול לא פועל בדפדפן הזה — נסה את Chrome או עבור להקשה',
  '🎤 Didn’t catch that': '🎤 לא הצלחתי לזהות',
  '🎤 …': '🎤 …',
  'Round Complete!': 'הסיבוב הושלם!',
  'Session Stopped': 'התרגול הופסק',
  "You're ready for the next stage:": 'אתה מוכן לשלב הבא:',
  "You've mastered this — ready to learn something new?": 'שלטת בזה — מוכן ללמוד משהו חדש?',
  'Move on': 'המשך הלאה',
  'Explore Learn': 'לעמוד הלמידה',
  'pts': 'נק׳',
  'OK': 'אישור',
  'Start': 'התחל',
  'Resume': 'המשך',
  'Pause': 'השהה',
  'Stop': 'עצור',
  'Refresh': 'רענן',
  'Privacy policy': 'מדיניות פרטיות',

  'QUESTIONS': 'שאלות',
  'streak': 'רצף',
  'New badge': 'תג חדש',
  'Badge upgraded': 'התג שודרג',
  'Continue': 'המשך',
  'Listening…': 'מקשיב…',
  'Member since': 'חבר מאז',
  'badges earned': 'תגים שנצברו',

  // Pinned badge shelf (Account section)
  'Choose badges to feature': 'בחר תגים להצגה',
  'Edit featured badges': 'עריכת התגים המוצגים',
  'Your badges': 'התגים שלך',
  'Feature up to 5 badges': 'הצג עד 5 תגים',
  'Remove a badge to feature another.': 'הסר תג כדי להוסיף אחר.',
  'See all badges': 'לרשימת התגים המלאה',

  // LeaderboardPanel — standings sub-page
  'player': 'שחקן',
  'players': 'שחקנים',
  'ranked by XP': 'מדורג לפי נקודות ניסיון',
  'free for everyone': 'חינם לכולם',
  'All-time': 'כל הזמנים',
  'This week': 'השבוע',
  // Weekly leagues (LeaderboardPanel League tab)
  'League': 'ליגה',
  'Bronze League': 'ליגת ארד',
  'Silver League': 'ליגת כסף',
  'Gold League': 'ליגת זהב',
  'Platinum League': 'ליגת פלטינה',
  'Diamond League': 'ליגת יהלום',
  'Top {n} move up, bottom {n} move down when the week ends.': 'בסוף השבוע {n} הראשונים עולים ליגה ו־{n} האחרונים יורדים.',
  'Top {n} move up when the week ends.': 'בסוף השבוע {n} הראשונים עולים ליגה.',
  'Correct answers since Monday count. A new week starts Monday 00:00 UTC.': 'נספרות תשובות נכונות מאז יום שני. שבוע חדש מתחיל ביום שני ב־00:00 UTC.',
  'Answer a question correctly this week to join a league of up to 30 players. Until then, here is everyone’s week.': 'ענו נכון על שאלה אחת השבוע כדי להצטרף לליגה של עד 30 שחקנים. בינתיים, הנה השבוע של כולם.',
  'Your league opens once {n} players have joined it this week. Until then, here is everyone’s week.': 'הליגה שלך תיפתח כשיצטרפו אליה {n} שחקנים השבוע. בינתיים, הנה השבוע של כולם.',
  'Leagues aren’t available right now. Here is everyone’s week instead.': 'הליגות לא זמינות כרגע. במקומן, הנה השבוע של כולם.',
  'Moves up': 'עולה ליגה',
  'Moves down': 'יורד ליגה',
  // Weekly leagues (end-of-round card league line)
  'Rank #{rank} in {league}': 'מקום #{rank} ב{league}',
  'Promoted to {league}!': 'עלית ל{league}!',
  'Moved to {league}': 'ירדת ל{league}',
  'Moving up this week!': 'עולה ליגה השבוע!',
  'Moving down this week': 'יורד ליגה השבוע',
  '{n} more to move up': 'עוד {n} כדי לעלות ליגה',
  'Loading…': 'טוען…',
  'Couldn’t load the leaderboard. Check your connection and try again.':
    'לא ניתן לטעון את טבלת המובילים. בדוק את החיבור ונסה שוב.',
  'Couldn’t update that. Check your connection and try again.':
    'לא ניתן לעדכן. בדוק את החיבור ונסה שוב.',
  'Your standing': 'המיקום שלך',
  'RANK': 'דירוג',
  'acc': 'דיוק',
  '(you)': '(אתה)',
  'Hidden from the leaderboard': 'מוסתר מטבלת המובילים',
  'Visible on the leaderboard': 'מוצג בטבלת המובילים',
  'Join the board': 'הצטרף לטבלה',
  'You can see every player’s standing right now. Sign in with Google to take your own place — every correct answer you’ve ever played counts. Free, no subscription.':
    'אפשר לראות עכשיו את המיקום של כל שחקן. התחבר באמצעות Google כדי להוסיף גם את השם שלך — כל תשובה נכונה שענית עליה עד היום נחשבת. חינם, ללא מנוי.',
  'No one’s on the board yet': 'עדיין אין שחקנים בטבלה',
  'Finish a practice run while signed in and your name lands here first.':
    'סיים סיבוב תרגול כשאתה מחובר, והשם שלך יופיע כאן ראשון.',
  'How is XP counted?': 'איך מחושבות נקודות הניסיון?',

  // SelectorPanel — mode/difficulty/fret-range picker
  'all': 'כל',
  'strings': 'מיתרים',
  'frets': 'סריגים',
  'only the dot-marker frets': 'רק סריגי הנקודות',
  'natural notes only (no sharps or flats)': 'תווים טבעיים בלבד (ללא דיאזים או במולים)',
  'every note, sharps and flats included': 'כל התווים, כולל דיאזים ובמולים',
  'alphabetical order': 'סדר אלפביתי',
  'circle-of-fifths order': 'סדר מעגל הקווינטות',
  'A fret lights up and you pick its note from the wheel':
    'סריג נדלק, ואתה בוחר בגלגל את התו שלו',
  ', rotated to the string': ', מסובב בהתאם למיתר',
  'A note name is shown and you tap every fret on the neck where it lands.':
    'שם של תו מוצג, ואתה מקיש על כל סריג בצוואר שבו התו הזה נמצא.',
  'Note-by-Fret': 'תו לפי סריג',
  'Fret-by-Note': 'סריג לפי תו',
  'Auto-advances through the difficulty stages.': 'מתקדם אוטומטית בין שלבי הקושי.',
  'How this works': 'איך זה עובד',
  'neck': 'צוואר',
  'neck fret range selector': 'בורר טווח הסריגים בצוואר',
  'Precise fret range': 'טווח סריגים מדויק',
  'Pick an exact fret N–M window to drill': 'בחירת חלון סריגים מדויק לתרגול — מסריג N עד סריג M',
  'Fret range': 'טווח סריגים',
  'Full only while a precise fret window is on': 'כשטווח סריגים מדויק מופעל, אפשר לתרגל רק במצב "מלא"',
  'Drill only part of the neck. Drag the handles to set the exact fret window — the shaded area is muted out, both here and on the home-screen neck.':
    'תרגול של חלק מהצוואר בלבד. גררו את הידיות כדי לקבוע את חלון הסריגים המדויק — האזור המוצלל מושתק, גם כאן וגם בצוואר שבמסך הבית.',
  'Lowest fret': 'הסריג הנמוך',
  'Highest fret': 'הסריג הגבוה',
  'Multi': 'מרובה',
  'Note by Fret': 'תו לפי סריג',
  'Alpha': 'אלפביתי',
  'Fifths': 'קווינטות',
  'By String': 'לפי מיתר',
  'Fret by Note': 'סריג לפי תו',
  "Read the note wheel like a clock: your open string sits at 12 o'clock, and the dots under each note show its fret. Answer before the timing bar empties.":
    'קרא את גלגל התווים כמו שעון: המיתר הפתוח נמצא בשעה 12, והנקודות שמתחת לכל תו מציינות את הסריג שלו. ענה לפני שפס הזמן מתרוקן.',
  'Answer before the timing bar empties.': 'ענה לפני שפס הזמן מתרוקן.',
  'Dots': 'נקודות',
  'Naturals': 'טבעיים',
  'Full': 'מלא',
  'Auto Advance to next difficulty': 'מעבר אוטומטי לרמת הקושי הבאה',

  // Onboarding
  'Fretquency': 'Fretquency',
  'What do you play?': 'על מה אתה מנגן?',
  'Skip setup →': 'דלג על ההגדרה →',
  'How well do you know the fretboard?': 'עד כמה אתה מכיר את צוואר הגיטרה?',
  "I'm just starting": 'אני רק מתחיל',
  'I play but want to improve': 'אני מנגן ורוצה להשתפר',
  'Quick 3-question test': 'מבחן קצר של 3 שאלות',
  'I know the full neck': 'אני מכיר את כל הצוואר',
  'Jump right in': 'התחל מיד',
  'Skip →': 'דלג →',
  'String': 'מיתר',
  'what note is fret': 'איזה תו נמצא בסריג',
  'Skip test →': 'דלג על המבחן →',
  'Keep going!': 'המשך כך!',
  'Good start!': 'התחלה טובה!',
  'Nice work!': 'עבודה מצוינת!',
  'Impressive!': 'מרשים!',
  'Dot Frets': 'סריגי נקודות',
  'Natural notes': 'תווים טבעיים',
  'the full chromatic neck': 'כל הצוואר הכרומטי',
  "correct — we've set you up on": 'נכונות — נקודת ההתחלה שלך:',
  'Change it anytime in the selector panel.': 'אפשר לשנות זאת בכל עת בפאנל הבחירה.',
  "Let's go →": 'בוא נתחיל →',

  // Welcome, privacy and sign-in onboarding steps
  'Welcome to Fretquency':
    'ברוך הבא ל־Fretquency',
  'Learn every note on the neck of your guitar, bass, ukulele, mandolin or banjo — in short, focused drills, a few minutes a day.':
    'למד את כל התווים על צוואר הגיטרה, הבס, היוקולילי, המנדולינה או הבנג׳ו — בתרגולים קצרים וממוקדים, כמה דקות ביום.',
  "What's inside":
    'מה יש באפליקציה',
  'Note drills':
    'תרגול תווים',
  'Name the note at a fret, or find every fret of a note. Start with the dot frets and work up to the whole neck.':
    'זהה את התו שבסריג, או מצא את כל הסריגים של תו. התחל בסריגי הנקודות והתקדם עד לכל הצוואר.',
  'Answer your way':
    'ענה בדרך שלך',
  'Tap, say the note out loud, or play it on your instrument.':
    'הקש, אמור את שם התו בקול, או נגן אותו על הכלי שלך.',
  'Watch yourself improve':
    'ראה איך אתה משתפר',
  'Stats, personal bests, badges and a leaderboard.':
    'סטטיסטיקות, שיאים אישיים, תגים וטבלת מובילים.',
  'Built-in tuner':
    'טיונר מובנה',
  'Tune up before you practise.':
    'כוון את הכלי לפני שאתה מתרגל.',
  'Free to start':
    'מתחילים בחינם',
  'The full note drill on every string, badges, the leaderboard and cloud backup. Shows ads.':
    'תרגול התווים המלא על כל המיתרים, תגים, טבלת המובילים וגיבוי בענן. כולל פרסומות.',
  'Your full history and trends, mastery maps, a precise fret range, multi-string drills — and no ads.':
    'כל ההיסטוריה והמגמות שלך, מפות שליטה, טווח סריגים מדויק, תרגול כמה מיתרים יחד — ובלי פרסומות.',
  'A teacher, not a timer: a daily plan built from your weak spots, a learning path, intervals, scales, staff reading and tab reading.':
    'מורה, לא שעון עצר: תוכנית יומית שנבנית מהנקודות החלשות שלך, מסלול למידה, אינטרוולים, סולמות, קריאת תווים וקריאת טאבים.',
  'Pro and Premium are coming soon.':
    'Pro ופרימיום יגיעו בקרוב.',
  'Get started':
    'בוא נתחיל',
  'Your privacy':
    'הפרטיות שלך',
  'As a guest, everything stays on this device. Signing in with Google (any time, from the menu) backs it up so you can restore it elsewhere. The microphone is only used if you choose to answer by voice, and the free plan shows ads provided by Google.':
    'כאורח, הכול נשאר במכשיר הזה. התחברות עם Google (בכל עת, מהתפריט) מגבה את הנתונים שלך כדי שתוכל לשחזר אותם במכשיר אחר. המיקרופון משמש רק אם תבחר לענות בקול, ובמסלול החינמי מוצגות פרסומות מסופקות על ידי Google.',
  'Terms of use': 'תנאי שימוש',
  'I have read the terms of use and the privacy policy and agree to them.':
    'קראתי את תנאי השימוש ואת מדיניות הפרטיות ואני מסכים להם.',
  'That instrument needs Pro. Pick Guitar, Bass or Ukulele for now — you can upgrade any time from the menu.':
    'הכלי הזה דורש Pro. בחר גיטרה, בס או יוקולילי לעת עתה — אפשר לשדרג בכל עת מהתפריט.',
  'See what Pro unlocks': 'לראות מה Pro פותח',
  'Strings, frets and tuning can be changed later from the menu → Playing.':
    'את המיתרים, הסריגים והכיוון אפשר לשנות אחר כך מהתפריט ← נגינה.',
  'Start with the dot frets':
    'התחל עם סריגי הנקודות',

  // ProgressPanel — stats & progress screen
  'by note': 'לפי תו',
  'by fret': 'לפי סריג',
  'fret': 'סריג',
  'not played': 'לא נוגן',
  'known': 'מוכר',
  'needs work': 'דורש תרגול',
  'unplayed': 'לא נוגן',
  'Not enough data yet.': 'עדיין אין מספיק נתונים.',
  'Not practiced yet': 'עדיין לא תורגל',
  'Older sessions have no date stamp, so the timeline is empty. New sessions fill it in.':
    'בסשנים ישנים לא נשמר תאריך, ולכן ציר הזמן ריק. סשנים חדשים יתווספו אליו.',
  'Play a few rounds and your all-time progress shows up here.':
    'שחק כמה סיבובים וההתקדמות שלך לאורך זמן תופיע כאן.',
  'accuracy': 'דיוק',
  'day streak': 'רצף יומי',
  'answered': 'נענו',
  'Weakest notes': 'התווים שדורשים הכי הרבה תרגול',
  'Nothing below 70% — nice.': 'אין תווים מתחת ל־70% — מצוין.',
  'By note': 'לפי תו',
  'By string': 'לפי מיתר',
  'By fret': 'לפי סריג',
  'Fretboard heatmap': 'מפת חום של צוואר הגיטרה',
  'Share': 'שתפו',
  'Share my neck map': 'שתפו את מפת הצוואר שלי',
  'My neck map': 'מפת הצוואר שלי',
  'Daily timeline': 'ציר זמן יומי',
  'Accuracy %': 'אחוז דיוק',
  'Avg response time': 'זמן תגובה ממוצע',
  'Personal bests': 'שיאים אישיים',
  'No personal bests recorded yet.': 'עדיין לא נרשמו שיאים אישיים.',
  'No practice in the last 7 days.': 'אין תרגול ב-7 הימים האחרונים.',
  'All time': 'כל הזמנים',
  'Last 7 days': '7 הימים האחרונים',
  'across every': 'בכל',
  'settings combination': 'שילוב הגדרות',
  'Clear all history': 'נקה את כל ההיסטוריה',
  'Clear all stats?': 'לנקות את כל הסטטיסטיקות?',
  'This permanently erases your entire practice history and resets the all-time mastery for every note, string and settings combination. Your personal bests are kept.':
    'פעולה זו תמחק לצמיתות את כל היסטוריית התרגול שלך ותאפס את מדד השליטה לאורך זמן עבור כל תו, מיתר ושילוב הגדרות. השיאים האישיים שלך יישמרו.',
  "This can't be undone.": 'אי אפשר לבטל פעולה זו.',
  'Delete anyway': 'מחק בכל זאת',
  'Cancel': 'ביטול',

  // Instrument string labels (guitar + bass, "String N · note")
  'String 1 · high E': 'מיתר 1 · מי גבוה',
  'String 2 · B': 'מיתר 2 · סי',
  'String 3 · G': 'מיתר 3 · סול',
  'String 4 · D': 'מיתר 4 · רה',
  'String 5 · A': 'מיתר 5 · לה',
  'String 6 · low E': 'מיתר 6 · מי נמוך',
  'String 1 · G': 'מיתר 1 · סול',
  'String 2 · D': 'מיתר 2 · רה',
  'String 3 · A': 'מיתר 3 · לה',
  'String 4 · low E': 'מיתר 4 · מי נמוך',

  // ── Badges / Achievements wall ─────────────────────────────────────────────
  // Tiers
  'Bronze': 'ברונזה',
  'Silver': 'כסף',
  'Gold': 'זהב',
  'Platinum': 'פלטינה',
  'Diamond': 'יהלום',
  'Master': 'מאסטר',
  'Legendary I': 'אגדי I',
  'Legendary II': 'אגדי II',
  'Legendary III': 'אגדי III',
  'Legendary IV': 'אגדי IV',
  // Wall chrome
  'unlocked': 'נפתחו',
  'Max': 'שיא',
  'Earned': 'הושג',
  // Player profile card (leaderboard)
  'Achievements': 'הישגים',
  'No badges earned yet.': 'עדיין לא הושגו תגים.',
  // Admin test controls
  'Grant': 'הענק',
  'Reset': 'אפס',
  'Admin tools: Grant or Reset each badge to test it. History-based badges re-appear on reopen unless you also clear history.':
    'כלי מנהל: אפשר להעניק או לאפס כל תג לצורך בדיקה. תגים מבוססי־היסטוריה יחזרו בפתיחה מחדש, אלא אם מנקים גם את ההיסטוריה.',
  // Family names
  'Perfect Session': 'סיבוב מושלם',
  'Speed Demon': 'שד מהירות',
  'Flawless Sprint': 'ספרינט ללא רבב',
  'On Fire': 'בוער',
  'Comeback': 'קאמבק',
  'Every String': 'כל המיתרים',
  'String Master': 'שליטה במיתר',
  'String Master · {s}': 'שליטה · {s}',
  'Full String Master': 'שליטה מלאה במיתרים',
  'Neck Runner': 'רץ הצוואר',
  'Both Ends': 'שני הקצוות',
  'Low End': 'הקצה הנמוך',
  'Week Warrior': 'לוחם השבוע',
  'Dedicated': 'מסור',
  'Total Reps': 'סך החזרות',
  'Sharpshooter': 'צלף',
  'Quick Read': 'קריאה מהירה',
  'Most Improved': 'המשתפר ביותר',
  'Doubling Up': 'הכפלה',
  'Multi-Instrumentalist': 'רב-כליים',
  'Admin': 'מנהל',
  // Earning conditions — Perfect Session
  'Answer 10+ questions in a round with no mistakes at all.':
    'ענה על 10+ שאלות בסיבוב בלי אף טעות.',
  '25+ questions in a round, still zero mistakes.':
    '25+ שאלות בסיבוב, ועדיין בלי אף טעות.',
  '50+ questions in a round, still zero mistakes — a full clean run.':
    '50+ שאלות בסיבוב, ועדיין בלי אף טעות — סיבוב נקי לחלוטין.',
  // Speed Demon
  'Get 10+ correct answers in a round, at least 8 of them under 1.5s.':
    'ענה נכון על 10+ שאלות בסיבוב, לפחות 8 מהן בתוך פחות מ־1.5 שנ׳.',
  '20+ correct answers, at least 16 of them under 1.5s.':
    '20+ תשובות נכונות, לפחות 16 מהן בתוך פחות מ־1.5 שנ׳.',
  '40+ correct answers, at least 32 of them under 1.2s.':
    '40+ תשובות נכונות, לפחות 32 מהן בתוך פחות מ־1.2 שנ׳.',
  // Flawless Sprint
  'Finish a whole round at 90% accuracy or better.':
    'סיים סיבוב שלם בדיוק של 90% ומעלה.',
  'Finish a whole round at 95% accuracy or better.':
    'סיים סיבוב שלם בדיוק של 95% ומעלה.',
  'Finish a whole round at 100% accuracy.':
    'סיים סיבוב שלם בדיוק של 100%.',
  // On Fire
  'Reach a streak of 15 in a single round.': 'הגיע לרצף של 15 תשובות נכונות בסיבוב אחד.',
  'Reach a streak of 20 in a single round.': 'הגיע לרצף של 20 תשובות נכונות בסיבוב אחד.',
  'Reach a streak of 30 in a single round.': 'הגיע לרצף של 30 תשובות נכונות בסיבוב אחד.',
  // Comeback
  'Miss 3+ of your first 20 questions, then answer the next 8 in a row correctly.':
    'פספס 3+ מתוך 20 השאלות הראשונות, ואז ענה נכון על 8 השאלות הבאות ברצף.',
  'Miss 5+ of your first 20 questions, then answer the next 12 in a row correctly.':
    'פספס 5+ מתוך 20 השאלות הראשונות, ואז ענה נכון על 12 השאלות הבאות ברצף.',
  'Miss 8+ of your first 20 questions, then answer the next 18 in a row correctly.':
    'פספס 8+ מתוך 20 השאלות הראשונות, ואז ענה נכון על 18 השאלות הבאות ברצף.',
  // Every String
  'Finish a round that visited every string: 2x that many questions, 90% accuracy.':
    'סיים סיבוב שעבר בכל המיתרים: פי 2 ממספר המיתרים בשאלות, בדיוק של 90%.',
  'Visited every string: 4x that many questions, 90% accuracy.':
    'עבר בכל המיתרים: פי 4 ממספר המיתרים בשאלות, בדיוק של 90%.',
  'Visited every string: 6x that many questions, 95% accuracy.':
    'עבר בכל המיתרים: פי 6 ממספר המיתרים בשאלות, בדיוק של 95%.',
  // Per-string String Master — {s} is the translated string label
  'Answer 40+ questions on {s} at 90% accuracy or better.':
    'ענה על 40+ שאלות על {s} בדיוק של 90% ומעלה.',
  '100+ questions on {s} at 92% accuracy or better.':
    '100+ שאלות על {s} בדיוק של 92% ומעלה.',
  '200+ questions on {s} at 95% accuracy or better.':
    '200+ שאלות על {s} בדיוק של 95% ומעלה.',
  '400+ questions on {s} at 96% accuracy or better, over 14+ practice days.':
    '400+ שאלות על {s} בדיוק של 96% ומעלה, לאורך 14+ ימי תרגול.',
  '800+ questions on {s} at 97% accuracy or better, over 30+ practice days.':
    '800+ שאלות על {s} בדיוק של 97% ומעלה, לאורך 30+ ימי תרגול.',
  // Full String Master
  'Earn String Master — Bronze on every string of this instrument.':
    'השג דרגת ברונזה של שליטה במיתר בכל מיתרי הכלי.',
  'Earn String Master — Silver on every string.':
    'השג דרגת כסף של שליטה במיתר בכל המיתרים.',
  'Earn String Master — Gold on every string.':
    'השג דרגת זהב של שליטה במיתר בכל המיתרים.',
  'Earn String Master — Platinum on every string.':
    'השג דרגת פלטינה של שליטה במיתר בכל המיתרים.',
  'Earn String Master — Diamond on every string.':
    'השג דרגת יהלום של שליטה במיתר בכל המיתרים.',
  // Neck Runner
  'Answer at least one question on every fret of the neck.':
    'ענה על לפחות שאלה אחת בכל סריג בצוואר.',
  'Answer at least 3 questions on every fret of the neck.':
    'ענה על לפחות 3 שאלות בכל סריג בצוואר.',
  'Answer at least 5 questions on every fret of the neck.':
    'ענה על לפחות 5 שאלות בכל סריג בצוואר.',
  'Answer at least 10 questions on every fret, spread across 14+ practice days.':
    'ענה על לפחות 10 שאלות בכל סריג, לאורך 14+ ימי תרגול.',
  'Answer at least 20 questions on every fret, spread across 30+ practice days.':
    'ענה על לפחות 20 שאלות בכל סריג, לאורך 30+ ימי תרגול.',
  // Both Ends
  'Answer 40+ questions above the 12th fret at 85% accuracy or better.':
    'ענה על 40+ שאלות מעל הסריג ה־12 בדיוק של 85% ומעלה.',
  '100+ questions above the 12th fret at 88% accuracy or better.':
    '100+ שאלות מעל הסריג ה־12 בדיוק של 88% ומעלה.',
  '200+ questions above the 12th fret at 92% accuracy or better.':
    '200+ שאלות מעל הסריג ה־12 בדיוק של 92% ומעלה.',
  '400+ questions above the 12th fret at 93% accuracy or better, over 14+ practice days.':
    '400+ שאלות מעל הסריג ה־12 בדיוק של 93% ומעלה, לאורך 14+ ימי תרגול.',
  '800+ questions above the 12th fret at 94% accuracy or better, over 30+ practice days.':
    '800+ שאלות מעל הסריג ה־12 בדיוק של 94% ומעלה, לאורך 30+ ימי תרגול.',
  // Low End
  'Answer 40+ questions on the bass low-E string at 90% accuracy or better.':
    'ענה על 40+ שאלות על מיתר המי הנמוך בבס בדיוק של 90% ומעלה.',
  '100+ questions on the low-E string at 93% accuracy or better.':
    '100+ שאלות על מיתר המי הנמוך בבס בדיוק של 93% ומעלה.',
  '200+ questions on the low-E string at 96% accuracy or better.':
    '200+ שאלות על מיתר המי הנמוך בבס בדיוק של 96% ומעלה.',
  '400+ questions on the low-E string at 97% accuracy or better, over 14+ practice days.':
    '400+ שאלות על מיתר המי הנמוך בבס בדיוק של 97% ומעלה, לאורך 14+ ימי תרגול.',
  '800+ questions on the low-E string at 98% accuracy or better, over 30+ practice days.':
    '800+ שאלות על מיתר המי הנמוך בבס בדיוק של 98% ומעלה, לאורך 30+ ימי תרגול.',
  // Week Warrior
  'Practise on 5 separate days within a single 7-day window.':
    'תרגל ב־5 ימים שונים בתוך תקופה של 7 ימים.',
  '6 separate days within a single 7-day window.':
    'תרגל ב־6 ימים שונים בתוך תקופה של 7 ימים.',
  'All 7 days within a single 7-day window — a perfect week.':
    'תרגל בכל 7 הימים בתוך תקופה של 7 ימים — שבוע מושלם.',
  // Dedicated
  'Build a run of 7 consecutive practice days.': 'צור רצף של 7 ימי תרגול רצופים.',
  '14 consecutive practice days.': '14 ימי תרגול רצופים.',
  '30 consecutive practice days.': '30 ימי תרגול רצופים.',
  '60 consecutive practice days.': '60 ימי תרגול רצופים.',
  '90 consecutive practice days.': '90 ימי תרגול רצופים.',
  '120 consecutive practice days.': '120 ימי תרגול רצופים.',
  '180 consecutive practice days.': '180 ימי תרגול רצופים.',
  '250 consecutive practice days.': '250 ימי תרגול רצופים.',
  '300 consecutive practice days.': '300 ימי תרגול רצופים.',
  '365 consecutive practice days — a full year, every day.':
    '365 ימי תרגול רצופים — שנה שלמה, כל יום.',
  // Total Reps
  'Answer 100 questions all-time, across every instrument.':
    'ענה על 100 שאלות בסך הכול, בכל הכלים.',
  '250 questions all-time.': '250 שאלות בסך הכול.',
  '500 questions all-time.': '500 שאלות בסך הכול.',
  '1,000 questions all-time.': '1,000 שאלות בסך הכול.',
  '2,500 questions all-time, spread across 20+ practice days.':
    '2,500 שאלות בסך הכול, לאורך 20+ ימי תרגול.',
  '5,000 questions all-time, spread across 40+ practice days.':
    '5,000 שאלות בסך הכול, לאורך 40+ ימי תרגול.',
  '10,000 questions all-time, spread across 70+ practice days.':
    '10,000 שאלות בסך הכול, לאורך 70+ ימי תרגול.',
  '20,000 questions all-time, spread across 110+ practice days.':
    '20,000 שאלות בסך הכול, לאורך 110+ ימי תרגול.',
  '35,000 questions all-time, spread across 160+ practice days.':
    '35,000 שאלות בסך הכול, לאורך 160+ ימי תרגול.',
  '50,000 questions all-time, spread across 220+ practice days.':
    '50,000 שאלות בסך הכול, לאורך 220+ ימי תרגול.',
  // Sharpshooter
  'Hold 85% accuracy over at least 200 questions, across every instrument.':
    'שמור על דיוק של 85% לפחות לאורך 200 שאלות לפחות, בכל הכלים.',
  '88% accuracy over at least 500 questions.':
    'דיוק של 88% לפחות לאורך 500 שאלות לפחות.',
  '92% accuracy over at least 1,000 questions.':
    'דיוק של 92% לפחות לאורך 1,000 שאלות לפחות.',
  '93% accuracy over at least 2,500 questions, spread across 30+ practice days.':
    'דיוק של 93% לפחות לאורך 2,500 שאלות לפחות, לאורך 30+ ימי תרגול.',
  '94% accuracy over at least 5,000 questions, spread across 60+ practice days.':
    'דיוק של 94% לפחות לאורך 5,000 שאלות לפחות, לאורך 60+ ימי תרגול.',
  // Quick Read
  'Hold an average answer time under 2.0s over 200+ questions.':
    'שמור על זמן מענה ממוצע של פחות מ־2.0 שנ׳ לאורך 200+ שאלות.',
  'Under 1.6s over 500+ questions.': 'פחות מ־1.6 שנ׳ לאורך 500+ שאלות.',
  'Under 1.3s over 1,000+ questions.': 'פחות מ־1.3 שנ׳ לאורך 1,000+ שאלות.',
  'Under 1.15s over 2,500+ questions, spread across 30+ practice days.':
    'פחות מ־1.15 שנ׳ לאורך 2,500+ שאלות, לאורך 30+ ימי תרגול.',
  'Under 1.05s over 5,000+ questions, spread across 60+ practice days.':
    'פחות מ־1.05 שנ׳ לאורך 5,000+ שאלות, לאורך 60+ ימי תרגול.',
  // Most Improved
  'Over 10+ practice days, lift your accuracy by 20 points from your first days to your latest.':
    'לאורך 10+ ימי תרגול, שפר את הדיוק שלך ב־20 נקודות אחוז מהימים הראשונים ועד האחרונים.',
  'Over 15+ practice days, lift your accuracy by 30 points.':
    'לאורך 15+ ימי תרגול, שפר את הדיוק שלך ב־30 נקודות אחוז.',
  'Over 20+ practice days, lift your accuracy by 40 points.':
    'לאורך 20+ ימי תרגול, שפר את הדיוק שלך ב־40 נקודות אחוז.',
  // Doubling Up
  'Earn String Master on every string of both guitar and bass.':
    'השג שליטה במיתר בכל המיתרים, גם בגיטרה וגם בבס.',
  'Earn Full String Master — Silver on both guitar and bass.':
    'השג שליטה מלאה במיתרים בדרגת כסף, גם בגיטרה וגם בבס.',
  'Earn Full String Master — Gold and Neck Runner — Gold on both guitar and bass.':
    'השג שליטה מלאה במיתרים בדרגת זהב ורץ הצוואר בדרגת זהב, גם בגיטרה וגם בבס.',
  'Earn Full String Master — Platinum and Neck Runner — Platinum on both guitar and bass.':
    'השג שליטה מלאה במיתרים בדרגת פלטינה ורץ הצוואר בדרגת פלטינה, גם בגיטרה וגם בבס.',
  'Earn Full String Master — Diamond and Neck Runner — Diamond on both guitar and bass.':
    'השג שליטה מלאה במיתרים בדרגת יהלום ורץ הצוואר בדרגת יהלום, גם בגיטרה וגם בבס.',
  // Multi-Instrumentalist
  'Earn Full String Master — Silver on 2 different instruments.':
    'השג שליטה מלאה במיתרים בדרגת כסף בשני כלים שונים.',
  'Earn Full String Master — Silver on 3 different instruments.':
    'השג שליטה מלאה במיתרים בדרגת כסף בשלושה כלים שונים.',
  'Earn Full String Master — Gold on 4 different instruments.':
    'השג שליטה מלאה במיתרים בדרגת זהב בארבעה כלים שונים.',
  'Earn Full String Master — Gold on all 5 instruments.':
    'השג שליטה מלאה במיתרים בדרגת זהב בכל 5 הכלים.',
  'Earn Full String Master — Platinum on all 5 instruments.':
    'השג שליטה מלאה במיתרים בדרגת פלטינה בכל 5 הכלים.',
  // Admin (role)
  'Granted to app administrators — read every Feedback board post, not just your own.':
    'מוענק למנהלי האפליקציה — מאפשר לקרוא את כל הפוסטים בלוח המשוב, לא רק את הפוסטים שלך.',

  // Free / Pro / Premium tiering — ProGate lock states + the Upgrade card
  'Premium': 'פרימיום',
  // Free-tier ad strip
  'Advertisement': 'פרסומת',
  'Ad': 'פרסומת',
  'Close ad': 'סגירת הפרסומת',
  'Your ad could be here. Go Pro to remove ads.': 'כאן יכולה להופיע הפרסומת שלך. עברו ל-Pro כדי להסיר פרסומות.',
  'Unlock with Pro': 'זמין במסלול Pro',
  'Unlock with Premium': 'זמין במסלול Premium',
  'You have Pro': 'יש לך Pro',
  "You're on Free": 'אתה במסלול החינמי',
  'Your plan': 'המסלול שלך',
  'Included with Pro': 'כלול גם ב-Pro',
  'Everything in Free, plus:': 'כל מה שיש בחינמי, ובנוסף:',
  'Everything you need to practice daily, at no cost.':
    'כל מה שצריך כדי לתרגל כל יום, ללא עלות.',
  'The full fretboard drill — by note and by fret, on every string':
    'תרגול מלא על סרגל הסריגים — לפי תו ולפי סריג, על כל מיתר.',
  'Badges and achievements, with your pinned medal shelf':
    'עיטורים והישגים, כולל מדף המדליות הנעוצות שלך.',
  'The leaderboard — XP, questions answered and accuracy':
    'לוח המובילים — ניקוד, מספר שאלות ודיוק.',
  'Cloud sync and full restore of your practice on every device':
    'סנכרון ענן ושחזור מלא של התרגול שלך בכל מכשיר.',
  'Your last 7 days of stats, plus the personal best for what you’re drilling':
    'סטטיסטיקות שבעת הימים האחרונים, בתוספת השיא האישי בתרגול הנוכחי.',
  'Free, forever': 'חינמי, לתמיד',
  'Pro is for training seriously and tracking progress over time.':
    'מסלול Pro מיועד לתרגול רציני ולמעקב אחר ההתקדמות לאורך זמן.',
  'Your full practice history — all-time stats and trends, not just the last 7 days':
    'כל היסטוריית התרגול שלך — סטטיסטיקות ומגמות מאז ומתמיד, לא רק שבעת הימים האחרונים.',
  'Mastery maps — per-note and per-fret accuracy overlays on the circle and grid':
    'מפות שליטה — שכבות דיוק לכל תו ולכל סריג על גבי הגלגל והרשת.',
  'Browse your personal bests across every settings combination':
    'עיון בשיאים האישיים שלך בכל צירוף הגדרות.',
  'A personal voice profile built from your own calibration recordings':
    'פרופיל קול אישי הנבנה מהקלטות הכיול שלך.',
  'Your Pro access is complimentary.': 'גישת ה־Pro שלך ניתנה ללא תשלום.',
  'Your Pro access came from a promotion.': 'גישת ה־Pro שלך התקבלה במסגרת מבצע.',
  'Your Pro access was granted manually.': 'גישת ה־Pro שלך הוענקה ידנית.',
  'Your Pro access is from your subscription.': 'גישת ה־Pro שלך היא חלק מהמנוי שלך.',
  'Your Pro access is active.': 'גישת ה־Pro שלך פעילה.',
  'It does not expire.': 'הגישה אינה פגה.',
  'Access runs until': 'הגישה בתוקף עד',
  'Pro isn’t on sale yet — everything above stays free to try in the meantime.':
    'מסלול Pro עדיין אינו נמכר — עד אז כל מה שלמעלה זמין לניסיון בחינם.',
  // Premium tier + the reverse 7-day trial (Task D)
  'Upgrade': 'שדרוג',
  'Included with Premium': 'כלול גם ב-Premium',
  'Everything in Pro, plus:': 'כל מה שיש ב-Pro, ובנוסף:',
  'Your trial': 'תקופת הניסיון שלך',
  'Premium is a teacher, not a timer — it plans your practice for you.':
    'Premium הוא מורה, לא טיימר — הוא מתכנן עבורך את התרגול.',
  'Your Premium trial is active.': 'תקופת הניסיון שלך ל-Premium פעילה.',
  'Your access is complimentary.': 'הגישה שלך ניתנה ללא תשלום.',
  'Your access came from a promotion.': 'הגישה שלך התקבלה במסגרת מבצע.',
  'Your access was granted manually.': 'הגישה שלך הוענקה ידנית.',
  'Your access is from your subscription.': 'הגישה שלך היא חלק מהמנוי שלך.',
  'Your access is active.': 'הגישה שלך פעילה.',
  'Your 7-day Premium trial has ended. Everything below Premium stays free.':
    'תקופת הניסיון של 7 הימים ל-Premium הסתיימה. כל מה שמתחת ל-Premium נשאר חינמי.',
  'Ends in': 'מסתיימת בעוד',
  'day': 'יום',
  'days': 'ימים',
  'Ends today.': 'מסתיימת היום.',
  'Premium isn’t on sale yet — every new install gets a 7-day free trial in the meantime.':
    'מסלול Premium עדיין אינו נמכר — בינתיים כל התקנה חדשה מקבלת תקופת ניסיון חינמית של 7 ימים.',
  'Up to 2 strings at once in multi-string mode': 'עד 2 מיתרים בו-זמנית במצב רב-מיתרים',
  'Occasional ads between rounds': 'פרסומות מדי פעם בין הסבבים',
  'No ads': 'בלי פרסומות',
  'Drill three or more strings at once.': 'תרגול של שלושה מיתרים או יותר בו-זמנית.',
  'A daily session the Teacher builds from your actual weak spots':
    'סבב יומי שהמורה בונה מהחולשות האמיתיות שלך',
  'Spaced review that brings what you missed back until it sticks':
    'חזרה מרווחת שמחזירה את מה שפספסת עד שהוא נטמע',
  'A guided Learning Path across the whole fretboard':
    'מסלול לימוד מודרך על פני כל סרגל הסריגים',
  'Interval training, scale training, staff reading and tab reading':
    'תרגול מרווחים, תרגול סולמות, קריאת תווים וקריאת טאבים',
  'See your full practice history, not just the last 7 days.':
    'צפייה בכל היסטוריית התרגול שלך, לא רק שבעת הימים האחרונים.',
  'Practice without ads.': 'תרגול בלי פרסומות.',
  'Premium trial': 'תקופת ניסיון ל-Premium',
  'day left': 'יום נותר',
  'days left': 'ימים נותרו',
  'Premium trial — ends today': 'תקופת ניסיון ל-Premium — מסתיימת היום',
  'Your Premium trial has ended': 'תקופת הניסיון שלך ל-Premium הסתיימה',
  'This week the Teacher kept track of': 'השבוע המורה עקב אחרי',
  'positions on your fretboard.': 'מיקומים על סרגל הסריגים שלך.',
  'This week the Teacher started learning your fretboard.':
    'השבוע המורה התחיל ללמוד את סרגל הסריגים שלך.',
  'You’re back on Free — everything you’ve already learned stays yours.':
    'חזרת למסלול החינמי — כל מה שכבר למדת נשאר שלך.',
  'See what’s in Premium': 'לראות מה יש ב-Premium',
  'Every new install gets 7 days of Premium free. Paid plans aren’t for sale yet.':
    'כל התקנה חדשה מקבלת 7 ימי Premium בחינם. מסלולים בתשלום עדיין לא נמכרים.',
  'Premium free': 'Premium בחינם',
  'ends today': 'מסתיים היום',
  'Try today’s plan': 'לנסות את התוכנית של היום',
  'Your Premium trial ends soon': 'תקופת הניסיון שלך ל-Premium מתקרבת לסיום',
  'After that, you’re back on Free.': 'לאחר מכן חוזרים למסלול החינמי.',
  'This goes back to Free too:': 'זה גם חוזר למסלול החינמי:',
  'multi-string drills': 'תרגול מרובה-מיתרים',
  'the precise fret window': 'טווח הסריגים המדויק',
  // Admin-only account tools (settings ▸ Account)
  'Admin: plan on your account': 'מנהל: המסלול בחשבון שלך',
  'Sets the plan on your own account only (Free, Pro or Premium). Writes to the entitlements table and syncs across your devices.':
    'קובע את המסלול בחשבון שלך בלבד (חינמי, Pro או Premium). נכתב לטבלת ההרשאות ומסונכרן בין המכשירים שלך.',
  // Debug panel (dev only)
  'Simulate tier (dev only — no DB change)':
    'הדמיית מסלול (למפתחים בלבד — ללא שינוי במסד הנתונים)',
  'Admin: view the app as': 'מנהל: הצג את האפליקציה בתור',
  'Hides every admin-only control so you see exactly what a regular user sees. Switch back here any time — this is a local view change only and does not change what your account can do.':
    'מסתיר כל פקד שמיועד למנהלים בלבד כדי שתראה בדיוק מה שמשתמש רגיל רואה. אפשר לחזור למצב מנהל כאן בכל רגע — זהו שינוי תצוגה מקומי בלבד ואינו משנה את מה שהחשבון שלך יכול לעשות.',
  'Regular user': 'משתמש רגיל',
  'Free': 'חינמי',

  // Guest-merge prompt (design §5.4) — shown on the first sign-in on a device
  // that already has local guest practice history.
  'Add this device’s progress to your account?':
    'להוסיף את ההתקדמות מהמכשיר הזה לחשבון שלך?',
  'You’ve practiced on this device without an account. Add that progress to your account, or keep only what’s already on your account?':
    'תרגלת על המכשיר הזה בלי חשבון. אפשר להוסיף את ההתקדמות הזו לחשבון שלך, או להשאיר רק את מה שכבר קיים בחשבון.',
  'Merge my progress': 'הוסף את ההתקדמות שלי',
  'Use account only': 'השתמש בחשבון בלבד',
  'Leave this practice off your account?': 'להשאיר את התרגול הזה מחוץ לחשבון?',
  'You have {n} rounds of practice saved on this device. If you continue, they stay on this device but are not added to your account.':
    'שמורים על המכשיר הזה {n} סיבובי תרגול. אם תמשיך, הם יישארו על המכשיר אך לא יתווספו לחשבון שלך.',

  // VoiceCalibration
  'Voice calibration': 'כיול קול',
  'Personal voice calibration': 'כיול קול אישי',
  'Profile name': 'שם הפרופיל',
  'Say just this word, on its own': 'אמור רק את המילה הזו, לבדה',
  'Say just the note name, on its own': 'אמור רק את שם התו, לבד',
  'Speak clearly and pause briefly between words — later, when answering, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'דברו ברור והשהו רגע קצר בין מילים — בהמשך, כשעונים, אמרו את האות, השהו רגע, ואז "דיאז"/"במול" כשתי מילים נפרדות.',
  'Could not use the microphone — try again': 'לא ניתן להשתמש במיקרופון — נסה שוב',
  'No sound captured — try again, closer to the mic': 'לא נקלט קול — נסה שוב, קרוב יותר למיקרופון',
  'Recording too short — try again': 'ההקלטה קצרה מדי — נסה שוב',
  "That didn't sound like a note — try again": 'זה לא נשמע כמו תו — נסה שוב',
  'Saving the recording failed': 'שמירת ההקלטה נכשלה',
  'Recorded': 'הוקלטו',
  'notes': 'תווים',
  'accidentals': 'דיאזים/במולים',
  'Say:': 'אמור:',
  'Play last recording': 'נגן את ההקלטה האחרונה',
  'Export recordings to a folder (dev)': 'ייצוא הקלטות לתיקייה (dev)',
  'Stop exporting recordings': 'הפסק ייצוא הקלטות',
  'Every accepted take is also saved as a WAV, named for scripts/eval-voice.mts.': 'כל הקלטה מאושרת נשמרת גם כ-WAV, בשם המתאים ל-scripts/eval-voice.mts.',
  'Could not write to the export folder — pick it again': 'לא ניתן היה לכתוב לתיקיית הייצוא — בחר אותה מחדש',
  'Speak the word on screen — calibration advances on its own': 'אמור את המילה שעל המסך — הכיול מתקדם בעצמו',
  'Take': 'הקלטה',
  'Previous': 'הקודם',
  'Next': 'הבא',
  'Delete profile': 'מחק פרופיל',
  'Reset automatic learning of the general mode': 'אפס למידה אוטומטית של המצב הכללי',
  'Checking recordings…': 'בודק הקלטות…',
  'Self-test recordings': 'בדיקה עצמית של ההקלטות',
  'All words are distinct enough — looks good.': 'כל המילים שונות מספיק זו מזו — נראה טוב.',
  'Finish & enable': 'סיים והפעל',
  '“{a}” and “{b}” sound very similar — re-record one of them.':
    '“{a}” ו-“{b}” נשמעים דומים מדי — הקלט מחדש אחד מהם.',
  'Recording extra takes to tell “{a}” and “{b}” apart':
    'מקליט עוד טייקים כדי להבחין בין “{a}” ל-“{b}”',
  'No recordings for “{prompt}” yet': 'אין הקלטות עבור “{prompt}” עדיין',
  'Delete take {n} of {prompt}': 'מחק הקלטה {n} של {prompt}',
  'Record {n} more takes for “{a}” and “{b}”': 'הקלט עוד {n} טייקים ל-“{a}” ו-“{b}”',
  'to go': 'נותרו',

  // VoiceLevelMeter
  'Microphone level good': 'רמת המיקרופון תקינה',
  'Microphone level low, speak louder': 'רמת המיקרופון נמוכה, דבר בקול רם יותר',
  'Good level': 'רמה טובה',
  'Too quiet — speak up': 'שקט מדי — דבר בקול רם יותר',

  // DebugLogPanel
  'Debug log': 'יומן ניפוי באגים',
  'Open debug log': 'פתח יומן ניפוי באגים',
  'Errors + voice · auto-clears daily': 'שגיאות + קול · מתנקה אוטומטית מדי יום',
  'Errors · auto-clears daily': 'שגיאות · מתנקה אוטומטית מדי יום',
  'Voice: on': 'קול: פעיל',
  'Voice: off': 'קול: כבוי',
  'Copied': 'הועתק',
  'Copy': 'העתק',
  'Clear': 'נקה',
  'Close': 'סגור',
  '(no errors)': '(אין שגיאות)',

  // FeedbackBoard
  'Couldn’t load the board. Check your connection and try again.':
    'לא הצלחנו לטעון את הלוח. בדוק את החיבור שלך ונסה שוב.',
  'Couldn’t send that. Check your connection and try again.':
    'לא הצלחנו לשלוח את זה. בדוק את החיבור שלך ונסה שוב.',
  'Sign in with Google to leave a comment, idea, or suggestion. Only admins can read the full board.':
    'התחבר עם Google כדי להשאיר תגובה, רעיון או הצעה. רק מנהלים יכולים לקרוא את הלוח המלא.',
  'Microphone access is off — turn it on to dictate.': 'הגישה למיקרופון כבויה — הפעל אותה כדי להכתיב.',
  'Voice typing isn’t available on this device.': 'הקלדה קולית אינה זמינה במכשיר הזה.',
  'Couldn’t hear that — try again.': 'לא שמעתי את זה — נסה שוב.',
  'What’s on your mind?': 'מה עובר לך בראש?',
  'Stop voice typing': 'עצור הקלדה קולית',
  'Start voice typing': 'התחל הקלדה קולית',
  'Sending…': 'שולח…',
  'Send': 'שלח',
  'Listening… say one sentence — it stops on its own.': 'מקשיב… אמור משפט אחד — ייעצר לבד.',
  'Thanks — your message was sent.': 'תודה — ההודעה שלך נשלחה.',
  'Unknown': 'לא ידוע',
  'You': 'אתה',
  'Handled': 'טופל',
  'Mark unhandled': 'סמן כלא מטופל',
  'Mark handled': 'סמן כמטופל',
  'Delete': 'מחק',
  'You haven’t sent anything yet.': 'עדיין לא שלחת שום דבר.',
  'Share a comment, idea, or suggestion. Admins read every post; below you can see the ones you’ve sent.':
    'שתף תגובה, רעיון או הצעה. מנהלים קוראים כל פוסט; למטה תוכל לראות את אלה ששלחת.',
  'Write': 'כתיבה',
  'Inbox': 'תיבת דואר נכנס',
  'Post a comment, idea, or suggestion of your own.': 'פרסם תגובה, רעיון או הצעה משלך.',
  'Every post from every user': 'כל פוסט מכל משתמש',
  'still to handle': 'עדיין לטיפול',
  'Mark one handled once you’ve dealt with it, or delete it.':
    'סמן פוסט כמטופל לאחר שטיפלת בו, או מחק אותו.',
  'No posts yet.': 'אין עדיין פוסטים.',
  'Nothing open — all caught up.': 'אין פתוחים — הכול מטופל.',
  'Delete post': 'מחיקת פוסט',
  'Delete this post?': 'למחוק את הפוסט הזה?',
  'This permanently removes it for everyone, including': 'פעולה זו מסירה אותו לצמיתות עבור כולם, כולל',
  'the author': 'הכותב',
  'It can’t be undone.': 'לא ניתן לבטל פעולה זו.',
  'Delete for everyone': 'מחק עבור כולם',

  // Adaptive difficulty suggestion banner (wishlist §3)
  'You’re cruising through this — ready for a harder level?':
    'אתה עובר את זה בקלות — מוכן לרמה קשה יותר?',
  'This setup is fighting back. Want to ease off a level?':
    'ההגדרה הזו נותנת לך בראש. רוצה לרדת רמה?',
  'Switch the difficulty to': 'החלף את דרגת הקושי ל־',
  'Drop the difficulty to': 'הורד את דרגת הקושי ל־',
  'Apply': 'החל',
  'Dismiss': 'סגור',

  // Learning-type navigation — the drawer's "Learn" group and its full pages
  'Learn': 'לימוד',
  'Choose what to practise.': 'בחר מה לתרגל.',
  'Current': 'נוכחי',
  'Daily practice': 'תרגול יומי',
  'Intervals': 'אינטרוולים',
  'Scales': 'סולמות',
  'Chords': 'אקורדים',
  'Staff reading': 'קריאת תווים',
  'Game': 'משחק',
  'Your daily plan is loading…': 'התוכנית היומית נטענת…',
  'Let the Teacher plan your practice': 'תן למאמן לתכנן את התרגול שלך',
  'Practise hearing and finding intervals': 'תרגול זיהוי ומציאת אינטרוולים',

  // Premium Teacher — the Today card (premium-product-plan.md §6 P2)
  'Teacher': 'מאמן',
  'Today with your Teacher': 'היום עם המאמן שלך',
  'Recommended': 'מומלץ',
  'positions': 'עמדות',
  "Today's goal is done": 'יעד היום הושלם',
  'one more round?': 'עוד סבב?',
  'Daily goal': 'יעד יומי',
  "Start today's practice": 'התחל את התרגול של היום',
  'Practise my weak spots': 'תרגל את הנקודות החלשות שלי',
  'No weak spots yet — keep practising and the Teacher will find them.':
    'עדיין אין נקודות חלשות — המשך לתרגל והמאמן ימצא אותן.',
  'Why these?': 'למה אלה?',
  'Hide why': 'הסתר הסבר',
  'due for review': 'מיועד לחזרה',
  'weak spots': 'נקודות חלשות',
  'to reinforce': 'לחיזוק',
  'new ground': 'תחום חדש',
  'a fresh set to get started': 'סט חדש כדי להתחיל',
  'often missed': 'נענה שגוי לעיתים קרובות',
  'slow to recall': 'איטי להיזכר',
  'recent slips': 'טעויות אחרונות',
  'reinforcement': 'חיזוק',
  'not practised much': 'לא תורגל הרבה',
  'review': 'חזרה',

  // Premium Learning Path — the Path screen (premium-product-plan.md §9 P3)
  'Learning Path': 'מסלול הלמידה',
  'View your Learning Path': 'הצג את מסלול הלמידה שלך',
  'Follow a guided path from single notes onward': 'עקוב אחר מסלול מודרך, החל מתווים בודדים',
  'A guided journey through the fretboard. Practise from the Selector whenever you like — your answers still move you along this path.':
    'מסע מודרך על פני הצוואר. אפשר לתרגל מלוח הבחירה מתי שרוצים — התשובות שלך עדיין מקדמות אותך במסלול הזה.',
  'Practise toward this checkpoint': 'תרגל לקראת נקודת הציון הזו',
  'This is your next step.': 'זה הצעד הבא שלך.',
  'Every checkpoint mastered — keep it sharp.': 'כל נקודות הציון נשלטו — שמור על החדות.',
  'mastered': 'בשליטה',
  'Locked': 'נעול',

  // Premium interval training — the P4 interval drill (premium-product-plan.md §9 P4)
  'Interval training': 'תרגול אינטרוולים',
  'Hear and find the distance between two notes.': 'להקשיב ולמצוא את המרחק בין שני תווים.',
  'intervals tracked': 'אינטרוולים במעקב',
  '1 interval tracked': 'אינטרוול אחד במעקב',
  'Answer form': 'צורת תשובה',
  'Find it on the neck': 'למצוא על הצוואר',
  'Name the note': 'לזהות את התו',
  'Start interval practice': 'התחל תרגול אינטרוולים',
  'above': 'מעל',

  // Premium scale training — the P5 scales half, first slice (scales-learning-spec.md)
  'Scale training': 'תרגול סולמות',
  'Practise building scale shapes on the neck': 'תרגול בניית צורות סולם על הצוואר',
  'Rows of notes fall down the screen, one lane per string. Only the first note of the scale is lit — tap it, and the distance in tones to the next note appears on it. Find that next note before its row falls off, bottom row first — a run up or down the scale, as the arrow on the banner shows. Every note you tap plays its sound.':
    'שורות של תווים יורדות במסך, נתיב לכל מיתר. רק התו הראשון של הסולם מואר — הקישו עליו ועליו יופיע המרחק בטונים לתו הבא. מצאו את התו הבא לפני שהשורה שלו נופלת מהמסך, מהשורה התחתונה ומעלה — ריצה עולה או יורדת על הסולם, לפי החץ בכותרת. כל תו שתקישו עליו משמיע את הצליל שלו.',
  'Tones to the next note': 'טונים עד התו הבא',
  'The next note is on another string': 'התו הבא נמצא במיתר אחר',
  'Frets to the next note': 'סריגים עד התו הבא',
  'Distance shown in': 'המרחק מוצג ב',
  'Tones': 'טונים',
  'A half tone is one fret, a whole tone is two.': 'חצי טון הוא סריג אחד, טון שלם הוא שני סריגים.',
  'Question': 'שאלה',
  'Scale': 'סולם',
  'Session complete!': 'הסשן הושלם!',
  'Practice again': 'תרגלו שוב',
  'Build the scale': 'בנו את הסולם',
  'Tap the scale in order': 'הקישו את הסולם לפי הסדר',
  'A section of the neck is shown with every note of the scale lit. Tap them in order to play the scale: start on the root (gold ring), go to one end of the section, then to the other end, and back to the root — up first or down first, as the arrow shows.':
    'מוצג מקטע של הצוואר ובו כל תווי הסולם מוארים. הקישו עליהם לפי הסדר כדי לנגן את הסולם: מתחילים בתו הבסיס (המסגרת הזהובה), ממשיכים עד קצה אחד של המקטע, משם עד הקצה השני, וחוזרים לתו הבסיס — קודם עולים או קודם יורדים, לפי החץ.',
  'Connect the boxes': 'חברו בין התבניות',
  'Boxes 1–2': 'תבניות 1–2',
  'A wider section of the neck is shown, spanning box 1 and box 2 of the scale together. Tap the notes in order to play a run that crosses from one box into the next and back — the same rules as "Tap the scale in order".':
    'מוצג מקטע רחב יותר של הצוואר, שחובק גם את תבנית 1 וגם את תבנית 2 של הסולם. הקישו על התווים לפי הסדר כדי לנגן ריצה שעוברת מתבנית אחת לשנייה וחוזרת — אותם כללים כמו ב"הקישו את הסולם לפי הסדר".',
  'Learning mode': 'מצב למידה',
  'Play on my own': 'לנגן לבד',
  'Watch, then play': 'לצפות ואז לנגן',
  'The app plays each scale first, lighting its notes one by one — then you play it after.':
    'האפליקציה מנגנת קודם כל סולם ומאירה את התווים שלו אחד אחרי השני — ואז אתם מנגנים אחריה.',
  'Watch and listen…': 'צפו והקשיבו…',
  'Your turn — play it back': 'תורכם — נגנו את מה ששמעתם',
  // Task A — Scales Recall mode ("play the box from memory").
  'Play from memory': 'לנגן מהזיכרון',
  'All notes lit': 'כל התווים מוארים',
  'Only the root lit': 'רק תו הבסיס מואר',
  'Empty neck': 'צוואר ריק',
  'Every note of the box is lit — learn the shape by seeing it.': 'כל תווי התבנית מוארים — לומדים את הצורה מתוך התבוננות.',
  'Only the root is lit. Play the rest of the box from memory — a dim note of the box still counts.':
    'רק תו הבסיס מואר. נגנו את שאר התבנית מהזיכרון — תו כבוי של התבנית עדיין נחשב.',
  'Nothing is lit. Find the root and play the whole box from memory.': 'שום תו לא מואר. מצאו את תו הבסיס ונגנו את כל התבנית מהזיכרון.',
  'Move up a level by itself after 3 good runs in a row': 'לעלות רמה לבד אחרי 3 ריצות טובות ברצף',
  'Good runs toward the next level:': 'ריצות טובות לקראת הרמה הבאה:',
  'Level up — the neck is empty now': 'עליתם רמה — עכשיו הצוואר ריק',
  'Level up — only the root is lit now': 'עליתם רמה — עכשיו רק תו הבסיס מואר',
  'Play the scale on your guitar, note by note — the app listens through the microphone. A note an octave higher or lower also counts. Tapping still works.':
    'נגנו את הסולם על הגיטרה, תו אחרי תו — האפליקציה מקשיבה דרך המיקרופון. תו גבוה או נמוך באוקטבה נחשב גם הוא. אפשר עדיין גם להקיש.',
  '🎸 Play the scale on your guitar': '🎸 נגנו את הסולם על הגיטרה',
  'Identify the scale': 'זהו את הסולם',
  'Name the degree': 'ציינו את הדרגה',
  'The app plays the scale up or down. Pick which scale you heard.':
    'האפליקציה מנגנת את הסולם עולה או יורד. בחרו איזה סולם שמעתם.',
  'The app shows a scale, a root and a degree. Pick the note that matches.':
    'האפליקציה מציגה סולם, שורש ודרגה. בחרו את התו המתאים.',
  '🔊 hear it again': '🔊 השמיעו שוב',
  'Minor Pentatonic': 'פנטטוני מינורי',
  'Major': 'מז\'ור',
  'Natural Minor': 'מינור טבעי',
  'Major Pentatonic': 'פנטטוני מז\'ורי',
  'Blues': 'בלוז',
  'Harmonic Minor': 'מינור הרמוני',
  'Melodic Minor': 'מינור מלודי',
  'Dorian': 'דורי',
  'Phrygian': 'פריגי',
  'Lydian': 'לידי',
  'Mixolydian': 'מיקסולידי',
  'Locrian': 'לוקרי',
  'Phrygian Dominant (Hijaz)': 'חיג\'אז (פריגי דומיננטי)',
  'Major Blues': 'בלוז מז\'ורי',
  'Half-Whole Diminished': 'דימיניש חצי־שלם (מוקטן)',
  'Whole-Half Diminished': 'דימיניש שלם־חצי (מוקטן)',
  'Whole Tone': 'טונים שלמים',
  'Lydian Dominant (Acoustic)': 'לידי דומיננטי (אקוסטי)',
  'Altered (Super Locrian)': 'אלטרד (סופר לוקרי)',
  'Double Harmonic (Arabic)': 'ערבי (הרמוני כפול)',
  'Hungarian Minor (Gypsy Minor)': 'מינור הונגרי (מינור צועני)',
  'Hirajoshi': 'הירג\'ושי',
  'All scales': 'כל הסולמות',
  'More scales': 'סולמות נוספים',
  'Modes': 'מודוסים',
  'Minor variations': 'סולמות מינור נוספים',
  'Blues & jazz': 'בלוז וג\'אז',
  'World': 'מוזיקת עולם',
  'Other': 'אחר',
  // "?" explanations on the More scales page (src/utils/scaleBlurbs.ts).
  "Each number is a note's place in the scale, counted from the starting note (1).":
    'כל מספר הוא מקומו של תו בסולם, כשסופרים מתו ההתחלה (1).',
  'Pick a starting note to see the scale on it:': 'בחרו תו התחלה כדי לראות את הסולם עליו:',
  'Highlighted numbers differ from the major scale: b means one fret lower, # means one fret higher.':
    'המספרים המודגשים שונים מהסולם המז\'ורי: b פירושו סריג אחד נמוך יותר, ו-# פירושו סריג אחד גבוה יותר.',
  'Like natural minor, but with a major 6th instead of a flat 6th. It sounds minor yet lighter and more open — common in funk, jazz and rock.':
    'כמו מינור טבעי, אבל עם דרגה שישית מז\'ורית במקום מינורית. הוא נשמע מינורי אך קליל ופתוח יותר, ושכיח בפאנק, בג\'אז וברוק.',
  'Like natural minor, but the 2nd note sits just one fret above the root. It sounds dark and tense, with a Spanish flavour — common in flamenco and metal.':
    'כמו מינור טבעי, אבל התו השני נמצא סריג אחד בלבד מעל תו הבסיס. הוא נשמע כהה ומתוח, עם טעם ספרדי, ושכיח בפלמנקו ובמטאל.',
  'Like the major scale, but with a raised 4th. It sounds bright, dreamy and floating — common in film music.':
    'כמו הסולם המז\'ורי, אבל עם דרגה רביעית מוגבהת. הוא נשמע בהיר, חלומי ומרחף, ושכיח במוזיקת קולנוע.',
  'Like the major scale, but with a flat 7th. It sounds relaxed and bluesy — common in rock, blues and folk.':
    'כמו הסולם המז\'ורי, אבל עם דרגה שביעית מונמכת. הוא נשמע רגוע ובלוזי, ושכיח ברוק, בבלוז ובפולק.',
  'The most unstable of the modes: it has both a flat 2nd and a flat 5th. It is rarely used as a home key and mostly heard over half-diminished chords.':
    'הכי לא יציב מבין המודוסים: יש בו גם דרגה שנייה מונמכת וגם דרגה חמישית מונמכת. כמעט לא משתמשים בו כסולם בית, והוא נשמע בעיקר מעל אקורדים חצי־מוקטנים.',
  'Natural minor with a raised 7th, so the 7th sits one fret below the root. That gives a strong pull back home and a dramatic, classical sound.':
    'מינור טבעי עם דרגה שביעית מוגבהת, כך שהיא נמצאת סריג אחד מתחת לתו הבסיס. זה יוצר משיכה חזקה חזרה הביתה וצליל דרמטי וקלאסי.',
  'A minor scale (flat 3rd) that keeps the major 6th and 7th. It sounds smooth and jazzy.':
    'סולם מינורי (דרגה שלישית מונמכת) ששומר על דרגות שישית ושביעית מז\'וריות. הוא נשמע חלק וג\'זי.',
  'Harmonic minor with a raised 4th. It has two wide gaps of a step and a half, which gives it a dramatic, exotic sound.':
    'מינור הרמוני עם דרגה רביעית מוגבהת. יש בו שני פערים רחבים של טון וחצי, שנותנים לו צליל דרמטי ואקזוטי.',
  'The major pentatonic scale plus the flat 3rd "blue note". It sounds sunny, with a country and blues feel.':
    'הפנטטוני המז\'ורי בתוספת ה"תו הכחול", דרגה שלישית מונמכת. הוא נשמע שמשי, עם תחושה של קאנטרי ובלוז.',
  'A major scale with a raised 4th and a flat 7th. It sounds bright but bluesy, and jazz players use it over dominant 7th chords.':
    'סולם מז\'ורי עם דרגה רביעית מוגבהת ודרגה שביעית מונמכת. הוא נשמע בהיר אך בלוזי, ונגני ג\'אז משתמשים בו מעל אקורדי דומיננטה שביעית.',
  'It bends every colour note of a dominant chord: it has both a flat and a raised 2nd, and both a flat and a raised 5th. It sounds very tense, and is played right before resolving to the next chord.':
    'הוא מעוות כל תו צבע של אקורד דומיננטה: יש בו גם דרגה שנייה מונמכת וגם מוגבהת, וגם דרגה חמישית מונמכת וגם מוגבהת. הוא נשמע מתוח מאוד, ומנגנים אותו ממש לפני המעבר לאקורד הבא.',
  'Eight notes, alternating a half step and a whole step. It is symmetrical and tense, and jazz players use it over dominant 7th chords.':
    'שמונה תווים, לסירוגין חצי טון וטון שלם. הוא סימטרי ומתוח, ונגני ג\'אז משתמשים בו מעל אקורדי דומיננטה שביעית.',
  'Eight notes, alternating a whole step and a half step. It is symmetrical, and is used over diminished chords.':
    'שמונה תווים, לסירוגין טון שלם וחצי טון. הוא סימטרי, ומשתמשים בו מעל אקורדים מוקטנים.',
  'Six notes, every step a whole tone. With no half steps it has no clear home note, so it sounds dreamy and floating.':
    'שישה תווים, וכל צעד בו הוא טון שלם. בלי חצאי טון אין לו תו בית ברור, ולכן הוא נשמע חלומי ומרחף.',
  'Phrygian with a major 3rd. It is the classic Middle-Eastern sound, common in flamenco, klezmer and Arabic music.':
    'פריגי עם דרגה שלישית מז\'ורית. זה הצליל המזרחי הקלאסי, ושכיח בפלמנקו, בכליזמר ובמוזיקה ערבית.',
  'A major-sounding scale with a flat 2nd and a flat 6th, so it has two gaps of a step and a half. It has a rich Middle-Eastern flavour.':
    'סולם בעל צליל מז\'ורי עם דרגה שנייה מונמכת ודרגה שישית מונמכת, ולכן יש בו שני פערים של טון וחצי. יש לו טעם מזרחי עשיר.',
  'A five-note Japanese scale with wide gaps between its notes. It sounds sparse and haunting, like a koto.':
    'סולם יפני בן חמישה תווים עם פערים רחבים ביניהם. הוא נשמע דליל ומהפנט, כמו קוטו.',
  'The scale behind most pop, folk and classical music. It sounds bright and happy, and every other scale is easiest to understand by comparing it to this one.':
    'הסולם שעומד מאחורי רוב מוזיקת הפופ, הפולק והמוזיקה הקלאסית. הוא נשמע בהיר ושמח, ואת כל שאר הסולמות הכי קל להבין בהשוואה אליו.',
  'The basic minor scale. Compared to major, its 3rd, 6th and 7th are one fret lower, which gives it a sad, serious sound.':
    'סולם המינור הבסיסי. בהשוואה למז\'ור, הדרגות השלישית, השישית והשביעית שלו נמוכות בסריג אחד, וזה נותן לו צליל עצוב ורציני.',
  'Five notes: the minor scale without its 2nd and 6th. It is the most common scale for rock and blues solos, and easy to play because it has no awkward notes.':
    'חמישה תווים: סולם המינור בלי הדרגה השנייה והשישית. זה הסולם הנפוץ ביותר לסולואים ברוק ובבלוז, וקל לנגן אותו כי אין בו תווים מסובכים.',
  'Five notes: the major scale without its 4th and 7th. It sounds sweet and open, and is common in country, pop and rock solos.':
    'חמישה תווים: הסולם המז\'ורי בלי הדרגה הרביעית והשביעית. הוא נשמע מתוק ופתוח, ושכיח בסולואים של קאנטרי, פופ ורוק.',
  'The minor pentatonic scale plus one extra "blue note", the flat 5th, which adds a gritty, bluesy tension.':
    'הפנטטוני המינורי בתוספת "תו כחול" אחד, הדרגה החמישית המונמכת, שמוסיפה מתח גס ובלוזי.',
  'Degree': 'דרגה',
  'Root': 'שורש',
  'Position': 'פוזיציה',
  'All positions': 'כל הפוזיציות',
  'Box': 'תבנית',
  'One position selected — difficulty is focused.': 'נבחרה פוזיציה אחת — רמת הקושי ממוקדת.',
  // Scale progress board (scales-learning-spec.md §12) — a flat board,
  // grouped by scale type, showing each position's not started / learning /
  // mastered status. Reached from ScalePracticeScreen's Practice/Progress tab.
  'Practice': 'תרגול',
  'Progress': 'התקדמות',
  'Scales mastered': 'סולמות בשליטה',
  'No scales shipped yet.': 'עדיין לא הושקו סולמות.',
  // "Meet the scale" — a beginner-facing view shown before practicing: the
  // scale across the whole neck, a root picker, a play button and the blurb.
  'Meet the scale': 'הכר את הסולם',
  'What does this scale look like?': 'איך הסולם הזה נראה?',
  'Play the scale': 'נגן את הסולם',
  'Start practicing': 'התחל לתרגל',
  'More options': 'עוד אפשרויות',
  'Fewer options': 'פחות אפשרויות',
  'New to scales? Start with:': 'חדש בסולמות? התחל עם:',
  'Why start here?': 'למה להתחיל כאן?',
  'Fewer notes (5) and no awkward fingerings — the most common first scale for guitar, and you can solo with it right away. Trade-off: it skips two notes of the full scale, so it won’t teach you scale-degree theory on its own.':
    'פחות תווים (5) ובלי אצבוע מביך — הסולם הראשון הנפוץ ביותר לגיטרה, ואפשר לאלתר איתו מיד. החיסרון: הוא מדלג על שני תווים מהסולם המלא, אז הוא לא ילמד אותך לבד את תורת דרגות הסולם.',
  'The foundation scale — every other scale and key gets explained by comparing it to this one. Trade-off: seven notes means a bit more to remember, and a slightly bigger stretch for the fingers than the five-note pentatonic.':
    'סולם היסוד — כל סולם וסולם אחר מוסבר בהשוואה אליו. החיסרון: שבעה תווים זה קצת יותר לזכור, ומתיחה מעט גדולה יותר לאצבעות לעומת הפנטטוני בן חמשת התווים.',
  // Intervals Learning — the two MVP exercises + the identify-the-interval
  // question (intervals-learning-spec §8.1, task T5).
  'Identify the interval': 'לזהות את האינטרוול',
  'Find the note': 'למצוא את התו',
  'Find on the neck': 'למצוא על הצוואר',
  'Which interval did you hear?': 'איזה אינטרוול שמעת?',
  'Hear it again': 'להשמיע שוב',
  'below': 'מתחת ל־',
  // *Find on the neck* (intervals-learning-spec §8.5): one note is marked on the
  // string, tap the note that completes the interval.
  'above the marked note': 'מעל התו המסומן',
  'below the marked note': 'מתחת לתו המסומן',
  'A note is marked on the neck — tap the note that completes the interval.':
    'תו מסומן על הצוואר — הקש על התו שמשלים את האינטרוול.',
  // Silent mode disables the audio-only "Identify the interval" exercise.
  'Silent mode is on — this exercise needs sound.':
    'מצב שקט מופעל — התרגיל הזה דורש קול.',
  'Silent mode is on — “Identify the interval” needs sound.':
    'מצב שקט מופעל — התרגיל „לזהות את האינטרוול” דורש קול.',
  'Minor 2nd': 'סקונדה קטנה',
  'Major 2nd': 'סקונדה גדולה',
  'Minor 3rd': 'טרצה קטנה',
  'Major 3rd': 'טרצה גדולה',
  'Perfect 4th': 'קוורטה מושלמת',
  'Tritone': 'טריטון',
  'Perfect 5th': 'קווינטה מושלמת',
  'Minor 6th': 'סקסטה קטנה',
  'Major 6th': 'סקסטה גדולה',
  'Minor 7th': 'ספטימה קטנה',
  'Major 7th': 'ספטימה גדולה',
  'Augmented 4th': 'קוורטה מוגדלת',
  'Diminished 5th': 'קווינטה מוקטנת',
  'Augmented 5th': 'קווינטה מוגדלת',

  // Intervals Learning — curriculum group names (intervals-learning-spec §6).
  // Shown only as "currently learning: <name>" — never as a path step.
  'Perfect 4th & 5th': 'קוורטה וקווינטה מושלמות',
  'Major & minor 3rds': 'טרצות גדולה וקטנה',
  'Whole & half steps': 'צעדים שלמים וחצאים',
  'Major & minor 6ths': 'סקסטות גדולה וקטנה',
  'Major & minor 7ths': 'ספטימות גדולה וקטנה',
  'The tritone': 'הטריטון',
  'All intervals': 'כל האינטרוולים',

  // Intervals Learning — per-quality educational copy (intervals-learning-spec §7).
  // description / comparison / role for each of the 11 drilled qualities.
  'One semitone — the smallest step, two adjacent frets; a tense, grinding sound.':
    'חצי טון — הצעד הקטן ביותר, שני סריגים סמוכים; צליל מתוח ומחוספס.',
  'One semitone narrower than a major 2nd — clashing and unstable where the major 2nd sounds like a plain step.':
    'חצי טון צר מסקונדה גדולה — מתנגש ולא יציב, במקום שבו הסקונדה הגדולה נשמעת כצעד רגיל.',
  'The pull of a leading tone up to the tonic; the clash inside a tone cluster.':
    'המשיכה של צליל מוביל כלפי הטוניקה; ההתנגשות בתוך אשכול צלילים.',
  'Two semitones — a whole step; the plain next note of a scale.':
    'שני חצאי טונים — טון שלם; הצעד הרגיל אל התו הבא בסולם.',
  'One semitone wider than a minor 2nd and one narrower than a minor 3rd — a plain step, neither harsh nor sweet.':
    'חצי טון רחב מסקונדה קטנה וחצי טון צר מטרצה קטנה — צעד רגיל, לא צורם ולא מתוק.',
  'The step between most neighbouring scale degrees.':
    'הצעד בין רוב דרגות הסולם הסמוכות.',
  'Three semitones — the minor colour; a small, slightly sad-sounding gap.':
    'שלושה חצאי טונים — הצבע המינורי; מרווח קטן שנשמע מעט עצוב.',
  'One semitone narrower than a major 3rd — that single semitone is what makes a chord sound minor instead of major.':
    'חצי טון צר מטרצה גדולה — חצי הטון הזה הוא מה שגורם לאקורד להישמע מינורי במקום מז׳ורי.',
  'The third of a minor chord.': 'הטרצה של אקורד מינורי.',
  'Four semitones — the major colour; a bright, open, happy-sounding gap.':
    'ארבעה חצאי טונים — הצבע המז׳ורי; מרווח בהיר, פתוח ושמח.',
  'One semitone wider than a minor 3rd and one narrower than a perfect 4th — bright where the minor 3rd sounds sad.':
    'חצי טון רחב מטרצה קטנה וחצי טון צר מקוורטה מושלמת — בהיר, במקום שבו הטרצה הקטנה נשמעת עצובה.',
  'The bright third of a major chord.': 'הטרצה הבהירה של אקורד מז׳ורי.',
  'Five semitones — a strong, stable, slightly hollow consonance.':
    'חמישה חצאי טונים — צליל יציב וחזק, מעט חלול.',
  'One semitone wider than a major 3rd and one narrower than a tritone — settled and resolved where the tritone is tense.':
    'חצי טון רחב מטרצה גדולה וחצי טון צר מטריטון — מיושב ופתור, במקום שבו הטריטון מתוח.',
  'The sound of standard guitar tuning; root to fourth of a suspended chord.':
    'הצליל של כיוון הגיטרה הרגיל; מהיסוד אל הרביעית באקורד סַספֵּנְד.',
  'Six semitones — exactly half an octave; a tense, restless, unresolved sound.':
    'שישה חצאי טונים — בדיוק חצי אוקטבה; צליל מתוח, חסר מנוחה ולא פתור.',
  'One semitone wider than a perfect 4th and one narrower than a perfect 5th — tense and unresolved where both perfects sound stable.':
    'חצי טון רחב מקוורטה מושלמת וחצי טון צר מקווינטה מושלמת — מתוח ולא פתור, במקום ששתי המושלמות נשמעות יציבות.',
  'The blue note; the gap inside a dominant 7th chord that wants to resolve.':
    'התו הכחול; המרווח בתוך אקורד ספטימה דומיננטי שמבקש להיפתר.',
  'Seven semitones — the most stable interval after the octave; the power-chord sound.':
    'שבעה חצאי טונים — האינטרוול היציב ביותר אחרי האוקטבה; צליל אקורד הכוח.',
  'One semitone wider than a tritone — solid and at rest where the tritone is tense.':
    'חצי טון רחב מטריטון — מוצק ורגוע, במקום שבו הטריטון מתוח.',
  'Root to fifth of almost every chord; the power-chord shape.':
    'מהיסוד אל החמישית כמעט בכל אקורד; צורת אקורד הכוח.',
  'Eight semitones — a wide, wistful interval; a major 3rd turned upside down.':
    'שמונה חצאי טונים — אינטרוול רחב וגעגועי; טרצה גדולה הפוכה.',
  'One semitone narrower than a major 6th — darker and more longing than the major 6th.':
    'חצי טון צר מסקסטה גדולה — כהה ומתגעגע יותר מהסקסטה הגדולה.',
  'The top of a first-inversion major chord; root to the minor 6th degree.':
    'הצליל העליון של אקורד מז׳ורי בהיפוך ראשון; מהיסוד אל הדרגה השישית המינורית.',
  'Nine semitones — a wide, warm, sweet interval; a minor 3rd turned upside down.':
    'תשעה חצאי טונים — אינטרוול רחב, חם ומתוק; טרצה קטנה הפוכה.',
  'One semitone wider than a minor 6th and one narrower than a minor 7th — brighter and sweeter than either.':
    'חצי טון רחב מסקסטה קטנה וחצי טון צר מספטימה קטנה — בהיר ומתוק משתיהן.',
  'The added note of a 6th chord; root to the sixth degree of a major scale.':
    'התו המוסף באקורד סקסטה; מהיסוד אל הדרגה השישית בסולם מז׳ורי.',
  'Ten semitones — a wide, bluesy interval that leans forward and wants to resolve.':
    'עשרה חצאי טונים — אינטרוול רחב ובלוזי שנוטה קדימה ומבקש להיפתר.',
  'One semitone narrower than a major 7th and one wider than a major 6th — restless where the major 7th sounds sharp and the major 6th sounds settled.':
    'חצי טון צר מספטימה גדולה וחצי טון רחב מסקסטה גדולה — חסר מנוחה, במקום שבו הספטימה הגדולה נשמעת חדה והסקסטה הגדולה נשמעת מיושבת.',
  'The interval that makes a dominant 7th chord want to resolve.':
    'האינטרוול שגורם לאקורד ספטימה דומיננטי לרצות להיפתר.',
  'Eleven semitones — one short of the octave; a sharp, shimmering, almost-there sound.':
    'אחד עשר חצאי טונים — חצי טון לפני האוקטבה; צליל חד, נוצץ וכמעט־שם.',
  'One semitone wider than a minor 7th and one narrower than the octave — it strains up toward the octave where the minor 7th sits lower and bluesier.':
    'חצי טון רחב מספטימה קטנה וחצי טון צר מאוקטבה — נמתח כלפי מעלה אל האוקטבה, במקום שבו הספטימה הקטנה יושבת נמוך יותר ובלוזית יותר.',
  'The bright, jazzy top of a major 7th chord.':
    'הצליל העליון הבהיר והג׳אזי של אקורד ספטימה גדולה.',

  // Intervals Learning — the flat 11-interval progress board + the "Intervals"
  // section of Stats & progress (intervals-learning-spec §12, §15.1). Status
  // words for the board ("mastered" already exists above); headline numbers.
  'not started': 'טרם התחיל',
  'learning': 'בלמידה',
  'currently learning': 'לומד עכשיו',
  'In the system': 'במערכת',
  'Started': 'התחילו',
  'Needs work': 'דורש עבודה',
  'Accuracy': 'דיוק',
  'Avg. time': 'זמן ממוצע',

  // Intervals Learning — the guided Interval Today card (intervals-learning-spec
  // §13 / §16.2, task T9). Mirrors the note Teacher's Today card; most copy is
  // reused ("Recommended", "Start today's practice", "Why these?", the reason
  // labels). No Learning-Path string — intervals has no path screen (OD-8).
  "Today's intervals": 'האינטרוולים של היום',
  'intervals': 'אינטרוולים',
  'new': 'חדש',
  'to tell apart': 'להבחין ביניהם',
  'Practise my weak intervals': 'תרגל את האינטרוולים החלשים שלי',
  'No weak intervals yet — keep practising and the Teacher will find them.':
    'עדיין אין אינטרוולים חלשים — המשך לתרגל והמאמן ימצא אותם.',
  'broadening': 'הרחבה',

  // Intervals Learning — the Interval Selector controls (intervals-learning-spec
  // §5, task T6). Segmented-control labels, the material picker, and the two
  // "?" summary templates. Deliberately no Auto Advance string (§5.5).
  'Exercise': 'תרגיל',
  'Interval selection': 'בחירת אינטרוולים',
  'Difficulty': 'רמת קושי',
  'Direction': 'כיוון',
  'One interval': 'אינטרוול אחד',
  'A group': 'קבוצה',
  'All learned': 'כל הנלמדים',
  'All 11': 'כל ה־11',
  'Fall speed': 'מהירות נפילה',
  'Slow': 'איטי',
  'Fast': 'מהיר',
  'Focused': 'ממוקד',
  'Mixed': 'מעורב',
  'Ascending': 'עולה',
  'Descending': 'יורד',
  'Both': 'שניהם',
  'Pick more than one interval to mix': 'בחרו יותר מאינטרוול אחד כדי לערבב',
  'Practising:': 'מתרגלים:',
  "You'll hear two notes. Pick the interval between them.":
    'תשמעו שני תווים. בחרו את האינטרוול שביניהם.',
  "You'll see a note and an interval. Pick the note that far above it.":
    'תראו תו ואינטרוול. בחרו את התו שנמצא במרחק הזה מעליו.',

  // Intervals Learning — inline educational content surfaced on a missed
  // question and in the Selector's "about this interval" disclosure
  // (intervals-learning-spec §7, task T10).
  'About this interval': 'על האינטרוול הזה',
  'semitones': 'חצאי טונים',

  // Quick Access — the opt-in floating home-screen control and its Settings
  // enable row + per-card pushpins.
  'Quick access': 'גישה מהירה',
  'A floating button on the home screen for the settings you flip most. Pin up to 5 with the pushpins below, then double-tap the lower-right of the screen outside a drill to open it.':
    'כפתור צף במסך הבית להגדרות שאתם מחליפים הכי הרבה. הצמידו עד 5 באמצעות הסיכות שלמטה, ואז הקישו הקשה כפולה בחלק הימני-התחתון של המסך מחוץ לתרגול כדי לפתוח אותו.',
  'Pin to quick access?': 'להצמיד לגישה מהירה?',
  'Remove from quick access?': 'להסיר מהגישה המהירה?',
  'You can pin up to {n} settings. Remove one first.':
    'אפשר להצמיד עד {n} הגדרות. הסירו קודם אחת.',
  'Quick access is full': 'הגישה המהירה מלאה',
  'You already have {n} shortcuts. Remove one to make room?':
    'כבר יש {n} קיצורים. להסיר אחד כדי לפנות מקום?',
  'Remove one': 'להסיר אחד',
  'Leave as is': 'להשאיר כמו שזה',
  'Remove a quick access shortcut': 'הסרת קיצור מהגישה המהירה',
  'Quick access holds five shortcuts. Remove one to make room.':
    'הגישה המהירה מכילה חמישה קיצורים. הסירו אחד כדי לפנות מקום.',
  'Remove {name} from quick access': 'הסרת {name} מהגישה המהירה',
  'Yes': 'כן',
  'No': 'לא',
  'Double-tap the lower-right of the screen for quick access':
    'הקשה כפולה בחלק הימני-התחתון של המסך פותחת גישה מהירה',
  'Double-tap the lower-left of the screen for quick access':
    'הקשה כפולה בחלק השמאלי-התחתון של המסך פותחת גישה מהירה',
  'Quick access is off': 'הגישה המהירה כבויה',
  "You haven't pinned any quick access shortcuts yet":
    'עדיין לא הגדרתם קיצורי דרך לגישה המהירה',
  'What do the icons mean?': 'מה המשמעות של הסמלים?',
  'Quick access symbol legend': 'מקרא הסמלים של הגישה המהירה',
  'What each icon on the Quick Access widget means. Tapping a pinned shortcut cycles through these states in order.':
    'המשמעות של כל סמל בווידג\'ט הגישה המהירה. הקשה על קיצור מוצמד עוברת בין המצבים האלה בסדר הזה.',
  'Letters (A B C)': 'אותיות (A B C)',
  'Solfège (Do Re Mi)': 'סולפג\' (דו רה מי)',
  'Sharps (♯)': 'דיאזים (♯)',
  'Flats (♭)': 'במולים (♭)',

  // Tuner — the Learn-tab tile that opens a live chromatic tuner (mic-based
  // pitch detection). Free for every tier.
  'Tuner': 'טיונר',
  'Tune your strings using the microphone.': 'כוונון המיתרים באמצעות המיקרופון.',
  'Start listening': 'התחל האזנה',
  'Requesting microphone permission…': 'מבקש הרשאת מיקרופון…',
  'Microphone access was denied. Allow it in your browser settings, then try again.':
    'הגישה למיקרופון נדחתה. אשרו אותה בהגדרות הדפדפן ונסו שוב.',
  'Try again': 'נסו שוב',
  "Couldn't start the microphone.": 'לא ניתן היה להפעיל את המיקרופון.',
  'Listening… play a note.': 'מאזין… נגנו תו.',
  "Tap a note on the wheel to lock it as the string you're tuning. Tap it again to switch back to auto-detect.":
    'הקישו על תו בחוגה כדי לנעוץ אותו כמיתר שאתם מכוונים. הקישו עליו שוב כדי לחזור לזיהוי אוטומטי.',
  'Tuning': 'מכוונים',
  'Detected': 'זוהה',
  'String {n}': 'מיתר {n}',
  'or': 'או',
  'Unpin': 'שחרר נעילה',
  "Tap to lock this note at 12 o'clock": 'הקישו כדי לנעוץ את התו הזה בשעה 12',
  'Tap to unpin': 'הקישו כדי לשחרר את הנעילה',
  'In tune': 'מכוון',
  'Tighten (raise pitch)': 'הידקו (העלו את הטון)',
  'Loosen (lower pitch)': 'רפו (הורידו את הטון)',
  '~{pct}% of the audible threshold': '~{pct}% מסף השמיעה האנושי',

  // Fret range conflict dialog
  'Fret range too small': 'טווח סריגים קטן מדי',
  'The current fret range': 'טווח הסריגים הנוכחי',
  ' allows fewer than ': ' מאפשר פחות מ-',
  ' unique notes': ' תווים ייחודיים',
  ' with the selected strings. Please expand the range.': ' עם המיתרים הנבחרים. אנא הרחב את הטווח.',
  'Expand to minimum': 'הרחב למינימום',
  'I will expand': 'אני ארחיב',
  'Custom range': 'טווח מותאם',
  'Keep as is': 'השאר כמו שזה',
  'Set fret range': 'הגדר טווח סריגים',

  // Staff reading (StaffPracticeScreen). The two exercise names reuse the
  // Intervals keys 'Name the note' / 'Find it on the neck' above.
  'A note is written on the staff. Pick its name — you will hear it after you answer.': 'תו כתוב על החמשה. בחרו את שמו — אחרי התשובה תשמעו אותו.',
  'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.': 'תו כתוב על החמשה. הקישו על מקום בצוואר שמנגן אותו — כל מיתר נחשב. אחר כך יוצגו כל המקומות שבהם הוא נמצא.',
  'Range': 'טווח',
  'Frets 0–3': 'סריגים \u20660–3\u2069',
  'Frets 0–5': 'סריגים \u20660–5\u2069',
  'Frets 0–12': 'סריגים \u20660–12\u2069',
  'Natural notes only': 'תווים טבעיים בלבד',
  'With sharps and flats': 'עם דיאזים ובמולים',
  'Bass music is written in the bass clef, one octave above how it sounds.': 'תווים לבס נכתבים במפתח פה, אוקטבה אחת מעל הצליל שנשמע.',
  'Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.': 'תווים לכלי הזה נכתבים במפתח סול, אוקטבה אחת מעל הצליל שנשמע — ה־8 הקטן מתחת למפתח מציין זאת.',
  'Music for this instrument is written in the treble clef, at the pitch it sounds.': 'תווים לכלי הזה נכתבים במפתח סול, בגובה הצליל שנשמע.',
  'Practise reading notes on the staff and finding them on the neck': 'תרגלו קריאת תווים על החמשה ומציאתם על הצוואר',
  'A note on the staff': 'תו על החמשה',
  'Where is it written?': 'איפה זה כתוב?',
  'Read a phrase': 'קריאת משפט',
  'A place on the neck is marked. Tap the staff where that note is written, fine-tune with the arrows, then press Check.': 'מקום על הצוואר מסומן. הקישו על החמשה במקום שבו התו הזה כתוב, דייקו בעזרת החצים ולחצו על "בדיקה".',
  'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.': 'משפט קצר כתוב על החמשה. בחרו את שמות התווים שלו אחד אחרי השני — בסוף תשמעו אותו.',
  'Key signature': 'סולם וסימני היתק',
  'The signs at the start of the staff hold for every note on that letter, unless a note carries its own sign.': 'הסימנים בתחילת החמשה חלים על כל תו בשם הזה, אלא אם ליד התו כתוב סימן משלו.',
  'Notes of the key only': 'רק תווי הסולם',
  'With accidentals': 'גם תווים מחוץ לסולם',
  'Phrase': 'משפט',
  'Tap the staff where the note is written': 'הקישו על החמשה במקום שבו התו כתוב',
  'Up': 'למעלה',
  'Down': 'למטה',
  'Check': 'בדיקה',
  'Notes mastered': 'תווים בשליטה',
  'Your progress on the staff': 'ההתקדמות שלך על החמשה',
  "Today's staff reading": 'קריאת תווים היום',
  'Read a round of notes on the staff — the notes that are due come first.': 'קראו סבב תווים על החמשה — התווים שהגיע זמנם לחזרה באים ראשונים.',
  'Open staff reading': 'לקריאת תווים',
  'Play it on your guitar instead of naming it — the app listens through the microphone. Play the exact note you see, including its octave: that’s what this exercise is testing. Tapping still works.':
    'נגנו את זה על הגיטרה במקום לבחור את השם — האפליקציה מקשיבה דרך המיקרופון. נגנו את התו המדויק שאתם רואים, כולל האוקטבה שלו: זה בדיוק מה שהתרגיל הזה בודק. אפשר עדיין גם להקיש.',
  '🎸 Play the phrase on your guitar': '🎸 נגנו את המשפט על הגיטרה',

  // Tab reading (TabPracticeScreen). 'Name the note', 'Find it on the neck',
  // the range / notes chips and the board statuses reuse the keys above.
  'Tab reading': 'קריאת טאבים',
  'Write it in tab': 'לכתוב בטאב',
  'Read a riff': 'קריאת ריף',
  'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.': 'מספר כתוב על אחד מקווי הטאב. בחרו את שם התו שהוא מנגן — אחרי התשובה תשמעו אותו.',
  'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.': 'מספר כתוב על אחד מקווי הטאב. הקישו בדיוק על המקום הזה בצוואר: הקו הוא המיתר, והמספר הוא הסריג.',
  'A place on the neck is marked. Tap the tab line of its string, pick the fret number, then press Check.': 'מקום על הצוואר מסומן. הקישו על קו הטאב של המיתר שלו, בחרו את מספר הסריג ולחצו על "בדיקה".',
  'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.': 'ריף קצר כתוב בטאב. בחרו את שמות התווים שלו אחד אחרי השני — בסוף תשמעו אותו.',
  'In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.': 'בטאב הקו העליון הוא המיתר הדק והגבוה ביותר, והקו התחתון הוא העבה ביותר — הפוך מהצוואר באפליקציה, שבו המיתר העבה נמצא למעלה.',
  'Practise reading tabs and finding every number on the neck': 'תרגלו קריאת טאבים ומציאת כל מספר על הצוואר',
  'Riff': 'ריף',
  'Tap the tab line of the string': 'הקישו על קו הטאב של המיתר',
  'A number on the tab': 'מספר בטאב',
  'Fret': 'סריג',
  'Places mastered': 'מקומות בשליטה',
  'Your progress on the neck': 'ההתקדמות שלך על הצוואר',
  "Today's tab reading": 'קריאת טאבים היום',
  'Read a round of tab — the places that are due come first.': 'קראו סבב טאבים — המקומות שהגיע זמנם לחזרה באים ראשונים.',
  'Open tab reading': 'לקריאת טאבים',
  'Play it on your guitar instead of naming it — the app listens through the microphone. A pitch can’t say which string it came from, so any place that plays the right note counts — an octave either way too. Tapping still works.':
    'נגנו את זה על הגיטרה במקום לבחור את השם — האפליקציה מקשיבה דרך המיקרופון. תו שמנגנים לא יכול להעיד על המיתר שממנו הגיע, אז כל מקום שמנגן את התו הנכון נחשב — גם תו גבוה או נמוך באוקטבה. אפשר עדיין גם להקיש.',
  '🎸 Play the riff on your guitar': '🎸 נגנו את הריף על הגיטרה',

  // Tab reading, Slice 2: chords and technique symbols. 'Chords' and 'Major'
  // reuse the keys above.
  'Topic': 'נושא',
  'Single notes': 'תווים בודדים',
  'Techniques': 'טכניקות',
  'Name the chord': 'לזהות את האקורד',
  'Play the chord': 'לנגן את האקורד',
  'What does it mean?': 'מה זה אומר?',
  'Which note do you hear at the end?': 'איזה תו נשמע בסוף?',
  'A chord is written in the tab: the numbers in one column are played together, and a line with no number is not played. Name the chord — you will hear it after you answer.': 'אקורד כתוב בטאב: המספרים שבאותה עמודה מנוגנים יחד, ומיתר שאין עליו מספר לא מנוגן. בחרו את שם האקורד — אחרי התשובה תשמעו אותו.',
  'A chord is written in the tab. Tap every place it plays on the neck, one per string, leave the strings with no number alone, then press Check.': 'אקורד כתוב בטאב. הקישו על כל מקום שהוא מנגן בצוואר, מקום אחד בכל מיתר, אל תגעו במיתרים שאין עליהם מספר, ולחצו על "בדיקה".',
  'A playing technique is written in the tab. Say what the symbol means — you will hear it after you answer.': 'טכניקת נגינה כתובה בטאב. בחרו מה הסימן אומר — אחרי התשובה תשמעו אותה.',
  'A playing technique is written in the tab. Name the note that sounds at the end of it.': 'טכניקת נגינה כתובה בטאב. בחרו את התו שנשמע בסופה.',
  'The lowest note of these chords is the root, the note the chord is named after.': 'התו הנמוך ביותר באקורדים האלה הוא הטוניקה — התו שעל שמו האקורד נקרא.',
  'Chords in tab are not available for this instrument yet.': 'אקורדים בטאב עדיין לא זמינים לכלי הזה.',
  'Chords mastered': 'אקורדים בשליטה',
  'Symbols mastered': 'סימנים בשליטה',
  'Minor': 'מינור',
  'Hammer-on': 'האמר־און',
  'Pull-off': 'פול־אוף',
  'Slide up': 'סלייד למעלה',
  'Slide down': 'סלייד למטה',
  'Bend': 'בנד',
  'Vibrato': 'ויברטו',
  'Muted note': 'צליל מושתק',
  'Palm mute': 'פאלם־מיוט',
  'Hammer-on: pick the first note, then press the higher fret down hard without picking again.': 'האמר־און: פורטים את התו הראשון, ואז לוחצים בחוזקה על הסריג הגבוה יותר בלי לפרוט שוב.',
  'Pull-off: pick the first note, then pull that finger off so the lower fret sounds, without picking again.': 'פול־אוף: פורטים את התו הראשון, ואז מושכים את האצבע מהמיתר כך שהסריג הנמוך יותר נשמע, בלי לפרוט שוב.',
  'Slide up: pick the first note and slide the same finger up the string to the second fret.': 'סלייד למעלה: פורטים את התו הראשון ומחליקים את אותה אצבע לאורך המיתר למעלה, עד הסריג השני.',
  'Slide down: pick the first note and slide the same finger down the string to the second fret.': 'סלייד למטה: פורטים את התו הראשון ומחליקים את אותה אצבע לאורך המיתר למטה, עד הסריג השני.',
  'Bend: pick the note and push the string sideways until it sounds as high as the fret in the second number.': 'בנד: פורטים את התו ודוחפים את המיתר הצידה עד שהוא נשמע גבוה כמו הסריג שבמספר השני.',
  'Vibrato: let the note ring and shake its pitch slightly by moving the string.': 'ויברטו: נותנים לתו להדהד ומנענעים מעט את גובה הצליל בתנועה של המיתר.',
  'Muted note: touch the string without pressing it down and pick — a short click with no pitch.': 'צליל מושתק: נוגעים במיתר בלי ללחוץ אותו ופורטים — נקישה קצרה בלי גובה צליל.',
  'Palm mute: rest the side of the picking hand on the strings by the bridge, for a short, muffled sound.': 'פאלם־מיוט: מניחים את צד כף היד הפורטת על המיתרים ליד הגשר, לצליל קצר ועמום.',
  // Task D — Scales fingering ("Show fingers" on the box).
  'Show fingers': 'הצג אצבעות',
  'The small number on each note is the finger that plays it: 1 index, 2 middle, 3 ring, 4 pinky, 0 an open string. One finger per fret — the hand stays in place and each finger owns its fret.':
    'המספר הקטן על כל תו הוא האצבע שמנגנת אותו: 1 אצבע מורה, 2 אמה, 3 קמיצה, 4 זרת, 0 מיתר פתוח. אצבע אחת לכל סריג — היד נשארת במקומה וכל אצבע אחראית על הסריג שלה.',
  // Wishlist item 8 — Scales: the picking hand (stroke marks, notes per click).
  'Pick strokes': 'כיוון הפריטה',
  'The arrow on each note is the pick stroke: ↓ down, ↑ up. Alternate from the first note — down, up, down, up — even when you change strings.':
    'החץ על כל תו הוא כיוון הפריטה: ↓ למטה, ↑ למעלה. מחליפים כיוון מהתו הראשון — למטה, למעלה, למטה, למעלה — גם כשעוברים מיתר.',
  'The app hears which note you play, not how you pick it — it can’t check the stroke direction. With the metronome at 2 notes per click, every down stroke falls on a click, which keeps the alternation even.':
    'האפליקציה שומעת איזה תו ניגנתם, לא איך פרטתם אותו — היא לא יכולה לבדוק את כיוון הפריטה. עם המטרונום על 2 תווים לכל קליק, כל פריטה למטה נופלת על קליק, וזה שומר על החילוף אחיד.',
  'Notes per click': 'תווים לכל קליק',
  'Play two notes on each click: the down stroke on the click, the up stroke halfway to the next one. Each note is judged against those half-beats, so start slower than usual. After a clean run the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'נגנו שני תווים על כל קליק: הפריטה למטה על הקליק, הפריטה למעלה באמצע הדרך לקליק הבא. כל תו נבדק מול חצאי הפעמה האלה, לכן התחילו לאט מהרגיל. אחרי ריצה נקייה הטמפו עולה ב־4 BPM. לכל סולם ולכל תבנית יש טמפו משלהם.',
  '↓ down · ↑ up — alternate picking. The app checks the notes, not your picking hand.':
    '↓ למטה · ↑ למעלה — פריטה לסירוגין. האפליקציה בודקת את התווים, לא את היד הפורטת.',
  // Task C — Scales guided beginner path (ScalePathCard / ScaleRelativeScreen).
  'Five notes in one small box near the root — the shape most solos start from. Watch it once, then play it back.':
    'חמישה תווים בתבנית קטנה אחת ליד השורש — הצורה שממנה מתחילים רוב הסולואים. צפו בה פעם אחת, ואז נגנו אותה בחזרה.',
  'The same five notes, one box further: the root moves to the next string.':
    'אותם חמישה תווים, תבנית אחת הלאה: השורש עובר למיתר הבא.',
  'One run that crosses from box 1 into box 2 and back, so the two boxes become one stretch of the neck.':
    'ריצה אחת שעוברת מתבנית 1 לתבנית 2 וחזרה, כך ששתי התבניות הופכות לקטע אחד של הצוואר.',
  'The box you know is also a major pentatonic — only the home note changes.':
    'התבנית שאתם כבר מכירים היא גם פנטטוני מז\'ורי — רק תו הבית משתנה.',
  'Play the box you already know, but start and end on its major home note — three frets above the minor root on the thickest string.':
    'נגנו את התבנית שאתם כבר מכירים, אבל התחילו וסיימו על תו הבית המז\'ורי שלה — שלושה סריגים מעל השורש המינורי, על המיתר העבה ביותר.',
  'Box 1 of the minor pentatonic plus one extra note — the flat 5th, the "blue note".':
    'תבנית 1 של הפנטטוני המינורי ועוד תו אחד — הקווינטה המוקטנת, "התו הכחול".',
  'The full seven-note minor scale: the minor pentatonic box with two more notes filled in.':
    'סולם המינור המלא, בן שבעה תווים: התבנית של הפנטטוני המינורי עם עוד שני תווים שממלאים את הרווחים.',
  'The seven-note major scale — the one every other scale is compared to.':
    'סולם המז\'ור בן שבעה התווים — הסולם שאליו משווים את כל השאר.',
  'One shape, two names':
    'צורה אחת, שני שמות',
  'Same box, new home note':
    'אותה תבנית, תו בית חדש',
  'Your path':
    'המסלול שלך',
  'Step passed! Next up:':
    'השלב עבר! הבא בתור:',
  'Step passed!':
    'השלב עבר!',
  'Not passed yet — one more clean session usually does it.':
    'עוד לא עבר — בדרך כלל עוד סשן נקי אחד מספיק.',
  'Start this step':
    'התחילו את השלב',
  'Path complete! Practise any step again, or open More options for every scale.':
    'המסלול הושלם! אפשר לתרגל שוב כל שלב, או לפתוח את "אפשרויות נוספות" בשביל כל הסולמות.',
  'Hide steps':
    'הסתר שלבים',
  'All steps':
    'כל השלבים',
  'Finish the steps before it to unlock this one.':
    'סיימו את השלבים שלפניו כדי לפתוח אותו.',
  // Scales — sequences, a ladder after Recall (wishlist 2026-10-03 item 6).
  'Sequences':
    'רצפים',
  'Groups of 3':
    'קבוצות של 3',
  'Groups of 4':
    'קבוצות של 4',
  'Thirds':
    'טרצות',
  'Play 1-2-3, then 2-3-4, then 3-4-5… one note further each time.':
    'נגנו 1-2-3, אחר כך 2-3-4, אחר כך 3-4-5… בכל פעם תו אחד הלאה.',
  'Play 1-2-3-4, then 2-3-4-5… one note further each time.':
    'נגנו 1-2-3-4, אחר כך 2-3-4-5… בכל פעם תו אחד הלאה.',
  'Skip a note, then step back: 1-3, 2-4, 3-5…':
    'דלגו על תו וחזרו צעד אחורה: 1-3, 2-4, 3-5…',
  'Box 1 in groups of 3, groups of 4, then thirds, up and down — so you know each note’s neighbour, not only the whole line. It opens once you can play box 1 from memory.':
    'תבנית 1 בקבוצות של 3, בקבוצות של 4 ואז בטרצות, למעלה ולמטה — כדי שתכירו את השכן של כל תו, לא רק את הקו כולו. השלב נפתח כשתדעו לנגן את תבנית 1 מהזיכרון.',
  'First, play the box from memory: only the root is lit.':
    'קודם נגנו את התבנית מהזיכרון: רק תו הבסיס מואר.',
  'Good runs in a row:':
    'ריצות טובות ברצף:',
  'Play the box from memory':
    'לנגן את התבנית מהזיכרון',
  'Finish the rung before it to unlock this one.':
    'סיימו את השלב שלפניו כדי לפתוח אותו.',
  'Same five notes, same shape. Start and end on {minor} and they sound like a minor pentatonic — dark and bluesy. Start and end on {major} and the very same notes sound like a major pentatonic — bright and sweet.':
    'אותם חמישה תווים, אותה צורה. התחילו וסיימו על {minor} והם נשמעים כמו פנטטוני מינורי — כהה ובלוזי. התחילו וסיימו על {major} ואותם תווים בדיוק נשמעים כמו פנטטוני מז\'ורי — בהיר ומתוק.',
  'On the thickest string, the major home note sits three frets above the minor one.':
    'על המיתר העבה ביותר, תו הבית המז\'ורי נמצא שלושה סריגים מעל המינורי.',
  'Count the degrees from':
    'לספור את הדרגות מ־',
  'Back to the path':
    'חזרה למסלול',
  // Scales path step 0 — "One string, four fingers" + "Make it ring" (ScaleRingTips).
  'Before any scale: one finger per fret on one string, up and back. Press just behind the fret and let every note ring.':
    'לפני כל סולם: אצבע אחת לכל סריג על מיתר אחד, למעלה וחזרה. לחצו ממש מאחורי הסריג ותנו לכל תו לצלצל.',
  'One string, four fingers':
    'מיתר אחד, ארבע אצבעות',
  'Make it ring':
    'תנו לתו לצלצל',
  'Where the fingertip goes':
    'איפה שמים את קצה האצבע',
  'Arch the finger, thumb behind the neck':
    'אצבע מקומרת, אגודל מאחורי הצוואר',
  'Thumb behind the neck, about behind your middle finger — not wrapped over the top.':
    'האגודל מאחורי הצוואר, בערך מול האצבע האמצעית — לא עוטף אותו מלמעלה.',
  'Fingertip just behind the fret wire, not on top of it.':
    'קצה האצבע ממש מאחורי פס הסריג, לא עליו.',
  'Arch the finger so only the tip touches: the string next to it must still ring.':
    'קמרו את האצבע כך שרק הקצה נוגע: המיתר שלידו חייב להמשיך לצלצל.',
  'One finger per fret: finger 1 on fret 5, 2 on 6, 3 on 7, 4 on 8. Let each note ring before the next.':
    'אצבע אחת לכל סריג: אצבע 1 על סריג 5, 2 על 6, 3 על 7, 4 על 8. תנו לכל תו לצלצל לפני הבא.',
  'Fingertip just behind the fret. Let each note ring before the next.':
    'קצה האצבע ממש מאחורי הסריג. תנו לכל תו לצלצל לפני הבא.',

  // Task B — Scales metronome + gradual tempo ("Tap the scale in order").
  'Metronome': 'מטרונום',
  'Slower': 'לאט יותר',
  'Faster': 'מהר יותר',
  'Tempo': 'טמפו',
  'Play one note on each click. After a clean run — no wrong notes and nearly every note on the click — the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'נגנו תו אחד על כל קליק. אחרי ריצה נקייה — בלי תווים שגויים וכמעט כל תו על הקליק — הטמפו עולה ב־4 BPM. לכל סולם ולכל תבנית יש טמפו משלהם.',
  'The scales and boxes you picked have different tempos — this sets them all.':
    'לסולמות ולתבניות שבחרתם יש טמפו שונה — השינוי כאן קובע את כולם.',
  'On time': 'בזמן',
  'Early': 'מוקדם',
  'Late': 'מאוחר',
  'Last run': 'הריצה האחרונה',
  'on the click': 'על הקליק',
  'early': 'מוקדם',
  'late': 'מאוחר',
  'You are rushing — wait for the click.': 'אתם ממהרים — חכו לקליק.',
  'You are dragging — play right on the click.': 'אתם נגררים — נגנו בדיוק על הקליק.',
  'Clean run! Tempo up to': 'ריצה נקייה! הטמפו החדש:',
  'Clean run at the top tempo!': 'ריצה נקייה בטמפו המרבי!',
  'Not clean yet — the tempo stays at': 'עוד לא נקי — הטמפו נשאר',

  // Wishlist 2026-10-03 item 1 — Scales: plain words, in place (ScaleTermHint).
  'What does this word mean?':
    'מה פירוש המילה?',
  'What the words mean':
    'מה פירוש המילים',
  'A box is one hand-sized patch of the neck where the whole scale fits under your four fingers without moving your hand — its number says which patch, not a finger or a fret.':
    'תבנית היא אזור בגודל כף יד על הצוואר, שבו כל הסולם נכנס מתחת לארבע האצבעות בלי להזיז את היד — המספר שלה אומר איזה אזור, לא איזו אצבע ולא איזה סריג.',
  'The root is the scale’s home note, the one it is named after — it has the gold ring.':
    'השורש הוא תו הבית של הסולם, התו שעל שמו הוא נקרא — יש לו טבעת זהב.',
  'A degree is a note’s place in the scale, counted up from the root, which is 1 — a “b” before the number means one fret lower.':
    'דרגה היא המקום של תו בסולם, בספירה מהשורש שהוא 1 — “b” לפני המספר פירושו סריג אחד נמוך יותר.',
  'Strings are numbered from the thinnest (1) to the thickest, so the thickest string — the lit row on top — has the highest number.':
    'המיתרים ממוספרים מהדק ביותר (1) עד העבה ביותר, כך שלמיתר העבה ביותר — השורה המוארת למעלה — יש המספר הגבוה ביותר.',
  'A fret is one numbered slot along the neck — press just behind its metal wire; the numbers under the board are the frets.':
    'סריג הוא משבצת ממוספרת לאורך הצוואר — לוחצים ממש מאחורי פס המתכת שלו; המספרים מתחת ללוח הם הסריגים.',
  // Scales — "I play, you play it back" (call and response by ear).
  'Play it back by ear': 'לנגן בחזרה לפי השמיעה',
  'The app plays a few notes from the box — nothing lights up, so listen. Then play them back on your guitar or tap them. Every phrase starts on the root (gold ring). Two clean phrases in a row and the next one is a note longer.': 'האפליקציה מנגנת כמה תווים מהתבנית — שום דבר לא נדלק, אז הקשיבו. אחר כך נגנו אותם בחזרה בגיטרה או הקישו עליהם. כל משפט מתחיל בתו הבסיס (המסגרת הזהובה). אחרי שני משפטים נקיים ברצף, המשפט הבא ארוך בתו אחד.',
  'The box on the board': 'התבנית על הלוח',
  'With only the root lit, your ear finds the notes, not your eye.': 'כשרק תו הבסיס מואר, האוזן מוצאת את התווים, לא העין.',
  'Notes in the phrase': 'תווים במשפט',
  'Listen…': 'הקשיבו…',
  '✓ Clean — the next phrase is one note longer.': '✓ נקי — המשפט הבא ארוך בתו אחד.',
  '✓ Clean!': '✓ נקי!',
  'Found it, with a slip.': 'מצאתם, עם טעות אחת בדרך.',
  'Missed — the next phrase is one note shorter.': 'לא הפעם — המשפט הבא קצר בתו אחד.',
  'Longest phrase played back': 'המשפט הארוך ביותר שניגנתם בחזרה',
  '🎸 Play the notes back on your guitar': '🎸 נגנו את התווים בחזרה בגיטרה',
  // Scales — short licks per box (scaleLicks.ts, wishlist item 7).
  'The blues opening': 'פתיחת הבלוז',
  'One note each on strings 3, 2 and 1, ending on the root.': 'תו אחד בכל מיתר: 3, 2 ואז 1, ומסיימים על השורש.',
  'The full version bends the first note up a whole step. Here it is played without the bend.': 'בגרסה המלאה מכופפים (בנד) את התו הראשון בטון שלם. כאן מנגנים אותו בלי הבנד.',
  'Turn for home': 'חזרה הביתה',
  'Two notes down string 3, then the root on string 4.': 'שני תווים יורדים במיתר 3, ואז השורש במיתר 4.',
  'The full version starts the first note bent up and lets it down. Here it is played without the bend.': 'בגרסה המלאה התו הראשון מתחיל מכופף ומשחררים אותו למטה. כאן מנגנים אותו בלי הבנד.',
  'The rolling triplet': 'הטריולה המתגלגלת',
  'Pull off from the high note to the root on string 1, then string 2 — three notes, twice round.': 'פול־אוף מהתו הגבוה לשורש במיתר 1, ואז מיתר 2 — שלושה תווים, פעמיים.',
  'Pull-offs down the box': 'פול־אופים במורד התבנית',
  'On strings 1, 2 and 3 in turn, pull off from the high note to the low one.': 'במיתרים 1, 2 ו־3 לפי הסדר: פול־אוף מהתו הגבוה לנמוך.',
  'The full version bends the 5th note up a whole step. Here it is played without the bend.': 'בגרסה המלאה מכופפים (בנד) את התו החמישי בטון שלם. כאן מנגנים אותו בלי הבנד.',
  'Lick': 'ליק',
  'Try': 'ניסיון',
  'Missed this time.': 'לא הפעם.',
  'What the app plays': 'מה האפליקציה מנגנת',
  'Short phrases': 'משפטים קצרים',
  'Licks': 'ליקים',
  'Standard blues and rock licks every guitarist learns in this box. The app shows and plays each lick, then you play it back on your guitar or tap it — twice per lick, in one key.': 'ליקים סטנדרטיים של בלוז ורוק שכל גיטריסט לומד בתבנית הזאת. האפליקציה מראה ומנגנת כל ליק, ואז אתם מנגנים אותו בחזרה בגיטרה או מקישים — פעמיים לכל ליק, באותו סולם.',
  'Licks played clean': 'ליקים נקיים',
  // Menu search (src/utils/appSearch.ts)
  'Search the app': 'חיפוש באפליקציה',
  'No results': 'לא נמצאו תוצאות',
  'Clear search': 'ניקוי החיפוש',
  // Practice drill feedback line (src/hooks/useGameEngine.ts)
  'Correct!': 'נכון!',
  'All found!': 'מצאת את כולם!',
  'Where else? ({n} more)': 'איפה עוד? (עוד {n})',
  'Also on: {list}': 'גם בסריגים: {list}',
  'Correct: {list}': 'הסריגים הנכונים: {list}',
  'It was {note}': 'התשובה: {note}',

  // Fret of the Day / Challenge a friend
  'Fret of the Day': 'הסריג של היום',
  'The same {count} positions for every player in the world, today.': '{count} המיקומים הזהים לכל שחקן בעולם, היום.',
  '{count} positions, today': '{count} מיקומים, היום',
  '{name} got {correct}/{total} in {seconds}s — beat it!': '{name} קיבל/ה {correct}/{total} תוך {seconds} שניות — תוכלו לנצח?',
  '{n}-day streak': 'רצף של {n} ימים',
  'Come back tomorrow for a new puzzle.': 'חזרו מחר לחידה חדשה.',
  'Share result': 'שתפו תוצאה',
  'Your name (optional)': 'השם שלכם (לא חובה)',
  'Challenge a friend': 'אתגרו חבר',
  'Copied to clipboard': 'הועתק ללוח',
  'A friend': 'חבר',
  "Beat my score on today's Fret of the Day!": 'תוכלו לנצח את הניקוד שלי בסריג של היום?',
  'You beat {name} by {n}!': 'ניצחתם את {name} בהפרש של {n}!',
  '{name} still leads': '{name} עדיין מוביל/ה',
  'You beat {name} — same score, faster!': 'ניצחתם את {name} — אותו ניקוד, מהר יותר!',
  'You tied {name}!': 'תיקו עם {name}!',
  'Want to learn the whole neck? A few minutes a day.': 'רוצים ללמוד את כל הצוואר? כמה דקות ביום.',
  // ── Teacher mode: the Class screen (ClassroomScreen / HomeworkRun) ──
  "Class": "כיתה",
  "Classes need an internet connection and are not available in this build.": "כיתות דורשות חיבור לאינטרנט ואינן זמינות בגרסה הזו.",
  "Something went wrong. Check your connection and try again.": "משהו השתבש. בדקו את החיבור ונסו שוב.",
  "You were invited to join a class with code {code}.": "הוזמנתם להצטרף לכיתה עם הקוד {code}.",
  "Classes connect a teacher and their students: the teacher assigns practice, and sees who did it and how it went. Sign in so your teacher can see your results.": "כיתה מחברת בין מורה לתלמידים: המורה נותן תרגול, ורואה מי תרגל ואיך הלך. התחברו כדי שהמורה יראה את התוצאות שלכם.",
  "My classes": "הכיתות שלי",
  "Classes I teach": "כיתות שאני מלמד",
  "Verified teacher — Premium is on us.": "מורה מאומת — Premium עלינו.",
  "Premium is on us — one of your classes is active.": "Premium עלינו — אחת הכיתות שלכם פעילה.",
  "Get Premium free, automatically, once one of your classes has 6 or more students who have practised in the last 30 days. Everything here already works either way.": "קבלו Premium בחינם, אוטומטית, כשלאחת הכיתות שלכם יש 6 תלמידים או יותר שתרגלו ב-30 הימים האחרונים. בכל מקרה, כל מה שכאן כבר עובד.",
  "You joined {name}.": "הצטרפתם ל־{name}.",
  "That is your own class — you teach it.": "זו הכיתה שלכם — אתם המורים בה.",
  "No class has that code. Check it with your teacher.": "אין כיתה עם הקוד הזה. בדקו אותו עם המורה.",
  "Join a class": "הצטרפות לכיתה",
  "Class code": "קוד כיתה",
  "Your name, as your teacher will see it": "השם שלכם, כפי שהמורה יראה אותו",
  "Join": "הצטרפות",
  "Do you teach guitar, bass or ukulele?": "מלמדים גיטרה, בס או יוקלילי?",
  "Create a class, give your students its code, assign practice and see who did it. Get Premium free once a class has 6 or more active students.": "צרו כיתה, תנו לתלמידים את הקוד שלה, הקצו תרגול וראו מי תרגל. קבלו Premium בחינם כשלכיתה יש 6 תלמידים פעילים או יותר.",
  "I'm a teacher": "אני מורה",
  "Becoming a teacher needs a short, timed music-theory test first.": "כדי להיות מורה צריך קודם לעבור מבחן קצר ומתוזמן בתורת המוזיקה.",

  // Teacher test (0027_teacher_exam.sql / TeacherExamScreen.tsx)
  "Show what you know": "הראו מה אתם יודעים",
  "Becoming a teacher needs a short music-theory test: {n} questions, each timed, about reading the neck, the staff, intervals, key signatures and chords. A pass needs {pass} or more right.":
    "כדי להיות מורה צריך לעבור מבחן קצר בתורת המוזיקה: {n} שאלות, כל אחת עם זמן מוגבל, על קריאת הצוואר, התווים, האינטרוולים, סימני המפתח והאקורדים. כדי לעבור צריך {pass} תשובות נכונות או יותר.",
  "Each question disappears once its time is up, so there is no time to look anything up — just enough to answer if you know it.":
    "כל שאלה נעלמת כשנגמר הזמן שלה, כך שאין זמן לחפש תשובה — רק מספיק זמן לענות אם אתם יודעים.",
  "You can try again {when}.": "תוכלו לנסות שוב {when}.",
  "Try again now.": "אפשר לנסות שוב עכשיו.",
  "Start the test": "התחלת המבחן",
  "Which instrument?": "איזה כלי?",
  "The neck and staff questions use this instrument.": "שאלות הצוואר והתווים משתמשות בכלי הזה.",
  "Begin": "התחלה",
  "Teacher test": "מבחן מורים",
  "Question {n} of {total}": "שאלה {n} מתוך {total}",
  "Leave now? This attempt will count as failed.": "לצאת עכשיו? הניסיון הזה ייחשב ככישלון.",
  "Which note is marked on the neck?": "איזה תו מסומן על הצוואר?",
  "Which note is written?": "איזה תו כתוב?",
  "From {a} up to {b} — which interval?": "מ-{a} עד {b} — איזה אינטרוול?",
  "How many sharps or flats does {key} have?": "כמה דיאזים או במולים יש ב-{key}?",
  "Which major key has {sig}?": "איזה סולם מז'ור מכיל {sig}?",
  "What is the relative minor of {key}?": "מהו המינור המקביל של {key}?",
  "Which chord is {notes}?": "איזה אקורד הוא {notes}?",
  "Which notes make up {chord}?": "אילו תווים מרכיבים את {chord}?",
  "In {key}, which chord is built on degree {n}?": "ב-{key}, איזה אקורד בנוי על דרגה {n}?",
  "In {key}, which note is degree {n}?": "ב-{key}, איזה תו הוא דרגה {n}?",
  "No sharps or flats": "בלי דיאזים ובלי במולים",
  "{note} major": "{note} מז'ור",
  "{note} minor": "{note} מינור",
  "You're a teacher now — you can create classes and assign homework.": "אתם מורים עכשיו — אתם יכולים ליצור כיתות ולהקצות שיעורי בית.",
  "Not this time — {pass} or more were needed.": "לא הפעם — היה צריך {pass} תשובות נכונות או יותר.",
  "Notes on the neck": "תווים על הצוואר",
  "Reading the staff": "קריאת התווים",
  "Key signatures": "סימני מפתח",
  "Harmony in a key": "הרמוניה בסולם",
  "Admins already have Premium regardless of teacher status — skip the test and become a teacher directly.":
    "למנהלים כבר יש Premium בלי קשר לסטטוס מורה — אפשר לדלג על המבחן ולהפוך למורה ישירות.",
  "Skip the test (admin)": "דילוג על המבחן (מנהל)",
  "Show on my public profile": "הצגה בפרופיל הציבורי שלי",
  "New class name": "שם הכיתה החדשה",
  "Create class": "יצירת כיתה",
  "Join my class on Fretquency": "הצטרפו לכיתה שלי ב־Fretquency",
  "Join my class \"{name}\" on Fretquency — code {code}": "הצטרפו לכיתה שלי \"{name}\" ב־Fretquency — קוד {code}",
  "Share invite link": "שיתוף קישור הזמנה",
  "Homework": "שיעורי בית",
  "Assign homework": "הקצאת שיעורי בית",
  "No homework yet.": "עדיין אין שיעורי בית.",
  "Students": "תלמידים",
  "No students yet. Share the code or the invite link with them.": "עדיין אין תלמידים. שתפו איתם את הקוד או את קישור ההזמנה.",
  "Remove {name} from this class?": "להסיר את {name} מהכיתה?",
  "Remove": "הסרה",
  "Delete this class, its homework and all results?": "למחוק את הכיתה, את שיעורי הבית שלה ואת כל התוצאות?",
  "Delete class": "מחיקת הכיתה",
  "{n} of {total} practised": "{n} מתוך {total} תרגלו",
  "Due {date}": "להגשה עד {date}",
  "best {correct}/{total} · {n} tries · {date}": "הכי טוב {correct}/{total} · {n} ניסיונות · {date}",
  "best {correct}/{total} · {n} tries": "הכי טוב {correct}/{total} · {n} ניסיונות",
  "Not yet": "עדיין לא",
  "Not done yet": "עדיין לא בוצע",
  "Delete this homework and its results?": "למחוק את שיעורי הבית ואת התוצאות שלהם?",
  "Delete homework": "מחיקת שיעורי הבית",
  "A Notes drill: a fret is shown, the student names the note.": "תרגיל תווים: מוצג סריג, והתלמיד אומר איזה תו זה.",
  "Title": "כותרת",
  "e.g. Low E string, first 5 frets": "למשל: מיתר E נמוך, 5 הסריגים הראשונים",
  "From fret": "מסריג",
  "To fret": "עד סריג",
  "Natural notes only (no sharps or flats)": "רק תווים טבעיים (בלי דיאזים ובמולים)",
  "Questions": "שאלות",
  "Due date (optional)": "תאריך הגשה (לא חובה)",
  "Assign": "הקצאה",
  "Teacher: {name}": "מורה: {name}",
  "Update the app to open this homework.": "עדכנו את האפליקציה כדי לפתוח את שיעורי הבית האלה.",
  "Leave this class? Your teacher will no longer see your results.": "לעזוב את הכיתה? המורה כבר לא יראה את התוצאות שלכם.",
  "Leave class": "עזיבת הכיתה",
  "Sending your result to your teacher…": "שולחים את התוצאה למורה…",
  "Your teacher can see this result.": "המורה יכול לראות את התוצאה הזו.",
  "Could not send your result. Check your connection.": "לא הצלחנו לשלוח את התוצאה. בדקו את החיבור.",
  "Play again": "שוב",
  "Done": "סיום",
  "Strings {list}": "מיתרים {list}",
  "frets {from}–{to}": "סריגים {from}–{to}",
  "naturals only": "רק טבעיים",
  "{n} questions": "{n} שאלות",

  // Class: teacher-chosen codes, blocking, idle-class notices (migration 0028).
  "The teacher of this class removed you from it, so you cannot join it again.": "המורה של הכיתה הזו הסיר אתכם ממנה, ולכן אי אפשר להצטרף אליה שוב.",
  "Too many wrong codes. Wait a few minutes and try again.": "יותר מדי קודים שגויים. חכו כמה דקות ונסו שוב.",
  "Capital and small letters count. Type the code exactly as your teacher wrote it.": "יש הבדל בין אותיות גדולות לקטנות. הקלידו את הקוד בדיוק כמו שהמורה כתב אותו.",
  "The code needs 6 to 10 characters.": "הקוד צריך להיות באורך 6 עד 10 תווים.",
  "Use only English letters and digits.": "השתמשו רק באותיות באנגלית ובספרות.",
  "Add at least one letter.": "הוסיפו לפחות אות אחת.",
  "Add at least one digit.": "הוסיפו לפחות ספרה אחת.",
  "A class with this name already exists. Pick another name.": "כבר יש כיתה בשם הזה. בחרו שם אחר.",
  "This code is already taken. Pick another code.": "הקוד הזה כבר תפוס. בחרו קוד אחר.",
  "This code is not valid. Use 6 to 10 English letters and digits, with at least one of each.": "הקוד לא תקין. השתמשו ב-6 עד 10 אותיות באנגלית וספרות, ולפחות אחת מכל סוג.",
  "Suggest": "הצעה",
  "6 to 10 English letters and digits, at least one of each. Capital and small letters count.": "6 עד 10 אותיות באנגלית וספרות, לפחות אחת מכל סוג. יש הבדל בין אותיות גדולות לקטנות.",
  "Closing soon": "תיסגר בקרוב",
  "Quiet": "שקטה",
  "Assign homework, or have a student practise or join, to keep it open.": "כדי שהכיתה תישאר פתוחה, תנו שיעורי בית, או שתלמיד יתרגל או יצטרף.",
  "Nothing has happened in this class for {n} days.": "לא הייתה פעילות בכיתה הזו כבר {n} ימים.",
  "A class with no activity for 6 months is deleted.": "כיתה בלי פעילות במשך 6 חודשים נמחקת.",
  "This class will be deleted on {date}, with its homework and results, because nothing has happened in it for 5 months.": "הכיתה הזו תימחק ב-{date}, יחד עם שיעורי הבית והתוצאות, כי לא הייתה בה פעילות במשך 5 חודשים.",
  "Students already in the class stay in it. The old code and old invite links stop working.": "תלמידים שכבר בכיתה נשארים בה. הקוד הישן וקישורי ההזמנה הישנים יפסיקו לעבוד.",
  "Save code": "שמירת הקוד",
  "Change code": "החלפת קוד",
  "New code saved.": "הקוד החדש נשמר.",
  "Remove {name} and block them? They will not be able to join this class again, even with a new code.": "להסיר את {name} ולחסום? לא תהיה לו אפשרות להצטרף לכיתה הזו שוב, גם עם קוד חדש.",
  "Remove and block": "הסרה וחסימה",
  "Blocked": "חסומים",
  "These students cannot join this class again, even with a new code.": "התלמידים האלה לא יכולים להצטרף לכיתה הזו שוב, גם עם קוד חדש.",
  "blocked {date}": "נחסם ב-{date}",
  "Unblock": "ביטול חסימה",
};
