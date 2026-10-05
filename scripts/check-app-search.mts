// Hand-run diagnostic for the menu search index (src/utils/appSearch.ts):
// every entry is reachable by its own English title, ids are unique, and a
// handful of typical queries (English, Hebrew, other languages, typos of
// case/accents) land the expected entry first.
//   node --experimental-strip-types scripts/check-app-search.mts
import { SEARCH_ENTRIES, searchApp, type SearchContext } from '../src/utils/appSearch.ts';

const ctx: SearchContext = { configured: true, voiceSupported: true, guitarSupported: true };
const t = (s: string) => s;
let failed = 0;
const fail = (msg: string) => { failed++; console.error('FAIL', msg); };

const ids = new Set<string>();
for (const e of SEARCH_ENTRIES) {
  if (ids.has(e.id)) fail(`duplicate id ${e.id}`);
  ids.add(e.id);
  const hits = searchApp(e.label, t, ctx);
  if (!hits.some((h) => h.id === e.id)) fail(`"${e.label}" does not find ${e.id}`);
}

const expectFirst: Array<[string, string]> = [
  ['tuner', 'tuner'],
  ['כוונן', 'tuner'],
  ['fret of the day', 'daily-challenge'],
  ['challenge a friend', 'daily-challenge'],
  ['אתגר יומי', 'daily-challenge'],
  ['יד שמאל', 'leftHanded'],
  ['שמאלי', 'leftHanded'],
  ['ווליום', 'soundLevel'],
  ['רטט', 'soundLevel'],
  ['שפה', 'language'],
  ['עברית', 'language'],
  ['Do Re Mi', 'notation'],
  ['במול', 'accidental'],
  ['טאבים', 'tabs'],
  ['פנטטוני', 'scales'],
  ['מרווחים', 'intervals'],
  ['dark', 'appearance'],
  ['שלג', 'seasonDeco'],
  ['idioma', 'language'],
  ['zurdo', 'leftHanded'],
  ['GAUCHER', 'leftHanded'],
  ['solfège', 'notation'],
  ['badges', 'badges'],
  ['תגים', 'badges'],
  ['התחברות', 'account'],
  ['לוח משתמשים', 'leaderboard'],
  ['טבלה', 'leaderboard'],
  ['משתמש', 'account'],
  ['הפרופיל שלי', 'account'],
  ['פרימיום', 'plan'],
  ['קושי', 'sel-difficulty'],
  ['כיול', 'voiceProfile'],
  ['heatmap', 'stats'],
  ['color blind', 'colorblind'],
];
for (const [q, id] of expectFirst) {
  const top = searchApp(q, t, ctx)[0];
  if (top?.id !== id) fail(`"${q}" → ${top?.id ?? '(none)'} (expected ${id})`);
}

if (searchApp('zzzz', t, ctx).length) fail('nonsense query returned results');
const guest: SearchContext = { configured: false, voiceSupported: false, guitarSupported: false };
if (searchApp('leaderboard', t, guest).length) fail('cloud entry listed without Supabase');
if (searchApp('voice engine', t, guest).length) fail('voice entry listed without voice support');

console.log(failed ? `${failed} failure(s)` : `OK — ${SEARCH_ENTRIES.length} entries`);
process.exitCode = failed ? 1 : 0;
