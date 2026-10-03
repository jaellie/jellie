/**
 * Food and customs follow your nationality, not your language: a Korean-language game for an American
 * player says 마카로니 앤 치즈 where a Korean player gets 라면. Text carries {f:key} (data/world/culture.json),
 * optionally followed by a paired particle ("{f:ramen}을(를)"), resolved here for the word that lands.
 */
import data from "../../data/world/culture.json";
import { hasBatchim } from "../game/text";

const REGION = data.regionOf as Record<string, string>;
const WORDS = data.words as unknown as Record<string, Record<string, [string, string]>>;

export function cultureRegion(nationality: string | undefined): string {
  return REGION[String(nationality ?? "KR").toUpperCase()] ?? "OTHER";
}

export function cultureWord(key: string, nationality: string | undefined, lang: "ko" | "en"): string | undefined {
  const w = WORDS[key];
  if (!w) return;
  const pair = w[cultureRegion(nationality)] ?? w.OTHER ?? w.KR;
  return pair[lang === "ko" ? 0 : 1];
}

const PARTICLE: Record<string, [string, string]> = { "을(를)": ["을", "를"], "이(가)": ["이", "가"], "은(는)": ["은", "는"], "와(과)": ["과", "와"], "(으)로": ["으로", "로"], "(이)": ["이", ""], "(이)랑": ["이랑", "랑"] };

/** Put the culture words into a text (both languages). Unknown keys are left as they are. */
export function applyCulture(text: string, nationality: string | undefined, lang: "ko" | "en"): string {
  if (!text.includes("{f:")) return text;
  return text.replace(/\{f:(\w+)\}(을\(를\)|이\(가\)|은\(는\)|와\(과\)|\(으\)로|\(이\)랑|\(이\))?/g, (m, key: string, p: string | undefined, at: number, all: string) => {
    let w = cultureWord(key, nationality, lang);
    if (w === undefined) return m;
    // English: a word opening a sentence gets a capital ("Pizza", not "pizza").
    if (lang === "en" && (at === 0 || /[.!?(]\s*$/.test(all.slice(0, at)))) w = w[0].toUpperCase() + w.slice(1);
    if (!p) return w;
    const [withB, without] = PARTICLE[p];
    const last = w.charCodeAt(w.length - 1);
    if (p === "(으)로" && last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 === 8) return w + "로";
    return w + (hasBatchim(w) ? withB : without);
  });
}
