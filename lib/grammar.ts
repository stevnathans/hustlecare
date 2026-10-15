const SILENT_H = /^(hour|honest|honou?r|heir)/i;
const YOO_OR_WUN_SOUND = /^(uni|use|usu|uti|eu|one|once|ura)/i;

/** Just the article: "a" or "an". Use when the name is styled separately (e.g. in a <span>). */
export function indefiniteArticle(name: string): 'a' | 'an' {
  const n = name.trim();
  if (SILENT_H.test(n)) return 'an';
  if (YOO_OR_WUN_SOUND.test(n)) return 'a';
  return /^[aeiou]/i.test(n) ? 'an' : 'a';
}

/** Article + name: "a Barbershop", "an Event Planning". */
export function withArticle(name: string): string {
  const n = name.trim();
  if (!n) return 'a';
  return `${indefiniteArticle(n)} ${n}`;
}