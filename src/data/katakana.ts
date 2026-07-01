import { rawItems, getLongVowelNote, HiraganaItem } from './hiragana';

// Function to convert a Hiragana string to a Katakana string
export function hiraganaToKatakana(hira: string): string {
  return hira.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
}

export const katakanaData: HiraganaItem[] = rawItems.map(([no, hiragana, romaji, isLongVowel]) => {
  const isL = isLongVowel === 1;
  const kata = hiraganaToKatakana(hiragana);
  return {
    no: no + 1000, // Offset by 1000 to prevent FSRS card key collision
    hiragana: kata, // Reuse 'hiragana' field name to integrate with existing UI components flawlessly
    romaji,
    isLongVowel: isL,
    specialNote: isL ? getLongVowelNote(kata, romaji) : undefined,
    type: 'katakana'
  } as HiraganaItem;
});
