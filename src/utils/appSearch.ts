// App search — the index behind the search field at the top of the hamburger
// menu. Every place a player might look for (a menu page, a settings card, a
// learning domain, a home-screen control) is one `SearchEntry`: what it is
// called, the trail of menu pages that leads to it, and where tapping the
// result takes them. <App> owns the navigation (`openSearchResult`); this
// module is pure data + matching, so a new setting or screen only needs a row
// here (and, for a card, a matching `anchor` on its <SettingCard>).
//
// `label` and `path` are English source strings shown through `t()`, so a
// result always reads in the player's language. `keywords` are extra words a
// player might type instead of the exact title — kept in every supported
// language at once (all of them are always searchable, which costs nothing
// and lets a bilingual player type either way).

import type { Feature } from './features';
import type { LearnDomain } from '../components/LearnHub';

export type SearchTarget =
  /** A hamburger sub-page (settingsSections id), optionally scrolled to one
   *  card; `fallback` anchors are tried when that card is not on screen (the
   *  voice cards only render while Voice is the answer mode). */
  | { kind: 'section'; section: string; anchor?: string; fallback?: readonly string[] }
  /** A learning domain's screen, optionally scrolled to one control on it. */
  | { kind: 'domain'; domain: LearnDomain; anchor?: string }
  | { kind: 'stats' }
  | { kind: 'tuner' }
  | { kind: 'dailyChallenge' }
  | { kind: 'path' };

export interface SearchEntry {
  id: string;
  /** English source string, shown through `t()`. */
  label: string;
  emoji: string;
  /** Menu trail leading to the entry, English source strings, outermost first. */
  path: readonly string[];
  target: SearchTarget;
  /** Tier-gated: the result shows a lock badge (navigation decides the rest). */
  feature?: Feature;
  /** Only listed when the build/device offers it. */
  needs?: 'cloud' | 'voiceOrGuitar' | 'voice';
  /** Other words a player might type, in any supported language. */
  keywords: readonly string[];
}

const LEARN = 'Learn';
const PLAYING = 'Playing';
const SETTINGS = 'Settings';
const ACCOUNT = 'Account';
const NOTES = ['Learn', 'Notes'] as const;

export const SEARCH_ENTRIES: readonly SearchEntry[] = [
  // ── Menu pages ────────────────────────────────────────────────────
  {
    id: 'learn', label: 'Learn', emoji: '📚', path: [],
    target: { kind: 'section', section: 'learn' },
    keywords: ['practice', 'practise', 'lessons', 'domains', 'לימוד', 'ללמוד', 'תרגול', 'שיעורים', 'aprender', 'práctica', 'praticar', 'apprendre', 'pratique', 'imparare', 'pratica'],
  },
  {
    id: 'playing', label: 'Playing', emoji: '🎸', path: [],
    target: { kind: 'section', section: 'instrument' },
    keywords: ['instrument', 'guitar', 'bass', 'נגינה', 'כלי', 'גיטרה', 'בס', 'tocar', 'instrumento', 'guitarra', 'jouer', 'guitare', 'suonare', 'strumento', 'chitarra'],
  },
  {
    id: 'settings', label: 'Settings', emoji: '⚙️', path: [],
    target: { kind: 'section', section: 'settings' },
    keywords: ['preferences', 'options', 'config', 'הגדרות', 'העדפות', 'אפשרויות', 'ajustes', 'configuración', 'configurações', 'réglages', 'paramètres', 'impostazioni'],
  },
  {
    id: 'stats', label: 'Stats & progress', emoji: '📊', path: [],
    target: { kind: 'stats' },
    keywords: ['statistics', 'history', 'progress', 'heatmap', 'personal best', 'records', 'mastery', 'סטטיסטיקה', 'סטטיסטיקות', 'התקדמות', 'היסטוריה', 'שיא', 'שליטה', 'estadísticas', 'progreso', 'historial', 'estatísticas', 'progresso', 'histórico', 'statistiques', 'progrès', 'historique', 'statistiche', 'progressi', 'cronologia'],
  },
  {
    id: 'board', label: 'Feedback board', emoji: '💬', path: [], needs: 'cloud',
    target: { kind: 'section', section: 'board' },
    keywords: ['feedback', 'bug', 'suggestion', 'idea', 'contact', 'report', 'משוב', 'באג', 'הצעה', 'רעיון', 'פנייה', 'תקלה', 'comentarios', 'sugerencia', 'sugestão', 'avis', 'suggestion', 'commenti', 'suggerimento'],
  },
  {
    id: 'leaderboard', label: 'Leaderboard', emoji: '🏆', path: [], needs: 'cloud',
    target: { kind: 'section', section: 'leaderboard' },
    keywords: ['ranking', 'xp', 'top', 'compete', 'users', 'players', 'scoreboard', 'טבלת מובילים', 'לוח מובילים', 'לוח משתמשים', 'לוח תוצאות', 'טבלה', 'טבלת דירוג', 'דירוג', 'מובילים', 'משתמשים', 'שחקנים', 'תחרות', 'usuarios', 'jugadores', 'usuários', 'jogadores', 'utilisateurs', 'joueurs', 'utenti', 'giocatori', 'clasificación', 'classificação', 'classement', 'classifica'],
  },
  {
    id: 'account', label: 'Account', emoji: '👤', path: [], needs: 'cloud',
    target: { kind: 'section', section: 'account' },
    keywords: ['sign in', 'login', 'log in', 'google', 'sync', 'backup', 'profile', 'user', 'my account', 'חשבון', 'החשבון שלי', 'משתמש', 'המשתמש שלי', 'הפרופיל שלי', 'usuario', 'perfil', 'usuário', 'utilisateur', 'profil', 'utente', 'profilo', 'התחברות', 'כניסה', 'גוגל', 'סנכרון', 'גיבוי', 'פרופיל', 'cuenta', 'iniciar sesión', 'conta', 'entrar', 'compte', 'connexion', 'account', 'accedi'],
  },
  {
    id: 'plan', label: 'Your plan', emoji: '⭐', path: [ACCOUNT], needs: 'cloud',
    target: { kind: 'section', section: 'upgrade' },
    keywords: ['pro', 'premium', 'upgrade', 'subscription', 'buy', 'price', 'free', 'מסלול', 'מנוי', 'שדרוג', 'פרו', 'פרימיום', 'מחיר', 'רכישה', 'suscripción', 'mejorar', 'assinatura', 'abonnement', 'abbonamento'],
  },
  {
    id: 'badges', label: 'Badges', emoji: '🏅', path: [ACCOUNT],
    target: { kind: 'section', section: 'badges' },
    keywords: ['medals', 'achievements', 'awards', 'trophies', 'תגים', 'תג', 'מדליות', 'הישגים', 'פרסים', 'insignias', 'medallas', 'logros', 'medalhas', 'conquistas', 'médailles', 'succès', 'medaglie', 'traguardi'],
  },

  // ── Learn: the domains + tuner ────────────────────────────────────
  {
    id: 'daily', label: 'Daily practice', emoji: '📅', path: [LEARN], feature: 'premiumTeacher',
    target: { kind: 'domain', domain: 'daily' },
    keywords: ['today', 'teacher', 'daily goal', 'review', 'תרגול יומי', 'היום', 'מורה', 'יעד יומי', 'חזרה', 'diaria', 'hoy', 'diária', 'hoje', 'quotidien', "aujourd'hui", 'giornaliera', 'oggi'],
  },
  {
    id: 'notes', label: 'Notes', emoji: '🎵', path: [LEARN],
    target: { kind: 'domain', domain: 'notes' },
    keywords: ['fretboard', 'neck', 'note practice', 'home', 'drill', 'תווים', 'צוואר', 'שריגים', 'מסך הבית', 'תרגול תווים', 'notas', 'mástil', 'braço', 'notes', 'manche', 'note', 'manico'],
  },
  {
    id: 'intervals', label: 'Intervals', emoji: '🎸', path: [LEARN], feature: 'intervalDrill',
    target: { kind: 'domain', domain: 'intervals' },
    keywords: ['interval', 'third', 'fifth', 'octave', 'ear', 'מרווחים', 'מרווח', 'טרצה', 'קווינטה', 'אוקטבה', 'שמיעה', 'intervalos', 'tercera', 'quinta', 'oído', 'ouvido', 'intervalles', 'quinte', 'oreille', 'intervalli', 'orecchio'],
  },
  {
    id: 'scales', label: 'Scales', emoji: '🎼', path: [LEARN], feature: 'scaleDrill',
    target: { kind: 'domain', domain: 'scales' },
    keywords: ['scale', 'pentatonic', 'box', 'major', 'minor', 'licks', 'modes', 'סולמות', 'סולם', 'פנטטוני', 'מז׳ור', 'מינור', 'ליקים', 'escalas', 'pentatónica', 'pentatônica', 'gammes', 'pentatonique', 'scale', 'pentatonica'],
  },
  {
    id: 'staff', label: 'Staff reading', emoji: '📖', path: [LEARN], feature: 'staffReading',
    target: { kind: 'domain', domain: 'staff' },
    keywords: ['sheet music', 'notation', 'clef', 'read music', 'sight reading', 'חמשה', 'קריאת תווים', 'מפתח סול', 'תווים כתובים', 'partitura', 'pentagrama', 'lectura', 'pauta', 'leitura', 'partition', 'portée', 'lecture', 'pentagramma', 'lettura', 'spartito'],
  },
  {
    id: 'tabs', label: 'Tab reading', emoji: '📝', path: [LEARN], feature: 'tabReading',
    target: { kind: 'domain', domain: 'tabs' },
    keywords: ['tab', 'tabs', 'tablature', 'riff', 'chords', 'hammer on', 'slide', 'טאבים', 'טאב', 'טבלטורה', 'ריף', 'אקורדים', 'tablatura', 'acordes', 'tablature', 'accords', 'intavolatura', 'accordi'],
  },
  {
    id: 'tuner', label: 'Tuner', emoji: '🎛️', path: [LEARN],
    target: { kind: 'tuner' },
    keywords: ['tune', 'tuning', 'pitch', 'כוונן', 'כיוון', 'לכוון', 'טיונר', 'afinador', 'afinar', 'accordeur', 'accorder', 'accordatore', 'accordare'],
  },
  {
    id: 'daily-challenge', label: 'Fret of the Day', emoji: '🔥', path: [LEARN],
    target: { kind: 'dailyChallenge' },
    keywords: ['daily challenge', 'challenge a friend', 'wordle', 'streak', 'share', 'אתגר יומי', 'אתגר חבר', 'שיתוף', 'רצף', 'desafío diario', 'reto diario', 'compartir', 'desafio diário', 'compartilhar', 'défi quotidien', 'partager', 'sfida del giorno', 'condividi'],
  },
  {
    id: 'path', label: 'Learning Path', emoji: '🗺️', path: [...NOTES], feature: 'learningPath',
    target: { kind: 'path' },
    keywords: ['path', 'checkpoints', 'roadmap', 'מסלול למידה', 'נקודות ציון', 'ruta', 'camino', 'trilha', 'parcours', 'percorso'],
  },

  // ── Notes: the home-screen practice selector ──────────────────────
  {
    id: 'sel-strings', label: 'Strings', emoji: '🎚️', path: [...NOTES],
    target: { kind: 'domain', domain: 'notes', anchor: 'sel-strings' },
    keywords: ['string', 'multi', 'multi-string', 'מיתרים', 'מיתר', 'כמה מיתרים', 'cuerdas', 'cuerda', 'cordas', 'corda', 'cordes', 'corde'],
  },
  {
    id: 'sel-mode', label: 'Note by Fret', emoji: '🎯', path: [...NOTES],
    target: { kind: 'domain', domain: 'notes', anchor: 'sel-mode' },
    keywords: ['mode', 'by fret', 'by note', 'fret by note', 'circle of fifths', 'by string', 'fifths', 'alphabet', 'מצב', 'סריג', 'לפי סריג', 'לפי תו', 'מעגל הקווינטות', 'modo', 'traste', 'casa', 'mode', 'case', 'tasto'],
  },
  {
    id: 'sel-frets', label: 'Fret range', emoji: '📏', path: [...NOTES],
    target: { kind: 'domain', domain: 'notes', anchor: 'sel-frets' },
    keywords: ['frets', 'neck', 'half', 'window', 'טווח שריגים', 'שריגים', 'חצי צוואר', 'trastes', 'casas', 'cases', 'tasti'],
  },
  {
    id: 'sel-difficulty', label: 'Difficulty', emoji: '🪜', path: [...NOTES],
    target: { kind: 'domain', domain: 'notes', anchor: 'sel-difficulty' },
    keywords: ['level', 'dots', 'naturals', 'full', 'auto advance', 'stages', 'קושי', 'רמה', 'נקודות', 'טבעיים', 'התקדמות אוטומטית', 'dificultad', 'nivel', 'dificuldade', 'nível', 'difficulté', 'niveau', 'difficoltà', 'livello'],
  },

  // ── Playing ───────────────────────────────────────────────────────
  {
    id: 'instruments', label: 'Instruments', emoji: '🎸', path: [PLAYING],
    target: { kind: 'section', section: 'instrument', anchor: 'instruments' },
    keywords: ['instrument', 'guitar', 'bass', 'ukulele', 'mandolin', 'banjo', 'strings', 'frets', 'tuning', '7 string', 'כלי נגינה', 'גיטרה', 'בס', 'יוקלילי', 'מנדולינה', 'בנג׳ו', 'כוונון', 'instrumentos', 'guitarra', 'bajo', 'baixo', 'guitare', 'basse', 'chitarra', 'basso'],
  },
  {
    id: 'notation', label: 'Note names', emoji: '🔤', path: [PLAYING],
    target: { kind: 'section', section: 'instrument', anchor: 'notation' },
    keywords: ['solfege', 'do re mi', 'abc', 'letters', 'notation', 'שמות תווים', 'סולפג׳', 'דו רה מי', 'אותיות', 'solfeo', 'nombres de notas', 'nomes das notas', 'solfejo', 'noms des notes', 'solfège', 'nomi delle note', 'solfeggio'],
  },
  {
    id: 'accidental', label: 'Sharps or flats', emoji: '♯', path: [PLAYING],
    target: { kind: 'section', section: 'instrument', anchor: 'accidental' },
    keywords: ['sharp', 'flat', 'accidentals', 'diez', 'bemol', 'דיאז', 'במול', 'סימני היתק', 'sostenido', 'sustenido', 'dièse', 'bémol', 'diesis', 'bemolle'],
  },
  {
    id: 'fretRange', label: 'Fret range', emoji: '📏', path: [PLAYING], feature: 'fretRange',
    target: { kind: 'section', section: 'instrument', anchor: 'fretRange' },
    keywords: ['frets', 'window', 'part of the neck', 'precise', 'טווח שריגים', 'שריגים', 'חלון', 'חלק מהצוואר', 'rango de trastes', 'trastes', 'casas', 'plage de cases', 'intervallo di tasti'],
  },

  // ── Settings ──────────────────────────────────────────────────────
  {
    id: 'quickAccess', label: 'Quick access', emoji: '📌', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'quickAccess' },
    keywords: ['shortcuts', 'pin', 'floating button', 'גישה מהירה', 'קיצורים', 'נעיצה', 'כפתור צף', 'acceso rápido', 'atajos', 'acesso rápido', 'atalhos', 'accès rapide', 'raccourcis', 'accesso rapido', 'scorciatoie'],
  },
  {
    id: 'showScore', label: 'Score & celebrations', emoji: '🎉', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'showScore' },
    keywords: ['score', 'streak', 'points', 'confetti', 'ניקוד', 'נקודות', 'רצף', 'חגיגות', 'puntuación', 'racha', 'pontuação', 'sequência', 'score', 'série', 'punteggio', 'serie'],
  },
  {
    id: 'dailyReminder', label: 'Daily reminder', emoji: '⏰', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'dailyReminder' },
    keywords: ['notification', 'notify', 'alarm', 'remind', 'streak', 'תזכורת', 'התראה', 'התראות', 'שעון מעורר', 'רצף', 'recordatorio', 'notificación', 'lembrete', 'notificação', 'rappel', 'notification', 'promemoria', 'notifica'],
  },
  {
    id: 'soundLevel', label: 'Sound & vibration', emoji: '🔊', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'soundLevel' },
    keywords: ['sound', 'volume', 'mute', 'silent', 'vibrate', 'haptics', 'audio', 'צליל', 'צלילים', 'עוצמה', 'ווליום', 'השתקה', 'שקט', 'רטט', 'סאונד', 'sonido', 'volumen', 'silencio', 'vibración', 'som', 'vibração', 'son', 'muet', 'vibration', 'suono', 'muto', 'vibrazione'],
  },
  {
    id: 'appearance', label: 'Appearance', emoji: '🎨', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'appearance' },
    keywords: ['theme', 'season', 'dark', 'light', 'night', 'day', 'colors', 'colours', 'מראה', 'ערכת נושא', 'עונה', 'כהה', 'בהיר', 'לילה', 'יום', 'צבעים', 'tema', 'apariencia', 'oscuro', 'claro', 'aparência', 'escuro', 'thème', 'apparence', 'sombre', 'clair', 'aspetto', 'scuro', 'chiaro'],
  },
  {
    id: 'seasonDeco', label: 'Seasonal background', emoji: '❄️', path: [SETTINGS], feature: 'seasonalBackdrop',
    target: { kind: 'section', section: 'settings', anchor: 'seasonDeco' },
    keywords: ['snow', 'snowflakes', 'leaves', 'decorations', 'background', 'רקע', 'שלג', 'פתיתי שלג', 'עלים', 'קישוטים', 'רקע עונתי', 'fondo', 'nieve', 'fundo', 'neve', 'fond', 'neige', 'sfondo'],
  },
  {
    id: 'buttonDepth', label: 'Button depth', emoji: '🔘', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'buttonDepth' },
    keywords: ['3d', 'buttons', 'flat', 'raised', 'כפתורים', 'תלת מימד', 'עומק', 'botones', 'botões', 'boutons', 'pulsanti'],
  },
  {
    id: 'language', label: 'Language', emoji: '🌐', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'language' },
    keywords: ['hebrew', 'english', 'spanish', 'translate', 'שפה', 'עברית', 'אנגלית', 'תרגום', 'idioma', 'español', 'inglés', 'português', 'langue', 'français', 'lingua', 'italiano'],
  },
  {
    id: 'leftHanded', label: 'Left-handed', emoji: '🫲', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'leftHanded' },
    keywords: ['left hand', 'lefty', 'mirror', 'flip', 'יד שמאל', 'שמאלי', 'שמאלית', 'שמאליים', 'היפוך', 'מראה', 'zurdo', 'mano izquierda', 'canhoto', 'gaucher', 'mancino'],
  },
  {
    id: 'answerMode', label: 'How you answer', emoji: '🎤', path: [SETTINGS], needs: 'voiceOrGuitar',
    target: { kind: 'section', section: 'settings', anchor: 'answerMode' },
    keywords: ['voice', 'microphone', 'mic', 'speak', 'tap', 'play guitar', 'answer mode', 'קול', 'דיבור', 'מיקרופון', 'מיק', 'הקשה', 'לנגן', 'אופן תשובה', 'voz', 'micrófono', 'microfone', 'voix', 'micro', 'voce', 'microfono'],
  },
  {
    id: 'voiceEngine', label: 'Voice engine', emoji: '🗣️', path: [SETTINGS, 'How you answer'], needs: 'voice', feature: 'voiceProfile',
    target: { kind: 'section', section: 'settings', anchor: 'voiceEngine', fallback: ['answerMode'] },
    keywords: ['speech recognition', 'voice recognition', 'זיהוי קול', 'זיהוי דיבור', 'מנוע קול', 'reconocimiento de voz', 'reconhecimento de voz', 'reconnaissance vocale', 'riconoscimento vocale'],
  },
  {
    id: 'voiceProfile', label: 'Your voice profile', emoji: '🎙️', path: [SETTINGS, 'How you answer'], needs: 'voice', feature: 'voiceProfile',
    target: { kind: 'section', section: 'settings', anchor: 'voiceProfile', fallback: ['voiceEngine', 'answerMode'] },
    keywords: ['calibrate', 'calibration', 'recordings', 'record', 'כיול', 'הקלטות', 'פרופיל קול', 'הקלטה', 'calibrar', 'grabaciones', 'gravações', 'calibrer', 'enregistrements', 'calibrare', 'registrazioni'],
  },
  {
    id: 'showMastery', label: 'Mastery on the fretboard', emoji: '📶', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'showMastery' },
    keywords: ['mastery bars', 'accuracy', 'overlay', 'שליטה', 'דיוק', 'פסי שליטה', 'dominio', 'precisión', 'domínio', 'precisão', 'maîtrise', 'précision', 'padronanza', 'precisione'],
  },
  {
    id: 'colorblind', label: 'Colour-blind heatmap markers', emoji: '✓', path: [SETTINGS],
    target: { kind: 'section', section: 'settings', anchor: 'colorblind' },
    keywords: ['color blind', 'colorblind', 'accessibility', 'heatmap', 'עיוורון צבעים', 'נגישות', 'מפת חום', 'daltonismo', 'accesibilidad', 'acessibilidade', 'daltonisme', 'accessibilité', 'daltonismo', 'accessibilità'],
  },
  {
    id: 'masteryWindow', label: 'Mastery time window', emoji: '🗓️', path: [SETTINGS], feature: 'masteryMaps',
    target: { kind: 'section', section: 'settings', anchor: 'masteryWindow' },
    keywords: ['date range', 'recent questions', 'day', 'period', 'טווח תאריכים', 'תקופה', 'יום', 'שאלות אחרונות', 'rango de fechas', 'período', 'intervalo de datas', 'période', 'periodo'],
  },

  // ── Account ───────────────────────────────────────────────────────
  {
    id: 'signIn', label: 'Sign in with Google', emoji: '🔑', path: [ACCOUNT], needs: 'cloud',
    target: { kind: 'section', section: 'account', anchor: 'account' },
    keywords: ['sign in', 'login', 'log in', 'sign out', 'logout', 'google', 'התחברות', 'התחבר', 'כניסה', 'התנתקות', 'יציאה', 'iniciar sesión', 'cerrar sesión', 'entrar', 'sair', 'connexion', 'déconnexion', 'accedi', 'esci'],
  },
];

export interface SearchContext {
  configured: boolean;
  voiceSupported: boolean;
  guitarSupported: boolean;
}

function available(e: SearchEntry, ctx: SearchContext): boolean {
  if (e.needs === 'cloud') return ctx.configured;
  if (e.needs === 'voiceOrGuitar') return ctx.voiceSupported || ctx.guitarSupported;
  if (e.needs === 'voice') return ctx.voiceSupported;
  return true;
}

/** Lower-case, strip accents and Hebrew points/geresh, unify dashes/space. */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-֑ͯ-ׇ]/g, '')
    .replace(/[׳'’`"״]/g, '')
    .replace(/[-_/&·,.]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldScore(token: string, field: string, weight: number): number {
  if (!field) return 0;
  if (field === token) return weight * 4;
  if (field.startsWith(token)) return weight * 3;
  if (field.includes(' ' + token)) return weight * 2;
  if (field.includes(token)) return weight;
  return 0;
}

/**
 * Rank the entries against `query`. Every word of the query must match
 * somewhere (title, a keyword or the menu trail); titles weigh most. Matches
 * the translated title (`t`) and the English one, so a result can be found by
 * the name shown on screen in either language.
 */
export function searchApp(
  query: string,
  t: (s: string) => string,
  ctx: SearchContext,
): SearchEntry[] {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return [];
  const scored: Array<{ e: SearchEntry; score: number; i: number }> = [];
  SEARCH_ENTRIES.forEach((e, i) => {
    if (!available(e, ctx)) return;
    const titles = [normalizeSearch(t(e.label)), normalizeSearch(e.label)];
    const words = e.keywords.map(normalizeSearch);
    const trail = e.path.flatMap((p) => [normalizeSearch(t(p)), normalizeSearch(p)]);
    let total = 0;
    for (const tok of tokens) {
      let best = 0;
      for (const f of titles) best = Math.max(best, fieldScore(tok, f, 10));
      for (const f of words) best = Math.max(best, fieldScore(tok, f, 5));
      for (const f of trail) best = Math.max(best, fieldScore(tok, f, 1));
      if (best === 0) return;
      total += best;
    }
    scored.push({ e, score: total, i });
  });
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((s) => s.e);
}

// ── Jump to a card ───────────────────────────────────────────────────
// After <App> switches to the target page, the card is not in the DOM until
// React commits, so poll a few frames for `[data-search-anchor]`, then scroll
// it to the middle of the screen and flash it so the eye lands on it.

const FLASH_CLASS = 'search-flash';
const MAX_FRAMES = 40;
// Fallbacks only count once the page has had a few frames to render the
// preferred card, so a slow commit never lands on the second choice.
const FALLBACK_AFTER = 8;

export function jumpToSearchAnchor(anchor: string, fallback: readonly string[] = []): void {
  if (typeof document === 'undefined') return;
  const find = (id: string) => document.querySelector<HTMLElement>(`[data-search-anchor="${id}"]`);
  let frames = 0;
  const tryFind = () => {
    let el = find(anchor);
    if (!el && frames >= FALLBACK_AFTER) {
      for (const id of fallback) { el = find(id); if (el) break; }
    }
    if (!el) {
      if (++frames < MAX_FRAMES) requestAnimationFrame(tryFind);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove(FLASH_CLASS);
    // Restart the animation even if the same card was flashed a moment ago.
    void el.offsetWidth;
    el.classList.add(FLASH_CLASS);
    window.setTimeout(() => el.classList.remove(FLASH_CLASS), 2000);
  };
  requestAnimationFrame(tryFind);
}
