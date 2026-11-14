// UI language and word language are independent. Override with ?ui=xx&words=yy.
const params = new URLSearchParams(location.search);
export const UI_LANG = params.get('ui') || 'en';
export const WORD_LANG = params.get('words') || 'sv';

let dict = {};

export async function loadI18n() {
  dict = await (await fetch(`lang/${UI_LANG}.json`)).json();
  document.documentElement.lang = UI_LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
}

export function t(key, vars = {}) {
  const s = dict[key] ?? key;
  if (typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export async function loadWords() {
  return (await fetch(`words/${WORD_LANG}.json`)).json();
}
