/**
 * Nationality (yours and the destined person's): where "home" is — where your family lives, what
 * "flying home" means, what you're homesick for abroad (한인마트 for a Korean in New York; a Japanese
 * grocery for someone from Osaka), military service, the 수능, a 제사. The charts don't use it.
 */
import type { LifeState } from "../sim/types";
import { PLACES, countryName } from "../destiny/birthplace";

type Bi = { ko: string; en: string };
const HOME: Record<string, { food: Bi; market: Bi; lang: Bi }> = {
  KR: { food: { ko: "한국 음식", en: "Korean food" }, market: { ko: "한인마트", en: "the Korean market" }, lang: { ko: "한국말", en: "Korean" } },
  JP: { food: { ko: "일본 음식", en: "Japanese food" }, market: { ko: "일본 식료품점", en: "the Japanese grocery" }, lang: { ko: "일본어", en: "Japanese" } },
  CN: { food: { ko: "중국 음식", en: "Chinese food" }, market: { ko: "중국 마트", en: "the Chinese supermarket" }, lang: { ko: "중국어", en: "Chinese" } },
  TW: { food: { ko: "대만 음식", en: "Taiwanese food" }, market: { ko: "아시안 마트", en: "the Asian market" }, lang: { ko: "중국어", en: "Mandarin" } },
  VN: { food: { ko: "베트남 음식", en: "Vietnamese food" }, market: { ko: "베트남 식료품점", en: "the Vietnamese grocery" }, lang: { ko: "베트남어", en: "Vietnamese" } },
  TH: { food: { ko: "태국 음식", en: "Thai food" }, market: { ko: "아시안 마트", en: "the Asian market" }, lang: { ko: "태국어", en: "Thai" } },
  US: { food: { ko: "미국 음식", en: "American food" }, market: { ko: "수입 식료품점", en: "the import grocery" }, lang: { ko: "영어", en: "English" } },
  GB: { food: { ko: "영국 음식", en: "British food" }, market: { ko: "수입 식료품점", en: "the import grocery" }, lang: { ko: "영어", en: "English" } },
  CA: { food: { ko: "캐나다 음식", en: "Canadian food" }, market: { ko: "수입 식료품점", en: "the import grocery" }, lang: { ko: "영어", en: "English" } },
  AU: { food: { ko: "호주 음식", en: "Australian food" }, market: { ko: "수입 식료품점", en: "the import grocery" }, lang: { ko: "영어", en: "English" } },
  FR: { food: { ko: "프랑스 음식", en: "French food" }, market: { ko: "프랑스 식료품점", en: "the French deli" }, lang: { ko: "프랑스어", en: "French" } },
  DE: { food: { ko: "독일 음식", en: "German food" }, market: { ko: "유럽 식료품점", en: "the European deli" }, lang: { ko: "독일어", en: "German" } },
};

/** Country code from a setup value ("KR", "kr", "한국", "Japan"); undefined if unknown. */
export function nationCode(input: string | undefined): string | undefined {
  if (!input) return;
  const t = input.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  const codes = [...new Set(PLACES.map((p) => p.country))];
  return codes.find((c) => countryName(c, "ko") === t || countryName(c, "en").toLowerCase() === t.toLowerCase());
}

/** For a nationality picker: Korea first, then the rest A–Z. */
export function nationalityOptions(lang: "ko" | "en" = "ko"): Array<{ id: string; name: string }> {
  const codes = [...new Set(PLACES.map((p) => p.country))].filter((c) => c !== "KR" && c !== "KP");
  const rest = codes.map((id) => ({ id, name: countryName(id, lang) })).sort((a, b) => a.name.localeCompare(b.name, lang));
  return [{ id: "KR", name: countryName("KR", lang) }, ...rest];
}

export function nationalityOf(state: LifeState): string {
  return String(state.flags.nationality ?? "KR");
}

/** {homeland} {homeFood} {homeMarket} {homeLang} — as language pairs (x_ko / x_en). */
export function homeVars(state: LifeState): Record<string, string> {
  const n = nationalityOf(state);
  const h = HOME[n] ?? { food: { ko: "고향 음식", en: "food from home" }, market: { ko: "수입 식료품점", en: "the import grocery" }, lang: { ko: "모국어", en: "your own language" } };
  const land = { ko: countryName(n, "ko"), en: countryName(n, "en") };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries({ homeland: land, homeFood: h.food, homeMarket: h.market, homeLang: h.lang })) {
    out[k] = v.ko;
    out[`${k}_ko`] = v.ko;
    out[`${k}_en`] = v.en;
  }
  return out;
}
