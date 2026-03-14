import es from './es.json';
import en from './en.json';

const translations = { es, en } as const;

export type Lang = keyof typeof translations;
export const defaultLang: Lang = 'es';
export const languages = ['es', 'en'] as const;

export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang === 'en') return 'en';
  return 'es';
}

export function getLocalizedPath(lang: Lang, path: string): string {
  return `/${lang}${path}`;
}
