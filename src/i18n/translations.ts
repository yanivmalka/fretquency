// Lightweight i18n: the English source string doubles as the lookup key, so
// call sites just wrap literal text in t('...') instead of inventing a
// separate key namespace. Missing entries (and English itself) fall back to
// the original string untouched.
//
// Each translated language lives in its own file and is downloaded only when
// it is the player's language (their stored pick, or the regional guess on a
// first launch) — an English player never fetches a dictionary at all. The
// service worker keeps them out of the precache and caches each one the first
// time it is fetched (vite.config.ts), so a language once used works offline.

export type Lang = 'en' | 'he' | 'es' | 'pt-BR' | 'fr' | 'it' | 'de' | 'ja';

export const LANGUAGES: Array<{ value: Lang; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'he', label: 'עברית' },
  { value: 'es', label: 'Español' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
];

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'he' || value === 'es' || value === 'pt-BR' || value === 'fr' || value === 'it' || value === 'de' || value === 'ja';
}

// BCP-47 locale for dates shown in the active language.
export function dateLocale(lang: Lang): string {
  return lang === 'he' ? 'he-IL' : lang === 'es' ? 'es-ES' : lang === 'pt-BR' ? 'pt-BR' : lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : lang === 'de' ? 'de-DE' : lang === 'ja' ? 'ja-JP' : 'en-GB';
}

type Dictionary = Record<string, string>;

const loaders: Record<Exclude<Lang, 'en'>, () => Promise<Dictionary>> = {
  he: () => import('./translations.he.ts').then((m) => m.he),
  es: () => import('./translations.es.ts').then((m) => m.es),
  'pt-BR': () => import('./translations.ptBR.ts').then((m) => m.ptBR),
  fr: () => import('./translations.fr.ts').then((m) => m.fr),
  it: () => import('./translations.it.ts').then((m) => m.it),
  de: () => import('./translations.de.ts').then((m) => m.de),
  ja: () => import('./translations.ja.ts').then((m) => m.ja),
};

const dictionaries: Partial<Record<Lang, Dictionary>> = { en: {} };
const pending: Partial<Record<Lang, Promise<void>>> = {};

export function isDictionaryLoaded(lang: Lang): boolean {
  return dictionaries[lang] !== undefined;
}

// Downloads `lang`'s dictionary once; concurrent callers share the request. A
// failed download (offline, before the language was ever cached) rejects and
// is forgotten, so the next call tries again.
export function loadDictionary(lang: Lang): Promise<void> {
  if (lang === 'en' || dictionaries[lang]) return Promise.resolve();
  pending[lang] ??= loaders[lang]().then(
    (dict) => { dictionaries[lang] = dict; },
    (err: unknown) => { delete pending[lang]; throw err; },
  );
  return pending[lang];
}

// Falls back to the English source while (or if) `lang` is not loaded.
export function translate(lang: Lang, source: string): string {
  if (lang === 'en') return source;
  return dictionaries[lang]?.[source] ?? source;
}
