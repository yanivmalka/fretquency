// French (fr) dictionary, keyed by the English source string like `he` in
// translations.ts. Addresses the player as "tu", the usual register for a
// music-practice app. Landing in stages, mirroring Spanish stage 1: the app
// shell, settings, the drawer, the in-game screen, the Selector, Onboarding,
// Stats, the Leaderboard and the plan card. Everything not listed here falls
// back to English until a later stage adds it (see product-wishlist.md).
// French typography: a thin no-break space (U+202F) before ? ! : ; and %.

export const fr: Record<string, string> = {
  // Instrument / title
  'Guitar': 'Guitare',
  'Bass': 'Basse',
  'Fret Practice': 'Entraînement des cases',

  // Instrument picker — roadmap instruments (admin-only "coming soon" tiles)
  'Coming soon': 'Bientôt',
  'Ukulele': 'Ukulélé',
  'Mandolin': 'Mandoline',
  'Banjo': 'Banjo',

  // Settings — section titles / labels / help
  'Instrument': 'Instrument',
  'Playing': 'Jeu',
  'Instruments': 'Instruments',
  'Strings': 'Cordes',
  'Frets': 'Cases',
  'Type': 'Type',
  'Acoustic': 'Acoustique',
  'Electric': 'Électrique',
  'Soprano': 'Soprano',
  'Concert': 'Concert',
  'Tenor': 'Ténor',
  'Baritone': 'Baryton',
  '5-String Standard': '5 cordes · standard',
  '5-String Parlor': '5 cordes · parlor',
  '5-String Long Neck': '5 cordes · manche long',
  '4-String Tenor (Irish, short scale)': '4 cordes · ténor (irlandais, diapason court)',
  '4-String Tenor': '4 cordes · ténor',
  '4-String Plectrum': '4 cordes · plectre',
  '6-String (Guitar-Banjo)': '6 cordes · guitare-banjo',
  'Notes': 'Notes',
  'Switches tuning, string count and fret range, then reloads the note samples.':
    'Change l’accordage, le nombre de cordes et l’étendue des cases, puis recharge les sons des notes.',
  'Note names': 'Noms des notes',
  'Written as': 'Écrites en',
  "Display only — the drill itself doesn't change.":
    'Affichage uniquement — l’exercice ne change pas.',
  'Solfège (Do Re Mi)': 'Solfège (Do Ré Mi)',
  'Letters (A, B, C…) or solfège syllables (Do, Re, Mi…).':
    'Lettres (A, B, C…) ou syllabes de solfège (Do, Ré, Mi…).',
  'A sharp (♯) is a half-step higher; a flat (♭) is a half-step lower. The same pitch can be written either way — C♯ and D♭ are one note. Pick which sign you see.':
    'Un dièse (♯) monte d’un demi-ton ; un bémol (♭) descend d’un demi-ton. La même hauteur peut s’écrire des deux façons — C♯ et D♭ sont une seule note. Choisis le signe que tu veux voir.',
  'A dièse (♯) is a half-step higher; a bémol (♭) is a half-step lower. The same pitch can be written either way — Do♯ and Re♭ are one note. Pick which sign you see.':
    'Un dièse (♯) monte d’un demi-ton ; un bémol (♭) descend d’un demi-ton. La même hauteur peut s’écrire des deux façons — Do♯ et Ré♭ sont une seule note. Choisis le signe que tu veux voir.',
  'Sharps or flats': 'Dièses ou bémols',
  'Sharp (♯)': 'Dièse (♯)',
  'Flat (♭)': 'Bémol (♭)',
  'Dièse (♯)': 'Dièse (♯)',
  'Bémol (♭)': 'Bémol (♭)',
  'Score': 'Score',
  'Score & celebrations': 'Score et célébrations',
  'Live score, streak multiplier and celebrations are shown.':
    'Le score en direct, le multiplicateur de série et les célébrations sont affichés.',
  'Every answer is still recorded to your stats and personal bests either way.':
    'Dans tous les cas, chaque réponse reste enregistrée dans tes statistiques et tes records personnels.',
  'On': 'Activé',
  'Off': 'Désactivé',
  'Silent mode': 'Mode silencieux',
  'Sound & vibration': 'Son et vibration',
  'Sound': 'Son',
  'Vibrate': 'Vibreur',
  'Silent': 'Silencieux',
  'How the drill answers back, on one ladder from quietest to loudest. Silent: no sound and no per-button buzz, just a buzz on right / wrong answers plus the on-screen celebrations. Vibrate: no sound — a buzz on every button press and on right / wrong answers instead. Sound 1–5: note playback, chimes and tap sounds, louder each step; the limiter keeps even the loudest from distorting. Silent and Vibrate are great for practising with headphones off or a guitar in hand.':
    'Comment l’exercice te répond, sur une échelle du plus discret au plus fort. Silencieux : aucun son ni vibration sur les boutons, seulement une vibration sur les bonnes / mauvaises réponses et les célébrations à l’écran. Vibreur : aucun son — une vibration à chaque bouton et sur les bonnes / mauvaises réponses. Son 1–5 : la note jouée, les signaux et les sons de touche, plus forts à chaque niveau ; le limiteur évite toute distorsion, même au plus fort. Silencieux et Vibreur sont parfaits pour t’entraîner sans casque ou la guitare en main.',
  'Theme': 'Thème',
  'Dark': 'Sombre',
  'Night': 'Nuit',
  'Day': 'Jour',
  'Night is a warmer, dimmer palette for a dark room. Day is a light palette.':
    'Nuit est une palette plus chaude et plus douce pour une pièce sombre. Jour est une palette claire.',
  'Appearance': 'Apparence',
  'Theme sets how light or dark the app is: Night is a warmer, dimmer palette for a dark room, Day is a light one. Season sets the colours layered over it — Winter is the original look. Auto follows your clock (Day from 07:00 to 19:00, Night after) and the real season where you are; picking a season by hand holds until that season ends.':
    'Le thème règle la luminosité de l’app : Nuit est une palette plus chaude et plus douce pour une pièce sombre, Jour est une palette claire. La saison règle les couleurs appliquées par-dessus — Hiver est l’apparence d’origine. Auto suit ton horloge (Jour de 07:00 à 19:00, Nuit ensuite) et la vraie saison là où tu es ; une saison choisie à la main reste active jusqu’à la fin de cette saison.',
  'Season': 'Saison',
  'Winter': 'Hiver',
  'Spring': 'Printemps',
  'Summer': 'Été',
  'Autumn': 'Automne',
  'A seasonal colour palette layered over the theme. Winter is the original look.':
    'Une palette de couleurs de saison appliquée sur le thème. Hiver est l’apparence d’origine.',
  'Mastery on the fretboard': 'Maîtrise sur le manche',
  'The per-note / per-fret accuracy bars drawn over the circle and grid while stopped or paused.':
    'Les barres de précision par note / par case affichées sur le cercle et la grille à l’arrêt ou en pause.',
  'Mastery keeps being tracked and shows on the Stats screen either way.':
    'La maîtrise reste suivie et s’affiche dans les statistiques dans tous les cas.',
  'Questions counted': 'Questions prises en compte',
  'How many of your most recent questions the mastery bars are computed from. Free accounts use the last 250.':
    'Le nombre de tes questions les plus récentes utilisées pour calculer les barres de maîtrise. Les comptes gratuits utilisent les 250 dernières.',
  'Choose how many recent questions the mastery bars are counted from':
    'Choisis combien de questions récentes servent à calculer les barres de maîtrise',
  'Mastery time window': 'Période de maîtrise',
  'Point the mastery bars at a recent-question count, a single day, or a date range':
    'Calcule les barres de maîtrise sur un nombre de questions récentes, un seul jour ou une plage de dates',
  'What slice of your history the mastery bars are computed from. Free accounts use the last 250 questions. Older history saved without a date is not counted for a specific day or range.':
    'La partie de ton historique utilisée pour calculer les barres de maîtrise. Les comptes gratuits utilisent les 250 dernières questions. L’ancien historique enregistré sans date n’est pas compté pour un jour ou une plage précise.',
  'Recent': 'Récentes',
  'A day': 'Un jour',
  'A range': 'Une plage',
  'From': 'Du',
  'To': 'Au',
  'showing': 'affichage',
  'showing last': 'affichage des',
  'showing all questions': 'affichage de toutes les questions',
  'All': 'Tout',
  'Stats & progress': 'Statistiques et progrès',
  'Answer mode': 'Mode de réponse',
  'How you answer': 'Comment tu réponds',
  'Voice mode asks for microphone permission the first time.':
    'Le mode voix demande l’accès au micro la première fois.',
  'Speak clearly and pause briefly between words — for sharp/flat notes, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Parle clairement et marque une courte pause entre les mots — pour les notes avec dièse/bémol, dis la lettre, fais une pause, puis « sharp » / « flat » en deux mots séparés.',
  'Tap': 'Toucher',
  'Voice': 'Voix',
  'Play the target note on your guitar instead of tapping — the app listens through the microphone. Only works for “by fret” questions — a played note can’t say which string it came from, so “by note” questions stay on tap.':
    'Joue la note demandée sur ta guitare au lieu de toucher l’écran — l’app écoute par le micro. Fonctionne uniquement pour les questions « par case » — une note jouée ne dit pas de quelle corde elle vient, donc les questions « par note » restent au toucher.',
  '🎸 Microphone blocked — enable it or switch to tap': '🎸 Micro bloqué — active-le ou passe au toucher',
  '🎸 Pitch detection isn’t available on this device — use tap': '🎸 La détection de hauteur n’est pas disponible sur cet appareil — utilise le toucher',
  '🎸 Didn’t catch that': '🎸 Pas compris',
  '🎸 Play the note on your guitar': '🎸 Joue la note sur ta guitare',
  'Voice engine': 'Moteur vocal',
  'Auto picks the best available. Personal uses your calibrated profile; General uses the built-in model.':
    'Auto choisit le meilleur disponible. Personnel utilise ton profil calibré ; Général utilise le modèle intégré.',
  'Auto': 'Auto',
  'Personal': 'Personnel',
  'General': 'Général',
  'Your voice profile': 'Ton profil vocal',
  'Calibrating your own voice improves recognition when answering by voice.':
    'Calibrer ta propre voix améliore la reconnaissance quand tu réponds à la voix.',
  'recordings': 'enregistrements',
  'enabled': 'activé',
  'Add / review recordings': 'Ajouter / revoir les enregistrements',
  'Calibrate my voice': 'Calibrer ma voix',
  'Feedback board': 'Boîte à idées',
  'Leaderboard': 'Classement',
  'Account': 'Compte',
  'Signed in': 'Connecté',
  'Keeps your preferences and data in sync across devices.':
    'Synchronise tes préférences et tes données entre tes appareils.',
  'Sign out': 'Se déconnecter',
  'Sign in with Google to keep your preferences and data across devices.':
    'Connecte-toi avec Google pour retrouver tes préférences et tes données sur tous tes appareils.',
  'Sign in with Google': 'Se connecter avec Google',

  // Account → About tile + live community counts
  'About': 'À propos',
  'Guitar Fret Practice is a small labor of love — built to turn learning the fretboard into a game instead of a chore. Made by an independent developer, with patient help from family and friends.':
    'Guitar Fret Practice est un petit projet fait avec passion — pensé pour transformer l’apprentissage du manche en jeu plutôt qu’en corvée. Créé par un développeur indépendant, avec l’aide patiente de sa famille et de ses amis.',
  'Registered users': 'Utilisateurs inscrits',
  'Active now': 'Actifs maintenant',
  'Guests online': 'Invités en ligne',
  'App update': 'Mise à jour de l’app',
  'A new version of the app is ready to install.': 'Une nouvelle version de l’app est prête à être installée.',
  'Update to version': 'Mettre à jour vers la version',
  'Downloading…': 'Téléchargement…',
  'Allow installs from this app in Android settings, then try again.': 'Autorisez les installations depuis cette app dans les réglages Android, puis réessayez.',
  'The update could not be installed. Check your connection and try again.': 'Impossible d’installer la mise à jour. Vérifiez votre connexion et réessayez.',
  'See the full list and what earns each one': 'Voir la liste complète et comment obtenir chacun',
  'Badges': 'Badges',
  'Language': 'Langue',
  'Downloading the language…': 'Téléchargement de la langue…',
  'Could not download the language. Check your connection and try again.': 'Impossible de télécharger la langue. Vérifie ta connexion et réessaie.',
  'Left-handed': 'Gaucher',
  'Seasonal background': 'Fond de saison',
  'Snowflakes, anemones, sunflowers or falling leaves behind the app, following the season': 'Flocons de neige, anémones, tournesols ou feuilles qui tombent derrière l’appli, au fil des saisons',
  'Light seasonal decorations behind the app: snowflakes in winter, anemones in spring, sunflowers in summer, falling leaves in autumn. They follow the season above. Off keeps the background plain.':
    'Décorations légères de saison derrière l’appli : flocons de neige en hiver, anémones au printemps, tournesols en été et feuilles qui tombent en automne. Elles suivent la saison choisie plus haut. Désactivé laisse le fond uni.',
  'Button depth': 'Relief des boutons',
  'Gives the buttons a raised, 3D look: a light rim on top, a solid edge underneath, and they sink a little when pressed. Off keeps them flat.':
    'Donne aux boutons un aspect en relief, en 3D : un liseré clair en haut, un bord plein en dessous, et ils s’enfoncent un peu quand on appuie. Désactivé les garde plats.',
  'Mirrors the app for a left-handed player: the fretboard flips (nut on the right), and the menu, Quick Access and back buttons move to the left. Independent of language — it stays mirrored in Hebrew too.':
    'Inverse l’app pour les gauchers : le manche se retourne (sillet à droite) et le menu, l’Accès rapide et les boutons retour passent à gauche. Indépendant de la langue — l’inversion reste aussi en hébreu.',
  'Colour-blind heatmap markers': 'Repères de la carte de chaleur pour daltoniens',
  'Adds a ✓ / • mark on the Stats-screen fretboard heatmap cells, on top of colour, so known vs. needs-work reads without relying on hue.':
    'Ajoute une marque ✓ / • sur les cases de la carte de chaleur du manche dans les statistiques, en plus de la couleur, pour distinguer l’acquis de ce qui est à travailler sans dépendre de la teinte.',

  // Hamburger drawer / dialogs
  'Settings': 'Réglages',
  'Close settings': 'Fermer les réglages',
  'Open settings': 'Ouvrir les réglages',
  'Game settings': 'Réglages du jeu',
  'Back': 'Retour',
  'Microphone access': 'Accès au micro',
  'Answer out loud': 'Réponds à voix haute',
  'Voice mode listens for the note or fret you say instead of a tap.':
    'Le mode voix écoute la note ou la case que tu prononces, au lieu d’un toucher.',
  'Your browser will ask to use the microphone next — audio stays on your device and is never recorded or uploaded.':
    'Ton navigateur va ensuite demander l’accès au micro — le son reste sur ton appareil et n’est jamais enregistré ni envoyé.',
  'Allow microphone': 'Autoriser le micro',
  'Not now': 'Pas maintenant',
  'Microphone is blocked': 'Le micro est bloqué',
  "Your browser is refusing microphone access for this site, so voice answers can't work yet. Tap the 🔒 / 🎤 icon beside the address bar, set the microphone to":
    'Ton navigateur refuse l’accès au micro pour ce site, donc les réponses vocales ne fonctionnent pas encore. Touche l’icône 🔒 / 🎤 à côté de la barre d’adresse et règle le micro sur',
  ', then reload the page.': ', puis recharge la page.',
  'Allow': 'Autoriser',
  'Got it': 'Compris',
  'Use tap instead': 'Utiliser le toucher',
  'Sign in': 'Se connecter',
  'Save your progress': 'Sauvegarde ta progression',
  'Sign in to keep your history, badges and personal bests across devices. You can keep playing as a guest — everything still works, it just stays on this device.':
    'Connecte-toi pour garder ton historique, tes badges et tes records personnels sur tous tes appareils. Tu peux continuer en invité — tout fonctionne pareil, mais reste sur cet appareil.',
  'Maybe later': 'Plus tard',
  'Press back again to exit': 'Appuie encore sur retour pour quitter',

  // In-game
  'STAGE COMPLETE': 'NIVEAU TERMINÉ',
  'Retry': 'Réessayer',
  '🎤 Microphone blocked — enable it or switch to tap': '🎤 Micro bloqué — active-le ou passe au toucher',
  '🎤 Voice needs a connection': '🎤 La voix nécessite une connexion',
  '🎤 Voice isn’t working in this browser — try Chrome, or use tap':
    '🎤 La voix ne fonctionne pas dans ce navigateur — essaie Chrome ou utilise le toucher',
  '🎤 Didn’t catch that': '🎤 Pas compris',
  'Round Complete!': 'Manche terminée !',
  'Session Stopped': 'Session arrêtée',
  "You're ready for the next stage:": "Vous êtes prêt pour l'étape suivante :",
  "You've mastered this — ready to learn something new?": 'Vous maîtrisez ça — prêt à apprendre autre chose ?',
  'Move on': 'Continuer',
  'Explore Learn': 'Aller à Apprendre',
  'pts': 'pts',
  'OK': 'OK',
  'Start': 'Commencer',
  'Resume': 'Reprendre',
  'Pause': 'Pause',
  'Stop': 'Arrêter',
  'Refresh': 'Actualiser',
  'Privacy policy': 'Politique de confidentialité',

  'QUESTIONS': 'QUESTIONS',
  'streak': 'série',
  'New badge': 'Nouveau badge',
  'Badge upgraded': 'Badge amélioré',
  'Continue': 'Continuer',
  'Listening…': 'À l’écoute…',
  'Member since': 'Membre depuis',
  'badges earned': 'badges obtenus',

  // Pinned badge shelf (Account section)
  'Choose badges to feature': 'Choisis les badges à mettre en avant',
  'Edit featured badges': 'Modifier les badges en vedette',
  'Your badges': 'Tes badges',
  'Feature up to 5 badges': 'Mets en avant jusqu’à 5 badges',
  'Remove a badge to feature another.': 'Retire un badge pour en mettre un autre en avant.',
  'See all badges': 'Voir tous les badges',

  // LeaderboardPanel — standings sub-page
  'player': 'joueur',
  'players': 'joueurs',
  'ranked by XP': 'classés par XP',
  'free for everyone': 'gratuit pour tous',
  'All-time': 'Depuis le début',
  'This week': 'Cette semaine',
  'Loading…': 'Chargement…',
  'Couldn’t load the leaderboard. Check your connection and try again.':
    'Impossible de charger le classement. Vérifie ta connexion et réessaie.',
  'Couldn’t update that. Check your connection and try again.':
    'Impossible de mettre à jour. Vérifie ta connexion et réessaie.',
  'Your standing': 'Ta position',
  'RANK': 'RANG',
  'acc': 'préc.',
  '(you)': '(toi)',
  'Hidden from the leaderboard': 'Masqué du classement',
  'Visible on the leaderboard': 'Visible dans le classement',
  'Join the board': 'Rejoins le classement',
  'You can see every player’s standing right now. Sign in with Google to take your own place — every correct answer you’ve ever played counts. Free, no subscription.':
    'Tu peux déjà voir la position de chaque joueur. Connecte-toi avec Google pour prendre ta place — chaque bonne réponse que tu as donnée compte. Gratuit, sans abonnement.',
  'No one’s on the board yet': 'Personne n’est encore au classement',
  'Finish a practice run while signed in and your name lands here first.':
    'Termine une session d’entraînement en étant connecté et ton nom apparaîtra ici en premier.',
  'How is XP counted?': 'Comment l’XP est-elle comptée ?',

  // SelectorPanel — mode/difficulty/fret-range picker
  'all': 'toutes les',
  'strings': 'cordes',
  'frets': 'cases',
  'only the dot-marker frets': 'uniquement les cases à repère',
  'natural notes only (no sharps or flats)': 'notes naturelles uniquement (sans dièses ni bémols)',
  'every note, sharps and flats included': 'toutes les notes, dièses et bémols compris',
  'alphabetical order': 'ordre alphabétique',
  'circle-of-fifths order': 'ordre du cycle des quintes',
  'A fret lights up and you pick its note from the wheel':
    'Une case s’allume et tu choisis sa note sur la roue',
  ', rotated to the string': ', tournée selon la corde',
  'A note name is shown and you tap every fret on the neck where it lands.':
    'Un nom de note s’affiche et tu touches chaque case du manche où elle se trouve.',
  'Note-by-Fret': 'Note par case',
  'Fret-by-Note': 'Case par note',
  'Auto-advances through the difficulty stages.': 'Passe automatiquement d’un niveau de difficulté à l’autre.',
  'How this works': 'Comment ça marche',
  'neck': 'manche',
  'neck fret range selector': 'sélecteur de l’étendue des cases du manche',
  'Precise fret range': 'Étendue de cases précise',
  'Pick an exact fret N–M window to drill': 'Choisis une étendue exacte de cases N–M à travailler',
  'Fret range': 'Étendue des cases',
  'Full only while a precise fret window is on': 'Complet uniquement tant qu’une étendue de cases précise est active',
  'Drill only part of the neck. Drag the handles to set the exact fret window — the shaded area is muted out, both here and on the home-screen neck.':
    'Travaille seulement une partie du manche. Fais glisser les poignées pour fixer l’étendue exacte des cases — la zone grisée est exclue, ici comme sur le manche de l’écran d’accueil.',
  'Lowest fret': 'Case la plus basse',
  'Highest fret': 'Case la plus haute',
  'Multi': 'Multi',
  'Note by Fret': 'Note par case',
  'Alpha': 'Alphabétique',
  'Fifths': 'Quintes',
  'By String': 'Par corde',
  'Fret by Note': 'Case par note',
  "Read the note wheel like a clock: your open string sits at 12 o'clock, and the dots under each note show its fret. Answer before the timing bar empties.":
    'Lis la roue des notes comme une horloge : ta corde à vide est à midi, et les points sous chaque note indiquent sa case. Réponds avant que la barre de temps se vide.',
  'Answer before the timing bar empties.': 'Réponds avant que la barre de temps se vide.',
  'Dots': 'Repères',
  'Naturals': 'Naturelles',
  'Full': 'Complet',
  'Auto Advance to next difficulty': 'Passage automatique à la difficulté suivante',

  // Onboarding
  'Guitar Fret Practice': 'Guitar Fret Practice',
  'Master the fretboard with the clock method — one string at a time.':
    'Maîtrise le manche avec la méthode de l’horloge — une corde à la fois.',
  'What do you play?': 'De quoi joues-tu ?',
  'Skip setup →': 'Passer la configuration →',
  'How well do you know the fretboard?': 'Connais-tu bien le manche ?',
  "I'm just starting": 'Je débute',
  'Start with dot frets on String 6': 'Commence par les cases à repère sur la corde 6',
  'I play but want to improve': 'Je joue mais je veux progresser',
  'Quick 3-question test': 'Test rapide en 3 questions',
  'I know the full neck': 'Je connais tout le manche',
  'Jump right in': 'Commencer directement',
  'Skip →': 'Passer →',
  'String': 'Corde',
  'what note is fret': 'quelle note est la case',
  'Skip test →': 'Passer le test →',
  'Keep going!': 'Continue !',
  'Good start!': 'Bon début !',
  'Nice work!': 'Bien joué !',
  'Impressive!': 'Impressionnant !',
  'Dot Frets': 'Cases à repère',
  'Natural notes': 'Notes naturelles',
  'the full chromatic neck': 'tout le manche chromatique',
  "correct — we've set you up on": 'justes — on t’a configuré sur',
  'Change it anytime in the selector panel.': 'Tu peux le changer à tout moment dans le panneau de sélection.',
  "Let's go →": 'C’est parti →',

  // ProgressPanel — stats & progress screen
  'by note': 'par note',
  'by fret': 'par case',
  'fret': 'case',
  'not played': 'pas jouée',
  'known': 'acquise',
  'needs work': 'à travailler',
  'unplayed': 'pas jouée',
  'Not enough data yet.': 'Pas encore assez de données.',
  'Not practiced yet': 'Pas encore travaillé',
  'Older sessions have no date stamp, so the timeline is empty. New sessions fill it in.':
    'Les anciennes sessions n’ont pas de date, donc la chronologie est vide. Les nouvelles sessions la rempliront.',
  'Play a few rounds and your all-time progress shows up here.':
    'Joue quelques manches et ta progression globale apparaîtra ici.',
  'accuracy': 'précision',
  'day streak': 'jours d’affilée',
  'answered': 'répondues',
  'Weakest notes': 'Notes les plus faibles',
  'Nothing below 70% — nice.': 'Rien sous 70 % — bravo.',
  'By note': 'Par note',
  'By string': 'Par corde',
  'By fret': 'Par case',
  'Fretboard heatmap': 'Carte de chaleur du manche',
  'Daily timeline': 'Chronologie quotidienne',
  'Accuracy %': 'Précision (%)',
  'Avg response time': 'Temps de réponse moyen',
  'Personal bests': 'Records personnels',
  'No personal bests recorded yet.': 'Aucun record personnel pour l’instant.',
  'No practice in the last 7 days.': 'Aucun entraînement ces 7 derniers jours.',
  'All time': 'Depuis le début',
  'Last 7 days': '7 derniers jours',
  'across every': 'sur toutes les',
  'settings combination': 'combinaisons de réglages',
  'Clear all history': 'Effacer tout l’historique',
  'Clear all stats?': 'Effacer toutes les statistiques ?',
  'This permanently erases your entire practice history and resets the all-time mastery for every note, string and settings combination. Your personal bests are kept.':
    'Cela efface définitivement tout ton historique d’entraînement et remet à zéro la maîtrise globale de chaque note, corde et combinaison de réglages. Tes records personnels sont conservés.',
  "This can't be undone.": 'Action irréversible.',
  'Delete anyway': 'Effacer quand même',
  'Cancel': 'Annuler',

  // Instrument string labels (guitar + bass, "String N · note")
  'String 1 · high E': 'Corde 1 · Mi aigu',
  'String 2 · B': 'Corde 2 · Si',
  'String 3 · G': 'Corde 3 · Sol',
  'String 4 · D': 'Corde 4 · Ré',
  'String 5 · A': 'Corde 5 · La',
  'String 6 · low E': 'Corde 6 · Mi grave',
  'String 1 · G': 'Corde 1 · Sol',
  'String 2 · D': 'Corde 2 · Ré',
  'String 3 · A': 'Corde 3 · La',
  'String 4 · low E': 'Corde 4 · Mi grave',

  // Free / Pro / Premium tiering — ProGate lock states + the Upgrade card
  'Premium': 'Premium',
  // Free-tier ad strip
  'Advertisement': 'Publicité',
  'Ad': 'Pub',
  'Close ad': 'Fermer la publicité',
  'Your ad could be here. Go Pro to remove ads.': 'Ta publicité pourrait être ici. Passe à Pro pour supprimer les publicités.',
  'Unlock with Pro': 'Débloquer avec Pro',
  'Unlock with Premium': 'Débloquer avec Premium',
  'You have Pro': 'Tu as Pro',
  "You're on Free": 'Tu es en formule gratuite',
  'Your plan': 'Ta formule',
  'Included with Pro': 'Inclus avec Pro',
  'Everything in Free, plus:': 'Tout ce qu’offre la formule gratuite, plus :',
  'Everything you need to practice daily, at no cost.':
    'Tout ce qu’il faut pour t’entraîner chaque jour, gratuitement.',
  'The full fretboard drill — by note and by fret, on every string':
    'L’exercice complet du manche — par note et par case, sur toutes les cordes',
  'Badges and achievements, with your pinned medal shelf':
    'Badges et succès, avec ta vitrine de médailles',
  'The leaderboard — XP, questions answered and accuracy':
    'Le classement — XP, questions répondues et précision',
  'Cloud sync and full restore of your practice on every device':
    'Synchronisation dans le cloud et restauration complète de ton entraînement sur tous tes appareils',
  'Your last 7 days of stats, plus the personal best for what you’re drilling':
    'Tes statistiques des 7 derniers jours, plus le record personnel de ce que tu travailles',
  'Free, forever': 'Gratuit, pour toujours',
  'Pro is for training seriously and tracking progress over time.':
    'Pro, c’est pour s’entraîner sérieusement et suivre ses progrès dans le temps.',
  'Your full practice history — all-time stats and trends, not just the last 7 days':
    'Tout ton historique d’entraînement — statistiques et tendances depuis le début, pas seulement les 7 derniers jours',
  'Mastery maps — per-note and per-fret accuracy overlays on the circle and grid':
    'Cartes de maîtrise — précision par note et par case sur le cercle et la grille',
  'Browse your personal bests across every settings combination':
    'Consulte tes records personnels pour chaque combinaison de réglages',
  'A personal voice profile built from your own calibration recordings':
    'Un profil vocal personnel créé à partir de tes propres enregistrements de calibration',
  'Your Pro access is complimentary.': 'Ton accès Pro est offert.',
  'Your Pro access came from a promotion.': 'Ton accès Pro provient d’une promotion.',
  'Your Pro access was granted manually.': 'Ton accès Pro a été accordé manuellement.',
  'Your Pro access is from your subscription.': 'Ton accès Pro provient de ton abonnement.',
  'Your Pro access is active.': 'Ton accès Pro est actif.',
  'It does not expire.': 'Il n’expire pas.',
  'Access runs until': 'Accès valable jusqu’au',
  'Pro isn’t on sale yet — everything above stays free to try in the meantime.':
    'Pro n’est pas encore en vente — en attendant, tout ce qui précède reste gratuit à essayer.',
  'Free': 'Gratuit',

  // Adaptive difficulty suggestion banner (wishlist §3)
  'You’re cruising through this — ready for a harder level?':
    'Tu files à toute allure — prêt pour un niveau plus difficile ?',
  'This setup is fighting back. Want to ease off a level?':
    'Cette configuration te résiste. Tu veux descendre d’un niveau ?',
  'Switch the difficulty to': 'Passer la difficulté à',
  'Drop the difficulty to': 'Baisser la difficulté à',
  'Apply': 'Appliquer',
  'Dismiss': 'Ignorer',

  // Learning-type navigation — the drawer's "Learn" group and its full pages
  'Learn': 'Apprendre',
  'Choose what to practise.': 'Choisis ce que tu veux travailler.',
  'Current': 'Actuel',
  'Daily practice': 'Entraînement quotidien',
  'Intervals': 'Intervalles',
  'Scales': 'Gammes',
  'Chords': 'Accords',
  'Staff reading': 'Lecture de partition',
  'Game': 'Jeu',
  'Your daily plan is loading…': 'Chargement de ton programme du jour…',
  'Let the Teacher plan your practice': 'Laisse le Professeur planifier ton entraînement',
  'Practise hearing and finding intervals': 'Entraîne-toi à entendre et à trouver les intervalles',

  // Fret range conflict dialog
  'Fret range too small': 'Étendue de cases trop petite',
  'The current fret range': 'L’étendue de cases actuelle',
  ' allows fewer than ': ' permet moins de ',
  ' unique notes': ' notes différentes',
  ' with the selected strings. Please expand the range.': ' avec les cordes choisies. Élargis l’étendue.',
  'Expand to minimum': 'Élargir au minimum',
  'I will expand': 'Je vais l’élargir',
  'Custom range': 'Étendue personnalisée',
  'Keep as is': 'Laisser tel quel',
  'Set fret range': 'Définir l’étendue des cases',

  // ── Stage 2a: badges, guest merge, voice calibration, feedback board,
  // quick access and the tuner ──────────────────────────────────────────
  // Badges / Achievements wall — tiers
  'Bronze': 'Bronze',
  'Silver': 'Argent',
  'Gold': 'Or',
  'Platinum': 'Platine',
  'Diamond': 'Diamant',
  'Master': 'Maître',
  'Legendary I': 'Légendaire I',
  'Legendary II': 'Légendaire II',
  'Legendary III': 'Légendaire III',
  'Legendary IV': 'Légendaire IV',
  // Wall chrome
  'unlocked': 'débloqués',
  'Max': 'Max',
  'Earned': 'Obtenu',
  // Player profile card (leaderboard)
  'Achievements': 'Succès',
  'No badges earned yet.': 'Aucun badge obtenu pour l’instant.',
  // Admin test controls
  'Grant': 'Accorder',
  'Reset': 'Réinitialiser',
  'Admin tools: Grant or Reset each badge to test it. History-based badges re-appear on reopen unless you also clear history.':
    'Outils d’administration : accorde ou réinitialise chaque badge pour le tester. Les badges basés sur l’historique réapparaissent à la réouverture, sauf si tu effaces aussi l’historique.',
  // Family names
  'Perfect Session': 'Session parfaite',
  'Speed Demon': 'Démon de la vitesse',
  'Flawless Sprint': 'Sprint impeccable',
  'On Fire': 'En feu',
  'Comeback': 'Retour en force',
  'Every String': 'Toutes les cordes',
  'String Master': 'Maître de la corde',
  'String Master · {s}': 'Maître · {s}',
  'Full String Master': 'Maître de toutes les cordes',
  'Neck Runner': 'Coureur du manche',
  'Both Ends': 'Les deux bouts',
  'Low End': 'Registre grave',
  'Week Warrior': 'Guerrier de la semaine',
  'Dedicated': 'Assidu',
  'Total Reps': 'Répétitions totales',
  'Sharpshooter': 'Tireur d’élite',
  'Quick Read': 'Lecture rapide',
  'Most Improved': 'Meilleure progression',
  'Doubling Up': 'Coup double',
  'Multi-Instrumentalist': 'Multi-instrumentiste',
  'Admin': 'Administrateur',
  // Earning conditions — Perfect Session
  'Answer 10+ questions in a round with no mistakes at all.':
    'Réponds à 10+ questions dans une manche sans aucune erreur.',
  '25+ questions in a round, still zero mistakes.': '25+ questions dans une manche, toujours zéro erreur.',
  '50+ questions in a round, still zero mistakes — a full clean run.':
    '50+ questions dans une manche, toujours zéro erreur — un sans-faute complet.',
  // Speed Demon
  'Get 10+ correct answers in a round, at least 8 of them under 1.5s.':
    'Donne 10+ bonnes réponses dans une manche, dont au moins 8 en moins de 1,5 s.',
  '20+ correct answers, at least 16 of them under 1.5s.':
    '20+ bonnes réponses, dont au moins 16 en moins de 1,5 s.',
  '40+ correct answers, at least 32 of them under 1.2s.':
    '40+ bonnes réponses, dont au moins 32 en moins de 1,2 s.',
  // Flawless Sprint
  'Finish a whole round at 90% accuracy or better.':
    'Termine une manche entière avec 90 % de précision ou plus.',
  'Finish a whole round at 95% accuracy or better.':
    'Termine une manche entière avec 95 % de précision ou plus.',
  'Finish a whole round at 100% accuracy.': 'Termine une manche entière avec 100 % de précision.',
  // On Fire
  'Reach a streak of 15 in a single round.': 'Atteins une série de 15 dans une seule manche.',
  'Reach a streak of 20 in a single round.': 'Atteins une série de 20 dans une seule manche.',
  'Reach a streak of 30 in a single round.': 'Atteins une série de 30 dans une seule manche.',
  // Comeback
  'Miss 3+ of your first 20 questions, then answer the next 8 in a row correctly.':
    'Rate 3+ de tes 20 premières questions, puis réponds juste aux 8 suivantes d’affilée.',
  'Miss 5+ of your first 20 questions, then answer the next 12 in a row correctly.':
    'Rate 5+ de tes 20 premières questions, puis réponds juste aux 12 suivantes d’affilée.',
  'Miss 8+ of your first 20 questions, then answer the next 18 in a row correctly.':
    'Rate 8+ de tes 20 premières questions, puis réponds juste aux 18 suivantes d’affilée.',
  // Every String
  'Finish a round that visited every string: 2x that many questions, 90% accuracy.':
    'Termine une manche qui passe par toutes les cordes : deux fois plus de questions que de cordes, 90 % de précision.',
  'Visited every string: 4x that many questions, 90% accuracy.':
    'En passant par toutes les cordes : 4 fois plus de questions que de cordes, 90 % de précision.',
  'Visited every string: 6x that many questions, 95% accuracy.':
    'En passant par toutes les cordes : 6 fois plus de questions que de cordes, 95 % de précision.',
  // Per-string String Master — {s} is the translated string label
  'Answer 40+ questions on {s} at 90% accuracy or better.':
    'Réponds à 40+ questions sur {s} avec 90 % de précision ou plus.',
  '100+ questions on {s} at 92% accuracy or better.':
    '100+ questions sur {s} avec 92 % de précision ou plus.',
  '200+ questions on {s} at 95% accuracy or better.':
    '200+ questions sur {s} avec 95 % de précision ou plus.',
  '400+ questions on {s} at 96% accuracy or better, over 14+ practice days.':
    '400+ questions sur {s} avec 96 % de précision ou plus, sur 14+ jours de pratique.',
  '800+ questions on {s} at 97% accuracy or better, over 30+ practice days.':
    '800+ questions sur {s} avec 97 % de précision ou plus, sur 30+ jours de pratique.',
  // Full String Master
  'Earn String Master — Bronze on every string of this instrument.':
    'Obtiens Maître de la corde — Bronze sur toutes les cordes de cet instrument.',
  'Earn String Master — Silver on every string.':
    'Obtiens Maître de la corde — Argent sur toutes les cordes.',
  'Earn String Master — Gold on every string.': 'Obtiens Maître de la corde — Or sur toutes les cordes.',
  'Earn String Master — Platinum on every string.':
    'Obtiens Maître de la corde — Platine sur toutes les cordes.',
  'Earn String Master — Diamond on every string.':
    'Obtiens Maître de la corde — Diamant sur toutes les cordes.',
  // Neck Runner
  'Answer at least one question on every fret of the neck.':
    'Réponds à au moins une question sur chaque case du manche.',
  'Answer at least 3 questions on every fret of the neck.':
    'Réponds à au moins 3 questions sur chaque case du manche.',
  'Answer at least 5 questions on every fret of the neck.':
    'Réponds à au moins 5 questions sur chaque case du manche.',
  'Answer at least 10 questions on every fret, spread across 14+ practice days.':
    'Réponds à au moins 10 questions sur chaque case, réparties sur 14+ jours de pratique.',
  'Answer at least 20 questions on every fret, spread across 30+ practice days.':
    'Réponds à au moins 20 questions sur chaque case, réparties sur 30+ jours de pratique.',
  // Both Ends
  'Answer 40+ questions above the 12th fret at 85% accuracy or better.':
    'Réponds à 40+ questions au-delà de la case 12 avec 85 % de précision ou plus.',
  '100+ questions above the 12th fret at 88% accuracy or better.':
    '100+ questions au-delà de la case 12 avec 88 % de précision ou plus.',
  '200+ questions above the 12th fret at 92% accuracy or better.':
    '200+ questions au-delà de la case 12 avec 92 % de précision ou plus.',
  '400+ questions above the 12th fret at 93% accuracy or better, over 14+ practice days.':
    '400+ questions au-delà de la case 12 avec 93 % de précision ou plus, sur 14+ jours de pratique.',
  '800+ questions above the 12th fret at 94% accuracy or better, over 30+ practice days.':
    '800+ questions au-delà de la case 12 avec 94 % de précision ou plus, sur 30+ jours de pratique.',
  // Low End
  'Answer 40+ questions on the bass low-E string at 90% accuracy or better.':
    'Réponds à 40+ questions sur la corde de mi (E) grave de la basse avec 90 % de précision ou plus.',
  '100+ questions on the low-E string at 93% accuracy or better.':
    '100+ questions sur la corde de mi (E) grave avec 93 % de précision ou plus.',
  '200+ questions on the low-E string at 96% accuracy or better.':
    '200+ questions sur la corde de mi (E) grave avec 96 % de précision ou plus.',
  '400+ questions on the low-E string at 97% accuracy or better, over 14+ practice days.':
    '400+ questions sur la corde de mi (E) grave avec 97 % de précision ou plus, sur 14+ jours de pratique.',
  '800+ questions on the low-E string at 98% accuracy or better, over 30+ practice days.':
    '800+ questions sur la corde de mi (E) grave avec 98 % de précision ou plus, sur 30+ jours de pratique.',
  // Week Warrior
  'Practise on 5 separate days within a single 7-day window.':
    'Pratique 5 jours différents sur une même période de 7 jours.',
  '6 separate days within a single 7-day window.': '6 jours différents sur une même période de 7 jours.',
  'All 7 days within a single 7-day window — a perfect week.':
    'Les 7 jours d’une même période de 7 jours — une semaine parfaite.',
  // Dedicated
  'Build a run of 7 consecutive practice days.': 'Enchaîne 7 jours de pratique consécutifs.',
  '14 consecutive practice days.': '14 jours de pratique consécutifs.',
  '30 consecutive practice days.': '30 jours de pratique consécutifs.',
  '60 consecutive practice days.': '60 jours de pratique consécutifs.',
  '90 consecutive practice days.': '90 jours de pratique consécutifs.',
  '120 consecutive practice days.': '120 jours de pratique consécutifs.',
  '180 consecutive practice days.': '180 jours de pratique consécutifs.',
  '250 consecutive practice days.': '250 jours de pratique consécutifs.',
  '300 consecutive practice days.': '300 jours de pratique consécutifs.',
  '365 consecutive practice days — a full year, every day.':
    '365 jours de pratique consécutifs — une année entière, chaque jour.',
  // Total Reps
  'Answer 100 questions all-time, across every instrument.':
    'Réponds à 100 questions au total, tous instruments confondus.',
  '250 questions all-time.': '250 questions au total.',
  '500 questions all-time.': '500 questions au total.',
  '1,000 questions all-time.': '1 000 questions au total.',
  '2,500 questions all-time, spread across 20+ practice days.':
    '2 500 questions au total, réparties sur 20+ jours de pratique.',
  '5,000 questions all-time, spread across 40+ practice days.':
    '5 000 questions au total, réparties sur 40+ jours de pratique.',
  '10,000 questions all-time, spread across 70+ practice days.':
    '10 000 questions au total, réparties sur 70+ jours de pratique.',
  '20,000 questions all-time, spread across 110+ practice days.':
    '20 000 questions au total, réparties sur 110+ jours de pratique.',
  '35,000 questions all-time, spread across 160+ practice days.':
    '35 000 questions au total, réparties sur 160+ jours de pratique.',
  '50,000 questions all-time, spread across 220+ practice days.':
    '50 000 questions au total, réparties sur 220+ jours de pratique.',
  // Sharpshooter
  'Hold 85% accuracy over at least 200 questions, across every instrument.':
    'Garde 85 % de précision sur au moins 200 questions, tous instruments confondus.',
  '88% accuracy over at least 500 questions.': '88 % de précision sur au moins 500 questions.',
  '92% accuracy over at least 1,000 questions.': '92 % de précision sur au moins 1 000 questions.',
  '93% accuracy over at least 2,500 questions, spread across 30+ practice days.':
    '93 % de précision sur au moins 2 500 questions, réparties sur 30+ jours de pratique.',
  '94% accuracy over at least 5,000 questions, spread across 60+ practice days.':
    '94 % de précision sur au moins 5 000 questions, réparties sur 60+ jours de pratique.',
  // Quick Read
  'Hold an average answer time under 2.0s over 200+ questions.':
    'Garde un temps de réponse moyen sous 2,0 s sur 200+ questions.',
  'Under 1.6s over 500+ questions.': 'Sous 1,6 s sur 500+ questions.',
  'Under 1.3s over 1,000+ questions.': 'Sous 1,3 s sur 1 000+ questions.',
  'Under 1.15s over 2,500+ questions, spread across 30+ practice days.':
    'Sous 1,15 s sur 2 500+ questions, réparties sur 30+ jours de pratique.',
  'Under 1.05s over 5,000+ questions, spread across 60+ practice days.':
    'Sous 1,05 s sur 5 000+ questions, réparties sur 60+ jours de pratique.',
  // Most Improved
  'Over 10+ practice days, lift your accuracy by 20 points from your first days to your latest.':
    'Sur 10+ jours de pratique, gagne 20 points de précision entre tes premiers jours et les plus récents.',
  'Over 15+ practice days, lift your accuracy by 30 points.':
    'Sur 15+ jours de pratique, gagne 30 points de précision.',
  'Over 20+ practice days, lift your accuracy by 40 points.':
    'Sur 20+ jours de pratique, gagne 40 points de précision.',
  // Doubling Up
  'Earn String Master on every string of both guitar and bass.':
    'Obtiens Maître de la corde sur toutes les cordes, à la guitare comme à la basse.',
  'Earn Full String Master — Silver on both guitar and bass.':
    'Obtiens Maître de toutes les cordes — Argent, à la guitare comme à la basse.',
  'Earn Full String Master — Gold and Neck Runner — Gold on both guitar and bass.':
    'Obtiens Maître de toutes les cordes — Or et Coureur du manche — Or, à la guitare comme à la basse.',
  'Earn Full String Master — Platinum and Neck Runner — Platinum on both guitar and bass.':
    'Obtiens Maître de toutes les cordes — Platine et Coureur du manche — Platine, à la guitare comme à la basse.',
  'Earn Full String Master — Diamond and Neck Runner — Diamond on both guitar and bass.':
    'Obtiens Maître de toutes les cordes — Diamant et Coureur du manche — Diamant, à la guitare comme à la basse.',
  // Multi-Instrumentalist
  'Earn Full String Master — Silver on 2 different instruments.':
    'Obtiens Maître de toutes les cordes — Argent sur 2 instruments différents.',
  'Earn Full String Master — Silver on 3 different instruments.':
    'Obtiens Maître de toutes les cordes — Argent sur 3 instruments différents.',
  'Earn Full String Master — Gold on 4 different instruments.':
    'Obtiens Maître de toutes les cordes — Or sur 4 instruments différents.',
  'Earn Full String Master — Gold on all 5 instruments.':
    'Obtiens Maître de toutes les cordes — Or sur les 5 instruments.',
  'Earn Full String Master — Platinum on all 5 instruments.':
    'Obtiens Maître de toutes les cordes — Platine sur les 5 instruments.',
  // Admin (role)
  'Granted to app administrators — read every Feedback board post, not just your own.':
    'Attribué aux administrateurs de l’app — permet de lire tous les messages de la boîte à idées, pas seulement les tiens.',
  // Guest-merge prompt — first sign-in on a device with local guest history
  'Add this device’s progress to your account?': 'Ajouter la progression de cet appareil à ton compte ?',
  'You’ve practiced on this device without an account. Add that progress to your account, or keep only what’s already on your account?':
    'Tu as pratiqué sur cet appareil sans compte. Ajouter cette progression à ton compte, ou garder seulement ce qui s’y trouve déjà ?',
  'Merge my progress': 'Fusionner ma progression',
  'Use account only': 'Utiliser seulement le compte',
  'Leave this practice off your account?': 'Laisser cette pratique hors de ton compte ?',
  'You have {n} rounds of practice saved on this device. If you continue, they stay on this device but are not added to your account.':
    'Tu as {n} manches de pratique enregistrées sur cet appareil. Si tu continues, elles restent sur cet appareil mais ne sont pas ajoutées à ton compte.',
  // VoiceCalibration
  'Voice calibration': 'Calibrage vocal',
  'Personal voice calibration': 'Calibrage vocal personnel',
  'Profile name': 'Nom du profil',
  'Say just this word, on its own': 'Dis seulement ce mot, tout seul',
  'Say just the note name, on its own': 'Dis seulement le nom de la note, tout seul',
  'Speak clearly and pause briefly between words — later, when answering, say the letter, pause, then “sharp” / “flat” as two separate words.':
    'Parle clairement et marque une courte pause entre les mots — ensuite, pour répondre, dis la lettre, fais une pause, puis « sharp » / « flat » en deux mots séparés.',
  'Could not use the microphone — try again': 'Impossible d’utiliser le micro — réessaie',
  'No sound captured — try again, closer to the mic': 'Aucun son capté — réessaie, plus près du micro',
  'Recording too short — try again': 'Enregistrement trop court — réessaie',
  "That didn't sound like a note — try again": 'Ça ne ressemblait pas à une note — réessaie',
  'Saving the recording failed': 'L’enregistrement n’a pas pu être sauvegardé',
  'Recorded': 'Enregistrés',
  'notes': 'notes',
  'accidentals': 'altérations',
  'Say:': 'Dis :',
  'Play last recording': 'Écouter le dernier enregistrement',
  'Export recordings to a folder (dev)': 'Exporter les enregistrements dans un dossier (dev)',
  'Stop exporting recordings': 'Arrêter d’exporter les enregistrements',
  'Every accepted take is also saved as a WAV, named for scripts/eval-voice.mts.':
    'Chaque prise acceptée est aussi enregistrée en WAV, nommée pour scripts/eval-voice.mts.',
  'Could not write to the export folder — pick it again':
    'Impossible d’écrire dans le dossier d’export — choisis-le à nouveau',
  'Speak the word on screen — calibration advances on its own':
    'Dis le mot affiché à l’écran — le calibrage avance tout seul',
  'Take': 'Prise',
  'Previous': 'Précédent',
  'Next': 'Suivant',
  'Delete profile': 'Supprimer le profil',
  'Reset automatic learning of the general mode': 'Réinitialiser l’apprentissage automatique du mode général',
  'Checking recordings…': 'Vérification des enregistrements…',
  'Self-test recordings': 'Autotest des enregistrements',
  'All words are distinct enough — looks good.': 'Tous les mots sont assez distincts — c’est bon.',
  'Finish & enable': 'Terminer et activer',
  '“{a}” and “{b}” sound very similar — re-record one of them.':
    '« {a} » et « {b} » se ressemblent trop — réenregistre l’un des deux.',
  'Recording extra takes to tell “{a}” and “{b}” apart':
    'Enregistrement de prises supplémentaires pour distinguer « {a} » de « {b} »',
  'No recordings for “{prompt}” yet': 'Pas encore d’enregistrement pour « {prompt} »',
  'Delete take {n} of {prompt}': 'Supprimer la prise {n} de {prompt}',
  'Record {n} more takes for “{a}” and “{b}”': 'Enregistrer {n} prises de plus pour « {a} » et « {b} »',
  'to go': 'restants',
  // VoiceLevelMeter
  'Microphone level good': 'Niveau du micro correct',
  'Microphone level low, speak louder': 'Niveau du micro faible, parle plus fort',
  'Good level': 'Bon niveau',
  'Too quiet — speak up': 'Trop faible — parle plus fort',
  // DebugLogPanel
  'Debug log': 'Journal de débogage',
  'Open debug log': 'Ouvrir le journal de débogage',
  'Errors + voice · auto-clears daily': 'Erreurs + voix · vidé chaque jour',
  'Errors · auto-clears daily': 'Erreurs · vidé chaque jour',
  'Voice: on': 'Voix : activée',
  'Voice: off': 'Voix : désactivée',
  'Copied': 'Copié',
  'Copy': 'Copier',
  'Clear': 'Effacer',
  'Close': 'Fermer',
  '(no errors)': '(aucune erreur)',
  // FeedbackBoard
  'Couldn’t load the board. Check your connection and try again.':
    'Impossible de charger la boîte à idées. Vérifie ta connexion et réessaie.',
  'Couldn’t send that. Check your connection and try again.':
    'Impossible d’envoyer. Vérifie ta connexion et réessaie.',
  'Sign in with Google to leave a comment, idea, or suggestion. Only admins can read the full board.':
    'Connecte-toi avec Google pour laisser un commentaire, une idée ou une suggestion. Seuls les administrateurs peuvent tout lire.',
  'Microphone access is off — turn it on to dictate.':
    'L’accès au micro est désactivé — active-le pour dicter.',
  'Voice typing isn’t available on this device.': 'La saisie vocale n’est pas disponible sur cet appareil.',
  'Couldn’t hear that — try again.': 'Je n’ai pas entendu — réessaie.',
  'What’s on your mind?': 'Qu’as-tu en tête ?',
  'Stop voice typing': 'Arrêter la saisie vocale',
  'Start voice typing': 'Démarrer la saisie vocale',
  'Sending…': 'Envoi…',
  'Send': 'Envoyer',
  'Listening… say one sentence — it stops on its own.': 'J’écoute… dis une phrase — ça s’arrête tout seul.',
  'Thanks — your message was sent.': 'Merci — ton message a été envoyé.',
  'Unknown': 'Inconnu',
  'You': 'Toi',
  'Handled': 'Traité',
  'Mark unhandled': 'Marquer comme non traité',
  'Mark handled': 'Marquer comme traité',
  'Delete': 'Supprimer',
  'You haven’t sent anything yet.': 'Tu n’as encore rien envoyé.',
  'Share a comment, idea, or suggestion. Admins read every post; below you can see the ones you’ve sent.':
    'Partage un commentaire, une idée ou une suggestion. Les administrateurs lisent chaque message ; tu vois ci-dessous ceux que tu as envoyés.',
  'Write': 'Écrire',
  'Inbox': 'Boîte de réception',
  'Post a comment, idea, or suggestion of your own.': 'Publie ton propre commentaire, idée ou suggestion.',
  'Every post from every user': 'Tous les messages de tous les utilisateurs',
  'still to handle': 'à traiter',
  'Mark one handled once you’ve dealt with it, or delete it.':
    'Marque un message comme traité une fois réglé, ou supprime-le.',
  'No posts yet.': 'Aucun message pour l’instant.',
  'Nothing open — all caught up.': 'Rien en attente — tout est à jour.',
  'Delete post': 'Supprimer le message',
  'Delete this post?': 'Supprimer ce message ?',
  'This permanently removes it for everyone, including':
    'Il sera supprimé définitivement pour tout le monde, y compris',
  'the author': 'l’auteur',
  'It can’t be undone.': 'C’est irréversible.',
  'Delete for everyone': 'Supprimer pour tout le monde',
  // Quick Access — the floating home-screen control, its Settings row and pushpins
  'Quick access': 'Accès rapide',
  'A floating button on the home screen for the settings you flip most. Pin up to 5 with the pushpins below, then double-tap the lower-right of the screen outside a drill to open it.':
    'Un bouton flottant sur l’écran d’accueil pour les réglages que tu changes le plus. Épingle-en jusqu’à 5 avec les punaises ci-dessous, puis touche deux fois le coin inférieur droit de l’écran, hors d’un exercice, pour l’ouvrir.',
  'Pin to quick access?': 'Épingler dans l’accès rapide ?',
  'Remove from quick access?': 'Retirer de l’accès rapide ?',
  'You can pin up to {n} settings. Remove one first.':
    'Tu peux épingler jusqu’à {n} réglages. Retires-en un d’abord.',
  'Quick access is full': 'L’accès rapide est plein',
  'You already have {n} shortcuts. Remove one to make room?':
    'Tu as déjà {n} raccourcis. En retirer un pour faire de la place ?',
  'Remove one': 'En retirer un',
  'Leave as is': 'Laisser tel quel',
  'Remove a quick access shortcut': 'Retirer un raccourci de l’accès rapide',
  'Quick access holds five shortcuts. Remove one to make room.':
    'L’accès rapide contient cinq raccourcis. Retires-en un pour faire de la place.',
  'Remove {name} from quick access': 'Retirer {name} de l’accès rapide',
  'Yes': 'Oui',
  'No': 'Non',
  'Double-tap the lower-right of the screen for quick access':
    'Touche deux fois le coin inférieur droit de l’écran pour l’accès rapide',
  'Double-tap the lower-left of the screen for quick access':
    'Touche deux fois le coin inférieur gauche de l’écran pour l’accès rapide',
  'Quick access is off': 'L’accès rapide est désactivé',
  "You haven't pinned any quick access shortcuts yet":
    'Tu n’as encore épinglé aucun raccourci dans l’accès rapide',
  'What do the icons mean?': 'Que signifient les icônes ?',
  'Quick access symbol legend': 'Légende des symboles de l’accès rapide',
  'What each icon on the Quick Access widget means. Tapping a pinned shortcut cycles through these states in order.':
    'Ce que signifie chaque icône de l’accès rapide. Toucher un raccourci épinglé fait défiler ces états dans cet ordre.',
  'Letters (A B C)': 'Lettres (A B C)',
  'Sharps (♯)': 'Dièses (♯)',
  'Flats (♭)': 'Bémols (♭)',
  // Tuner — the Learn-tab tile that opens a live chromatic tuner
  'Tuner': 'Accordeur',
  'Tune your strings using the microphone.': 'Accorde tes cordes avec le micro.',
  'Start listening': 'Commencer l’écoute',
  'Requesting microphone permission…': 'Demande d’autorisation du micro…',
  'Microphone access was denied. Allow it in your browser settings, then try again.':
    'L’accès au micro a été refusé. Autorise-le dans les réglages du navigateur, puis réessaie.',
  'Try again': 'Réessayer',
  "Couldn't start the microphone.": 'Impossible de démarrer le micro.',
  'Listening… play a note.': 'J’écoute… joue une note.',
  "Tap a note on the wheel to lock it as the string you're tuning. Tap it again to switch back to auto-detect.":
    'Touche une note de la roue pour la fixer comme la corde que tu accordes. Touche-la à nouveau pour revenir à la détection automatique.',
  'Tuning': 'Accordage',
  'Detected': 'Détectée',
  'String {n}': 'Corde {n}',
  'or': 'ou',
  'Unpin': 'Libérer',
  "Tap to lock this note at 12 o'clock": 'Touche pour fixer cette note en haut, à midi',
  'Tap to unpin': 'Touche pour la libérer',
  'In tune': 'Juste',
  'Tighten (raise pitch)': 'Tends (monte la hauteur)',
  'Loosen (lower pitch)': 'Détends (baisse la hauteur)',
  '~{pct}% of the audible threshold': '~{pct} % du seuil audible',

  // ── Stage 2b: the Premium Learn areas (Teacher, Learning Path, intervals,
  // scales, staff and tab reading) and the admin / dev-panel copy ─────────
  // Admin-only account tools and the dev debug panel
  'Admin: plan on your account': 'Admin : formule de ton compte',
  'Sets the plan on your own account only (Free, Pro or Premium). Writes to the entitlements table and syncs across your devices.':
    'Change la formule de ton propre compte uniquement (Gratuit, Pro ou Premium). Écrit dans la table des droits et se synchronise sur tes appareils.',
  'Simulate tier (dev only — no DB change)':
    'Simuler une formule (dev uniquement — aucune modification de la base)',
  'Admin: view the app as': 'Admin : voir l’app en tant que',
  'Hides every admin-only control so you see exactly what a regular user sees. Switch back here any time — this is a local view change only and does not change what your account can do.':
    'Masque toutes les commandes réservées aux administrateurs pour que tu voies exactement ce que voit un utilisateur normal. Reviens ici à tout moment — c’est seulement un changement d’affichage local, qui ne change pas ce que ton compte peut faire.',
  'Regular user': 'Utilisateur normal',
  // Premium Teacher — the Today card
  'Teacher': 'Professeur',
  'Today with your Teacher': 'Aujourd’hui avec ton Professeur',
  'Recommended': 'Recommandé',
  'positions': 'positions',
  "Today's goal is done": 'Objectif du jour atteint',
  'one more round?': 'encore une manche ?',
  'Daily goal': 'Objectif quotidien',
  "Start today's practice": 'Commencer l’entraînement du jour',
  'Practise my weak spots': 'Travailler mes points faibles',
  'No weak spots yet — keep practising and the Teacher will find them.':
    'Pas encore de points faibles — continue à t’entraîner et le Professeur les trouvera.',
  'Why these?': 'Pourquoi celles-ci ?',
  'Hide why': 'Masquer le pourquoi',
  'due for review': 'à réviser',
  'weak spots': 'points faibles',
  'to reinforce': 'à renforcer',
  'new ground': 'nouveau terrain',
  'a fresh set to get started': 'une nouvelle série pour commencer',
  'often missed': 'souvent ratée',
  'slow to recall': 'lente à retrouver',
  'recent slips': 'erreurs récentes',
  'reinforcement': 'renforcement',
  'not practised much': 'peu travaillée',
  'review': 'révision',
  // Premium Learning Path — the Path screen
  'Learning Path': 'Parcours d’apprentissage',
  'View your Learning Path': 'Voir ton parcours d’apprentissage',
  'Follow a guided path from single notes onward': 'Suis un parcours guidé à partir de notes isolées',
  'A guided journey through the fretboard. Practise from the Selector whenever you like — your answers still move you along this path.':
    'Un voyage guidé sur le manche. Entraîne-toi depuis le sélecteur quand tu veux — tes réponses te font quand même avancer sur ce parcours.',
  'Practise toward this checkpoint': 'S’entraîner pour cette étape',
  'This is your next step.': 'C’est ta prochaine étape.',
  'Every checkpoint mastered — keep it sharp.': 'Toutes les étapes maîtrisées — garde la main.',
  'mastered': 'maîtrisé',
  'Locked': 'Verrouillé',
  // Premium interval training — the P4 interval drill
  'Interval training': 'Entraînement aux intervalles',
  'Hear and find the distance between two notes.': 'Entends et trouve la distance entre deux notes.',
  'intervals tracked': 'intervalles suivis',
  '1 interval tracked': '1 intervalle suivi',
  'Answer form': 'Forme de réponse',
  'Find it on the neck': 'La trouver sur le manche',
  'Name the note': 'Nommer la note',
  'Start interval practice': 'Commencer l’entraînement aux intervalles',
  'above': 'au-dessus de',
  // Premium scale training
  'Scale training': 'Entraînement aux gammes',
  'Practise building scale shapes on the neck':
    'Entraîne-toi à construire des formes de gammes sur le manche',
  'Rows of notes fall down the screen, one lane per string. Only the first note of the scale is lit — tap it, and the distance in tones to the next note appears on it. Find that next note before its row falls off, bottom row first — a run up or down the scale, as the arrow on the banner shows. Every note you tap plays its sound.':
    'Des rangées de notes descendent à l’écran, un couloir par corde. Seule la première note de la gamme est allumée — touche-la, et la distance en tons jusqu’à la note suivante s’affiche dessus. Trouve cette note suivante avant que sa rangée ne sorte de l’écran, en commençant par la rangée du bas — une montée ou une descente de la gamme, comme l’indique la flèche du bandeau. Chaque note touchée joue son son.',
  'Tones to the next note': 'Tons jusqu’à la note suivante',
  'The next note is on another string': 'La note suivante est sur une autre corde',
  'Frets to the next note': 'Cases jusqu’à la note suivante',
  'Distance shown in': 'Distance en',
  'Tones': 'Tons',
  'A half tone is one fret, a whole tone is two.': 'Un demi-ton fait une case, un ton entier deux.',
  'Question': 'Question',
  'Scale': 'Gamme',
  'Session complete!': 'Session terminée !',
  'Practice again': 'S’entraîner encore',
  'Build the scale': 'Construis la gamme',
  'Tap the scale in order': 'Touche la gamme dans l’ordre',
  'Connect the boxes': 'Relie les motifs',
  'Boxes 1–2': 'Motifs 1–2',
  'A wider section of the neck is shown, spanning box 1 and box 2 of the scale together. Tap the notes in order to play a run that crosses from one box into the next and back — the same rules as "Tap the scale in order".':
    'Une section plus large du manche s’affiche, réunissant le motif 1 et le motif 2 de la gamme. Touche les notes dans l’ordre pour jouer un enchaînement qui passe d’un motif à l’autre puis revient — les mêmes règles que « Touche la gamme dans l’ordre ».',
  'A section of the neck is shown with every note of the scale lit. Tap them in order to play the scale: start on the root (gold ring), go to one end of the section, then to the other end, and back to the root — up first or down first, as the arrow shows.':
    'Une section du manche s’affiche avec toutes les notes de la gamme allumées. Touche-les dans l’ordre pour jouer la gamme : commence sur la fondamentale (anneau doré), va jusqu’à un bout de la section, puis jusqu’à l’autre, et reviens à la fondamentale — en montant d’abord ou en descendant d’abord, comme l’indique la flèche.',
  'Learning mode': 'Mode d’apprentissage',
  'Play on my own': 'Jouer seul',
  'Watch, then play': 'Regarder, puis jouer',
  'The app plays each scale first, lighting its notes one by one — then you play it after.':
    'L’app joue d’abord chaque gamme en allumant ses notes une à une — puis c’est à toi de la jouer.',
  'Watch and listen…': 'Regarde et écoute…',
  'Your turn — play it back': 'À toi — rejoue-la',
  // Task A — Scales Recall mode ("play the box from memory").
  'Play from memory': 'Jouer de mémoire',
  'All notes lit': 'Toutes les notes allumées',
  'Only the root lit': 'Seule la fondamentale allumée',
  'Empty neck': 'Manche vide',
  'Every note of the box is lit — learn the shape by seeing it.': 'Toutes les notes du motif sont allumées — apprends la forme en la regardant.',
  'Only the root is lit. Play the rest of the box from memory — a dim note of the box still counts.':
    'Seule la fondamentale est allumée. Joue le reste du motif de mémoire — une note éteinte du motif compte quand même.',
  'Nothing is lit. Find the root and play the whole box from memory.': 'Rien n’est allumé. Trouve la fondamentale et joue tout le motif de mémoire.',
  'Move up a level by itself after 3 good runs in a row': 'Monter de niveau tout seul après 3 gammes réussies d’affilée',
  'Good runs toward the next level:': 'Gammes réussies vers le niveau suivant :',
  'Level up — the neck is empty now': 'Niveau supérieur — le manche est vide maintenant',
  'Level up — only the root is lit now': 'Niveau supérieur — seule la fondamentale est allumée maintenant',
  'Play the scale on your guitar, note by note — the app listens through the microphone. A note an octave higher or lower also counts. Tapping still works.':
    'Joue la gamme sur ta guitare, note par note — l’app écoute par le micro. Une note une octave plus haut ou plus bas compte aussi. Tu peux toujours toucher l’écran.',
  '🎸 Play the scale on your guitar': '🎸 Joue la gamme sur ta guitare',
  'Identify the scale': 'Identifie la gamme',
  'Name the degree': 'Nomme le degré',
  'The app plays the scale up or down. Pick which scale you heard.':
    'L’app joue la gamme en montant ou en descendant. Choisis quelle gamme tu as entendue.',
  'The app shows a scale, a root and a degree. Pick the note that matches.':
    'L’app affiche une gamme, une fondamentale et un degré. Choisis la note qui correspond.',
  '🔊 hear it again': '🔊 réécouter',
  'Minor Pentatonic': 'Pentatonique mineure',
  'Major': 'Majeur',
  'Natural Minor': 'Mineure naturelle',
  'Major Pentatonic': 'Pentatonique majeure',
  'Blues': 'Blues',
  'Harmonic Minor': 'Mineure harmonique',
  'Melodic Minor': 'Mineure mélodique',
  'Dorian': 'Dorien',
  'Phrygian': 'Phrygien',
  'Lydian': 'Lydien',
  'Mixolydian': 'Mixolydien',
  'Locrian': 'Locrien',
  'Phrygian Dominant (Hijaz)': 'Phrygien dominant (Hijaz)',
  'Major Blues': 'Blues majeur',
  'Half-Whole Diminished': 'Diminuée demi-ton/ton',
  'Whole-Half Diminished': 'Diminuée ton/demi-ton',
  'Whole Tone': 'Par tons',
  'Lydian Dominant (Acoustic)': 'Lydien dominant (acoustique)',
  'Altered (Super Locrian)': 'Altérée (superlocrien)',
  'Double Harmonic (Arabic)': 'Double harmonique (arabe)',
  'Hungarian Minor (Gypsy Minor)': 'Mineure hongroise (tzigane)',
  'Hirajoshi': 'Hirajoshi',
  'All scales': 'Toutes les gammes',
  'More scales': 'Plus de gammes',
  'Modes': 'Modes',
  'Minor variations': 'Variantes mineures',
  'Blues & jazz': 'Blues et jazz',
  'World': 'Du monde',
  'Other': 'Autres',
  // "?" explanations on the More scales page (src/utils/scaleBlurbs.ts)
  "Each number is a note's place in the scale, counted from the starting note (1).":
    'Chaque nombre est la place d’une note dans la gamme, en comptant à partir de la note de départ (1).',
  'Pick a starting note to see the scale on it:': 'Choisis une note de départ pour y voir la gamme :',
  'Highlighted numbers differ from the major scale: b means one fret lower, # means one fret higher.':
    'Les nombres en surbrillance diffèrent de la gamme majeure : b veut dire une case plus bas, # une case plus haut.',
  'Like natural minor, but with a major 6th instead of a flat 6th. It sounds minor yet lighter and more open — common in funk, jazz and rock.':
    'Comme la mineure naturelle, mais avec une 6te majeure au lieu d’une 6te bémol. Elle sonne mineure, mais plus légère et plus ouverte — courante en funk, en jazz et en rock.',
  'Like natural minor, but the 2nd note sits just one fret above the root. It sounds dark and tense, with a Spanish flavour — common in flamenco and metal.':
    'Comme la mineure naturelle, mais la 2de note n’est qu’à une case au-dessus de la fondamentale. Elle sonne sombre et tendue, avec une saveur espagnole — courante dans le flamenco et le metal.',
  'Like the major scale, but with a raised 4th. It sounds bright, dreamy and floating — common in film music.':
    'Comme la gamme majeure, mais avec une 4te augmentée. Elle sonne lumineuse, rêveuse et flottante — courante dans la musique de film.',
  'Like the major scale, but with a flat 7th. It sounds relaxed and bluesy — common in rock, blues and folk.':
    'Comme la gamme majeure, mais avec une 7e bémol. Elle sonne détendue et bluesy — courante en rock, en blues et en folk.',
  'The most unstable of the modes: it has both a flat 2nd and a flat 5th. It is rarely used as a home key and mostly heard over half-diminished chords.':
    'Le plus instable des modes : il a à la fois une 2de bémol et une 5te bémol. Il sert rarement de tonalité principale et s’entend surtout sur des accords demi-diminués.',
  'Natural minor with a raised 7th, so the 7th sits one fret below the root. That gives a strong pull back home and a dramatic, classical sound.':
    'La mineure naturelle avec une 7e haussée, qui se retrouve une case sous la fondamentale. Cela crée une forte attraction vers la tonique et un son dramatique et classique.',
  'A minor scale (flat 3rd) that keeps the major 6th and 7th. It sounds smooth and jazzy.':
    'Une gamme mineure (3ce bémol) qui garde la 6te et la 7e majeures. Elle sonne douce et jazzy.',
  'Harmonic minor with a raised 4th. It has two wide gaps of a step and a half, which gives it a dramatic, exotic sound.':
    'La mineure harmonique avec une 4te haussée. Elle a deux grands écarts d’un ton et demi, qui lui donnent un son dramatique et exotique.',
  'The major pentatonic scale plus the flat 3rd "blue note". It sounds sunny, with a country and blues feel.':
    'La pentatonique majeure plus la « blue note » de 3ce bémol. Elle sonne ensoleillée, avec une couleur country et blues.',
  'A major scale with a raised 4th and a flat 7th. It sounds bright but bluesy, and jazz players use it over dominant 7th chords.':
    'Une gamme majeure avec une 4te haussée et une 7e bémol. Elle sonne lumineuse mais bluesy, et les jazzmen l’utilisent sur les accords de septième de dominante.',
  'It bends every colour note of a dominant chord: it has both a flat and a raised 2nd, and both a flat and a raised 5th. It sounds very tense, and is played right before resolving to the next chord.':
    'Elle altère chaque note de couleur d’un accord de dominante : elle a une 2de bémol et une 2de haussée, une 5te bémol et une 5te haussée. Elle sonne très tendue et se joue juste avant de résoudre sur l’accord suivant.',
  'Eight notes, alternating a half step and a whole step. It is symmetrical and tense, and jazz players use it over dominant 7th chords.':
    'Huit notes, en alternant demi-ton et ton. Elle est symétrique et tendue, et les jazzmen l’utilisent sur les accords de septième de dominante.',
  'Eight notes, alternating a whole step and a half step. It is symmetrical, and is used over diminished chords.':
    'Huit notes, en alternant ton et demi-ton. Elle est symétrique et s’utilise sur les accords diminués.',
  'Six notes, every step a whole tone. With no half steps it has no clear home note, so it sounds dreamy and floating.':
    'Six notes, chaque pas d’un ton entier. Sans demi-tons, elle n’a pas de note de repos claire, d’où son côté rêveur et flottant.',
  'Phrygian with a major 3rd. It is the classic Middle-Eastern sound, common in flamenco, klezmer and Arabic music.':
    'Le phrygien avec une 3ce majeure. C’est le son oriental classique, courant dans le flamenco, le klezmer et la musique arabe.',
  'A major-sounding scale with a flat 2nd and a flat 6th, so it has two gaps of a step and a half. It has a rich Middle-Eastern flavour.':
    'Une gamme au son majeur avec une 2de et une 6te bémols, d’où deux écarts d’un ton et demi. Elle a une riche saveur orientale.',
  'A five-note Japanese scale with wide gaps between its notes. It sounds sparse and haunting, like a koto.':
    'Une gamme japonaise de cinq notes aux larges écarts. Elle sonne dépouillée et envoûtante, comme un koto.',
  'The scale behind most pop, folk and classical music. It sounds bright and happy, and every other scale is easiest to understand by comparing it to this one.':
    'La gamme derrière la plupart de la pop, du folk et de la musique classique. Elle sonne lumineuse et joyeuse, et toutes les autres gammes se comprennent plus facilement en les comparant à elle.',
  'The basic minor scale. Compared to major, its 3rd, 6th and 7th are one fret lower, which gives it a sad, serious sound.':
    'La gamme mineure de base. Par rapport à la majeure, ses 3ce, 6te et 7e sont une case plus bas, ce qui lui donne un son triste et grave.',
  'Five notes: the minor scale without its 2nd and 6th. It is the most common scale for rock and blues solos, and easy to play because it has no awkward notes.':
    'Cinq notes : la gamme mineure sans sa 2de ni sa 6te. C’est la gamme la plus courante pour les solos de rock et de blues, et elle est facile à jouer car elle n’a pas de notes délicates.',
  'Five notes: the major scale without its 4th and 7th. It sounds sweet and open, and is common in country, pop and rock solos.':
    'Cinq notes : la gamme majeure sans sa 4te ni sa 7e. Elle sonne douce et ouverte, et est courante dans les solos de country, de pop et de rock.',
  'The minor pentatonic scale plus one extra "blue note", the flat 5th, which adds a gritty, bluesy tension.':
    'La pentatonique mineure plus une « blue note » supplémentaire, la 5te bémol, qui ajoute une tension rugueuse et bluesy.',
  'Degree': 'Degré',
  'Root': 'Fondamentale',
  'Position': 'Position',
  'All positions': 'Toutes les positions',
  'Box': 'Motif',
  'One position selected — difficulty is focused.':
    'Une position choisie — la difficulté se concentre dessus.',
  // Scale progress board
  'Practice': 'Entraînement',
  'Progress': 'Progrès',
  'Scales mastered': 'Gammes maîtrisées',
  'No scales shipped yet.': 'Aucune gamme disponible pour l’instant.',
  'Meet the scale': 'Découvrir la gamme',
  'What does this scale look like?': 'À quoi ressemble cette gamme ?',
  'Play the scale': 'Jouer la gamme',
  'Start practicing': 'Commencer à pratiquer',
  'More options': 'Plus d’options',
  'Fewer options': 'Moins d’options',
  'New to scales? Start with:': 'Nouveau dans les gammes ? Commencez par :',
  'Why start here?': 'Pourquoi commencer ici ?',
  'Fewer notes (5) and no awkward fingerings — the most common first scale for guitar, and you can solo with it right away. Trade-off: it skips two notes of the full scale, so it won’t teach you scale-degree theory on its own.':
    'Moins de notes (5) et aucun doigté gênant — la première gamme la plus courante à la guitare, et vous pouvez improviser avec dès maintenant. Contrepartie : elle saute deux notes de la gamme complète, donc elle ne vous enseigne pas à elle seule la théorie des degrés.',
  'The foundation scale — every other scale and key gets explained by comparing it to this one. Trade-off: seven notes means a bit more to remember, and a slightly bigger stretch for the fingers than the five-note pentatonic.':
    'La gamme de base — toutes les autres gammes et tonalités s’expliquent en les comparant à celle-ci. Contrepartie : sept notes, c’est un peu plus à retenir, et un écart un peu plus grand pour les doigts que la pentatonique à cinq notes.',
  // Intervals Learning — exercises, questions and interval names
  'Identify the interval': 'Identifier l’intervalle',
  'Find the note': 'Trouver la note',
  'Find on the neck': 'Trouver sur le manche',
  'Which interval did you hear?': 'Quel intervalle as-tu entendu ?',
  'Hear it again': 'Réécouter',
  'below': 'en dessous de',
  'above the marked note': 'au-dessus de la note marquée',
  'below the marked note': 'en dessous de la note marquée',
  'A note is marked on the neck — tap the note that completes the interval.':
    'Une note est marquée sur le manche — touche la note qui complète l’intervalle.',
  'Silent mode is on — this exercise needs sound.':
    'Le mode silencieux est activé — cet exercice a besoin de son.',
  'Silent mode is on — “Identify the interval” needs sound.':
    'Le mode silencieux est activé — « Identifier l’intervalle » a besoin de son.',
  'Minor 2nd': 'Seconde mineure',
  'Major 2nd': 'Seconde majeure',
  'Minor 3rd': 'Tierce mineure',
  'Major 3rd': 'Tierce majeure',
  'Perfect 4th': 'Quarte juste',
  'Tritone': 'Triton',
  'Perfect 5th': 'Quinte juste',
  'Minor 6th': 'Sixte mineure',
  'Major 6th': 'Sixte majeure',
  'Minor 7th': 'Septième mineure',
  'Major 7th': 'Septième majeure',
  // Intervals Learning — curriculum group names
  'Perfect 4th & 5th': 'Quarte et quinte justes',
  'Major & minor 3rds': 'Tierces majeure et mineure',
  'Whole & half steps': 'Tons et demi-tons',
  'Major & minor 6ths': 'Sixtes majeure et mineure',
  'Major & minor 7ths': 'Septièmes majeure et mineure',
  'The tritone': 'Le triton',
  'All intervals': 'Tous les intervalles',
  // Intervals Learning — per-quality educational copy
  'One semitone — the smallest step, two adjacent frets; a tense, grinding sound.':
    'Un demi-ton — le plus petit pas, deux cases voisines ; un son tendu et grinçant.',
  'One semitone narrower than a major 2nd — clashing and unstable where the major 2nd sounds like a plain step.':
    'Un demi-ton plus étroite que la seconde majeure — elle frotte et reste instable, là où la seconde majeure sonne comme un simple pas.',
  'The pull of a leading tone up to the tonic; the clash inside a tone cluster.':
    'L’attraction de la sensible vers la tonique ; le frottement au cœur d’un cluster.',
  'Two semitones — a whole step; the plain next note of a scale.':
    'Deux demi-tons — un ton entier ; la note suivante toute simple d’une gamme.',
  'One semitone wider than a minor 2nd and one narrower than a minor 3rd — a plain step, neither harsh nor sweet.':
    'Un demi-ton plus large que la seconde mineure et un de moins que la tierce mineure — un simple pas, ni dur ni doux.',
  'The step between most neighbouring scale degrees.':
    'Le pas entre la plupart des degrés voisins d’une gamme.',
  'Three semitones — the minor colour; a small, slightly sad-sounding gap.':
    'Trois demi-tons — la couleur mineure ; un petit écart un peu triste.',
  'One semitone narrower than a major 3rd — that single semitone is what makes a chord sound minor instead of major.':
    'Un demi-ton plus étroite que la tierce majeure — c’est ce seul demi-ton qui rend un accord mineur plutôt que majeur.',
  'The third of a minor chord.': 'La tierce d’un accord mineur.',
  'Four semitones — the major colour; a bright, open, happy-sounding gap.':
    'Quatre demi-tons — la couleur majeure ; un écart lumineux, ouvert et joyeux.',
  'One semitone wider than a minor 3rd and one narrower than a perfect 4th — bright where the minor 3rd sounds sad.':
    'Un demi-ton plus large que la tierce mineure et un de moins que la quarte juste — lumineuse là où la tierce mineure sonne triste.',
  'The bright third of a major chord.': 'La tierce lumineuse d’un accord majeur.',
  'Five semitones — a strong, stable, slightly hollow consonance.':
    'Cinq demi-tons — une consonance forte, stable et un peu creuse.',
  'One semitone wider than a major 3rd and one narrower than a tritone — settled and resolved where the tritone is tense.':
    'Un demi-ton plus large que la tierce majeure et un de moins que le triton — posée et résolue là où le triton est tendu.',
  'The sound of standard guitar tuning; root to fourth of a suspended chord.':
    'Le son de l’accordage standard de la guitare ; de la fondamentale à la quarte d’un accord suspendu.',
  'Six semitones — exactly half an octave; a tense, restless, unresolved sound.':
    'Six demi-tons — exactement une demi-octave ; un son tendu, agité et non résolu.',
  'One semitone wider than a perfect 4th and one narrower than a perfect 5th — tense and unresolved where both perfects sound stable.':
    'Un demi-ton de plus que la quarte juste et un de moins que la quinte juste — tendu et non résolu là où les deux justes sonnent stables.',
  'The blue note; the gap inside a dominant 7th chord that wants to resolve.':
    'La blue note ; l’écart au cœur d’un accord de septième de dominante qui veut se résoudre.',
  'Seven semitones — the most stable interval after the octave; the power-chord sound.':
    'Sept demi-tons — l’intervalle le plus stable après l’octave ; le son du power chord.',
  'One semitone wider than a tritone — solid and at rest where the tritone is tense.':
    'Un demi-ton de plus que le triton — solide et au repos là où le triton est tendu.',
  'Root to fifth of almost every chord; the power-chord shape.':
    'De la fondamentale à la quinte de presque tous les accords ; la forme du power chord.',
  'Eight semitones — a wide, wistful interval; a major 3rd turned upside down.':
    'Huit demi-tons — un intervalle large et nostalgique ; une tierce majeure renversée.',
  'One semitone narrower than a major 6th — darker and more longing than the major 6th.':
    'Un demi-ton plus étroite que la sixte majeure — plus sombre et plus nostalgique qu’elle.',
  'The top of a first-inversion major chord; root to the minor 6th degree.':
    'Le haut d’un accord majeur en premier renversement ; de la fondamentale au 6e degré mineur.',
  'Nine semitones — a wide, warm, sweet interval; a minor 3rd turned upside down.':
    'Neuf demi-tons — un intervalle large, chaleureux et doux ; une tierce mineure renversée.',
  'One semitone wider than a minor 6th and one narrower than a minor 7th — brighter and sweeter than either.':
    'Un demi-ton plus large que la sixte mineure et un de moins que la septième mineure — plus lumineuse et plus douce que les deux.',
  'The added note of a 6th chord; root to the sixth degree of a major scale.':
    'La note ajoutée d’un accord de sixte ; de la fondamentale au sixième degré de la gamme majeure.',
  'Ten semitones — a wide, bluesy interval that leans forward and wants to resolve.':
    'Dix demi-tons — un intervalle large et bluesy qui pousse vers l’avant et veut se résoudre.',
  'One semitone narrower than a major 7th and one wider than a major 6th — restless where the major 7th sounds sharp and the major 6th sounds settled.':
    'Un demi-ton plus étroite que la septième majeure et un de plus que la sixte majeure — agitée là où la septième majeure sonne aiguë et la sixte majeure posée.',
  'The interval that makes a dominant 7th chord want to resolve.':
    'L’intervalle qui donne envie à un accord de septième de dominante de se résoudre.',
  'Eleven semitones — one short of the octave; a sharp, shimmering, almost-there sound.':
    'Onze demi-tons — un de moins que l’octave ; un son aigu, scintillant, presque arrivé.',
  'One semitone wider than a minor 7th and one narrower than the octave — it strains up toward the octave where the minor 7th sits lower and bluesier.':
    'Un demi-ton plus large que la septième mineure et un de moins que l’octave — elle tire vers l’octave là où la septième mineure reste plus basse et plus bluesy.',
  'The bright, jazzy top of a major 7th chord.':
    'Le sommet lumineux et jazzy d’un accord de septième majeure.',
  // Intervals Learning — progress board and Stats section
  'not started': 'pas commencé',
  'learning': 'en cours',
  'currently learning': 'en cours d’apprentissage',
  'In the system': 'Dans le système',
  'Started': 'Commencés',
  'Needs work': 'À travailler',
  'Accuracy': 'Précision',
  'Avg. time': 'Temps moyen',
  // Intervals Learning — the Interval Today card
  "Today's intervals": 'Les intervalles du jour',
  'intervals': 'intervalles',
  'new': 'à découvrir',
  'to tell apart': 'à distinguer',
  'Practise my weak intervals': 'Travailler mes intervalles faibles',
  'No weak intervals yet — keep practising and the Teacher will find them.':
    'Pas encore d’intervalles faibles — continue à t’entraîner et le Professeur les trouvera.',
  'broadening': 'élargissement',
  // Intervals Learning — the Interval Selector controls
  'Exercise': 'Exercice',
  'Interval selection': 'Choix des intervalles',
  'Difficulty': 'Difficulté',
  'Direction': 'Direction',
  'One interval': 'Un intervalle',
  'A group': 'Un groupe',
  'All learned': 'Tous ceux appris',
  'All 11': 'Les 11',
  'Fall speed': 'Vitesse de chute',
  'Slow': 'Lente',
  'Fast': 'Rapide',
  'Focused': 'Ciblé',
  'Mixed': 'Mélangé',
  'Ascending': 'Ascendant',
  'Descending': 'Descendant',
  'Both': 'Les deux',
  'Pick more than one interval to mix': 'Choisis plus d’un intervalle pour mélanger',
  'Practising:': 'Au programme :',
  "You'll hear two notes. Pick the interval between them.":
    'Tu vas entendre deux notes. Choisis l’intervalle entre elles.',
  "You'll see a note and an interval. Pick the note that far above it.":
    'Tu vas voir une note et un intervalle. Choisis la note située à cette distance au-dessus.',
  // Intervals Learning — inline educational content
  'About this interval': 'À propos de cet intervalle',
  'semitones': 'demi-tons',
  // Staff reading (StaffPracticeScreen)
  'A note is written on the staff. Pick its name — you will hear it after you answer.':
    'Une note est écrite sur la portée. Choisis son nom — tu l’entendras après avoir répondu.',
  'A note is written on the staff. Tap a place on the neck that plays it — any string counts. Afterwards every place that plays it is shown.':
    'Une note est écrite sur la portée. Touche un endroit du manche qui la joue — n’importe quelle corde compte. Ensuite, tous les endroits qui la jouent s’affichent.',
  'Range': 'Étendue',
  'Frets 0–3': 'Cases 0–3',
  'Frets 0–5': 'Cases 0–5',
  'Frets 0–12': 'Cases 0–12',
  'Natural notes only': 'Notes naturelles uniquement',
  'With sharps and flats': 'Avec dièses et bémols',
  'Bass music is written in the bass clef, one octave above how it sounds.':
    'La musique pour basse s’écrit en clé de fa, une octave au-dessus de ce qui sonne.',
  'Music for this instrument is written in the treble clef, one octave above how it sounds — the small 8 under the clef says so.':
    'La musique pour cet instrument s’écrit en clé de sol, une octave au-dessus de ce qui sonne — le petit 8 sous la clé l’indique.',
  'Music for this instrument is written in the treble clef, at the pitch it sounds.':
    'La musique pour cet instrument s’écrit en clé de sol, à la hauteur où elle sonne.',
  'Practise reading notes on the staff and finding them on the neck':
    'Entraîne-toi à lire les notes sur la portée et à les trouver sur le manche',
  'A note on the staff': 'Une note sur la portée',
  'Where is it written?': 'Où est-elle écrite ?',
  'Read a phrase': 'Lire une phrase',
  'A place on the neck is marked. Tap the staff where that note is written, fine-tune with the arrows, then press Check.':
    'Un endroit du manche est marqué. Touche la portée là où cette note est écrite, ajuste avec les flèches, puis appuie sur Vérifier.',
  'A short phrase is written on the staff. Name its notes one after another — at the end you will hear it.':
    'Une courte phrase est écrite sur la portée. Nomme ses notes l’une après l’autre — à la fin, tu l’entendras.',
  'Key signature': 'Armure',
  'The signs at the start of the staff hold for every note on that letter, unless a note carries its own sign.':
    'Les signes au début de la portée valent pour toutes les notes de ce nom, sauf si une note porte son propre signe.',
  'Notes of the key only': 'Notes de la tonalité uniquement',
  'With accidentals': 'Avec altérations',
  'Phrase': 'Phrase',
  'Tap the staff where the note is written': 'Touche la portée là où la note est écrite',
  'Up': 'Monter',
  'Down': 'Descendre',
  'Check': 'Vérifier',
  'Notes mastered': 'Notes maîtrisées',
  'Your progress on the staff': 'Ta progression sur la portée',
  "Today's staff reading": 'La lecture de partition du jour',
  'Read a round of notes on the staff — the notes that are due come first.':
    'Lis une manche de notes sur la portée — celles à réviser passent en premier.',
  'Open staff reading': 'Ouvrir la lecture de partition',
  'Play it on your guitar instead of naming it — the app listens through the microphone. Play the exact note you see, including its octave: that’s what this exercise is testing. Tapping still works.':
    'Joue-la sur ta guitare au lieu de choisir son nom — l’app écoute par le micro. Joue la note exacte que tu vois, avec son octave : c’est justement ce que cet exercice teste. Tu peux toujours aussi toucher l’écran.',
  '🎸 Play the phrase on your guitar': '🎸 Joue la phrase sur ta guitare',
  // Tab reading (TabPracticeScreen)
  'Tab reading': 'Lecture de tablature',
  'Write it in tab': 'L’écrire en tablature',
  'Read a riff': 'Lire un riff',
  'A number is written on one line of the tab. Name the note it plays — you will hear it after you answer.':
    'Un nombre est écrit sur une ligne de la tablature. Nomme la note qu’il joue — tu l’entendras après avoir répondu.',
  'A number is written on one line of the tab. Tap that exact place on the neck: the line is the string, the number is the fret.':
    'Un nombre est écrit sur une ligne de la tablature. Touche exactement cet endroit du manche : la ligne est la corde, le nombre est la case.',
  'A place on the neck is marked. Tap the tab line of its string, pick the fret number, then press Check.':
    'Un endroit du manche est marqué. Touche la ligne de tablature de sa corde, choisis le numéro de case, puis appuie sur Vérifier.',
  'A short riff is written in the tab. Name its notes one after another — at the end you will hear it.':
    'Un court riff est écrit en tablature. Nomme ses notes l’une après l’autre — à la fin, tu l’entendras.',
  'In a tab the top line is the thinnest, highest string and the bottom line the thickest — upside down from the neck in this app, where the thickest string is on top.':
    'Dans une tablature, la ligne du haut est la corde la plus fine et la plus aiguë, et celle du bas la plus grosse — à l’inverse du manche de cette app, où la corde la plus grosse est en haut.',
  'Practise reading tabs and finding every number on the neck':
    'Entraîne-toi à lire des tablatures et à trouver chaque nombre sur le manche',
  'Riff': 'Riff',
  'Tap the tab line of the string': 'Touche la ligne de tablature de la corde',
  'A number on the tab': 'Un nombre sur la tablature',
  'Fret': 'Case',
  'Places mastered': 'Endroits maîtrisés',
  'Your progress on the neck': 'Ta progression sur le manche',
  "Today's tab reading": 'La lecture de tablature du jour',
  'Read a round of tab — the places that are due come first.':
    'Lis une manche de tablature — les endroits à réviser passent en premier.',
  'Open tab reading': 'Ouvrir la lecture de tablature',
  'Play it on your guitar instead of naming it — the app listens through the microphone. A pitch can’t say which string it came from, so any place that plays the right note counts — an octave either way too. Tapping still works.':
    'Joue-la sur ta guitare au lieu de choisir son nom — l’app écoute par le micro. Une note jouée ne peut pas dire de quelle corde elle vient, donc n’importe quelle position qui joue la bonne note compte — une octave plus haut ou plus bas aussi. Tu peux toujours aussi toucher l’écran.',
  '🎸 Play the riff on your guitar': '🎸 Joue le riff sur ta guitare',
  // Tab reading, Slice 2: chords and technique symbols
  'Topic': 'Thème',
  'Single notes': 'Notes isolées',
  'Techniques': 'Techniques',
  'Name the chord': 'Nommer l’accord',
  'Play the chord': 'Jouer l’accord',
  'What does it mean?': 'Qu’est-ce que ça veut dire ?',
  'Which note do you hear at the end?': 'Quelle note entends-tu à la fin ?',
  'A chord is written in the tab: the numbers in one column are played together, and a line with no number is not played. Name the chord — you will hear it after you answer.':
    'Un accord est écrit en tablature : les nombres d’une même colonne se jouent ensemble, et une ligne sans nombre ne se joue pas. Nomme l’accord — tu l’entendras après avoir répondu.',
  'A chord is written in the tab. Tap every place it plays on the neck, one per string, leave the strings with no number alone, then press Check.':
    'Un accord est écrit en tablature. Touche chaque endroit qu’il joue sur le manche, un par corde, laisse les cordes sans nombre, puis appuie sur Vérifier.',
  'A playing technique is written in the tab. Say what the symbol means — you will hear it after you answer.':
    'Une technique de jeu est écrite en tablature. Dis ce que le symbole veut dire — tu l’entendras après avoir répondu.',
  'A playing technique is written in the tab. Name the note that sounds at the end of it.':
    'Une technique de jeu est écrite en tablature. Nomme la note qui sonne à la fin.',
  'The lowest note of these chords is the root, the note the chord is named after.':
    'La note la plus grave de ces accords est la fondamentale, la note qui donne son nom à l’accord.',
  'Chords in tab are not available for this instrument yet.':
    'Les accords en tablature ne sont pas encore disponibles pour cet instrument.',
  'Chords mastered': 'Accords maîtrisés',
  'Symbols mastered': 'Symboles maîtrisés',
  'Minor': 'Mineur',
  'Hammer-on': 'Hammer-on',
  'Pull-off': 'Pull-off',
  'Slide up': 'Slide ascendant',
  'Slide down': 'Slide descendant',
  'Bend': 'Bend',
  'Vibrato': 'Vibrato',
  'Muted note': 'Note étouffée',
  'Palm mute': 'Palm mute',
  'Hammer-on: pick the first note, then press the higher fret down hard without picking again.':
    'Hammer-on : joue la première note, puis frappe fort la case plus haute sans rejouer la corde.',
  'Pull-off: pick the first note, then pull that finger off so the lower fret sounds, without picking again.':
    'Pull-off : joue la première note, puis retire ce doigt en accrochant la corde pour faire sonner la case plus basse, sans rejouer la corde.',
  'Slide up: pick the first note and slide the same finger up the string to the second fret.':
    'Slide ascendant : joue la première note et fais glisser le même doigt vers le haut de la corde jusqu’à la seconde case.',
  'Slide down: pick the first note and slide the same finger down the string to the second fret.':
    'Slide descendant : joue la première note et fais glisser le même doigt vers le bas de la corde jusqu’à la seconde case.',
  'Bend: pick the note and push the string sideways until it sounds as high as the fret in the second number.':
    'Bend : joue la note et pousse la corde sur le côté jusqu’à ce qu’elle sonne aussi haut que la case du second nombre.',
  'Vibrato: let the note ring and shake its pitch slightly by moving the string.':
    'Vibrato : laisse sonner la note et fais légèrement varier sa hauteur en bougeant la corde.',
  'Muted note: touch the string without pressing it down and pick — a short click with no pitch.':
    'Note étouffée : effleure la corde sans appuyer et joue-la — un clic bref sans hauteur.',
  'Palm mute: rest the side of the picking hand on the strings by the bridge, for a short, muffled sound.':
    'Palm mute : pose le tranchant de la main qui joue sur les cordes près du chevalet, pour un son bref et étouffé.',
  // Task D — Scales fingering ("Show fingers" on the box).
  'Show fingers': 'Afficher les doigts',
  'The small number on each note is the finger that plays it: 1 index, 2 middle, 3 ring, 4 pinky, 0 an open string. One finger per fret — the hand stays in place and each finger owns its fret.':
    'Le petit chiffre sur chaque note est le doigt qui la joue : 1 index, 2 majeur, 3 annulaire, 4 auriculaire, 0 corde à vide. Un doigt par case — la main reste en place et chaque doigt garde sa case.',
  // Task C — Scales guided beginner path (ScalePathCard / ScaleRelativeScreen).
  'Five notes in one small box near the root — the shape most solos start from. Watch it once, then play it back.':
    'Cinq notes dans un petit motif près de la fondamentale : la forme par laquelle commencent la plupart des solos. Regarde-la une fois, puis rejoue-la.',
  'The same five notes, one box further: the root moves to the next string.':
    'Les cinq mêmes notes, un motif plus loin : la fondamentale passe sur la corde suivante.',
  'One run that crosses from box 1 into box 2 and back, so the two boxes become one stretch of the neck.':
    'Un seul passage qui va du motif 1 au motif 2 et revient, pour que les deux motifs ne fassent plus qu\'une seule portion du manche.',
  'The box you know is also a major pentatonic — only the home note changes.':
    'Le motif que tu connais est aussi une pentatonique majeure : seule la note de repos change.',
  'Play the box you already know, but start and end on its major home note — three frets above the minor root on the thickest string.':
    'Joue le motif que tu connais déjà, mais commence et termine sur sa note de repos majeure : trois cases au-dessus de la fondamentale mineure, sur la corde la plus grave.',
  'Box 1 of the minor pentatonic plus one extra note — the flat 5th, the "blue note".':
    'Le motif 1 de la pentatonique mineure plus une note : la quinte diminuée, la « blue note ».',
  'The full seven-note minor scale: the minor pentatonic box with two more notes filled in.':
    'La gamme mineure complète de sept notes : le motif de la pentatonique mineure avec deux notes de plus qui comblent les trous.',
  'The seven-note major scale — the one every other scale is compared to.':
    'La gamme majeure de sept notes : celle à laquelle on compare toutes les autres.',
  'One shape, two names':
    'Une forme, deux noms',
  'Same box, new home note':
    'Même motif, nouvelle note de repos',
  'Your path':
    'Ton parcours',
  'Step passed! Next up:':
    'Étape réussie ! Ensuite :',
  'Step passed!':
    'Étape réussie !',
  'Not passed yet — one more clean session usually does it.':
    'Pas encore réussie : en général, une session propre de plus suffit.',
  'Start this step':
    'Commencer cette étape',
  'Path complete! Practise any step again, or open More options for every scale.':
    'Parcours terminé ! Refais n\'importe quelle étape, ou ouvre Plus d\'options pour toutes les gammes.',
  'Hide steps':
    'Masquer les étapes',
  'All steps':
    'Toutes les étapes',
  'Finish the steps before it to unlock this one.':
    'Termine les étapes précédentes pour débloquer celle-ci.',
  // Scales — sequences, a ladder after Recall (wishlist 2026-10-03 item 6).
  'Sequences':
    'Séquences',
  'Groups of 3':
    'Groupes de 3',
  'Groups of 4':
    'Groupes de 4',
  'Thirds':
    'Tierces',
  'Play 1-2-3, then 2-3-4, then 3-4-5… one note further each time.':
    'Joue 1-2-3, puis 2-3-4, puis 3-4-5… une note plus loin à chaque fois.',
  'Play 1-2-3-4, then 2-3-4-5… one note further each time.':
    'Joue 1-2-3-4, puis 2-3-4-5… une note plus loin à chaque fois.',
  'Skip a note, then step back: 1-3, 2-4, 3-5…':
    'Saute une note, puis reviens d’un pas : 1-3, 2-4, 3-5…',
  'Box 1 in groups of 3, groups of 4, then thirds, up and down — so you know each note’s neighbour, not only the whole line. It opens once you can play box 1 from memory.':
    'Le motif 1 en groupes de 3, en groupes de 4, puis en tierces, en montant et en descendant — pour connaître la voisine de chaque note, pas seulement la ligne entière. L’étape s’ouvre quand tu sais jouer le motif 1 de mémoire.',
  'First, play the box from memory: only the root is lit.':
    'D’abord, joue le motif de mémoire : seule la fondamentale est allumée.',
  'Good runs in a row:':
    'Gammes réussies d’affilée :',
  'Play the box from memory':
    'Jouer le motif de mémoire',
  'Finish the rung before it to unlock this one.':
    'Termine l’échelon précédent pour débloquer celui-ci.',
  'Same five notes, same shape. Start and end on {minor} and they sound like a minor pentatonic — dark and bluesy. Start and end on {major} and the very same notes sound like a major pentatonic — bright and sweet.':
    'Les cinq mêmes notes, la même forme. Commence et termine sur {minor} et elles sonnent comme une pentatonique mineure : sombre et bluesy. Commence et termine sur {major} et exactement les mêmes notes sonnent comme une pentatonique majeure : lumineuse et douce.',
  'On the thickest string, the major home note sits three frets above the minor one.':
    'Sur la corde la plus grave, la note de repos majeure se trouve trois cases au-dessus de la mineure.',
  'Count the degrees from':
    'Compter les degrés depuis',
  'Back to the path':
    'Retour au parcours',
  // Scales path step 0 — "One string, four fingers" + "Make it ring" (ScaleRingTips).
  'Before any scale: one finger per fret on one string, up and back. Press just behind the fret and let every note ring.':
    'Avant toute gamme : un doigt par case sur une seule corde, en montant puis en revenant. Appuie juste derrière la frette et laisse sonner chaque note.',
  'One string, four fingers':
    'Une corde, quatre doigts',
  'Make it ring':
    'Fais sonner la note',
  'Where the fingertip goes':
    'Où placer le bout du doigt',
  'Arch the finger, thumb behind the neck':
    'Doigt arrondi, pouce derrière le manche',
  'Thumb behind the neck, about behind your middle finger — not wrapped over the top.':
    'Le pouce derrière le manche, à peu près derrière le majeur, sans passer par-dessus.',
  'Fingertip just behind the fret wire, not on top of it.':
    'Le bout du doigt juste derrière la frette, pas dessus.',
  'Arch the finger so only the tip touches: the string next to it must still ring.':
    'Arrondis le doigt pour que seul le bout touche : la corde voisine doit continuer à sonner.',
  'One finger per fret: finger 1 on fret 5, 2 on 6, 3 on 7, 4 on 8. Let each note ring before the next.':
    'Un doigt par case : le doigt 1 en case 5, le 2 en 6, le 3 en 7, le 4 en 8. Laisse sonner chaque note avant la suivante.',
  'Fingertip just behind the fret. Let each note ring before the next.':
    'Le bout du doigt juste derrière la frette. Laisse sonner chaque note avant la suivante.',

  // Task B — Scales metronome + gradual tempo ("Tap the scale in order").
  'Metronome': 'Métronome',
  'Slower': 'Plus lent',
  'Faster': 'Plus rapide',
  'Tempo': 'Tempo',
  'Play one note on each click. After a clean run — no wrong notes and nearly every note on the click — the tempo goes up by 4 BPM. Each scale and box keeps its own tempo.':
    'Jouez une note à chaque clic. Après un passage propre — aucune fausse note et presque toutes sur le clic — le tempo monte de 4 BPM. Chaque gamme et chaque motif garde son propre tempo.',
  'The scales and boxes you picked have different tempos — this sets them all.':
    'Les gammes et motifs choisis ont des tempos différents — ceci les règle tous.',
  'On time': 'En place',
  'Early': 'En avance',
  'Late': 'En retard',
  'Last run': 'Dernier passage',
  'on the click': 'sur le clic',
  'early': 'en avance',
  'late': 'en retard',
  'You are rushing — wait for the click.': 'Vous pressez — attendez le clic.',
  'You are dragging — play right on the click.': 'Vous traînez — jouez pile sur le clic.',
  'Clean run! Tempo up to': 'Passage propre ! Le tempo passe à',
  'Clean run at the top tempo!': 'Passage propre au tempo maximal !',
  'Not clean yet — the tempo stays at': 'Pas encore propre — le tempo reste à',

  // Wishlist 2026-10-03 item 1 — Scales: plain words, in place (ScaleTermHint).
  'What does this word mean?':
    'Que veut dire ce mot ?',
  'What the words mean':
    'Ce que veulent dire les mots',
  'A box is one hand-sized patch of the neck where the whole scale fits under your four fingers without moving your hand — its number says which patch, not a finger or a fret.':
    'Un motif est une zone du manche de la taille de la main où toute la gamme tient sous vos quatre doigts sans bouger la main — son numéro dit quelle zone, pas un doigt ni une case.',
  'The root is the scale’s home note, the one it is named after — it has the gold ring.':
    'La fondamentale est la note « maison » de la gamme, celle qui lui donne son nom — elle porte l’anneau doré.',
  'A degree is a note’s place in the scale, counted up from the root, which is 1 — a “b” before the number means one fret lower.':
    'Un degré est la place d’une note dans la gamme, comptée à partir de la fondamentale, qui est le 1 — un « b » devant le chiffre veut dire une case plus bas.',
  'Strings are numbered from the thinnest (1) to the thickest, so the thickest string — the lit row on top — has the highest number.':
    'Les cordes sont numérotées de la plus fine (1) à la plus grosse : la plus grosse — la rangée allumée en haut — porte donc le plus grand numéro.',
  'A fret is one numbered slot along the neck — press just behind its metal wire; the numbers under the board are the frets.':
    'Une case est un emplacement numéroté le long du manche — appuyez juste derrière sa barrette de métal ; les chiffres sous la grille sont les cases.',
};
