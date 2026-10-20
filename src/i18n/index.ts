import { zhTW, type MessageKey } from './zh-TW';

export type { MessageKey };

const dictionaries: Record<string, Record<MessageKey, string>> = { 'zh-TW': zhTW };
let locale = 'zh-TW';

export function setLocale(l: string): void {
  if (dictionaries[l]) locale = l;
}

/** 取得介面文字，{name} 會被 params 取代。 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const raw = dictionaries[locale][key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}

/** 動態組出的 key（例如 `scale.${name}`）；字典沒有時回傳 fallback。 */
export function tDynamic(key: string, fallback: string): string {
  return key in dictionaries[locale] ? dictionaries[locale][key as MessageKey] : fallback;
}
