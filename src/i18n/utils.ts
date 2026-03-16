import es from './es.json';

const translations = es;

export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    value = value?.[k];
  }
  return value ?? key;
}
