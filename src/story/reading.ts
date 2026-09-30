/**
 * "Why this is happening": the chart signals behind a fated turning point, in words a player can read
 * under the big popup's title — "사주: 도화 · 천간합 · 점성술: 목성 5하우스 · 상대: 역마".
 * The outcome is still 70% chart / 30% choice; this only shows the hand of fate.
 */
type Bi = { ko: string; en: string };

const SAJU: Record<string, Bi> = {
  DOHWA: { ko: "도화", en: "Peach Blossom (도화)" },
  YEOKMA: { ko: "역마", en: "Traveling Horse (역마)" },
  HWAGAE: { ko: "화개", en: "Canopy (화개)" },
  CHEONEUL_GWIIN: { ko: "천을귀인", en: "Noble helper (천을귀인)" },
  대운전환: { ko: "대운 전환", en: "a new 10-year luck cycle" },
  STEM_COMBINATION: { ko: "천간합", en: "stem combination" },
  STEM_CLASH: { ko: "천간충", en: "stem clash" },
  SIX_HARMONY: { ko: "육합", en: "six harmony" },
  THREE_HARMONY: { ko: "삼합", en: "three harmony" },
  HALF_HARMONY: { ko: "반합", en: "half harmony" },
  BRANCH_CLASH: { ko: "지지충", en: "branch clash" },
  PUNISHMENT: { ko: "형", en: "punishment" },
  HARM: { ko: "해", en: "harm" },
};
const PLANET: Record<string, Bi> = {
  SUN: { ko: "태양", en: "Sun" }, MOON: { ko: "달", en: "Moon" }, MERCURY: { ko: "수성", en: "Mercury" }, VENUS: { ko: "금성", en: "Venus" },
  MARS: { ko: "화성", en: "Mars" }, JUPITER: { ko: "목성", en: "Jupiter" }, SATURN: { ko: "토성", en: "Saturn" }, URANUS: { ko: "천왕성", en: "Uranus" },
  NEPTUNE: { ko: "해왕성", en: "Neptune" }, PLUTO: { ko: "명왕성", en: "Pluto" },
};
const ASPECT: Record<string, Bi> = {
  CONJUNCTION: { ko: "합", en: "conjunct" }, OPPOSITION: { ko: "충", en: "opposite" }, SQUARE: { ko: "사각", en: "square" },
  TRINE: { ko: "삼각", en: "trine" }, SEXTILE: { ko: "육각", en: "sextile" },
  conjunction: { ko: "합", en: "conjunct" }, hard: { ko: "긴장", en: "tense with" }, harmonious: { ko: "조화", en: "in harmony with" },
};
const SIGN: Record<string, Bi> = {
  ARIES: { ko: "양자리", en: "Aries" }, TAURUS: { ko: "황소자리", en: "Taurus" }, GEMINI: { ko: "쌍둥이자리", en: "Gemini" }, CANCER: { ko: "게자리", en: "Cancer" },
  LEO: { ko: "사자자리", en: "Leo" }, VIRGO: { ko: "처녀자리", en: "Virgo" }, LIBRA: { ko: "천칭자리", en: "Libra" }, SCORPIO: { ko: "전갈자리", en: "Scorpio" },
  SAGITTARIUS: { ko: "사수자리", en: "Sagittarius" }, CAPRICORN: { ko: "염소자리", en: "Capricorn" }, AQUARIUS: { ko: "물병자리", en: "Aquarius" }, PISCES: { ko: "물고기자리", en: "Pisces" },
};

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

/** One tag ("사주:DOHWA", "점성:JUPITER@5H", "상대:사주:YEOKMA"…) in words, or undefined if unknown. */
export function tagWords(tag: string): { who: "me" | "them"; kind: "saju" | "astro"; text: Bi } | undefined {
  const them = tag.startsWith("상대:");
  const t = them ? tag.slice(3) : tag;
  const who = them ? "them" : "me";
  if (t.startsWith("사주:")) {
    const k = t.slice(3).replace(/@(year|month|day)$/, "");
    const w = SAJU[k];
    return w ? { who, kind: "saju", text: w } : undefined;
  }
  if (!t.startsWith("점성:")) return;
  const a = t.slice(3);
  let m = /^(\w+)@(\d+)H$/.exec(a);
  if (m && PLANET[m[1]]) return { who, kind: "astro", text: { ko: `${PLANET[m[1]].ko} ${m[2]}하우스`, en: `${PLANET[m[1]].en} in the ${ordinal(Number(m[2]))} house` } };
  m = /^(\w+) (CONJUNCTION|OPPOSITION|SQUARE|TRINE|SEXTILE) (\w+)$/.exec(a);
  if (m && PLANET[m[1]] && PLANET[m[3]]) return { who, kind: "astro", text: { ko: `${PLANET[m[1]].ko}·${PLANET[m[3]].ko} ${ASPECT[m[2]].ko}`, en: `${PLANET[m[1]].en} ${ASPECT[m[2]].en} ${PLANET[m[3]].en}` } };
  m = /^(\w+) return$/.exec(a);
  if (m && PLANET[m[1]]) return { who, kind: "astro", text: { ko: `${PLANET[m[1]].ko} 회귀`, en: `${PLANET[m[1]].en} return` } };
  m = /^진행 ?(\w+)>(\w+):(\w+)$/.exec(a);
  if (m && PLANET[m[1]] && PLANET[m[2]]) return { who, kind: "astro", text: { ko: `진행 ${PLANET[m[1]].ko}·${PLANET[m[2]].ko} ${ASPECT[m[3]]?.ko ?? ""}`.trim(), en: `progressed ${PLANET[m[1]].en} ${ASPECT[m[3]]?.en ?? "to"} ${PLANET[m[2]].en}` } };
  m = /^진행(\w+)→(\w+)$/.exec(a);
  if (m && PLANET[m[1]] && SIGN[m[2]]) return { who, kind: "astro", text: { ko: `진행 ${PLANET[m[1]].ko} ${SIGN[m[2]].ko} 진입`, en: `progressed ${PLANET[m[1]].en} into ${SIGN[m[2]].en}` } };
  return;
}

/** A short reading from a turning point's signals: up to 2 사주 + 2 점성술 of yours, and 1–2 of theirs. */
export function readingOf(signals: string[]): Bi | undefined {
  const words = signals.map(tagWords).filter((x): x is NonNullable<typeof x> => !!x);
  const pick = (who: "me" | "them", kind: "saju" | "astro", n: number) => {
    const seen = new Set<string>();
    return words.filter((w) => w.who === who && w.kind === kind && !seen.has(w.text.ko) && seen.add(w.text.ko)).slice(0, n);
  };
  const mine = [...pick("me", "saju", 2), ...pick("me", "astro", 2)];
  const theirs = [...pick("them", "saju", 1), ...pick("them", "astro", 1)];
  if (!mine.length && !theirs.length) return;
  const part = (label: Bi, ws: typeof words) => (ws.length ? { ko: `${label.ko} ${ws.map((w) => w.text.ko).join(" · ")}`, en: `${label.en} ${ws.map((w) => w.text.en).join(" · ")}` } : undefined);
  const saju = part({ ko: "사주:", en: "Saju:" }, mine.filter((w) => w.kind === "saju"));
  const astro = part({ ko: "점성술:", en: "Astrology:" }, mine.filter((w) => w.kind === "astro"));
  const them = part({ ko: "상대:", en: "Them:" }, theirs);
  const parts = [saju, astro, them].filter((x): x is Bi => !!x);
  return { ko: parts.map((p) => p.ko).join("  /  "), en: parts.map((p) => p.en).join("  /  ") };
}
