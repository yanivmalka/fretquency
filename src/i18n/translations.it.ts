// Italian (it) dictionary, keyed by the English source string like `he` in
// translations.ts. Addresses the player as "tu". Landing in stages, mirroring
// Spanish / Portuguese stage 1: the app shell, settings, the drawer, the
// in-game screen, the Selector, Onboarding, Stats, the Leaderboard and the
// plan card. Everything not listed here falls back to English until a later
// stage adds it (see product-wishlist.md).

export const it: Record<string, string> = {
  // Instrument / title
  'Guitar': 'Chitarra',
  'Bass': 'Basso',
  'Fret Practice': 'Allenamento sui tasti',

  // Instrument picker — roadmap instruments (admin-only "coming soon" tiles)
  'Coming soon': 'Prossimamente',
  'Ukulele': 'Ukulele',
  'Mandolin': 'Mandolino',
  'Banjo': 'Banjo',

  // Settings — section titles / labels / help
  'Instrument': 'Strumento',
  'Playing': 'Pratica',
  'Instruments': 'Strumenti',
  'Strings': 'Corde',
  'Frets': 'Tasti',
  'Type': 'Tipo',
  'Acoustic': 'Acustica',
  'Electric': 'Elettrica',
  'Soprano': 'Soprano',
  'Concert': 'Concerto',
  'Tenor': 'Tenore',
  'Baritone': 'Baritono',
  '5-String Standard': '5 corde · standard',
  '5-String Parlor': '5 corde · parlor',
  '5-String Long Neck': '5 corde · manico lungo',
  '4-String Tenor (Irish, short scale)': '4 corde · tenore (irlandese, scala corta)',
  '4-String Tenor': '4 corde · tenore',
  '4-String Plectrum': '4 corde · plettro',
  '6-String (Guitar-Banjo)': '6 corde · banjo-chitarra',
  'Notes': 'Note',
  'Switches tuning, string count and fret range, then reloads the note samples.':
    'Cambia accordatura, numero di corde ed estensione dei tasti, poi ricarica i suoni delle note.',
  'Note names': 'Nomi delle note',
  'Written as': 'Scritte come',
  "Display only — the drill itself doesn't change.":
    'Cambia solo la visualizzazione — l’esercizio resta lo stesso.',
  'Letters (A, B, C…) or solfège syllables (Do, Re, Mi…).':
    'Lettere (A, B, C…) o sillabe del solfeggio (Do, Re, Mi…).',
  'A sharp (♯) is a half-step higher; a flat (♭) is a half-step lower. The same pitch can be written either way — C♯ and D♭ are one note. Pick which sign you see.':
    'Un diesis (♯) è un semitono sopra; un bemolle (♭) è un semitono sotto. La stessa altezza si può scrivere in entrambi i modi — C♯ e D♭ sono la stessa nota. Scegli quale segno vedere.',
  'A dièse (♯) is a half-step higher; a bémol (♭) is a half-step lower. The same pitch can be written either way — Do♯ and Re♭ are one note. Pick which sign you see.':
    'Un diesis (♯) è un semitono sopra; un bemolle (♭) è un semitono sotto. La stessa altezza si può scrivere in entrambi i modi — Do♯ e Re♭ sono la stessa nota. Scegli quale segno vedere.',
  'Sharps or flats': 'Diesis o bemolli',
  'Sharp (♯)': 'Diesis (♯)',
  'Flat (♭)': 'Bemolle (♭)',
  'Dièse (♯)': 'Diesis (♯)',
  'Bémol (♭)': 'Bemolle (♭)',
  'Score': 'Punteggio',
  'Score & celebrations': 'Punteggio e festeggiamenti',
  'Live score, streak multiplier and celebrations are shown.':
    'Vengono mostrati il punteggio in tempo reale, il moltiplicatore della serie e i festeggiamenti.',
  'Every answer is still recorded to your stats and personal bests either way.':
    'In ogni caso, ogni risposta viene comunque salvata nelle tue statistiche e nei tuoi record personali.',

  // Daily reminder
  'Daily reminder': 'Promemoria giornaliero',
  'A notification at the time you pick, reminding you to practice.':
    'Una notifica all’orario che scegli, per ricordarti di esercitarti.',
  'A browser notification at the time you pick — only while this app is open in a tab. For a reminder that works with the app closed, install the Android app.':
    'Una notifica del browser all’orario che scegli — solo mentre questa app è aperta in una scheda. Per un promemoria che funzioni ad app chiusa, installa l’app Android.',
  'Finish one more round first — then we can ask for notification permission.':
    'Finisci un altro round — poi potremo chiedere il permesso per le notifiche.',
  'Notifications are blocked — turn them on for this app in your device/browser settings.':
    'Le notifiche sono bloccate — attivale per questa app nelle impostazioni del dispositivo o del browser.',
  'Reminder time': 'Orario del promemoria',
  'Time to practice': 'È ora di esercitarsi',
  "A couple of minutes keeps your streak alive — don't lose it today.":
    'Pochi minuti bastano a tenere viva la tua serie — non perderla oggi.',

  'On': 'Attivo',
  'Off': 'Disattivo',
  'Silent mode': 'Modalità silenziosa',
  'Sound & vibration': 'Suono e vibrazione',
  'Sound': 'Suono',
  'Vibrate': 'Vibrazione',
  'Silent': 'Silenzioso',
  'How the drill answers back, on one ladder from quietest to loudest. Silent: no sound and no per-button buzz, just a buzz on right / wrong answers plus the on-screen celebrations. Vibrate: no sound — a buzz on every button press and on right / wrong answers instead. Sound 1–5: note playback, chimes and tap sounds, louder each step; the limiter keeps even the loudest from distorting. Silent and Vibrate are great for practising with headphones off or a guitar in hand.':
    'Come ti risponde l’esercizio, su una scala dal più silenzioso al più forte. Silenzioso: nessun suono e nessuna vibrazione sui pulsanti, solo una vibrazione sulle risposte giuste / sbagliate più i festeggiamenti sullo schermo. Vibrazione: nessun suono — al suo posto una vibrazione a ogni tocco di un pulsante e sulle risposte giuste / sbagliate. Suono 1–5: la nota, i segnali e i suoni dei tocchi, più forti a ogni livello; il limitatore evita la distorsione anche al massimo. Silenzioso e Vibrazione sono perfetti per esercitarsi senza cuffie o con la chitarra in mano.',
  'Theme': 'Tema',
  'Dark': 'Scuro',
  'Night': 'Notte',
  'Day': 'Giorno',
  'Night is a warmer, dimmer palette for a dark room. Day is a light palette.':
    'Notte è una tavolozza più calda e tenue per una stanza buia. Giorno è una tavolozza chiara.',
  'Appearance': 'Aspetto',
  'Theme sets how light or dark the app is: Night is a warmer, dimmer palette for a dark room, Day is a light one. Season sets the colours layered over it — Winter is the original look. Auto follows your clock (Day from 07:00 to 19:00, Night after) and the real season where you are; picking a season by hand holds until that season ends.':
    'Il tema stabilisce quanto l’app è chiara o scura: Notte è una tavolozza più calda e tenue per una stanza buia, Giorno è una tavolozza chiara. La stagione stabilisce i colori applicati sopra — Inverno è l’aspetto originale. Automatico segue il tuo orologio (Giorno dalle 07:00 alle 19:00, Notte dopo) e la stagione reale dove ti trovi; se scegli una stagione a mano, resta finché quella stagione non finisce.',
  'Season': 'Stagione',
  'Winter': 'Inverno',
  'Spring': 'Primavera',
  'Summer': 'Estate',
  'Autumn': 'Autunno',
  'A seasonal colour palette layered over the theme. Winter is the original look.':
    'Una tavolozza di colori stagionale applicata sopra il tema. Inverno è l’aspetto originale.',
  'Mastery on the fretboard': 'Padronanza sulla tastiera',
  'The per-note / per-fret accuracy bars drawn over the circle and grid while stopped or paused.':
    'Le barre di precisione per nota / per tasto disegnate sul cerchio e sulla griglia quando il gioco è fermo o in pausa.',
  'Mastery keeps being tracked and shows on the Stats screen either way.':
    'La padronanza continua a essere registrata e compare comunque nella schermata delle statistiche.',
  'Questions counted': 'Domande conteggiate',
  'How many of your most recent questions the mastery bars are computed from. Free accounts use the last 250.':
    'Da quante delle tue domande più recenti vengono calcolate le barre di padronanza. Gli account gratuiti usano le ultime 250.',
  'Choose how many recent questions the mastery bars are counted from':
    'Scegli da quante domande recenti vengono calcolate le barre di padronanza',
  'Mastery time window': 'Periodo della padronanza',
  'Point the mastery bars at a recent-question count, a single day, or a date range':
    'Calcola le barre di padronanza da un numero di domande recenti, da un singolo giorno o da un intervallo di date',
  'What slice of your history the mastery bars are computed from. Free accounts use the last 250 questions. Older history saved without a date is not counted for a specific day or range.':
    'Quale parte della tua cronologia viene usata per calcolare le barre di padronanza. Gli account gratuiti usano le ultime 250 domande. La cronologia più vecchia salvata senza data non conta per un giorno o un intervallo specifico.',
  'Recent': 'Recenti',
  'A day': 'Un giorno',
  'A range': 'Un intervallo',
  'From': 'Da',
  'To': 'A',
  'showing': 'mostra',
  'showing last': 'mostra le ultime',
  'showing all questions': 'mostra tutte le domande',
  'All': 'Tutto',
  'Stats & progress': 'Statistiche e progressi',
  'Answer mode': 'Modalità di risposta',
  'How you answer': 'Come rispondi',
  'Voice mode asks for microphone permission the first time.':
    'La modalità voce chiede il permesso di usare il microfono la prima volta.',
  'Speak clearly and pause briefly between words — for sharp/flat notes, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Parla chiaramente e fai una breve pausa tra le parole — per le note con diesis/bemolle, di’ la lettera, fai una pausa, poi “sharp” / “flat” come due parole separate.',
  'Tap': 'Tocco',
  'Voice': 'Voce',
  'Play the target note on your guitar instead of tapping — the app listens through the microphone. Only works for “by fret” questions — a played note can’t say which string it came from, so “by note” questions stay on tap.':
    'Suona la nota richiesta sulla tua chitarra invece di toccarla — l’app ascolta dal microfono. Funziona solo per le domande “per tasto” — una nota suonata non dice da quale corda arriva, quindi le domande “per nota” restano al tocco.',
  '🎸 Microphone blocked — enable it or switch to tap': '🎸 Microfono bloccato — attivalo o passa al tocco',
  '🎸 Pitch detection isn’t available on this device — use tap': '🎸 Il rilevamento dell’altezza non è disponibile su questo dispositivo — usa il tocco',
  '🎸 Didn’t catch that': '🎸 Non ho capito',
  '🎸 Play the note on your guitar': '🎸 Suona la nota sulla tua chitarra',
  'Voice engine': 'Motore vocale',
  'Auto picks the best available. Personal uses your calibrated profile; General uses the built-in model.':
    'Automatico sceglie il migliore disponibile. Personale usa il tuo profilo calibrato; Generale usa il modello integrato.',
  'Auto': 'Automatico',
  'Personal': 'Personale',
  'General': 'Generale',
  'Your voice profile': 'Il tuo profilo vocale',
  'Calibrating your own voice improves recognition when answering by voice.':
    'Calibrare la tua voce migliora il riconoscimento quando rispondi a voce.',
  'recordings': 'registrazioni',
  'enabled': 'attivo',
  'Add / review recordings': 'Aggiungi / rivedi le registrazioni',
  'Calibrate my voice': 'Calibra la mia voce',
  'Feedback board': 'Bacheca dei suggerimenti',
  'Leaderboard': 'Classifica',
  'Account': 'Account',
  'Signed in': 'Accesso effettuato',
  'Keeps your preferences and data in sync across devices.':
    'Mantiene le tue preferenze e i tuoi dati sincronizzati tra i dispositivi.',
  'Sign out': 'Esci',
  'Sign in with Google to keep your preferences and data across devices.':
    'Accedi con Google per avere le tue preferenze e i tuoi dati su tutti i dispositivi.',
  'Sign in with Google': 'Accedi con Google',

  // Account → About tile + live community counts
  'About': 'Informazioni',
  'Fretquency is a small labor of love — built to turn learning the fretboard into a game instead of a chore. Made by an independent developer, with patient help from family and friends.':
    'Fretquency è un piccolo progetto fatto con passione — creato per trasformare lo studio della tastiera in un gioco invece che in un dovere. Realizzato da uno sviluppatore indipendente, con il paziente aiuto di famiglia e amici.',
  'Registered users': 'Utenti registrati',
  'Active now': 'Attivi ora',
  'Guests online': 'Ospiti online',
  'App update': 'Aggiornamento dell’app',
  'A new version of the app is ready to install.': 'Una nuova versione dell’app è pronta da installare.',
  'Update to version': 'Aggiorna alla versione',
  'Downloading…': 'Download in corso…',
  'Allow installs from this app in Android settings, then try again.': 'Consenti le installazioni da questa app nelle impostazioni di Android, poi riprova.',
  'The update could not be installed. Check your connection and try again.': 'Impossibile installare l’aggiornamento. Controlla la connessione e riprova.',
  'See the full list and what earns each one': 'Vedi l’elenco completo e come ottenere ciascuna',
  'Badges': 'Medaglie',
  'Language': 'Lingua',
  'Downloading the language…': 'Download della lingua…',
  'Could not download the language. Check your connection and try again.': 'Impossibile scaricare la lingua. Controlla la connessione e riprova.',
  'Left-handed': 'Mancino',
  'Seasonal background': 'Sfondo stagionale',
  'Background beats': 'Ritmo di sottofondo',
  'Beat style': 'Stile del ritmo',
  'Rock': 'Rock',
  'Shuffle': 'Shuffle',
  'Hip-hop': 'Hip-hop',
  'Bossa nova': 'Bossa nova',
  'Beat tempo': 'Tempo del ritmo',
  'Follows your pace': 'Segue il tuo ritmo',
  'Steady': 'Fisso',
  'The beat speeds up as a streak shortens the time per question, and settles back when the timing resets.': 'Il ritmo accelera quando una serie accorcia il tempo per domanda, e rallenta quando il tempo si azzera.',
  'The beat keeps its own tempo for the whole round.': 'Il ritmo mantiene il suo tempo per tutto il round.',
  'A quiet drum loop under a Practice round to keep your pace. It stops while the round is paused.': 'Un loop di batteria leggero durante un round di pratica per tenere il tempo. Si ferma quando il round è in pausa.',
  'Not playing now: Sound & vibration is on Silent or Vibrate. Pick a Sound level to hear the beats.': 'Ora non suona: Suono e vibrazione è su Silenzioso o Vibrazione. Scegli un livello di suono per sentire il ritmo.',
  'Not playing now: you answer by voice or by playing, and the microphone would hear the beats. Switch “How you answer” to Tap to hear them.': 'Ora non suona: rispondi con la voce o suonando, e il microfono sentirebbe il ritmo. Imposta “Come rispondi” su Tocco per sentirlo.',
  'Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season': 'Fiocchi di neve, anemoni, girasoli o foglie che cadono dietro l’app, secondo la stagione',
  'Light seasonal decorations behind the app: snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn. They follow the season above. Off keeps the background plain.':
    'Decorazioni leggere di stagione dietro l’app: fiocchi di neve in inverno, anemoni in primavera, girasoli in estate e foglie che cadono in autunno. Seguono la stagione scelta sopra. Disattivato lascia lo sfondo semplice.',
  'Button depth': 'Rilievo dei pulsanti',
  'Gives the buttons a raised, 3D look: a light rim on top, a solid edge underneath, and they sink a little when pressed. Off keeps them flat.':
    'Dà ai pulsanti un aspetto in rilievo, 3D: un bordo chiaro sopra, un bordo pieno sotto, e si abbassano un po’ quando li premi. Disattivo li lascia piatti.',
  'Mirrors the app for a left-handed player: the fretboard flips (nut on the right), and the menu, Quick Access and back buttons move to the left. Independent of language — it stays mirrored in Hebrew too.':
    'Specchia l’app per chi suona da mancino: la tastiera si capovolge (capotasto a destra) e il menu, l’Accesso rapido e i pulsanti indietro passano a sinistra. Indipendente dalla lingua — resta specchiata anche in ebraico.',
  'Colour-blind heatmap markers': 'Segni della mappa di calore per daltonici',
  'Adds a ✓ / • mark on the Stats-screen fretboard heatmap cells, on top of colour, so known vs. needs-work reads without relying on hue.':
    'Aggiunge un segno ✓ / • sulle celle della mappa di calore della tastiera nelle Statistiche, oltre al colore, così distingui ciò che conosci da ciò che va esercitato senza affidarti alla tinta.',

  // Hamburger drawer / dialogs
  'Settings': 'Impostazioni',
  'Close settings': 'Chiudi impostazioni',
  'Open settings': 'Apri impostazioni',
  'Game settings': 'Impostazioni di gioco',
  'Back': 'Indietro',
  'Microphone access': 'Accesso al microfono',
  'Answer out loud': 'Rispondi ad alta voce',
  'Voice mode listens for the note or fret you say instead of a tap.':
    'La modalità voce ascolta la nota o il tasto che pronunci, invece di un tocco.',
  'Your browser will ask to use the microphone next — audio stays on your device and is never recorded or uploaded.':
    'Ora il browser ti chiederà di usare il microfono — l’audio resta sul tuo dispositivo e non viene mai registrato né caricato.',
  'Allow microphone': 'Consenti il microfono',
  'Not now': 'Non ora',
  'Microphone is blocked': 'Il microfono è bloccato',
  "Your browser is refusing microphone access for this site, so voice answers can't work yet. Tap the 🔒 / 🎤 icon beside the address bar, set the microphone to":
    'Il browser sta negando l’accesso al microfono per questo sito, quindi le risposte a voce non funzionano ancora. Tocca l’icona 🔒 / 🎤 accanto alla barra degli indirizzi e imposta il microfono su',
  ', then reload the page.': ', poi ricarica la pagina.',
  'Allow': 'Consenti',
  'Got it': 'Ho capito',
  'Use tap instead': 'Usa il tocco',
  'Sign in': 'Accedi',
  'Save your progress': 'Salva i tuoi progressi',
  'Sign in to keep your history, badges and personal bests across devices. You can keep playing as a guest — everything still works, it just stays on this device.':
    'Accedi per avere la tua cronologia, le tue medaglie e i tuoi record personali su tutti i dispositivi. Puoi continuare a giocare come ospite — funziona tutto lo stesso, resta solo su questo dispositivo.',
  'Maybe later': 'Forse più tardi',
  'Press back again to exit': 'Premi di nuovo indietro per uscire',

  // In-game
  'STAGE COMPLETE': 'LIVELLO COMPLETATO',
  'Retry': 'Riprova',
  '🎤 Microphone blocked — enable it or switch to tap': '🎤 Microfono bloccato — attivalo o passa al tocco',
  '🎤 Voice needs a connection': '🎤 La voce richiede una connessione',
  '🎤 Voice isn’t working in this browser — try Chrome, or use tap':
    '🎤 La voce non funziona in questo browser — prova Chrome o usa il tocco',
  '🎤 Didn’t catch that': '🎤 Non ho capito',
  'Round Complete!': 'Round completato!',
  'Session Stopped': 'Sessione interrotta',
  "You're ready for the next stage:": 'Sei pronto per la prossima fase:',
  "You've mastered this — ready to learn something new?": 'Lo padroneggi — pronto a imparare qualcosa di nuovo?',
  'Move on': 'Vai avanti',
  'Explore Learn': 'Vai a Impara',
  'pts': 'pt',
  'OK': 'OK',
  'Start': 'Inizia',
  'Resume': 'Riprendi',
  'Pause': 'Pausa',
  'Stop': 'Ferma',
  'Refresh': 'Aggiorna',
  'Privacy policy': 'Informativa sulla privacy',

  'QUESTIONS': 'DOMANDE',
  'streak': 'serie',
  'New badge': 'Nuova medaglia',
  'Badge upgraded': 'Medaglia migliorata',
  'Continue': 'Continua',
  'Listening…': 'In ascolto…',
  'Member since': 'Membro dal',
  'badges earned': 'medaglie ottenute',

  // Pinned badge shelf (Account section)
  'Choose badges to feature': 'Scegli le medaglie da mettere in vetrina',
  'Edit featured badges': 'Modifica le medaglie in vetrina',
  'Your badges': 'Le tue medaglie',
  'Feature up to 5 badges': 'Metti in vetrina fino a 5 medaglie',
  'Remove a badge to feature another.': 'Togli una medaglia per metterne in vetrina un’altra.',
  'See all badges': 'Vedi tutte le medaglie',

  // LeaderboardPanel — standings sub-page
  'player': 'giocatore',
  'players': 'giocatori',
  'ranked by XP': 'ordinati per XP',
  'free for everyone': 'gratis per tutti',
  'All-time': 'Di sempre',
  'This week': 'Questa settimana',
  // Weekly leagues (LeaderboardPanel League tab)
  'League': 'Lega',
  'Bronze League': 'Lega Bronzo',
  'Silver League': 'Lega Argento',
  'Gold League': 'Lega Oro',
  'Platinum League': 'Lega Platino',
  'Diamond League': 'Lega Diamante',
  'Top {n} move up, bottom {n} move down when the week ends.': 'A fine settimana i primi {n} salgono e gli ultimi {n} scendono.',
  'Top {n} move up when the week ends.': 'A fine settimana i primi {n} salgono.',
  'Correct answers since Monday count. A new week starts Monday 00:00 UTC.': 'Contano le risposte giuste da lunedì. Ogni settimana inizia lunedì alle 00:00 UTC.',
  'Answer a question correctly this week to join a league of up to 30 players. Until then, here is everyone’s week.': 'Rispondi giusto a una domanda questa settimana per entrare in una lega fino a 30 giocatori. Nel frattempo, ecco la settimana di tutti.',
  'Your league opens once {n} players have joined it this week. Until then, here is everyone’s week.': 'La tua lega si apre quando {n} giocatori si saranno uniti questa settimana. Nel frattempo, ecco la settimana di tutti.',
  'Leagues aren’t available right now. Here is everyone’s week instead.': 'Le leghe non sono disponibili al momento. Ecco invece la settimana di tutti.',
  'Moves up': 'Sale',
  'Moves down': 'Scende',
  // Weekly leagues (end-of-round card league line)
  'Rank #{rank} in {league}': 'Posizione #{rank} in {league}',
  'Promoted to {league}!': 'Promosso in {league}!',
  'Moved to {league}': 'Retrocesso in {league}',
  'Moving up this week!': 'In salita questa settimana!',
  'Moving down this week': 'In discesa questa settimana',
  '{n} more to move up': 'Ancora {n} per salire',
  'Loading…': 'Caricamento…',
  'Couldn’t load the leaderboard. Check your connection and try again.':
    'Impossibile caricare la classifica. Controlla la connessione e riprova.',
  'Couldn’t update that. Check your connection and try again.':
    'Impossibile aggiornare. Controlla la connessione e riprova.',
  'Your standing': 'La tua posizione',
  'RANK': 'POSIZIONE',
  'acc': 'prec.',
  '(you)': '(tu)',
  'Hidden from the leaderboard': 'Nascosto dalla classifica',
  'Visible on the leaderboard': 'Visibile in classifica',
  'Join the board': 'Entra in classifica',
  'You can see every player’s standing right now. Sign in with Google to take your own place — every correct answer you’ve ever played counts. Free, no subscription.':
    'Puoi già vedere la posizione di ogni giocatore. Accedi con Google per prendere il tuo posto — conta ogni risposta giusta che hai mai dato. Gratis, senza abbonamento.',
  'No one’s on the board yet': 'Non c’è ancora nessuno in classifica',
  'Finish a practice run while signed in and your name lands here first.':
    'Completa una sessione di pratica dopo aver effettuato l’accesso e il tuo nome comparirà qui per primo.',
  'How is XP counted?': 'Come si calcolano gli XP?',

  // SelectorPanel — mode/difficulty/fret-range picker
  'all': 'tutte le',
  'strings': 'corde',
  'frets': 'tasti',
  'only the dot-marker frets': 'solo i tasti con i segnatasti',
  'natural notes only (no sharps or flats)': 'solo note naturali (senza diesis né bemolli)',
  'every note, sharps and flats included': 'tutte le note, diesis e bemolli compresi',
  'alphabetical order': 'ordine alfabetico',
  'circle-of-fifths order': 'ordine del circolo delle quinte',
  'A fret lights up and you pick its note from the wheel':
    'Si illumina un tasto e scegli la sua nota sulla ruota',
  ', rotated to the string': ', ruotata in base alla corda',
  'A note name is shown and you tap every fret on the neck where it lands.':
    'Compare il nome di una nota e tocchi ogni tasto del manico in cui si trova.',
  'Note-by-Fret': 'Nota dal tasto',
  'Fret-by-Note': 'Tasto dalla nota',
  'Auto-advances through the difficulty stages.': 'Avanza automaticamente attraverso i livelli di difficoltà.',
  'How this works': 'Come funziona',
  'neck': 'manico',
  'neck fret range selector': 'selettore dell’estensione dei tasti del manico',
  'Precise fret range': 'Estensione dei tasti precisa',
  'Pick an exact fret N–M window to drill': 'Scegli un’estensione esatta di tasti N–M su cui esercitarti',
  'Fret range': 'Estensione dei tasti',
  'Full only while a precise fret window is on': 'Solo Completa finché è attiva un’estensione di tasti precisa',
  'Drill only part of the neck. Drag the handles to set the exact fret window — the shaded area is muted out, both here and on the home-screen neck.':
    'Esercitati solo su una parte del manico. Trascina le maniglie per impostare l’estensione esatta dei tasti — l’area ombreggiata resta esclusa, sia qui sia sul manico della schermata iniziale.',
  'Lowest fret': 'Tasto più basso',
  'Highest fret': 'Tasto più alto',
  'Multi': 'Più corde',
  'Note by Fret': 'Nota dal tasto',
  'Alpha': 'Alfabetico',
  'Fifths': 'Quinte',
  'By String': 'Per corda',
  'Fret by Note': 'Tasto dalla nota',
  "Read the note wheel like a clock: your open string sits at 12 o'clock, and the dots under each note show its fret. Answer before the timing bar empties.":
    'Leggi la ruota delle note come un orologio: la tua corda a vuoto sta alle ore 12 e i puntini sotto ogni nota indicano il suo tasto. Rispondi prima che la barra del tempo si svuoti.',
  'Answer before the timing bar empties.': 'Rispondi prima che la barra del tempo si svuoti.',
  'Dots': 'Segnatasti',
  'Naturals': 'Naturali',
  'Full': 'Completa',
  'Auto Advance to next difficulty': 'Avanzamento automatico alla difficoltà successiva',

  // Onboarding
  'Fretquency': 'Fretquency',
  'What do you play?': 'Che cosa suoni?',
  'Skip setup →': 'Salta la configurazione →',
  'How well do you know the fretboard?': 'Quanto conosci la tastiera?',
  "I'm just starting": 'Sto iniziando',
  'I play but want to improve': 'Suono, ma voglio migliorare',
  'Quick 3-question test': 'Test rapido di 3 domande',
  'I know the full neck': 'Conosco tutto il manico',
  'Jump right in': 'Inizia subito',
  'Skip →': 'Salta →',
  'String': 'Corda',
  'what note is fret': 'che nota è il tasto',
  'Skip test →': 'Salta il test →',
  'Keep going!': 'Continua così!',
  'Good start!': 'Buon inizio!',
  'Nice work!': 'Ottimo lavoro!',
  'Impressive!': 'Impressionante!',
  'Dot Frets': 'Tasti con segnatasti',
  'Natural notes': 'Note naturali',
  'the full chromatic neck': 'tutto il manico cromatico',
  "correct — we've set you up on": 'giuste — ti abbiamo impostato su',
  'Change it anytime in the selector panel.': 'Puoi cambiarlo quando vuoi nel pannello di selezione.',
  "Let's go →": 'Andiamo →',

  // Welcome, privacy and sign-in onboarding steps
  'Welcome to Fretquency':
    'Benvenuto in Fretquency',
  'Learn every note on the neck of your guitar, bass, ukulele, mandolin or banjo — in short, focused drills, a few minutes a day.':
    'Impara tutte le note sul manico della tua chitarra, basso, ukulele, mandolino o banjo — con esercizi brevi e mirati, pochi minuti al giorno.',
  "What's inside":
    'Cosa trovi',
  'Note drills':
    'Esercizi sulle note',
  'Name the note at a fret, or find every fret of a note. Start with the dot frets and work up to the whole neck.':
    'Indica la nota di un tasto, o trova tutti i tasti di una nota. Parti dai tasti con i segnatasti e arriva a tutto il manico.',
  'Answer your way':
    'Rispondi come preferisci',
  'Tap, say the note out loud, or play it on your instrument.':
    'Tocca lo schermo, di’ la nota ad alta voce o suonala sul tuo strumento.',
  'Watch yourself improve':
    'Guarda i tuoi progressi',
  'Stats, personal bests, badges and a leaderboard.':
    'Statistiche, record personali, medaglie e una classifica.',
  'Built-in tuner':
    'Accordatore integrato',
  'Tune up before you practise.':
    'Accorda lo strumento prima di esercitarti.',
  'Free to start':
    'Si comincia gratis',
  'The full note drill on every string, badges, the leaderboard and cloud backup. Shows ads.':
    'L’esercizio completo sulle note su tutte le corde, le medaglie, la classifica e il backup nel cloud. Con pubblicità.',
  'Your full history and trends, mastery maps, a precise fret range, multi-string drills — and no ads.':
    'Tutta la tua cronologia e le tendenze, mappe di padronanza, un intervallo di tasti preciso, esercizi su più corde — e niente pubblicità.',
  'A teacher, not a timer: a daily plan built from your weak spots, a learning path, intervals, scales, staff reading and tab reading.':
    'Un insegnante, non un cronometro: un piano quotidiano costruito sui tuoi punti deboli, un percorso di apprendimento, intervalli, scale, lettura dello spartito e della tablatura.',
  'Pro and Premium are coming soon.':
    'Pro e Premium arriveranno presto.',
  'Get started':
    'Inizia',
  'Your privacy':
    'La tua privacy',
  'As a guest, everything stays on this device. Signing in with Google (any time, from the menu) backs it up so you can restore it elsewhere. The microphone is only used if you choose to answer by voice, and the free plan shows ads provided by Google.':
    'Come ospite, tutto resta su questo dispositivo. Accedere con Google (quando vuoi, dal menu) salva i tuoi dati per permetterti di ripristinarli altrove. Il microfono viene usato solo se scegli di rispondere a voce, e il piano gratuito mostra pubblicità fornite da Google.',
  'Terms of use': 'Termini d’uso',
  'I have read the terms of use and the privacy policy and agree to them.':
    'Ho letto i termini d’uso e l’informativa sulla privacy e li accetto.',
  'That instrument needs Pro. Pick Guitar, Bass or Ukulele for now — you can upgrade any time from the menu.':
    'Quello strumento richiede Pro. Per ora scegli chitarra, basso o ukulele — puoi passare a Pro quando vuoi dal menu.',
  'See what Pro unlocks': 'Scopri cosa sblocca Pro',
  'Strings, frets and tuning can be changed later from the menu → Playing.':
    'Corde, tasti e accordatura si possono cambiare più tardi dal menu → Pratica.',
  'Start with the dot frets':
    'Inizia dai tasti con i segnatasti',

  // ProgressPanel — stats & progress screen
  'by note': 'per nota',
  'by fret': 'per tasto',
  'fret': 'tasto',
  'not played': 'non suonata',
  'known': 'conosciuta',
  'needs work': 'da esercitare',
  'unplayed': 'non suonata',
  'Not enough data yet.': 'Non ci sono ancora abbastanza dati.',
  'Not practiced yet': 'Non ancora esercitato',
  'Older sessions have no date stamp, so the timeline is empty. New sessions fill it in.':
    'Le sessioni più vecchie non hanno una data, quindi la cronologia è vuota. Le nuove sessioni la riempiranno.',
  'Play a few rounds and your all-time progress shows up here.':
    'Gioca qualche round e i tuoi progressi di sempre compariranno qui.',
  'accuracy': 'precisione',
  'day streak': 'giorni di fila',
  'answered': 'risposte',
  'Weakest notes': 'Note più deboli',
  'Nothing below 70% — nice.': 'Niente sotto il 70% — ottimo.',
  'By note': 'Per nota',
  'By string': 'Per corda',
  'By fret': 'Per tasto',
  'Fretboard heatmap': 'Mappa di calore della tastiera',
  'Share': 'Condividi',
  'Share my neck map': 'Condividi la mia mappa del manico',
  'My neck map': 'La mia mappa del manico',
  'Daily timeline': 'Andamento giornaliero',
  'Accuracy %': '% di precisione',
  'Avg response time': 'Tempo medio di risposta',
  'Personal bests': 'Record personali',
  'No personal bests recorded yet.': 'Non ci sono ancora record personali.',
  'No practice in the last 7 days.': 'Nessuna pratica negli ultimi 7 giorni.',
  'All time': 'Di sempre',
  'Last 7 days': 'Ultimi 7 giorni',
  'across every': 'in ogni',
  'settings combination': 'combinazione di impostazioni',
  'Clear all history': 'Cancella tutta la cronologia',
  'Clear all stats?': 'Cancellare tutte le statistiche?',
  'This permanently erases your entire practice history and resets the all-time mastery for every note, string and settings combination. Your personal bests are kept.':
    'Questo cancella per sempre tutta la tua cronologia di pratica e azzera la padronanza di sempre per ogni nota, corda e combinazione di impostazioni. I tuoi record personali vengono mantenuti.',
  "This can't be undone.": 'Non si può annullare.',
  'Delete anyway': 'Cancella comunque',
  'Cancel': 'Annulla',

  // Instrument string labels (guitar + bass, "String N · note")
  'String 1 · high E': 'Corda 1 · Mi cantino',
  'String 2 · B': 'Corda 2 · Si',
  'String 3 · G': 'Corda 3 · Sol',
  'String 4 · D': 'Corda 4 · Re',
  'String 5 · A': 'Corda 5 · La',
  'String 6 · low E': 'Corda 6 · Mi basso',
  'String 1 · G': 'Corda 1 · Sol',
  'String 2 · D': 'Corda 2 · Re',
  'String 3 · A': 'Corda 3 · La',
  'String 4 · low E': 'Corda 4 · Mi basso',

  // Free / Pro / Premium tiering — ProGate lock states + the Upgrade card
  'Premium': 'Premium',
  // Free-tier ad strip
  'Advertisement': 'Pubblicità',
  'Ad': 'Annuncio',
  'Close ad': 'Chiudi l’annuncio',
  'Your ad could be here. Go Pro to remove ads.': 'Qui potrebbe esserci il tuo annuncio. Passa a Pro per rimuovere gli annunci.',
  'Unlock with Pro': 'Sblocca con Pro',
  'Unlock with Premium': 'Sblocca con Premium',
  'You have Pro': 'Hai Pro',
  "You're on Free": 'Hai il piano gratuito',
  'Your plan': 'Il tuo piano',
  'Included with Pro': 'Incluso in Pro',
  'Everything in Free, plus:': 'Tutto il piano gratuito, più:',
  'Everything you need to practice daily, at no cost.':
    'Tutto quello che ti serve per esercitarti ogni giorno, senza costi.',
  'The full fretboard drill — by note and by fret, on every string':
    'L’esercizio completo sulla tastiera — per nota e per tasto, su ogni corda',
  'Badges and achievements, with your pinned medal shelf':
    'Medaglie e traguardi, con la tua vetrina di medaglie in evidenza',
  'The leaderboard — XP, questions answered and accuracy':
    'La classifica — XP, domande risposte e precisione',
  'Cloud sync and full restore of your practice on every device':
    'Sincronizzazione nel cloud e ripristino completo della tua pratica su ogni dispositivo',
  'Your last 7 days of stats, plus the personal best for what you’re drilling':
    'Le tue statistiche degli ultimi 7 giorni, più il record personale di ciò su cui ti stai esercitando',
  'Free, forever': 'Gratis, per sempre',
  'Pro is for training seriously and tracking progress over time.':
    'Pro è per allenarsi sul serio e seguire i progressi nel tempo.',
  'Your full practice history — all-time stats and trends, not just the last 7 days':
    'La tua cronologia di pratica completa — statistiche e tendenze di sempre, non solo degli ultimi 7 giorni',
  'Mastery maps — per-note and per-fret accuracy overlays on the circle and grid':
    'Mappe di padronanza — precisione per nota e per tasto sul cerchio e sulla griglia',
  'Browse your personal bests across every settings combination':
    'Consulta i tuoi record personali in ogni combinazione di impostazioni',
  'A personal voice profile built from your own calibration recordings':
    'Un profilo vocale personale creato dalle tue registrazioni di calibrazione',
  'Your Pro access is complimentary.': 'Il tuo accesso Pro è in omaggio.',
  'Your Pro access came from a promotion.': 'Il tuo accesso Pro deriva da una promozione.',
  'Your Pro access was granted manually.': 'Il tuo accesso Pro è stato concesso manualmente.',
  'Your Pro access is from your subscription.': 'Il tuo accesso Pro deriva dal tuo abbonamento.',
  'Your Pro access is active.': 'Il tuo accesso Pro è attivo.',
  'It does not expire.': 'Non scade.',
  'Access runs until': 'L’accesso è valido fino al',
  'Pro isn’t on sale yet — everything above stays free to try in the meantime.':
    'Pro non è ancora in vendita — nel frattempo puoi provare gratis tutto quanto sopra.',
  // Premium tier + the reverse 7-day trial (Task D)
  'Upgrade': 'Passa a un piano superiore',
  'Included with Premium': 'Incluso con Premium',
  'Everything in Pro, plus:': 'Tutto quello che c’è in Pro, più:',
  'Your trial': 'La tua prova',
  'Premium is a teacher, not a timer — it plans your practice for you.':
    'Premium è un insegnante, non un timer — pianifica l’allenamento al posto tuo.',
  'Your Premium trial is active.': 'La tua prova di Premium è attiva.',
  'Your access is complimentary.': 'Il tuo accesso è gratuito.',
  'Your access came from a promotion.': 'Il tuo accesso proviene da una promozione.',
  'Your access was granted manually.': 'Il tuo accesso è stato concesso manualmente.',
  'Your access is from your subscription.': 'Il tuo accesso proviene dal tuo abbonamento.',
  'Your access is active.': 'Il tuo accesso è attivo.',
  'Your 7-day Premium trial has ended. Everything below Premium stays free.':
    'La tua prova di 7 giorni di Premium è terminata. Tutto ciò che è sotto Premium resta gratuito.',
  'Ends in': 'Termina tra',
  'day': 'giorno',
  'days': 'giorni',
  'Ends today.': 'Termina oggi.',
  'Premium isn’t on sale yet — every new install gets a 7-day free trial in the meantime.':
    'Premium non è ancora in vendita — nel frattempo, ogni nuova installazione riceve una prova gratuita di 7 giorni.',
  'Up to 2 strings at once in multi-string mode': 'Fino a 2 corde alla volta in modalità multi-corda',
  'Occasional ads between rounds': 'Pubblicità occasionali tra un round e l’altro',
  'No ads': 'Senza pubblicità',
  'Drill three or more strings at once.': 'Allenati su tre o più corde alla volta.',
  'A daily session the Teacher builds from your actual weak spots':
    'Una sessione giornaliera che l’Insegnante costruisce sui tuoi punti deboli reali',
  'Spaced review that brings what you missed back until it sticks':
    'Ripasso distanziato che fa ritornare ciò che hai sbagliato finché non lo impari bene',
  'A guided Learning Path across the whole fretboard':
    'Un percorso guidato su tutta la tastiera',
  'Interval training, scale training, staff reading and tab reading':
    'Allenamento sugli intervalli, sulle scale, lettura del pentagramma e lettura della tablatura',
  'See your full practice history, not just the last 7 days.':
    'Guarda tutta la tua cronologia di allenamento, non solo gli ultimi 7 giorni.',
  'Practice without ads.': 'Allenati senza pubblicità.',
  'Premium trial': 'Prova di Premium',
  'day left': 'giorno rimasto',
  'days left': 'giorni rimasti',
  'Premium trial — ends today': 'Prova di Premium — termina oggi',
  'Your Premium trial has ended': 'La tua prova di Premium è terminata',
  'This week the Teacher kept track of': 'Questa settimana l’Insegnante ha tenuto traccia di',
  'positions on your fretboard.': 'posizioni sulla tua tastiera.',
  'This week the Teacher started learning your fretboard.':
    'Questa settimana l’Insegnante ha iniziato a imparare la tua tastiera.',
  'You’re back on Free — everything you’ve already learned stays yours.':
    'Sei tornato al piano Free — tutto quello che hai già imparato resta tuo.',
  'See what’s in Premium': 'Scopri cosa c’è in Premium',
  'Every new install gets 7 days of Premium free. Paid plans aren’t for sale yet.':
    'Ogni nuova installazione riceve 7 giorni di Premium gratis. I piani a pagamento non sono ancora in vendita.',
  'Premium free': 'Premium gratis',
  'ends today': 'termina oggi',
  'Try today’s plan': 'Prova il piano di oggi',
  'Your Premium trial ends soon': 'La tua prova di Premium sta per finire',
  'After that, you’re back on Free.': 'Dopo, torni al piano Free.',
  'This goes back to Free too:': 'Anche questo torna a Free:',
  'multi-string drills': 'esercizi multi-corda',
  'the precise fret window': 'l’intervallo preciso di tasti',
  'Free': 'Gratis',

  // Adaptive difficulty suggestion banner (wishlist §3)
  'You’re cruising through this — ready for a harder level?':
    'Te la stai cavando alla grande — pronto per un livello più difficile?',
  'This setup is fighting back. Want to ease off a level?':
    'Questa configurazione ti sta mettendo in difficoltà. Vuoi scendere di un livello?',
  'Switch the difficulty to': 'Cambia la difficoltà in',
  'Drop the difficulty to': 'Abbassa la difficoltà a',
  'Apply': 'Applica',
  'Dismiss': 'Ignora',

  // Learning-type navigation — the drawer's "Learn" group and its full pages
  'Learn': 'Impara',
  'Choose what to practise.': 'Scegli cosa esercitare.',
  'Current': 'Attuale',
  'Daily practice': 'Pratica quotidiana',
  'Intervals': 'Intervalli',
  'Scales': 'Scale',
  'Chords': 'Accordi',
  'Staff reading': 'Lettura dello spartito',
  'Game': 'Gioco',
  'Your daily plan is loading…': 'Caricamento del tuo piano quotidiano…',
  'Let the Teacher plan your practice': 'Lascia che l’Insegnante pianifichi la tua pratica',
  'Practise hearing and finding intervals': 'Esercitati ad ascoltare e trovare gli intervalli',

  // Fret range conflict dialog
  'Fret range too small': 'Estensione dei tasti troppo piccola',
  'The current fret range': 'L’estensione dei tasti attuale',
  ' allows fewer than ': ' consente meno di ',
  ' unique notes': ' note diverse',
  ' with the selected strings. Please expand the range.': ' con le corde scelte. Amplia l’estensione.',
  'Expand to minimum': 'Amplia al minimo',
  'I will expand': 'Amplio io',
  'Custom range': 'Estensione personalizzata',
  'Keep as is': 'Lascia così',
  'Set fret range': 'Imposta l’estensione dei tasti',

  // ── Stage 2a: badges, guest merge, voice calibration, feedback board,
  // quick access and the tuner ──────────────────────────────────────────
  // Badges / Achievements wall — tiers
  'Bronze': 'Bronzo',
  'Silver': 'Argento',
  'Gold': 'Oro',
  'Platinum': 'Platino',
  'Diamond': 'Diamante',
  'Master': 'Maestro',
  'Legendary I': 'Leggendario I',
  'Legendary II': 'Leggendario II',
  'Legendary III': 'Leggendario III',
  'Legendary IV': 'Leggendario IV',
  // Wall chrome
  'unlocked': 'sbloccate',
  'Max': 'Max',
  'Earned': 'Ottenuta',
  // Player profile card (leaderboard)
  'Achievements': 'Obiettivi',
  'No badges earned yet.': 'Nessun badge ottenuto ancora.',
  // Admin test controls
  'Grant': 'Assegna',
  'Reset': 'Azzera',
  'Admin tools: Grant or Reset each badge to test it. History-based badges re-appear on reopen unless you also clear history.':
    'Strumenti di amministrazione: assegna o azzera ogni medaglia per provarla. Le medaglie basate sulla cronologia ricompaiono alla riapertura, a meno che tu non cancelli anche la cronologia.',
  // Family names
  'Perfect Session': 'Sessione perfetta',
  'Speed Demon': 'Demone della velocità',
  'Flawless Sprint': 'Sprint impeccabile',
  'On Fire': 'In fiamme',
  'Comeback': 'Rimonta',
  'Every String': 'Tutte le corde',
  'String Master': 'Maestro della corda',
  'String Master · {s}': 'Maestro · {s}',
  'Full String Master': 'Maestro di tutte le corde',
  'Neck Runner': 'Corridore del manico',
  'Both Ends': 'Entrambi gli estremi',
  'Low End': 'Registro grave',
  'Week Warrior': 'Guerriero della settimana',
  'Dedicated': 'Costante',
  'Total Reps': 'Ripetizioni totali',
  'Sharpshooter': 'Tiratore scelto',
  'Quick Read': 'Lettura rapida',
  'Most Improved': 'Il più migliorato',
  'Doubling Up': 'Doppietta',
  'Multi-Instrumentalist': 'Polistrumentista',
  'Admin': 'Amministratore',
  // Earning conditions — Perfect Session
  'Answer 10+ questions in a round with no mistakes at all.':
    'Rispondi a 10+ domande in un round senza nessun errore.',
  '25+ questions in a round, still zero mistakes.': '25+ domande in un round, ancora zero errori.',
  '50+ questions in a round, still zero mistakes — a full clean run.':
    '50+ domande in un round, ancora zero errori — un round completamente pulito.',
  // Speed Demon
  'Get 10+ correct answers in a round, at least 8 of them under 1.5s.':
    'Dai 10+ risposte giuste in un round, almeno 8 in meno di 1,5 s.',
  '20+ correct answers, at least 16 of them under 1.5s.': '20+ risposte giuste, almeno 16 in meno di 1,5 s.',
  '40+ correct answers, at least 32 of them under 1.2s.': '40+ risposte giuste, almeno 32 in meno di 1,2 s.',
  // Flawless Sprint
  'Finish a whole round at 90% accuracy or better.':
    'Completa un intero round con il 90% di precisione o più.',
  'Finish a whole round at 95% accuracy or better.':
    'Completa un intero round con il 95% di precisione o più.',
  'Finish a whole round at 100% accuracy.': 'Completa un intero round con il 100% di precisione.',
  // On Fire
  'Reach a streak of 15 in a single round.': 'Raggiungi una serie di 15 in un solo round.',
  'Reach a streak of 20 in a single round.': 'Raggiungi una serie di 20 in un solo round.',
  'Reach a streak of 30 in a single round.': 'Raggiungi una serie di 30 in un solo round.',
  // Comeback
  'Miss 3+ of your first 20 questions, then answer the next 8 in a row correctly.':
    'Sbaglia 3+ delle prime 20 domande, poi rispondi giusto alle 8 successive di fila.',
  'Miss 5+ of your first 20 questions, then answer the next 12 in a row correctly.':
    'Sbaglia 5+ delle prime 20 domande, poi rispondi giusto alle 12 successive di fila.',
  'Miss 8+ of your first 20 questions, then answer the next 18 in a row correctly.':
    'Sbaglia 8+ delle prime 20 domande, poi rispondi giusto alle 18 successive di fila.',
  // Every String
  'Finish a round that visited every string: 2x that many questions, 90% accuracy.':
    'Completa un round che passi per tutte le corde: il doppio delle domande rispetto alle corde, 90% di precisione.',
  'Visited every string: 4x that many questions, 90% accuracy.':
    'Passando per tutte le corde: 4 volte più domande che corde, 90% di precisione.',
  'Visited every string: 6x that many questions, 95% accuracy.':
    'Passando per tutte le corde: 6 volte più domande che corde, 95% di precisione.',
  // Per-string String Master — {s} is the translated string label
  'Answer 40+ questions on {s} at 90% accuracy or better.':
    'Rispondi a 40+ domande su {s} con il 90% di precisione o più.',
  '100+ questions on {s} at 92% accuracy or better.': '100+ domande su {s} con il 92% di precisione o più.',
  '200+ questions on {s} at 95% accuracy or better.': '200+ domande su {s} con il 95% di precisione o più.',
  '400+ questions on {s} at 96% accuracy or better, over 14+ practice days.':
    '400+ domande su {s} con il 96% di precisione o più, in 14+ giorni di pratica.',
  '800+ questions on {s} at 97% accuracy or better, over 30+ practice days.':
    '800+ domande su {s} con il 97% di precisione o più, in 30+ giorni di pratica.',
  // Full String Master
  'Earn String Master — Bronze on every string of this instrument.':
    'Ottieni Maestro della corda — Bronzo su tutte le corde di questo strumento.',
  'Earn String Master — Silver on every string.': 'Ottieni Maestro della corda — Argento su tutte le corde.',
  'Earn String Master — Gold on every string.': 'Ottieni Maestro della corda — Oro su tutte le corde.',
  'Earn String Master — Platinum on every string.':
    'Ottieni Maestro della corda — Platino su tutte le corde.',
  'Earn String Master — Diamond on every string.':
    'Ottieni Maestro della corda — Diamante su tutte le corde.',
  // Neck Runner
  'Answer at least one question on every fret of the neck.':
    'Rispondi ad almeno una domanda su ogni tasto del manico.',
  'Answer at least 3 questions on every fret of the neck.':
    'Rispondi ad almeno 3 domande su ogni tasto del manico.',
  'Answer at least 5 questions on every fret of the neck.':
    'Rispondi ad almeno 5 domande su ogni tasto del manico.',
  'Answer at least 10 questions on every fret, spread across 14+ practice days.':
    'Rispondi ad almeno 10 domande su ogni tasto, distribuite in 14+ giorni di pratica.',
  'Answer at least 20 questions on every fret, spread across 30+ practice days.':
    'Rispondi ad almeno 20 domande su ogni tasto, distribuite in 30+ giorni di pratica.',
  // Both Ends
  'Answer 40+ questions above the 12th fret at 85% accuracy or better.':
    'Rispondi a 40+ domande oltre il 12° tasto con l’85% di precisione o più.',
  '100+ questions above the 12th fret at 88% accuracy or better.':
    '100+ domande oltre il 12° tasto con l’88% di precisione o più.',
  '200+ questions above the 12th fret at 92% accuracy or better.':
    '200+ domande oltre il 12° tasto con il 92% di precisione o più.',
  '400+ questions above the 12th fret at 93% accuracy or better, over 14+ practice days.':
    '400+ domande oltre il 12° tasto con il 93% di precisione o più, in 14+ giorni di pratica.',
  '800+ questions above the 12th fret at 94% accuracy or better, over 30+ practice days.':
    '800+ domande oltre il 12° tasto con il 94% di precisione o più, in 30+ giorni di pratica.',
  // Low End
  'Answer 40+ questions on the bass low-E string at 90% accuracy or better.':
    'Rispondi a 40+ domande sulla corda Mi (E) grave del basso con il 90% di precisione o più.',
  '100+ questions on the low-E string at 93% accuracy or better.':
    '100+ domande sulla corda Mi (E) grave con il 93% di precisione o più.',
  '200+ questions on the low-E string at 96% accuracy or better.':
    '200+ domande sulla corda Mi (E) grave con il 96% di precisione o più.',
  '400+ questions on the low-E string at 97% accuracy or better, over 14+ practice days.':
    '400+ domande sulla corda Mi (E) grave con il 97% di precisione o più, in 14+ giorni di pratica.',
  '800+ questions on the low-E string at 98% accuracy or better, over 30+ practice days.':
    '800+ domande sulla corda Mi (E) grave con il 98% di precisione o più, in 30+ giorni di pratica.',
  // Week Warrior
  'Practise on 5 separate days within a single 7-day window.':
    'Esercitati in 5 giorni diversi nello stesso arco di 7 giorni.',
  '6 separate days within a single 7-day window.': '6 giorni diversi nello stesso arco di 7 giorni.',
  'All 7 days within a single 7-day window — a perfect week.':
    'Tutti i 7 giorni dello stesso arco di 7 giorni — una settimana perfetta.',
  // Dedicated
  'Build a run of 7 consecutive practice days.': 'Metti in fila 7 giorni di pratica consecutivi.',
  '14 consecutive practice days.': '14 giorni di pratica consecutivi.',
  '30 consecutive practice days.': '30 giorni di pratica consecutivi.',
  '60 consecutive practice days.': '60 giorni di pratica consecutivi.',
  '90 consecutive practice days.': '90 giorni di pratica consecutivi.',
  '120 consecutive practice days.': '120 giorni di pratica consecutivi.',
  '180 consecutive practice days.': '180 giorni di pratica consecutivi.',
  '250 consecutive practice days.': '250 giorni di pratica consecutivi.',
  '300 consecutive practice days.': '300 giorni di pratica consecutivi.',
  '365 consecutive practice days — a full year, every day.':
    '365 giorni di pratica consecutivi — un anno intero, ogni giorno.',
  // Total Reps
  'Answer 100 questions all-time, across every instrument.':
    'Rispondi a 100 domande in totale, sommando tutti gli strumenti.',
  '250 questions all-time.': '250 domande in totale.',
  '500 questions all-time.': '500 domande in totale.',
  '1,000 questions all-time.': '1.000 domande in totale.',
  '2,500 questions all-time, spread across 20+ practice days.':
    '2.500 domande in totale, distribuite in 20+ giorni di pratica.',
  '5,000 questions all-time, spread across 40+ practice days.':
    '5.000 domande in totale, distribuite in 40+ giorni di pratica.',
  '10,000 questions all-time, spread across 70+ practice days.':
    '10.000 domande in totale, distribuite in 70+ giorni di pratica.',
  '20,000 questions all-time, spread across 110+ practice days.':
    '20.000 domande in totale, distribuite in 110+ giorni di pratica.',
  '35,000 questions all-time, spread across 160+ practice days.':
    '35.000 domande in totale, distribuite in 160+ giorni di pratica.',
  '50,000 questions all-time, spread across 220+ practice days.':
    '50.000 domande in totale, distribuite in 220+ giorni di pratica.',
  // Sharpshooter
  'Hold 85% accuracy over at least 200 questions, across every instrument.':
    'Mantieni l’85% di precisione su almeno 200 domande, sommando tutti gli strumenti.',
  '88% accuracy over at least 500 questions.': '88% di precisione su almeno 500 domande.',
  '92% accuracy over at least 1,000 questions.': '92% di precisione su almeno 1.000 domande.',
  '93% accuracy over at least 2,500 questions, spread across 30+ practice days.':
    '93% di precisione su almeno 2.500 domande, distribuite in 30+ giorni di pratica.',
  '94% accuracy over at least 5,000 questions, spread across 60+ practice days.':
    '94% di precisione su almeno 5.000 domande, distribuite in 60+ giorni di pratica.',
  // Quick Read
  'Hold an average answer time under 2.0s over 200+ questions.':
    'Mantieni un tempo medio di risposta sotto i 2,0 s su 200+ domande.',
  'Under 1.6s over 500+ questions.': 'Sotto 1,6 s su 500+ domande.',
  'Under 1.3s over 1,000+ questions.': 'Sotto 1,3 s su 1.000+ domande.',
  'Under 1.15s over 2,500+ questions, spread across 30+ practice days.':
    'Sotto 1,15 s su 2.500+ domande, distribuite in 30+ giorni di pratica.',
  'Under 1.05s over 5,000+ questions, spread across 60+ practice days.':
    'Sotto 1,05 s su 5.000+ domande, distribuite in 60+ giorni di pratica.',
  // Most Improved
  'Over 10+ practice days, lift your accuracy by 20 points from your first days to your latest.':
    'In 10+ giorni di pratica, alza la tua precisione di 20 punti dai primi giorni ai più recenti.',
  'Over 15+ practice days, lift your accuracy by 30 points.':
    'In 15+ giorni di pratica, alza la tua precisione di 30 punti.',
  'Over 20+ practice days, lift your accuracy by 40 points.':
    'In 20+ giorni di pratica, alza la tua precisione di 40 punti.',
  // Doubling Up
  'Earn String Master on every string of both guitar and bass.':
    'Ottieni Maestro della corda su tutte le corde, sia alla chitarra sia al basso.',
  'Earn Full String Master — Silver on both guitar and bass.':
    'Ottieni Maestro di tutte le corde — Argento, sia alla chitarra sia al basso.',
  'Earn Full String Master — Gold and Neck Runner — Gold on both guitar and bass.':
    'Ottieni Maestro di tutte le corde — Oro e Corridore del manico — Oro, sia alla chitarra sia al basso.',
  'Earn Full String Master — Platinum and Neck Runner — Platinum on both guitar and bass.':
    'Ottieni Maestro di tutte le corde — Platino e Corridore del manico — Platino, sia alla chitarra sia al basso.',
  'Earn Full String Master — Diamond and Neck Runner — Diamond on both guitar and bass.':
    'Ottieni Maestro di tutte le corde — Diamante e Corridore del manico — Diamante, sia alla chitarra sia al basso.',
  // Multi-Instrumentalist
  'Earn Full String Master — Silver on 2 different instruments.':
    'Ottieni Maestro di tutte le corde — Argento su 2 strumenti diversi.',
  'Earn Full String Master — Silver on 3 different instruments.':
    'Ottieni Maestro di tutte le corde — Argento su 3 strumenti diversi.',
  'Earn Full String Master — Gold on 4 different instruments.':
    'Ottieni Maestro di tutte le corde — Oro su 4 strumenti diversi.',
  'Earn Full String Master — Gold on all 5 instruments.':
    'Ottieni Maestro di tutte le corde — Oro su tutti e 5 gli strumenti.',
  'Earn Full String Master — Platinum on all 5 instruments.':
    'Ottieni Maestro di tutte le corde — Platino su tutti e 5 gli strumenti.',
  // Admin (role)
  'Granted to app administrators — read every Feedback board post, not just your own.':
    'Assegnata agli amministratori dell’app — permette di leggere tutti i messaggi della bacheca dei suggerimenti, non solo i tuoi.',
  // Guest-merge prompt — first sign-in on a device with local guest history
  'Add this device’s progress to your account?':
    'Aggiungere i progressi di questo dispositivo al tuo account?',
  'You’ve practiced on this device without an account. Add that progress to your account, or keep only what’s already on your account?':
    'Ti sei esercitato su questo dispositivo senza account. Vuoi aggiungere quei progressi al tuo account o tenere solo quello che c’è già?',
  'Merge my progress': 'Unisci i miei progressi',
  'Use account only': 'Usa solo l’account',
  'Leave this practice off your account?': 'Lasciare questa pratica fuori dal tuo account?',
  'You have {n} rounds of practice saved on this device. If you continue, they stay on this device but are not added to your account.':
    'Hai {n} round di pratica salvati su questo dispositivo. Se continui, restano su questo dispositivo ma non vengono aggiunti al tuo account.',
  // VoiceCalibration
  'Voice calibration': 'Calibrazione vocale',
  'Personal voice calibration': 'Calibrazione vocale personale',
  'Profile name': 'Nome del profilo',
  'Say just this word, on its own': 'Di’ solo questa parola, da sola',
  'Say just the note name, on its own': 'Di’ solo il nome della nota, da solo',
  'Speak clearly and pause briefly between words — later, when answering, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Parla chiaramente e fai una breve pausa tra le parole — poi, quando rispondi, di’ la lettera, fai una pausa e poi “sharp” / “flat” come due parole separate.',
  'Could not use the microphone — try again': 'Impossibile usare il microfono — riprova',
  'No sound captured — try again, closer to the mic':
    'Nessun suono rilevato — riprova, più vicino al microfono',
  'Recording too short — try again': 'Registrazione troppo breve — riprova',
  "That didn't sound like a note — try again": 'Non sembrava una nota — riprova',
  'Saving the recording failed': 'Impossibile salvare la registrazione',
  'Recorded': 'Registrate',
  'notes': 'note',
  'accidentals': 'alterazioni',
  'Say:': 'Di’:',
  'Play last recording': 'Riproduci l’ultima registrazione',
  'Export recordings to a folder (dev)': 'Esporta le registrazioni in una cartella (dev)',
  'Stop exporting recordings': 'Interrompi l’esportazione delle registrazioni',
  'Every accepted take is also saved as a WAV, named for scripts/eval-voice.mts.':
    'Ogni ripresa accettata viene salvata anche come WAV, con il nome atteso da scripts/eval-voice.mts.',
  'Could not write to the export folder — pick it again':
    'Impossibile scrivere nella cartella di esportazione — sceglila di nuovo',
  'Speak the word on screen — calibration advances on its own':
    'Di’ la parola sullo schermo — la calibrazione avanza da sola',
  'Take': 'Ripresa',
  'Previous': 'Precedente',
  'Next': 'Successivo',
  'Delete profile': 'Elimina profilo',
  'Reset automatic learning of the general mode': 'Azzera l’apprendimento automatico della modalità generale',
  'Checking recordings…': 'Controllo delle registrazioni…',
  'Self-test recordings': 'Autotest delle registrazioni',
  'All words are distinct enough — looks good.': 'Tutte le parole sono abbastanza distinte — va bene.',
  'Finish & enable': 'Termina e attiva',
  '“{a}” and “{b}” sound very similar — re-record one of them.':
    '“{a}” e “{b}” suonano troppo simili — registra di nuovo uno dei due.',
  'Recording extra takes to tell “{a}” and “{b}” apart':
    'Registrazione di riprese extra per distinguere “{a}” da “{b}”',
  'No recordings for “{prompt}” yet': 'Ancora nessuna registrazione per “{prompt}”',
  'Delete take {n} of {prompt}': 'Elimina la ripresa {n} di {prompt}',
  'Record {n} more takes for “{a}” and “{b}”': 'Registra altre {n} riprese per “{a}” e “{b}”',
  'to go': 'mancanti',
  // VoiceLevelMeter
  'Microphone level good': 'Livello del microfono buono',
  'Microphone level low, speak louder': 'Livello del microfono basso, parla più forte',
  'Good level': 'Livello buono',
  'Too quiet — speak up': 'Troppo basso — parla più forte',
  // DebugLogPanel
  'Debug log': 'Registro di debug',
  'Open debug log': 'Apri il registro di debug',
  'Errors + voice · auto-clears daily': 'Errori + voce · si svuota ogni giorno',
  'Errors · auto-clears daily': 'Errori · si svuota ogni giorno',
  'Voice: on': 'Voce: attiva',
  'Voice: off': 'Voce: disattivata',
  'Copied': 'Copiato',
  'Copy': 'Copia',
  'Clear': 'Svuota',
  'Close': 'Chiudi',
  '(no errors)': '(nessun errore)',
  // FeedbackBoard
  'Couldn’t load the board. Check your connection and try again.':
    'Impossibile caricare la bacheca. Controlla la connessione e riprova.',
  'Couldn’t send that. Check your connection and try again.':
    'Impossibile inviare. Controlla la connessione e riprova.',
  'Sign in with Google to leave a comment, idea, or suggestion. Only admins can read the full board.':
    'Accedi con Google per lasciare un commento, un’idea o un suggerimento. Solo gli amministratori possono leggere l’intera bacheca.',
  'Microphone access is off — turn it on to dictate.':
    'L’accesso al microfono è disattivato — attivalo per dettare.',
  'Voice typing isn’t available on this device.':
    'La dettatura vocale non è disponibile su questo dispositivo.',
  'Couldn’t hear that — try again.': 'Non ho sentito — riprova.',
  'What’s on your mind?': 'Cosa vuoi dirci?',
  'Stop voice typing': 'Ferma la dettatura vocale',
  'Start voice typing': 'Avvia la dettatura vocale',
  'Sending…': 'Invio…',
  'Send': 'Invia',
  'Listening… say one sentence — it stops on its own.': 'In ascolto… di’ una frase — si ferma da solo.',
  'Thanks — your message was sent.': 'Grazie — il tuo messaggio è stato inviato.',
  'Unknown': 'Sconosciuto',
  'You': 'Tu',
  'Handled': 'Gestito',
  'Mark unhandled': 'Segna come da gestire',
  'Mark handled': 'Segna come gestito',
  'Delete': 'Elimina',
  'You haven’t sent anything yet.': 'Non hai ancora inviato niente.',
  'Share a comment, idea, or suggestion. Admins read every post; below you can see the ones you’ve sent.':
    'Condividi un commento, un’idea o un suggerimento. Gli amministratori leggono ogni messaggio; qui sotto vedi quelli che hai inviato.',
  'Write': 'Scrivi',
  'Inbox': 'Posta in arrivo',
  'Post a comment, idea, or suggestion of your own.': 'Pubblica un tuo commento, idea o suggerimento.',
  'Every post from every user': 'Tutti i messaggi di tutti gli utenti',
  'still to handle': 'da gestire',
  'Mark one handled once you’ve dealt with it, or delete it.':
    'Segna un messaggio come gestito quando l’hai risolto, oppure eliminalo.',
  'No posts yet.': 'Ancora nessun messaggio.',
  'Nothing open — all caught up.': 'Niente in sospeso — tutto in pari.',
  'Delete post': 'Elimina messaggio',
  'Delete this post?': 'Eliminare questo messaggio?',
  'This permanently removes it for everyone, including':
    'Verrà eliminato definitivamente per tutti, compreso',
  'the author': 'l’autore',
  'It can’t be undone.': 'Non si può annullare.',
  'Delete for everyone': 'Elimina per tutti',
  // Quick Access — the floating home-screen control, its Settings row and pushpins
  'Quick access': 'Accesso rapido',
  'A floating button on the home screen for the settings you flip most. Pin up to 5 with the pushpins below, then double-tap the lower-right of the screen outside a drill to open it.':
    'Un pulsante mobile nella schermata iniziale per le impostazioni che cambi più spesso. Fissane fino a 5 con le puntine qui sotto, poi tocca due volte l’angolo in basso a destra dello schermo, fuori da un esercizio, per aprirlo.',
  'Pin to quick access?': 'Fissare nell’accesso rapido?',
  'Remove from quick access?': 'Togliere dall’accesso rapido?',
  'You can pin up to {n} settings. Remove one first.':
    'Puoi fissare fino a {n} impostazioni. Prima togline una.',
  'Quick access is full': 'L’accesso rapido è pieno',
  'You already have {n} shortcuts. Remove one to make room?':
    'Hai già {n} scorciatoie. Toglierne una per fare spazio?',
  'Remove one': 'Togline una',
  'Leave as is': 'Lascia così',
  'Remove a quick access shortcut': 'Togli una scorciatoia dall’accesso rapido',
  'Quick access holds five shortcuts. Remove one to make room.':
    'L’accesso rapido contiene cinque scorciatoie. Togline una per fare spazio.',
  'Remove {name} from quick access': 'Togli {name} dall’accesso rapido',
  'Yes': 'Sì',
  'No': 'No',
  'Double-tap the lower-right of the screen for quick access':
    'Tocca due volte l’angolo in basso a destra dello schermo per l’accesso rapido',
  'Double-tap the lower-left of the screen for quick access':
    'Tocca due volte l’angolo in basso a sinistra dello schermo per l’accesso rapido',
  'Quick access is off': 'L’accesso rapido è disattivato',
  "You haven't pinned any quick access shortcuts yet":
    'Non hai ancora fissato nessuna scorciatoia nell’accesso rapido',
  'What do the icons mean?': 'Cosa significano le icone?',
  'Quick access symbol legend': 'Legenda dei simboli dell’accesso rapido',
  'What each icon on the Quick Access widget means. Tapping a pinned shortcut cycles through these states in order.':
    'Cosa significa ogni icona dell’accesso rapido. Toccando una scorciatoia fissata si passa da uno stato all’altro in quest’ordine.',
  'Letters (A B C)': 'Lettere (A B C)',
  'Solfège (Do Re Mi)': 'Solfeggio (Do Re Mi)',
  'Sharps (♯)': 'Diesis (♯)',
  'Flats (♭)': 'Bemolle (♭)',
  // Tuner — the Learn-tab tile that opens a live chromatic tuner
  'Tuner': 'Accordatore',
  'Tune your strings using the microphone.': 'Accorda le corde con il microfono.',
  'Start listening': 'Inizia ad ascoltare',
  'Requesting microphone permission…': 'Richiesta del permesso per il microfono…',
  'Microphone access was denied. Allow it in your browser settings, then try again.':
    'L’accesso al microfono è stato negato. Consentilo nelle impostazioni del browser, poi riprova.',
  'Try again': 'Riprova',
  "Couldn't start the microphone.": 'Impossibile avviare il microfono.',
  'Listening… play a note.': 'In ascolto… suona una nota.',
  "Tap a note on the wheel to lock it as the string you're tuning. Tap it again to switch back to auto-detect.":
    'Tocca una nota sulla ruota per fissarla come la corda che stai accordando. Toccala di nuovo per tornare al rilevamento automatico.',
  'Tuning': 'Accordatura',
  'Detected': 'Rilevata',
  'String {n}': 'Corda {n}',
  'or': 'o',
  'Unpin': 'Sblocca',
  "Tap to lock this note at 12 o'clock": 'Tocca per fissare questa nota in alto, a ore 12',
  'Tap to unpin': 'Tocca per sbloccarla',
  'In tune': 'Intonata',
  'Tighten (raise pitch)': 'Tendi (alza l’intonazione)',
  'Loosen (lower pitch)': 'Allenta (abbassa l’intonazione)',
  '~{pct}% of the audible threshold': '~{pct}% della soglia udibile',

  // ── Stage 2b: the Premium Learn areas (Teacher, Learning Path, intervals,
  // scales, staff and tab reading) and the admin / dev-panel copy ─────────
  // Admin-only account tools and the dev debug panel
  'Admin: plan on your account': 'Admin: piano del tuo account',
  'Sets the plan on your own account only (Free, Pro or Premium). Writes to the entitlements table and syncs across your devices.':
    'Imposta il piano solo sul tuo account (Gratuito, Pro o Premium). Scrive nella tabella dei diritti e si sincronizza tra i tuoi dispositivi.',
  'Simulate tier (dev only — no DB change)': 'Simula piano (solo sviluppo — nessuna modifica al database)',
  'Admin: view the app as': 'Admin: visualizza l’app come',
  'Hides every admin-only control so you see exactly what a regular user sees. Switch back here any time — this is a local view change only and does not change what your account can do.':
    'Nasconde tutti i controlli riservati agli amministratori, così vedi esattamente ciò che vede un utente normale. Puoi tornare qui in qualsiasi momento — è solo un cambio di visualizzazione locale e non cambia ciò che il tuo account può fare.',
  'Regular user': 'Utente normale',
  // Premium Teacher — the Today card
  'Teacher': 'Insegnante',
  'Today with your Teacher': 'Oggi con il tuo Insegnante',
  'Recommended': 'Consigliato',
  'positions': 'posizioni',
  "Today's goal is done": 'Obiettivo di oggi raggiunto',
  'one more round?': 'un altro round?',
  'Daily goal': 'Obiettivo giornaliero',
  "Start today's practice": 'Inizia la pratica di oggi',
  'Practise my weak spots': 'Esercita i miei punti deboli',
  'No weak spots yet — keep practising and the Teacher will find them.':
    'Ancora nessun punto debole — continua a esercitarti e l’Insegnante li troverà.',
  'Why these?': 'Perché queste?',
  'Hide why': 'Nascondi il perché',
  'due for review': 'da ripassare',
  'weak spots': 'punti deboli',
  'to reinforce': 'da rinforzare',
  'new ground': 'terreno nuovo',
  'a fresh set to get started': 'un nuovo gruppo per iniziare',
  'often missed': 'sbagliata spesso',
  'slow to recall': 'lenta da ricordare',
  'recent slips': 'errori recenti',
  'reinforcement': 'rinforzo',
  'not practised much': 'poco esercitata',
  'review': 'ripasso',
  // Premium Learning Path — the Path screen
  'Learning Path': 'Percorso di apprendimento',
  'View your Learning Path': 'Vedi il tuo percorso di apprendimento',
  'Follow a guided path from single notes onward': 'Segui un percorso guidato a partire dalle singole note',
  'A guided journey through the fretboard. Practise from the Selector whenever you like — your answers still move you along this path.':
    'Un viaggio guidato sulla tastiera. Esercitati dal selettore quando vuoi — le tue risposte ti fanno comunque avanzare in questo percorso.',
  'Practise toward this checkpoint': 'Esercitati per questa tappa',
  'This is your next step.': 'Questo è il tuo prossimo passo.',
  'Every checkpoint mastered — keep it sharp.': 'Tutte le tappe padroneggiate — mantieniti in forma.',
  'mastered': 'padroneggiato',
  'Locked': 'Bloccato',
  // Premium interval training — the P4 interval drill
  'Interval training': 'Allenamento sugli intervalli',
  'Hear and find the distance between two notes.': 'Ascolta e trova la distanza tra due note.',
  'intervals tracked': 'intervalli monitorati',
  '1 interval tracked': '1 intervallo monitorato',
  'Answer form': 'Modalità di risposta',
  'Find it on the neck': 'Trovarla sul manico',
  'Name the note': 'Riconoscere la nota',
  'Start interval practice': 'Inizia la pratica degli intervalli',
  'above': 'sopra',
  // Premium scale training
  'Scale training': 'Allenamento sulle scale',
  'Practise building scale shapes on the neck': 'Esercitati a costruire le forme delle scale sul manico',
  'Rows of notes fall down the screen, one lane per string. Only the first note of the scale is lit — tap it, and the distance in tones to the next note appears on it. Find that next note before its row falls off, bottom row first — a run up or down the scale, as the arrow on the banner shows. Every note you tap plays its sound.':
    'File di note scendono sullo schermo, una corsia per corda. Solo la prima nota della scala è illuminata — toccala e sopra comparirà la distanza in toni dalla nota successiva. Trova quella nota prima che la sua fila esca dallo schermo, partendo dalla fila in basso — una corsa ascendente o discendente sulla scala, come indica la freccia sul banner. Ogni nota che tocchi suona.',
  'Tones to the next note': 'Toni fino alla nota successiva',
  'The next note is on another string': 'La nota successiva è su un’altra corda',
  'Frets to the next note': 'Tasti fino alla nota successiva',
  'Distance shown in': 'Distanza in',
  'Tones': 'Toni',
  'A half tone is one fret, a whole tone is two.': 'Un semitono è un tasto, un tono intero due.',
  'Question': 'Domanda',
  'Scale': 'Scala',
  'Session complete!': 'Sessione completata!',
  'Practice again': 'Esercitati di nuovo',
  'Build the scale': 'Costruisci la scala',
  'Tap the scale in order': 'Tocca la scala in ordine',
  'Connect the boxes': 'Collega gli schemi',
  'Boxes 1–2': 'Schemi 1–2',
  'A wider section of the neck is shown, spanning box 1 and box 2 of the scale together. Tap the notes in order to play a run that crosses from one box into the next and back — the same rules as "Tap the scale in order".':
    'Viene mostrata una sezione più ampia del manico, che comprende insieme lo schema 1 e lo schema 2 della scala. Tocca le note in ordine per suonare una sequenza che passa da uno schema all’altro e torna indietro — le stesse regole di "Tocca la scala in ordine".',
  'A section of the neck is shown with every note of the scale lit. Tap them in order to play the scale: start on the root (gold ring), go to one end of the section, then to the other end, and back to the root — up first or down first, as the arrow shows.':
    'Viene mostrata una sezione del manico con tutte le note della scala illuminate. Toccale in ordine per suonare la scala: parti dalla tonica (anello dorato), arriva a un’estremità della sezione, poi all’altra, e torna alla tonica — prima salendo o prima scendendo, come indica la freccia.',
  'Learning mode': 'Modalità di apprendimento',
  'Play on my own': 'Suonare da solo',
  'Watch, then play': 'Guardare, poi suonare',
  'The app plays each scale first, lighting its notes one by one — then you play it after.':
    'L’app suona prima ogni scala, illuminando le note una alla volta — poi la suoni tu.',
  'Watch and listen…': 'Guarda e ascolta…',
  'Your turn — play it back': 'Tocca a te — suonala',
  // Task A — Scales Recall mode ("play the box from memory").
  'Play from memory': 'Suonare a memoria',
  'All notes lit': 'Tutte le note accese',
  'Only the root lit': 'Solo la tonica accesa',
  'Empty neck': 'Manico vuoto',
  'Every note of the box is lit — learn the shape by seeing it.': 'Tutte le note dello schema sono accese — impara la forma guardandola.',
  'Only the root is lit. Play the rest of the box from memory — a dim note of the box still counts.':
    'Solo la tonica è accesa. Suona il resto dello schema a memoria — una nota spenta dello schema conta comunque.',
  'Nothing is lit. Find the root and play the whole box from memory.': 'Niente è acceso. Trova la tonica e suona tutto lo schema a memoria.',
  'Move up a level by itself after 3 good runs in a row': 'Salire di livello da solo dopo 3 scale riuscite di fila',
  'Good runs toward the next level:': 'Scale riuscite verso il livello successivo:',
  'Level up — the neck is empty now': 'Livello superiore — ora il manico è vuoto',
  'Level up — only the root is lit now': 'Livello superiore — ora è accesa solo la tonica',
  'Play the scale on your guitar, note by note — the app listens through the microphone. A note an octave higher or lower also counts. Tapping still works.':
    'Suona la scala sulla tua chitarra, nota per nota — l’app ascolta dal microfono. Anche una nota un’ottava sopra o sotto vale. Puoi sempre anche toccare lo schermo.',
  '🎸 Play the scale on your guitar': '🎸 Suona la scala sulla tua chitarra',
  'Identify the scale': 'Riconosci la scala',
  'Name the degree': 'Indica il grado',
  'The app plays the scale up or down. Pick which scale you heard.':
    'L’app suona la scala in salita o in discesa. Scegli quale scala hai sentito.',
  'The app shows a scale, a root and a degree. Pick the note that matches.':
    'L’app mostra una scala, una tonica e un grado. Scegli la nota corrispondente.',
  '🔊 hear it again': '🔊 riascolta',
  'Minor Pentatonic': 'Pentatonica minore',
  'Major': 'Maggiore',
  'Natural Minor': 'Minore naturale',
  'Major Pentatonic': 'Pentatonica maggiore',
  'Blues': 'Blues',
  'Harmonic Minor': 'Minore armonica',
  'Melodic Minor': 'Minore melodica',
  'Dorian': 'Dorica',
  'Phrygian': 'Frigia',
  'Lydian': 'Lidia',
  'Mixolydian': 'Misolidia',
  'Locrian': 'Locria',
  'Phrygian Dominant (Hijaz)': 'Frigia dominante (Hijaz)',
  'Major Blues': 'Blues maggiore',
  'Half-Whole Diminished': 'Diminuita semitono-tono',
  'Whole-Half Diminished': 'Diminuita tono-semitono',
  'Whole Tone': 'Esatonale',
  'Lydian Dominant (Acoustic)': 'Lidia dominante (acustica)',
  'Altered (Super Locrian)': 'Alterata (superlocria)',
  'Double Harmonic (Arabic)': 'Doppia armonica (araba)',
  'Hungarian Minor (Gypsy Minor)': 'Minore ungherese (zigana)',
  'Hirajoshi': 'Hirajoshi',
  'All scales': 'Tutte le scale',
  'More scales': 'Altre scale',
  'Modes': 'Modi',
  'Minor variations': 'Varianti minori',
  'Blues & jazz': 'Blues e jazz',
  'World': 'Dal mondo',
  'Other': 'Altre',
  // "?" explanations on the More scales page (src/utils/scaleBlurbs.ts)
  "Each number is a note's place in the scale, counted from the starting note (1).":
    'Ogni numero è il posto di una nota nella scala, contando dalla nota di partenza (1).',
  'Pick a starting note to see the scale on it:':
    'Scegli una nota di partenza per vedere la scala su di essa:',
  'Highlighted numbers differ from the major scale: b means one fret lower, # means one fret higher.':
    'I numeri evidenziati differiscono dalla scala maggiore: b significa un tasto più in basso, # un tasto più in alto.',
  'Like natural minor, but with a major 6th instead of a flat 6th. It sounds minor yet lighter and more open — common in funk, jazz and rock.':
    'Come la minore naturale, ma con una 6ª maggiore invece di una 6ª bemolle. Suona minore ma più leggera e aperta — comune nel funk, nel jazz e nel rock.',
  'Like natural minor, but the 2nd note sits just one fret above the root. It sounds dark and tense, with a Spanish flavour — common in flamenco and metal.':
    'Come la minore naturale, ma la 2ª nota è solo un tasto sopra la tonica. Suona scura e tesa, con un sapore spagnolo — comune nel flamenco e nel metal.',
  'Like the major scale, but with a raised 4th. It sounds bright, dreamy and floating — common in film music.':
    'Come la scala maggiore, ma con la 4ª alzata. Suona luminosa, sognante e sospesa — comune nella musica da film.',
  'Like the major scale, but with a flat 7th. It sounds relaxed and bluesy — common in rock, blues and folk.':
    'Come la scala maggiore, ma con la 7ª bemolle. Suona rilassata e bluesy — comune nel rock, nel blues e nel folk.',
  'The most unstable of the modes: it has both a flat 2nd and a flat 5th. It is rarely used as a home key and mostly heard over half-diminished chords.':
    'Il più instabile dei modi: ha sia la 2ª bemolle sia la 5ª bemolle. Si usa raramente come tonalità d’impianto e si sente soprattutto sugli accordi semidiminuiti.',
  'Natural minor with a raised 7th, so the 7th sits one fret below the root. That gives a strong pull back home and a dramatic, classical sound.':
    'La minore naturale con la 7ª alzata, che si trova così un tasto sotto la tonica. Questo dà una forte spinta a tornare a casa e un suono drammatico e classico.',
  'A minor scale (flat 3rd) that keeps the major 6th and 7th. It sounds smooth and jazzy.':
    'Una scala minore (3ª bemolle) che mantiene la 6ª e la 7ª maggiori. Suona morbida e jazzistica.',
  'Harmonic minor with a raised 4th. It has two wide gaps of a step and a half, which gives it a dramatic, exotic sound.':
    'La minore armonica con la 4ª alzata. Ha due ampi salti di un tono e mezzo, che le danno un suono drammatico ed esotico.',
  'The major pentatonic scale plus the flat 3rd "blue note". It sounds sunny, with a country and blues feel.':
    'La pentatonica maggiore più la "blue note" della 3ª bemolle. Suona solare, con un sapore country e blues.',
  'A major scale with a raised 4th and a flat 7th. It sounds bright but bluesy, and jazz players use it over dominant 7th chords.':
    'Una scala maggiore con la 4ª alzata e la 7ª bemolle. Suona luminosa ma bluesy, e i jazzisti la usano sugli accordi di settima di dominante.',
  'It bends every colour note of a dominant chord: it has both a flat and a raised 2nd, and both a flat and a raised 5th. It sounds very tense, and is played right before resolving to the next chord.':
    'Altera ogni nota di colore di un accordo di dominante: ha sia la 2ª bemolle sia la 2ª alzata, e sia la 5ª bemolle sia la 5ª alzata. Suona molto tesa e si suona subito prima di risolvere sull’accordo successivo.',
  'Eight notes, alternating a half step and a whole step. It is symmetrical and tense, and jazz players use it over dominant 7th chords.':
    'Otto note, alternando semitono e tono. È simmetrica e tesa, e i jazzisti la usano sugli accordi di settima di dominante.',
  'Eight notes, alternating a whole step and a half step. It is symmetrical, and is used over diminished chords.':
    'Otto note, alternando tono e semitono. È simmetrica e si usa sugli accordi diminuiti.',
  'Six notes, every step a whole tone. With no half steps it has no clear home note, so it sounds dreamy and floating.':
    'Sei note, ogni passo un tono intero. Senza semitoni non ha una nota di riposo chiara, per questo suona sognante e sospesa.',
  'Phrygian with a major 3rd. It is the classic Middle-Eastern sound, common in flamenco, klezmer and Arabic music.':
    'Frigia con la 3ª maggiore. È il classico suono mediorientale, comune nel flamenco, nel klezmer e nella musica araba.',
  'A major-sounding scale with a flat 2nd and a flat 6th, so it has two gaps of a step and a half. It has a rich Middle-Eastern flavour.':
    'Una scala dal suono maggiore con la 2ª e la 6ª bemolli, quindi ha due salti di un tono e mezzo. Ha un ricco sapore mediorientale.',
  'A five-note Japanese scale with wide gaps between its notes. It sounds sparse and haunting, like a koto.':
    'Una scala giapponese di cinque note con ampi salti tra loro. Suona spoglia e suggestiva, come un koto.',
  'The scale behind most pop, folk and classical music. It sounds bright and happy, and every other scale is easiest to understand by comparing it to this one.':
    'La scala alla base di gran parte del pop, del folk e della musica classica. Suona luminosa e allegra, e tutte le altre scale si capiscono meglio confrontandole con questa.',
  'The basic minor scale. Compared to major, its 3rd, 6th and 7th are one fret lower, which gives it a sad, serious sound.':
    'La scala minore di base. Rispetto alla maggiore, la 3ª, la 6ª e la 7ª sono un tasto più in basso, e questo le dà un suono triste e serio.',
  'Five notes: the minor scale without its 2nd and 6th. It is the most common scale for rock and blues solos, and easy to play because it has no awkward notes.':
    'Cinque note: la scala minore senza la 2ª e la 6ª. È la scala più comune per gli assoli rock e blues, e facile da suonare perché non ha note scomode.',
  'Five notes: the major scale without its 4th and 7th. It sounds sweet and open, and is common in country, pop and rock solos.':
    'Cinque note: la scala maggiore senza la 4ª e la 7ª. Suona dolce e aperta, ed è comune negli assoli country, pop e rock.',
  'The minor pentatonic scale plus one extra "blue note", the flat 5th, which adds a gritty, bluesy tension.':
    'La pentatonica minore più una "blue note" in più, la 5ª bemolle, che aggiunge una tensione ruvida e bluesy.',
  'Degree': 'Grado',
  'Root': 'Tonica',
  'Position': 'Posizione',
  'All positions': 'Tutte le posizioni',
  'Box': 'Schema',
  'One position selected — difficulty is focused.':
    'Una posizione scelta — la difficoltà si concentra su di essa.',
  // Scale progress board
  'Practice': 'Pratica',
  'Progress': 'Progressi',
  'Scales mastered': 'Scale padroneggiate',
  'No scales shipped yet.': 'Ancora nessuna scala disponibile.',
  'Meet the scale': 'Scopri la scala',
  'What does this scale look like?': 'Com’è fatta questa scala?',
  'Play the scale': 'Suona la scala',
  'Start practicing': 'Inizia a esercitarti',
  'More options': 'Altre opzioni',
  'Fewer options': 'Meno opzioni',
  'New to scales? Start with:': 'Nuovo alle scale? Inizia con:',
  'Why start here?': 'Perché iniziare da qui?',
  'Fewer notes (5) and no awkward fingerings — the most common first scale for guitar, and you can solo with it right away. Trade-off: it skips two notes of the full scale, so it won’t teach you scale-degree theory on its own.':
    'Meno note (5) e nessuna diteggiatura scomoda — la prima scala più comune per chitarra, e puoi improvvisare subito. Contro: salta due note della scala completa, quindi da sola non ti insegna la teoria dei gradi.',
  'The foundation scale — every other scale and key gets explained by comparing it to this one. Trade-off: seven notes means a bit more to remember, and a slightly bigger stretch for the fingers than the five-note pentatonic.':
    'La scala fondamentale — ogni altra scala e tonalità viene spiegata confrontandola con questa. Contro: sette note significano un po’ più da ricordare, e un’estensione leggermente maggiore per le dita rispetto alla pentatonica a cinque note.',
  // Intervals Learning — exercises, questions and interval names
  'Identify the interval': 'Riconoscere l’intervallo',
  'Find the note': 'Trovare la nota',
  'Find on the neck': 'Trovare sul manico',
  'Which interval did you hear?': 'Quale intervallo hai sentito?',
  'Hear it again': 'Riascolta',
  'below': 'sotto',
  'above the marked note': 'sopra la nota segnata',
  'below the marked note': 'sotto la nota segnata',
  'A note is marked on the neck — tap the note that completes the interval.':
    'Una nota è segnata sul manico — tocca la nota che completa l’intervallo.',
  'Silent mode is on — this exercise needs sound.':
    'La modalità silenziosa è attiva — questo esercizio ha bisogno del suono.',
  'Silent mode is on — “Identify the interval” needs sound.':
    'La modalità silenziosa è attiva — “Riconoscere l’intervallo” ha bisogno del suono.',
  'Minor 2nd': 'Seconda minore',
  'Major 2nd': 'Seconda maggiore',
  'Minor 3rd': 'Terza minore',
  'Major 3rd': 'Terza maggiore',
  'Perfect 4th': 'Quarta giusta',
  'Tritone': 'Tritono',
  'Perfect 5th': 'Quinta giusta',
  'Minor 6th': 'Sesta minore',
  'Major 6th': 'Sesta maggiore',
  'Minor 7th': 'Settima minore',
  'Major 7th': 'Settima maggiore',
  'Augmented 4th': 'Quarta eccedente',
  'Diminished 5th': 'Quinta diminuita',
  'Augmented 5th': 'Quinta eccedente',
  // Intervals Learning — curriculum group names
  'Perfect 4th & 5th': 'Quarta e quinta giuste',
  'Major & minor 3rds': 'Terze maggiore e minore',
  'Whole & half steps': 'Toni e semitoni',
  'Major & minor 6ths': 'Seste maggiore e minore',
  'Major & minor 7ths': 'Settime maggiore e minore',
  'The tritone': 'Il tritono',
  'All intervals': 'Tutti gli intervalli',
  // Intervals Learning — per-quality educational copy
  'One semitone — the smallest step, two adjacent frets; a tense, grinding sound.':
    'Un semitono — il passo più piccolo, due tasti vicini; un suono teso e stridente.',
  'One semitone narrower than a major 2nd — clashing and unstable where the major 2nd sounds like a plain step.':
    'Un semitono più stretta della seconda maggiore — stride ed è instabile, mentre la seconda maggiore suona come un passo normale.',
  'The pull of a leading tone up to the tonic; the clash inside a tone cluster.':
    'L’attrazione della sensibile verso la tonica; lo scontro dentro un cluster.',
  'Two semitones — a whole step; the plain next note of a scale.':
    'Due semitoni — un tono intero; la semplice nota successiva di una scala.',
  'One semitone wider than a minor 2nd and one narrower than a minor 3rd — a plain step, neither harsh nor sweet.':
    'Un semitono più ampia della seconda minore e uno più stretta della terza minore — un passo normale, né aspro né dolce.',
  'The step between most neighbouring scale degrees.':
    'Il passo tra la maggior parte dei gradi vicini di una scala.',
  'Three semitones — the minor colour; a small, slightly sad-sounding gap.':
    'Tre semitoni — il colore minore; un piccolo salto dal suono un po’ triste.',
  'One semitone narrower than a major 3rd — that single semitone is what makes a chord sound minor instead of major.':
    'Un semitono più stretta della terza maggiore — è proprio quel semitono a far suonare un accordo minore invece che maggiore.',
  'The third of a minor chord.': 'La terza di un accordo minore.',
  'Four semitones — the major colour; a bright, open, happy-sounding gap.':
    'Quattro semitoni — il colore maggiore; un salto luminoso, aperto e allegro.',
  'One semitone wider than a minor 3rd and one narrower than a perfect 4th — bright where the minor 3rd sounds sad.':
    'Un semitono più ampia della terza minore e uno più stretta della quarta giusta — luminosa, mentre la terza minore suona triste.',
  'The bright third of a major chord.': 'La terza luminosa di un accordo maggiore.',
  'Five semitones — a strong, stable, slightly hollow consonance.':
    'Cinque semitoni — una consonanza forte, stabile e un po’ vuota.',
  'One semitone wider than a major 3rd and one narrower than a tritone — settled and resolved where the tritone is tense.':
    'Un semitono più ampia della terza maggiore e uno più stretta del tritono — stabile e risolta, mentre il tritono è teso.',
  'The sound of standard guitar tuning; root to fourth of a suspended chord.':
    'Il suono dell’accordatura standard della chitarra; dalla fondamentale alla quarta di un accordo sospeso.',
  'Six semitones — exactly half an octave; a tense, restless, unresolved sound.':
    'Sei semitoni — esattamente mezza ottava; un suono teso, inquieto e irrisolto.',
  'One semitone wider than a perfect 4th and one narrower than a perfect 5th — tense and unresolved where both perfects sound stable.':
    'Un semitono più ampio della quarta giusta e uno più stretto della quinta giusta — teso e irrisolto, mentre le due giuste suonano stabili.',
  'The blue note; the gap inside a dominant 7th chord that wants to resolve.':
    'La blue note; l’intervallo dentro un accordo di settima di dominante che chiede di risolvere.',
  'Seven semitones — the most stable interval after the octave; the power-chord sound.':
    'Sette semitoni — l’intervallo più stabile dopo l’ottava; il suono del power chord.',
  'One semitone wider than a tritone — solid and at rest where the tritone is tense.':
    'Un semitono più ampia del tritono — solida e a riposo, mentre il tritono è teso.',
  'Root to fifth of almost every chord; the power-chord shape.':
    'Dalla fondamentale alla quinta di quasi ogni accordo; la forma del power chord.',
  'Eight semitones — a wide, wistful interval; a major 3rd turned upside down.':
    'Otto semitoni — un intervallo ampio e malinconico; una terza maggiore rovesciata.',
  'One semitone narrower than a major 6th — darker and more longing than the major 6th.':
    'Un semitono più stretta della sesta maggiore — più scura e malinconica della sesta maggiore.',
  'The top of a first-inversion major chord; root to the minor 6th degree.':
    'La nota superiore di un accordo maggiore in primo rivolto; dalla fondamentale al 6º grado minore.',
  'Nine semitones — a wide, warm, sweet interval; a minor 3rd turned upside down.':
    'Nove semitoni — un intervallo ampio, caldo e dolce; una terza minore rovesciata.',
  'One semitone wider than a minor 6th and one narrower than a minor 7th — brighter and sweeter than either.':
    'Un semitono più ampia della sesta minore e uno più stretta della settima minore — più luminosa e dolce di entrambe.',
  'The added note of a 6th chord; root to the sixth degree of a major scale.':
    'La nota aggiunta di un accordo di sesta; dalla fondamentale al sesto grado della scala maggiore.',
  'Ten semitones — a wide, bluesy interval that leans forward and wants to resolve.':
    'Dieci semitoni — un intervallo ampio e bluesy che spinge in avanti e chiede di risolvere.',
  'One semitone narrower than a major 7th and one wider than a major 6th — restless where the major 7th sounds sharp and the major 6th sounds settled.':
    'Un semitono più stretta della settima maggiore e uno più ampia della sesta maggiore — inquieta, mentre la settima maggiore suona acuta e la sesta maggiore stabile.',
  'The interval that makes a dominant 7th chord want to resolve.':
    'L’intervallo che fa chiedere a un accordo di settima di dominante di risolvere.',
  'Eleven semitones — one short of the octave; a sharp, shimmering, almost-there sound.':
    'Undici semitoni — uno in meno dell’ottava; un suono acuto, scintillante, quasi arrivato.',
  'One semitone wider than a minor 7th and one narrower than the octave — it strains up toward the octave where the minor 7th sits lower and bluesier.':
    'Un semitono più ampia della settima minore e uno più stretta dell’ottava — tende verso l’ottava, mentre la settima minore resta più bassa e più bluesy.',
  'The bright, jazzy top of a major 7th chord.':
    'La nota superiore luminosa e jazzistica di un accordo di settima maggiore.',
  // Intervals Learning — progress board and Stats section
  'not started': 'non iniziato',
  'learning': 'in corso',
  'currently learning': 'in studio ora',
  'In the system': 'Nel sistema',
  'Started': 'Iniziati',
  'Needs work': 'Da migliorare',
  'Accuracy': 'Precisione',
  'Avg. time': 'Tempo medio',
  // Intervals Learning — the Interval Today card
  "Today's intervals": 'Gli intervalli di oggi',
  'intervals': 'intervalli',
  'new': 'da imparare',
  'to tell apart': 'da distinguere',
  'Practise my weak intervals': 'Esercita i miei intervalli deboli',
  'No weak intervals yet — keep practising and the Teacher will find them.':
    'Ancora nessun intervallo debole — continua a esercitarti e l’Insegnante li troverà.',
  'broadening': 'ampliamento',
  // Intervals Learning — the Interval Selector controls
  'Exercise': 'Esercizio',
  'Interval selection': 'Scelta degli intervalli',
  'Difficulty': 'Difficoltà',
  'Direction': 'Direzione',
  'One interval': 'Un intervallo',
  'A group': 'Un gruppo',
  'All learned': 'Tutti quelli imparati',
  'All 11': 'Tutti e 11',
  'Fall speed': 'Velocità di caduta',
  'Slow': 'Lenta',
  'Fast': 'Veloce',
  'Focused': 'Mirato',
  'Mixed': 'Misto',
  'Ascending': 'Ascendente',
  'Descending': 'Discendente',
  'Both': 'Entrambi',
  'Pick more than one interval to mix': 'Scegli più di un intervallo per mescolare',
  'Practising:': 'In esercizio:',
  "You'll hear two notes. Pick the interval between them.":
    'Sentirai due note. Scegli l’intervallo tra di esse.',
  "You'll see a note and an interval. Pick the note that far above it.":
    'Vedrai una nota e un intervallo. Scegli la nota che si trova a quella distanza sopra.',
  // Intervals Learning — inline educational content
  'About this interval': 'Su questo intervallo',
  'semitones': 'semitoni',
  // Staff reading (StaffPracticeScreen)
  'A note is written on the staff. Pick its name — you will hear it after you answer.':
    'Una nota è scritta sul pentagramma. Scegli il suo nome — la sentirai dopo aver risposto.',
  'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.':
    'Una nota è scritta sul pentagramma. Tocca un punto del manico che la suona — va bene qualsiasi corda. Dopo vengono mostrati tutti i punti in cui si trova.',
  'Range': 'Estensione',
  'Frets 0–3': 'Tasti 0–3',
  'Frets 0–5': 'Tasti 0–5',
  'Frets 0–12': 'Tasti 0–12',
  'Natural notes only': 'Solo note naturali',
  'With sharps and flats': 'Con diesis e bemolle',
  'Bass music is written in the bass clef, one octave above how it sounds.':
    'La musica per basso si scrive in chiave di basso, un’ottava sopra il suono reale.',
  'Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.':
    'La musica per questo strumento si scrive in chiave di violino, un’ottava sopra il suono reale — lo indica il piccolo 8 sotto la chiave.',
  'Music for this instrument is written in the treble clef, at the pitch it sounds.':
    'La musica per questo strumento si scrive in chiave di violino, all’altezza reale.',
  'Practise reading notes on the staff and finding them on the neck':
    'Esercitati a leggere le note sul pentagramma e a trovarle sul manico',
  'A note on the staff': 'Una nota sul pentagramma',
  'Where is it written?': 'Dove è scritta?',
  'Read a phrase': 'Leggere una frase',
  'A place on the neck is marked. Tap the staff where that note is written, fine-tune with the arrows, then press Check.':
    'Un punto del manico è segnato. Tocca il pentagramma dove è scritta quella nota, regola con le frecce, poi premi Verifica.',
  'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.':
    'Una breve frase è scritta sul pentagramma. Nomina le sue note una dopo l’altra — alla fine la sentirai.',
  'Key signature': 'Armatura di chiave',
  'The signs at the start of the staff hold for every note on that letter, unless a note carries its own sign.':
    'I segni all’inizio del pentagramma valgono per tutte le note con quel nome, a meno che una nota non abbia un proprio segno.',
  'Notes of the key only': 'Solo note della tonalità',
  'With accidentals': 'Con alterazioni',
  'Phrase': 'Frase',
  'Tap the staff where the note is written': 'Tocca il pentagramma dove è scritta la nota',
  'Up': 'Su',
  'Down': 'Giù',
  'Check': 'Verifica',
  'Notes mastered': 'Note padroneggiate',
  'Your progress on the staff': 'I tuoi progressi sul pentagramma',
  "Today's staff reading": 'La lettura dello spartito di oggi',
  'Read a round of notes on the staff — the notes that are due come first.':
    'Leggi un round di note sul pentagramma — prima quelle da ripassare.',
  'Open staff reading': 'Apri la lettura dello spartito',
  'Play it on your guitar instead of naming it — the app listens through the microphone. Play the exact note you see, including its octave: that’s what this exercise is testing. Tapping still works.':
    'Suonala sulla tua chitarra invece di scegliere il nome — l’app ascolta dal microfono. Suona la nota esatta che vedi, inclusa la sua ottava: è proprio questo che l’esercizio verifica. Puoi sempre anche toccare lo schermo.',
  '🎸 Play the phrase on your guitar': '🎸 Suona la frase sulla tua chitarra',
  // Tab reading (TabPracticeScreen)
  'Tab reading': 'Lettura della tablatura',
  'Write it in tab': 'Scriverla in tablatura',
  'Read a riff': 'Leggere un riff',
  'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.':
    'Un numero è scritto su una linea della tablatura. Nomina la nota che suona — la sentirai dopo aver risposto.',
  'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.':
    'Un numero è scritto su una linea della tablatura. Tocca esattamente quel punto del manico: la linea è la corda, il numero è il tasto.',
  'A place on the neck is marked. Tap the tab line of its string, pick the fret number, then press Check.':
    'Un punto del manico è segnato. Tocca la linea della tablatura della sua corda, scegli il numero del tasto, poi premi Verifica.',
  'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.':
    'Un breve riff è scritto in tablatura. Nomina le sue note una dopo l’altra — alla fine lo sentirai.',
  'In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.':
    'In una tablatura la linea in alto è la corda più sottile e acuta e quella in basso la più spessa — al contrario del manico in questa app, dove la corda più spessa è in alto.',
  'Practise reading tabs and finding every number on the neck':
    'Esercitati a leggere le tablature e a trovare ogni numero sul manico',
  'Riff': 'Riff',
  'Tap the tab line of the string': 'Tocca la linea della tablatura della corda',
  'A number on the tab': 'Un numero sulla tablatura',
  'Fret': 'Tasto',
  'Places mastered': 'Punti padroneggiati',
  'Your progress on the neck': 'I tuoi progressi sul manico',
  "Today's tab reading": 'La lettura della tablatura di oggi',
  'Read a round of tab — the places that are due come first.':
    'Leggi un round di tablatura — prima i punti da ripassare.',
  'Open tab reading': 'Apri la lettura della tablatura',
  'Play it on your guitar instead of naming it — the app listens through the microphone. A pitch can’t say which string it came from, so any place that plays the right note counts — an octave either way too. Tapping still works.':
    'Suonala sulla tua chitarra invece di scegliere il nome — l’app ascolta dal microfono. Una nota suonata non può dire da quale corda arriva, quindi conta qualsiasi punto che suona la nota giusta — anche un’ottava sopra o sotto. Puoi sempre anche toccare lo schermo.',
  '🎸 Play the riff on your guitar': '🎸 Suona il riff sulla tua chitarra',
  // Tab reading, Slice 2: chords and technique symbols
  'Topic': 'Argomento',
  'Single notes': 'Note singole',
  'Techniques': 'Tecniche',
  'Name the chord': 'Riconoscere l’accordo',
  'Play the chord': 'Suonare l’accordo',
  'What does it mean?': 'Che cosa significa?',
  'Which note do you hear at the end?': 'Quale nota senti alla fine?',
  'A chord is written in the tab: the numbers in one column are played together, and a line with no number is not played. Name the chord — you will hear it after you answer.':
    'Un accordo è scritto in tablatura: i numeri nella stessa colonna si suonano insieme, e una linea senza numero non si suona. Nomina l’accordo — lo sentirai dopo aver risposto.',
  'A chord is written in the tab. Tap every place it plays on the neck, one per string, leave the strings with no number alone, then press Check.':
    'Un accordo è scritto in tablatura. Tocca ogni punto del manico in cui suona, uno per corda, lascia stare le corde senza numero, poi premi Verifica.',
  'A playing technique is written in the tab. Say what the symbol means — you will hear it after you answer.':
    'Una tecnica è scritta in tablatura. Di’ che cosa significa il simbolo — la sentirai dopo aver risposto.',
  'A playing technique is written in the tab. Name the note that sounds at the end of it.':
    'Una tecnica è scritta in tablatura. Nomina la nota che suona alla fine.',
  'The lowest note of these chords is the root, the note the chord is named after.':
    'La nota più grave di questi accordi è la fondamentale, la nota che dà il nome all’accordo.',
  'Chords in tab are not available for this instrument yet.':
    'Gli accordi in tablatura non sono ancora disponibili per questo strumento.',
  'Chords mastered': 'Accordi padroneggiati',
  'Symbols mastered': 'Simboli padroneggiati',
  'Minor': 'Minore',
  'Hammer-on': 'Hammer-on',
  'Pull-off': 'Pull-off',
  'Slide up': 'Slide ascendente',
  'Slide down': 'Slide discendente',
  'Bend': 'Bending',
  'Vibrato': 'Vibrato',
  'Muted note': 'Nota stoppata',
  'Palm mute': 'Palm mute',
  'Hammer-on: pick the first note, then press the higher fret down hard without picking again.':
    'Hammer-on: suona la prima nota, poi premi con forza il tasto più alto senza pizzicare di nuovo.',
  'Pull-off: pick the first note, then pull that finger off so the lower fret sounds, without picking again.':
    'Pull-off: suona la prima nota, poi togli quel dito tirando la corda così che suoni il tasto più basso, senza pizzicare di nuovo.',
  'Slide up: pick the first note and slide the same finger up the string to the second fret.':
    'Slide ascendente: suona la prima nota e fai scivolare lo stesso dito verso l’alto lungo la corda fino al secondo tasto.',
  'Slide down: pick the first note and slide the same finger down the string to the second fret.':
    'Slide discendente: suona la prima nota e fai scivolare lo stesso dito verso il basso lungo la corda fino al secondo tasto.',
  'Bend: pick the note and push the string sideways until it sounds as high as the fret in the second number.':
    'Bending: suona la nota e spingi la corda di lato finché suona alta come il tasto del secondo numero.',
  'Vibrato: let the note ring and shake its pitch slightly by moving the string.':
    'Vibrato: lascia suonare la nota e fai oscillare leggermente l’intonazione muovendo la corda.',
  'Muted note: touch the string without pressing it down and pick — a short click with no pitch.':
    'Nota stoppata: tocca la corda senza premerla e pizzicala — un breve clic senza intonazione.',
  'Palm mute: rest the side of the picking hand on the strings by the bridge, for a short, muffled sound.':
    'Palm mute: appoggia il taglio della mano che pizzica sulle corde vicino al ponte, per un suono breve e smorzato.',
  // Task D — Scales fingering ("Show fingers" on the box).
  'Show fingers': 'Mostra le dita',
  'The small number on each note is the finger that plays it: 1 index, 2 middle, 3 ring, 4 pinky, 0 an open string. One finger per fret — the hand stays in place and each finger owns its fret.':
    'Il numerino su ogni nota è il dito che la suona: 1 indice, 2 medio, 3 anulare, 4 mignolo, 0 corda a vuoto. Un dito per tasto: la mano resta ferma e ogni dito si occupa del suo tasto.',
  // Wishlist item 8 — Scales: the picking hand (stroke marks, notes per click).
  'Pick strokes': 'Direzione della pennata',
  'The arrow on each note is the pick stroke: ↓ down, ↑ up. Alternate from the first note — down, up, down, up — even when you change strings.':
    'La freccia su ogni nota è la direzione della pennata: ↓ in giù, ↑ in su. Alterna dalla prima nota — giù, su, giù, su — anche quando cambi corda.',
  'The app hears which note you play, not how you pick it — it can’t check the stroke direction. With the metronome at 2 notes per click, every down stroke falls on a click, which keeps the alternation even.':
    'L’app sente quale nota suoni, non come la pizzichi: non può controllare la direzione della pennata. Con il metronomo a 2 note per clic, ogni pennata in giù cade su un clic, e così l’alternanza resta regolare.',
  'Notes per click': 'Note per clic',
  'Play two notes on each click: the down stroke on the click, the up stroke halfway to the next one. Each note is judged against those half-beats, so start slower than usual. After a clean run the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'Suona due note a ogni clic: la pennata in giù sul clic, quella in su a metà strada verso il successivo. Ogni nota viene giudicata su questi mezzi tempi, quindi parti più lento del solito. Dopo un giro pulito il tempo sale di 4 BPM. Ogni scala e ogni schema tiene il proprio tempo.',
  '↓ down · ↑ up — alternate picking. The app checks the notes, not your picking hand.':
    '↓ giù · ↑ su — pennata alternata. L’app controlla le note, non la mano che pizzica.',
  // Task C — Scales guided beginner path (ScalePathCard / ScaleRelativeScreen).
  'Five notes in one small box near the root — the shape most solos start from. Watch it once, then play it back.':
    'Cinque note in un piccolo schema vicino alla tonica: la forma da cui partono quasi tutti gli assoli. Guardala una volta, poi suonala tu.',
  'The same five notes, one box further: the root moves to the next string.':
    'Le stesse cinque note, uno schema più in là: la tonica passa alla corda successiva.',
  'One run that crosses from box 1 into box 2 and back, so the two boxes become one stretch of the neck.':
    'Un\'unica corsa che passa dallo schema 1 allo schema 2 e torna indietro, così i due schemi diventano un solo tratto del manico.',
  'The box you know is also a major pentatonic — only the home note changes.':
    'Lo schema che conosci è anche una pentatonica maggiore: cambia solo la nota di riposo.',
  'Play the box you already know, but start and end on its major home note — three frets above the minor root on the thickest string.':
    'Suona lo schema che conosci già, ma inizia e finisci sulla sua nota di riposo maggiore: tre tasti sopra la tonica minore, sulla corda più grossa.',
  'Box 1 of the minor pentatonic plus one extra note — the flat 5th, the "blue note".':
    'Lo schema 1 della pentatonica minore più una nota: la quinta diminuita, la "blue note".',
  'The full seven-note minor scale: the minor pentatonic box with two more notes filled in.':
    'La scala minore completa di sette note: lo schema della pentatonica minore con altre due note che riempiono i vuoti.',
  'The seven-note major scale — the one every other scale is compared to.':
    'La scala maggiore di sette note: quella con cui si confrontano tutte le altre.',
  'One shape, two names':
    'Una forma, due nomi',
  'Same box, new home note':
    'Stesso schema, nuova nota di riposo',
  'Your path':
    'Il tuo percorso',
  'Step passed! Next up:':
    'Passo superato! Il prossimo:',
  'Step passed!':
    'Passo superato!',
  'Not passed yet — one more clean session usually does it.':
    'Non ancora superato: di solito basta un\'altra sessione pulita.',
  'Start this step':
    'Inizia questo passo',
  'Path complete! Practise any step again, or open More options for every scale.':
    'Percorso completato! Ripeti qualsiasi passo, oppure apri Altre opzioni per tutte le scale.',
  'Hide steps':
    'Nascondi i passi',
  'All steps':
    'Tutti i passi',
  'Finish the steps before it to unlock this one.':
    'Completa i passi precedenti per sbloccare questo.',
  // Scales — sequences, a ladder after Recall (wishlist 2026-10-03 item 6).
  'Sequences':
    'Sequenze',
  'Groups of 3':
    'Gruppi di 3',
  'Groups of 4':
    'Gruppi di 4',
  'Thirds':
    'Terze',
  'Play 1-2-3, then 2-3-4, then 3-4-5… one note further each time.':
    'Suona 1-2-3, poi 2-3-4, poi 3-4-5… una nota più avanti ogni volta.',
  'Play 1-2-3-4, then 2-3-4-5… one note further each time.':
    'Suona 1-2-3-4, poi 2-3-4-5… una nota più avanti ogni volta.',
  'Skip a note, then step back: 1-3, 2-4, 3-5…':
    'Salta una nota, poi torna indietro di un passo: 1-3, 2-4, 3-5…',
  'Box 1 in groups of 3, groups of 4, then thirds, up and down — so you know each note’s neighbour, not only the whole line. It opens once you can play box 1 from memory.':
    'Lo schema 1 in gruppi di 3, gruppi di 4 e poi terze, in salita e in discesa — per conoscere la vicina di ogni nota, non solo la linea intera. Si apre quando sai suonare lo schema 1 a memoria.',
  'First, play the box from memory: only the root is lit.':
    'Prima suona lo schema a memoria: è accesa solo la tonica.',
  'Good runs in a row:':
    'Scale riuscite di fila:',
  'Play the box from memory':
    'Suonare lo schema a memoria',
  'Finish the rung before it to unlock this one.':
    'Completa il gradino precedente per sbloccare questo.',
  'Same five notes, same shape. Start and end on {minor} and they sound like a minor pentatonic — dark and bluesy. Start and end on {major} and the very same notes sound like a major pentatonic — bright and sweet.':
    'Le stesse cinque note, la stessa forma. Inizia e finisci su {minor} e suonano come una pentatonica minore: scura e blues. Inizia e finisci su {major} e le stesse identiche note suonano come una pentatonica maggiore: luminosa e dolce.',
  'On the thickest string, the major home note sits three frets above the minor one.':
    'Sulla corda più grossa, la nota di riposo maggiore si trova tre tasti sopra quella minore.',
  'Count the degrees from':
    'Contare i gradi da',
  'Back to the path':
    'Torna al percorso',
  // Scales path step 0 — "One string, four fingers" + "Make it ring" (ScaleRingTips).
  'Before any scale: one finger per fret on one string, up and back. Press just behind the fret and let every note ring.':
    'Prima di ogni scala: un dito per tasto su una sola corda, salendo e tornando. Premi appena dietro la barretta e lascia suonare ogni nota.',
  'One string, four fingers':
    'Una corda, quattro dita',
  'Make it ring':
    'Falla suonare',
  'Where the fingertip goes':
    'Dove va il polpastrello',
  'Arch the finger, thumb behind the neck':
    'Dito arcuato, pollice dietro il manico',
  'Thumb behind the neck, about behind your middle finger — not wrapped over the top.':
    'Il pollice dietro il manico, più o meno dietro il dito medio, senza scavalcarlo da sopra.',
  'Fingertip just behind the fret wire, not on top of it.':
    'Il polpastrello appena dietro la barretta, non sopra.',
  'Arch the finger so only the tip touches: the string next to it must still ring.':
    'Arcua il dito in modo che tocchi solo la punta: la corda accanto deve continuare a suonare.',
  'One finger per fret: finger 1 on fret 5, 2 on 6, 3 on 7, 4 on 8. Let each note ring before the next.':
    'Un dito per tasto: il dito 1 sul tasto 5, il 2 sul 6, il 3 sul 7, il 4 sull’8. Lascia suonare ogni nota prima della successiva.',
  'Fingertip just behind the fret. Let each note ring before the next.':
    'Il polpastrello appena dietro la barretta. Lascia suonare ogni nota prima della successiva.',

  // Task B — Scales metronome + gradual tempo ("Tap the scale in order").
  'Metronome': 'Metronomo',
  'Slower': 'Più lento',
  'Faster': 'Più veloce',
  'Tempo': 'Tempo',
  'Play one note on each click. After a clean run — no wrong notes and nearly every note on the click — the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'Suona una nota a ogni clic. Dopo un giro pulito — nessuna nota sbagliata e quasi tutte sul clic — il tempo sale di 4 BPM. Ogni scala e ogni schema tiene il proprio tempo.',
  'The scales and boxes you picked have different tempos — this sets them all.':
    'Le scale e gli schemi scelti hanno tempi diversi: questo li imposta tutti.',
  'On time': 'A tempo',
  'Early': 'In anticipo',
  'Late': 'In ritardo',
  'Last run': 'Ultimo giro',
  'on the click': 'sul clic',
  'early': 'in anticipo',
  'late': 'in ritardo',
  'You are rushing — wait for the click.': 'Stai correndo: aspetta il clic.',
  'You are dragging — play right on the click.': 'Stai rallentando: suona proprio sul clic.',
  'Clean run! Tempo up to': 'Giro pulito! Il tempo sale a',
  'Clean run at the top tempo!': 'Giro pulito al tempo massimo!',
  'Not clean yet — the tempo stays at': 'Non ancora pulito: il tempo resta a',

  // Wishlist 2026-10-03 item 1 — Scales: plain words, in place (ScaleTermHint).
  'What does this word mean?':
    'Che cosa vuol dire questa parola?',
  'What the words mean':
    'Che cosa vogliono dire le parole',
  'A box is one hand-sized patch of the neck where the whole scale fits under your four fingers without moving your hand — its number says which patch, not a finger or a fret.':
    'Uno schema è una zona del manico grande quanto la mano in cui tutta la scala sta sotto le tue quattro dita senza spostare la mano: il numero dice quale zona, non un dito né un tasto.',
  'The root is the scale’s home note, the one it is named after — it has the gold ring.':
    'La tonica è la nota di casa della scala, quella da cui prende il nome: ha l’anello dorato.',
  'A degree is a note’s place in the scale, counted up from the root, which is 1 — a “b” before the number means one fret lower.':
    'Un grado è il posto di una nota nella scala, contando dalla tonica, che è 1: una “b” prima del numero significa un tasto più in basso.',
  'Strings are numbered from the thinnest (1) to the thickest, so the thickest string — the lit row on top — has the highest number.':
    'Le corde sono numerate dalla più sottile (1) alla più spessa, quindi la più spessa (la fila illuminata in alto) ha il numero più alto.',
  'A fret is one numbered slot along the neck — press just behind its metal wire; the numbers under the board are the frets.':
    'Un tasto è una casella numerata lungo il manico: premi subito dietro la sua barretta di metallo; i numeri sotto la griglia sono i tasti.',
  // Scales — "I play, you play it back" (call and response by ear).
  'Play it back by ear': 'Risuonalo a orecchio',
  'The app plays a few notes from the box — nothing lights up, so listen. Then play them back on your guitar or tap them. Every phrase starts on the root (gold ring). Two clean phrases in a row and the next one is a note longer.': 'L’app suona alcune note dello schema — non si accende niente, quindi ascolta. Poi risuonale sulla chitarra o toccale. Ogni frase parte dalla tonica (anello dorato). Due frasi pulite di fila e la successiva ha una nota in più.',
  'The box on the board': 'Lo schema sul tabellone',
  'With only the root lit, your ear finds the notes, not your eye.': 'Con solo la tonica accesa, le note le trova l’orecchio, non l’occhio.',
  'Notes in the phrase': 'Note nella frase',
  'Listen…': 'Ascolta…',
  '✓ Clean — the next phrase is one note longer.': '✓ Pulita: la frase successiva ha una nota in più.',
  '✓ Clean!': '✓ Pulita!',
  'Found it, with a slip.': 'Trovata, con un errore.',
  'Missed — the next phrase is one note shorter.': 'Sbagliata: la frase successiva ha una nota in meno.',
  'Longest phrase played back': 'Frase più lunga risuonata',
  '🎸 Play the notes back on your guitar': '🎸 Risuona le note sulla chitarra',
  // Scales — short licks per box (scaleLicks.ts, wishlist item 7).
  'The blues opening': 'L’apertura blues',
  'One note each on strings 3, 2 and 1, ending on the root.': 'Una nota per corda: 3, 2 e poi 1, finendo sulla tonica.',
  'The full version bends the first note up a whole step. Here it is played without the bend.': 'La versione completa fa un bending di un tono sulla prima nota. Qui si suona senza bending.',
  'Turn for home': 'Ritorno a casa',
  'Two notes down string 3, then the root on string 4.': 'Due note scendendo sulla corda 3, poi la tonica sulla corda 4.',
  'The full version starts the first note bent up and lets it down. Here it is played without the bend.': 'La versione completa parte con la prima nota già in bending e la rilascia. Qui si suona senza bending.',
  'The rolling triplet': 'La terzina che rotola',
  'Pull off from the high note to the root on string 1, then string 2 — three notes, twice round.': 'Pull-off dalla nota alta alla tonica sulla corda 1, poi la corda 2 — tre note, due giri.',
  'Pull-offs down the box': 'Pull-off giù per lo schema',
  'On strings 1, 2 and 3 in turn, pull off from the high note to the low one.': 'Sulle corde 1, 2 e 3 a turno: pull-off dalla nota alta a quella bassa.',
  'The full version bends the 5th note up a whole step. Here it is played without the bend.': 'La versione completa fa un bending di un tono sulla 5ª nota. Qui si suona senza bending.',
  'Lick': 'Lick',
  'Try': 'Tentativo',
  'Missed this time.': 'Non questa volta.',
  'What the app plays': 'Cosa suona l’app',
  'Short phrases': 'Frasi brevi',
  'Licks': 'Lick',
  'Standard blues and rock licks every guitarist learns in this box. The app shows and plays each lick, then you play it back on your guitar or tap it — twice per lick, in one key.': 'Lick classici blues e rock che ogni chitarrista impara in questo schema. L’app mostra e suona ogni lick, poi lo risuoni tu sulla chitarra o toccando lo schermo — due volte per lick, in una sola tonalità.',
  'Licks played clean': 'Lick puliti',
  // Menu search (src/utils/appSearch.ts)
  'Search the app': 'Cerca nell’app',
  'No results': 'Nessun risultato',
  'Clear search': 'Cancella la ricerca',
  // Practice drill feedback line (src/hooks/useGameEngine.ts)
  'Correct!': 'Giusto!',
  'All found!': 'Trovati tutti!',
  'Where else? ({n} more)': 'Dove altro? (ancora {n})',
  'Also on: {list}': 'Anche su: {list}',
  'Correct: {list}': 'Giusti: {list}',
  'It was {note}': 'Era {note}',

  // Fret of the Day / Challenge a friend
  'Fret of the Day': 'Il tasto del giorno',
  'The same {count} positions for every player in the world, today.': 'Le stesse {count} posizioni per tutti i giocatori del mondo, oggi.',
  '{count} positions, today': '{count} posizioni, oggi',
  '{name} got {correct}/{total} in {seconds}s — beat it!': '{name} ha fatto {correct}/{total} in {seconds}s — battilo!',
  '{n}-day streak': 'Serie di {n} giorni',
  'Come back tomorrow for a new puzzle.': 'Torna domani per una nuova sfida.',
  'Share result': 'Condividi il risultato',
  'Your name (optional)': 'Il tuo nome (opzionale)',
  'Challenge a friend': 'Sfida un amico',
  'Copied to clipboard': 'Copiato negli appunti',
  'A friend': 'Un amico',
  "Beat my score on today's Fret of the Day!": 'Batti il mio punteggio nel tasto del giorno!',
  'You beat {name} by {n}!': 'Hai battuto {name} di {n}!',
  '{name} still leads': '{name} è ancora in testa',
  'You beat {name} — same score, faster!': 'Hai battuto {name} — stesso punteggio, più veloce!',
  'You tied {name}!': 'Pareggio con {name}!',
  'Want to learn the whole neck? A few minutes a day.': 'Vuoi imparare tutto il manico? Pochi minuti al giorno.',
  // ── Teacher mode: the Class screen (ClassroomScreen / HomeworkRun) ──
  "Class": "Classe",
  "Classes need an internet connection and are not available in this build.": "Le classi richiedono una connessione a internet e non sono disponibili in questa versione.",
  "Something went wrong. Check your connection and try again.": "Qualcosa è andato storto. Controlla la connessione e riprova.",
  "You were invited to join a class with code {code}.": "Sei stato invitato a una classe con il codice {code}.",
  "Classes connect a teacher and their students: the teacher assigns practice, and sees who did it and how it went. Sign in so your teacher can see your results.": "Una classe collega un insegnante ai suoi studenti: l’insegnante assegna esercizi e vede chi li ha fatti e come sono andati. Accedi perché il tuo insegnante veda i tuoi risultati.",
  "My classes": "Le mie classi",
  "Classes I teach": "Classi in cui insegno",
  "Verified teacher — Premium is on us.": "Insegnante verificato: Premium lo offriamo noi.",
  "Premium is on us — one of your classes is active.": "Premium lo offriamo noi — una delle tue classi è attiva.",
  "Get Premium free, automatically, once one of your classes has 6 or more students who have practised in the last 30 days. Everything here already works either way.": "Ottieni Premium gratis, automaticamente, quando una delle tue classi ha 6 o più studenti che si sono allenati negli ultimi 30 giorni. In ogni caso, qui funziona già tutto.",
  "You joined {name}.": "Sei entrato in {name}.",
  "That is your own class — you teach it.": "È la tua classe: sei tu l’insegnante.",
  "No class has that code. Check it with your teacher.": "Nessuna classe ha questo codice. Controllalo con il tuo insegnante.",
  "Join a class": "Entra in una classe",
  "Class code": "Codice della classe",
  "Your name, as your teacher will see it": "Il tuo nome, come lo vedrà l’insegnante",
  "I'm 13 or older, or a parent/guardian is helping me join.": "Ho 13 anni o più, oppure un genitore/tutore mi sta aiutando a iscrivermi.",
  "Joining a class needs Pro — ask a parent or guardian, or upgrade yourself.": "Iscriversi a una classe richiede Pro — chiedi a un genitore o tutore, oppure esegui l'upgrade.",
  "See Pro": "Vedi Pro",
  "Join": "Entra",
  "Do you teach guitar, bass or ukulele?": "Insegni chitarra, basso o ukulele?",
  "Create a class, give your students its code, assign practice and see who did it. Get Premium free once a class has 6 or more active students.": "Crea una classe, dai il codice ai tuoi studenti, assegna esercizi e guarda chi li ha fatti. Ottieni Premium gratis quando una classe ha 6 o più studenti attivi.",
  "I'm a teacher": "Sono un insegnante",
  "Becoming a teacher needs a short, timed music-theory test first.": "Per diventare insegnante bisogna prima superare un breve test di teoria musicale a tempo.",

  // Teacher test (0027_teacher_exam.sql / TeacherExamScreen.tsx)
  "Show what you know": "Mostra quello che sai",
  "Becoming a teacher needs a short music-theory test: {n} questions, each timed, about reading the neck, the staff, intervals, key signatures and chords. A pass needs {pass} or more right.":
    "Per diventare insegnante bisogna superare un breve test di teoria musicale: {n} domande, ciascuna a tempo, su lettura del manico, del pentagramma, intervalli, armature di chiave e accordi. Per passare servono {pass} o più risposte corrette.",
  "Each question disappears once its time is up, so there is no time to look anything up — just enough to answer if you know it.":
    "Ogni domanda scompare quando finisce il suo tempo, quindi non c'è tempo per cercare la risposta — solo il tempo giusto per rispondere se la sai.",
  "You can try again {when}.": "Potrai riprovare {when}.",
  "Try again now.": "Puoi riprovare adesso.",
  "Start the test": "Inizia il test",
  "Which instrument?": "Quale strumento?",
  "The neck and staff questions use this instrument.": "Le domande sul manico e sul pentagramma usano questo strumento.",
  "Begin": "Inizia",
  "Teacher test": "Test da insegnante",
  "Question {n} of {total}": "Domanda {n} di {total}",
  "Leave now? This attempt will count as failed.": "Uscire adesso? Questo tentativo verrà contato come fallito.",
  "Which note is marked on the neck?": "Quale nota è segnata sul manico?",
  "Which note is written?": "Quale nota è scritta?",
  "From {a} up to {b} — which interval?": "Da {a} a {b} — che intervallo è?",
  "How many sharps or flats does {key} have?": "Quanti diesis o bemolli ha {key}?",
  "Which major key has {sig}?": "Quale tonalità maggiore ha {sig}?",
  "What is the relative minor of {key}?": "Qual è il relativo minore di {key}?",
  "Which chord is {notes}?": "Quale accordo è {notes}?",
  "Which notes make up {chord}?": "Quali note formano {chord}?",
  "In {key}, which chord is built on degree {n}?": "In {key}, quale accordo è costruito sul grado {n}?",
  "In {key}, which note is degree {n}?": "In {key}, quale nota è il grado {n}?",
  "No sharps or flats": "Senza diesis né bemolli",
  "{note} major": "{note} maggiore",
  "{note} minor": "{note} minore",
  "You're a teacher now — you can create classes and assign homework.": "Ora sei un insegnante — puoi creare classi e assegnare compiti.",
  "Not this time — {pass} or more were needed.": "Non questa volta — servivano {pass} o più risposte corrette.",
  "Notes on the neck": "Note sul manico",
  "Reading the staff": "Lettura del pentagramma",
  "Key signatures": "Armature di chiave",
  "Harmony in a key": "Armonia in una tonalità",
  "Admins already have Premium regardless of teacher status — skip the test and become a teacher directly.":
    "Gli amministratori hanno già Premium indipendentemente dallo stato di insegnante — possono saltare il test e diventare insegnanti direttamente.",
  "Skip the test (admin)": "Salta il test (amministratore)",
  "Show on my public profile": "Mostra sul mio profilo pubblico",
  "New class name": "Nome della nuova classe",
  "Create class": "Crea classe",
  "Join my class on Fretquency": "Entra nella mia classe su Fretquency",
  "Join my class \"{name}\" on Fretquency — code {code}": "Entra nella mia classe \"{name}\" su Fretquency: codice {code}",
  "Share invite link": "Condividi il link di invito",
  "Homework": "Compiti",
  "Assign homework": "Assegna compiti",
  "No homework yet.": "Ancora nessun compito.",
  "Students": "Studenti",
  "No students yet. Share the code or the invite link with them.": "Ancora nessuno studente. Condividi con loro il codice o il link di invito.",
  "Remove {name} from this class?": "Rimuovere {name} da questa classe?",
  "Remove": "Rimuovi",
  "Delete this class, its homework and all results?": "Eliminare questa classe, i suoi compiti e tutti i risultati?",
  "Delete class": "Elimina classe",
  "{n} of {total} practised": "{n} su {total} hanno esercitato",
  "Due {date}": "Entro il {date}",
  "Class weak spots": "Punti deboli della classe",
  "Fret {fret} on string {string}: {missed} of {total} attempts missed": "Tasto {fret} sulla corda {string}: sbagliato in {missed} tentativi su {total}",
  "Weak spots": "Punti deboli",
  "Hide weak spots": "Nascondi punti deboli",
  "best {correct}/{total} · {n} tries · {date}": "migliore {correct}/{total} · {n} tentativi · {date}",
  "best {correct}/{total} · {n} tries": "migliore {correct}/{total} · {n} tentativi",
  "Not yet": "Non ancora",
  "Not done yet": "Non ancora fatto",
  "Delete this homework and its results?": "Eliminare questo compito e i suoi risultati?",
  "Delete homework": "Elimina compito",
  "Edit homework": "Modifica compito",
  "A Notes drill: a fret is shown, the student names the note.": "Un esercizio sulle note: compare un tasto e lo studente dice la nota.",
  "A Notes drill: a note is shown, the student finds every matching fret.": "Un esercizio sulle note: compare una nota e lo studente trova tutti i tasti corrispondenti.",
  "Title": "Titolo",
  "e.g. Low E string, first 5 frets": "es. Corda Mi basso, primi 5 tasti",
  "From fret": "Dal tasto",
  "To fret": "Al tasto",
  "Natural notes only (no sharps or flats)": "Solo note naturali (senza diesis né bemolle)",
  "Questions": "Domande",
  "Due date (optional)": "Scadenza (facoltativa)",
  "Assign": "Assegna",
  "Save changes": "Salva modifiche",
  "Teacher: {name}": "Insegnante: {name}",
  "Update the app to open this homework.": "Aggiorna l’app per aprire questo compito.",
  "Leave this class? Your teacher will no longer see your results.": "Lasciare questa classe? Il tuo insegnante non vedrà più i tuoi risultati.",
  "Leave class": "Lascia la classe",
  "Sending your result to your teacher…": "Invio del risultato all’insegnante…",
  "Your teacher can see this result.": "Il tuo insegnante può vedere questo risultato.",
  "Could not send your result. Check your connection.": "Impossibile inviare il risultato. Controlla la connessione.",
  "Play again": "Ancora",
  "Done": "Fatto",
  "Strings {list}": "Corde {list}",
  "frets {from}–{to}": "tasti {from}–{to}",
  "naturals only": "solo naturali",
  "{n} questions": "{n} domande",

  // Class: teacher-chosen codes, blocking, idle-class notices (migration 0028).
  "The teacher of this class removed you from it, so you cannot join it again.": "L’insegnante di questa classe ti ha rimosso, quindi non puoi unirti di nuovo.",
  "Too many wrong codes. Wait a few minutes and try again.": "Troppi codici sbagliati. Aspetta qualche minuto e riprova.",
  "Capital and small letters count. Type the code exactly as your teacher wrote it.": "Maiuscole e minuscole contano. Scrivi il codice esattamente come l’ha scritto il tuo insegnante.",
  "The code needs 6 to 10 characters.": "Il codice deve avere da 6 a 10 caratteri.",
  "Use only English letters and digits.": "Usa solo lettere dell’alfabeto inglese e cifre.",
  "Add at least one letter.": "Aggiungi almeno una lettera.",
  "Add at least one digit.": "Aggiungi almeno una cifra.",
  "A class with this name already exists. Pick another name.": "Esiste già una classe con questo nome. Scegline un altro.",
  "This code is already taken. Pick another code.": "Questo codice è già usato. Scegline un altro.",
  "This code is not valid. Use 6 to 10 English letters and digits, with at least one of each.": "Questo codice non è valido. Usa da 6 a 10 lettere dell’alfabeto inglese e cifre, con almeno una di ciascun tipo.",
  "Suggest": "Suggerisci",
  "6 to 10 English letters and digits, at least one of each. Capital and small letters count.": "Da 6 a 10 lettere dell’alfabeto inglese e cifre, almeno una di ciascun tipo. Maiuscole e minuscole contano.",
  "Closing soon": "Chiude presto",
  "Quiet": "Inattiva",
  "Assign homework, or have a student practise or join, to keep it open.": "Per tenerla aperta, assegna un compito, oppure fai esercitare o entrare uno studente.",
  "Nothing has happened in this class for {n} days.": "In questa classe non succede niente da {n} giorni.",
  "A class with no activity for 6 months is deleted.": "Una classe senza attività per 6 mesi viene eliminata.",
  "This class will be deleted on {date}, with its homework and results, because nothing has happened in it for 5 months.": "Questa classe sarà eliminata il {date}, con i compiti e i risultati, perché non c’è attività da 5 mesi.",
  "Students already in the class stay in it. The old code and old invite links stop working.": "Gli studenti già nella classe ci restano. Il vecchio codice e i vecchi link di invito smettono di funzionare.",
  "Save code": "Salva codice",
  "Change code": "Cambia codice",
  "New code saved.": "Nuovo codice salvato.",
  "Remove {name} and block them? They will not be able to join this class again, even with a new code.": "Rimuovere {name} e bloccarlo? Non potrà più unirsi a questa classe, neanche con un nuovo codice.",
  "Remove and block": "Rimuovi e blocca",
  "Blocked": "Bloccati",
  "These students cannot join this class again, even with a new code.": "Questi studenti non possono più unirsi a questa classe, neanche con un nuovo codice.",
  "blocked {date}": "bloccato il {date}",
  "Unblock": "Sblocca",
};
