/** Small bilingual helpers for the game runtime. */
import { nameEn } from "../world/names";
import { findPlace } from "../destiny/birthplace";
export type Lang = "ko" | "en";
export type Bi = { ko: string; en: string };
export const bi = (ko: string, en: string): Bi => ({ ko, en });

export const COUNTRY_KO: Record<string, string> = {
  Korea: "한국", Canada: "캐나다", Japan: "일본", Germany: "독일", Australia: "호주", USA: "미국", UK: "영국", Singapore: "싱가포르", France: "프랑스",
  // ISO codes (a move to where the destined person lives, from the birthplace gazetteer).
  CN: "중국", TW: "대만", HK: "홍콩", MO: "마카오", MN: "몽골", VN: "베트남", TH: "태국", PH: "필리핀", ID: "인도네시아", MY: "말레이시아", IN: "인도",
  AE: "아랍에미리트", TR: "튀르키예", UZ: "우즈베키스탄", KZ: "카자흐스탄", RU: "러시아", NZ: "뉴질랜드", MX: "멕시코", BR: "브라질", AR: "아르헨티나", PE: "페루",
  CL: "칠레", CO: "콜롬비아", IE: "아일랜드", NL: "네덜란드", BE: "벨기에", PT: "포르투갈", AT: "오스트리아", ES: "스페인", IT: "이탈리아", CH: "스위스",
  SE: "스웨덴", NO: "노르웨이", DK: "덴마크", FI: "핀란드", PL: "폴란드", CZ: "체코", HU: "헝가리", GR: "그리스", EG: "이집트", ZA: "남아프리카공화국", KE: "케냐", NG: "나이지리아", KP: "북한",
};
export const DEST_KO: Record<string, string> = { paris: "파리", tokyo: "도쿄", coast: "바닷가 마을" };
export const EDU_KO: Record<string, Bi> = {
  BACHELOR: bi("대학을 졸업했다", "Graduated from university"),
  MASTER: bi("석사 과정을 마쳤다", "Finished a master's degree"),
  PHD: bi("박사가 되었다", "Earned a doctorate"),
  HIGH_SCHOOL: bi("고등학교를 졸업했다", "Finished high school"),
  NONE: bi("", ""),
};
export const SPEAKER_NAME: Record<string, Bi> = {
  me: bi("나", "Me"),
  mom: bi("엄마", "Mom"),
  dad: bi("아빠", "Dad"),
  boss: bi("팀장님", "Manager"),
  coworker: bi("동료", "Coworker"),
  work: bi("회사", "Work"),
  recruiter: bi("채용 담당자", "Recruiter"),
  professor: bi("교수님", "Professor"),
  mentor: bi("멘토", "Mentor"),
  stranger: bi("낯선 사람", "Stranger"),
  barista: bi("바리스타", "Barista"),
  instructor: bi("강사님", "Instructor"),
  app: bi("알림", "Notification"),
  ex: bi("???", "???"),
  relative: bi("친척", "Relative"),
  inlaw: bi("상대 부모님", "Their parents"),
  judge: bi("판사님", "Judge"),
  nurse: bi("간호사", "Nurse"),
  doctor: bi("의사 선생님", "Doctor"),
  fated: bi("그 사람", "That person"),
  police: bi("경찰", "Police"),
  lawyer: bi("변호사", "Lawyer"),
  fortune: bi("점집 할머니", "The fortune teller"),
  neighbor: bi("이웃", "Neighbor"),
  loanShark: bi("사채업자", "Loan shark"),
  cultist: bi("포교하던 사람", "The recruiter"),
  bank: bi("은행", "Bank"),
  landlord: bi("집주인", "Landlord"),
  unknown: bi("모르는 번호", "Unknown number"),
  reporter: bi("기자", "Reporter"),
  scout: bi("캐스팅 담당자", "Talent scout"),
  teacher: bi("담임 선생님", "Homeroom teacher"),
  counselor: bi("상담 선생님", "Counselor"),
  officer: bi("병무청", "Military Manpower Office"),
  tax: bi("세무서", "Tax office"),
  card: bi("카드사", "Card company"),
  insurer: bi("보험사", "Insurance company"),
};

export function krw(units: number, unitWon: number): string {
  const won = Math.round(units * unitWon);
  return (won < 0 ? "-₩" : "₩") + Math.abs(won).toLocaleString("ko-KR");
}

/** True if the word's last syllable has a final consonant (받침). Latin names: rough heuristic. */
export function hasBatchim(word: string): boolean {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  return /[lmnrgkbpt]$/i.test(ch);
}

/** Resolve "와(과)", "이(가)", "은(는)", "을(를)", "(으)로" after names. */
export function fixJosa(text: string): string {
  const pairs: Record<string, [string, string]> = { "와(과)": ["과", "와"], "과(와)": ["과", "와"], "이(가)": ["이", "가"], "은(는)": ["은", "는"], "을(를)": ["을", "를"], "(으)로": ["으로", "로"], "(이)": ["이", ""] };
  return text.replace(/([가-힣A-Za-z0-9]+)(와\(과\)|과\(와\)|이\(가\)|은\(는\)|을\(를\)|\(으\)로)/g, (_m, w: string, p: string) => {
    const [withB, without] = pairs[p];
    const last = w.charCodeAt(w.length - 1);
    if (p === "(으)로" && last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 === 8) return w + "로"; // ㄹ받침
    if (p === "(으)로" && /l$/i.test(w)) return w + "로";
    return w + (hasBatchim(w) ? withB : without);
  });
}

const JOSA_PAIRS: Record<string, [string, string]> = {
  와: ["과", "와"], 과: ["과", "와"], 이: ["이", "가"], 가: ["이", "가"], 은: ["은", "는"], 는: ["은", "는"],
  을: ["을", "를"], 를: ["을", "를"], 으로: ["으로", "로"], 로: ["으로", "로"], 이랑: ["이랑", "랑"], 랑: ["이랑", "랑"],
};

/**
 * Put names into "{partner}", "{friend}"… placeholders and fix ONLY the particle written right after each one
 * ("{partner}는" → "Ren은"/"하나는"). Everything else in the sentence is left exactly as written — never run a
 * josa rewrite over free text (it turns "있는" into "있은" and "아이" into "아가").
 */
export function fillNames(text: string, vars: Record<string, string | undefined>): string {
  // An author may also write the marker form ("{partner}와(과)") — swallow the "(과)" part too.
  return text.replace(/\{(\w+)\}(이랑|으로|과|와|이|가|은|는|을|를|로|랑)?(?:\((?:과|와|이|가|은|는|을|를)\))?/g, (m, key: string, josa: string | undefined, at: number) => {
    if (!(key in vars)) return m;
    let name = vars[key] ?? "";
    // "your older brother" at the start of a sentence → "Your older brother".
    if (/^[a-z]/.test(name) && /(^|[.!?]\s+|[("'“]\s*)$/.test(text.slice(0, at))) name = name[0].toUpperCase() + name.slice(1);
    if (!josa || !name) return name + (josa ?? "");
    const [withB, without] = JOSA_PAIRS[josa];
    const last = name.charCodeAt(name.length - 1);
    const rieul = (last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 === 8) || /l$/i.test(name);
    if (withB === "으로" && rieul) return name + "로";
    return name + (hasBatchim(name) ? withB : without);
  });
}

/** Vars given as a language pair (who_ko / who_en) resolve to their base name ({who}) for the language. */
export function langVars(vars: Record<string, string>, lang: "ko" | "en"): Record<string, string> {
  const out = { ...vars };
  for (const [k, v] of Object.entries(vars)) {
    const m = /^(\w+)_(ko|en)$/.exec(k);
    if (m && m[2] === lang) out[m[1]] = v;
  }
  return out;
}

/** A city's Korean name: the table below, else the birthplace gazetteer (Los Angeles → 로스앤젤레스). */
export function cityKo(city: string): string {
  return CITY_KO[city] ?? findPlace(city)?.ko ?? city;
}

export const CITY_KO: Record<string, string> = {
  Seoul: "서울", Busan: "부산", Daejeon: "대전", Daegu: "대구", Gwangju: "광주", Jeju: "제주",
  Toronto: "토론토", Vancouver: "밴쿠버", Montreal: "몬트리올", Tokyo: "도쿄", Osaka: "오사카", Fukuoka: "후쿠오카",
  Berlin: "베를린", Munich: "뮌헨", Hamburg: "함부르크", Sydney: "시드니", Melbourne: "멜버른",
  "New York": "뉴욕", "San Francisco": "샌프란시스코", Seattle: "시애틀", Boston: "보스턴", London: "런던", Edinburgh: "에든버러",
  Singapore: "싱가포르", Paris: "파리", Lyon: "리옹",
};

// ---- English: family words & romanized names ------------------------------------------------------

const FAMILY_EN: Record<string, string> = {
  외할머니: "Grandma (Mom's side)", 친할머니: "Grandma (Dad's side)", 할머니: "Grandma",
  외할아버지: "Grandpa (Mom's side)", 친할아버지: "Grandpa (Dad's side)", 할아버지: "Grandpa",
  고모부: "my uncle", 이모부: "my uncle", 삼촌: "my uncle", 외삼촌: "my uncle", 작은아버지: "my uncle", 큰아버지: "my uncle",
  고모: "my aunt", 이모: "my aunt", 숙모: "my aunt", 외숙모: "my aunt", 큰어머니: "my aunt", 작은어머니: "my aunt",
  오빠: "my older brother", 형: "my older brother", 누나: "my older sister", 언니: "my older sister",
  남동생: "my younger brother", 여동생: "my younger sister", 동생: "my younger sibling",
  엄마: "Mom", 아빠: "Dad", 딸: "daughter", 아들: "son", 조카: "my niece/nephew", 사촌: "my cousin",
};

const INI = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MED = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const FIN = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
/** A final consonant carried onto a following vowel (선우 → Seonu, not Seon-u). */
const FIN_LINK = ["", "g", "kk", "ks", "n", "nj", "nh", "d", "r", "lg", "lm", "lb", "ls", "lt", "lp", "lh", "m", "b", "ps", "s", "ss", "ng", "j", "ch", "k", "t", "p", "h"];

/** Revised Romanization of a Korean name ("재윤" → "Jaeyun", "보리" → "Bori"). */
export function romanize(hangul: string): string {
  const syl = [...hangul].map((ch) => {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c > 11171) return undefined;
    return { i: Math.floor(c / 588), m: Math.floor((c % 588) / 28), f: c % 28 };
  });
  let out = "";
  syl.forEach((s, k) => {
    if (!s) return;
    out += INI[s.i] + MED[s.m];
    const next = syl[k + 1];
    out += s.f === 0 ? "" : next && next.i === 11 ? FIN_LINK[s.f] : FIN[s.f];
  });
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** English text with no Korean left: family words translated, NPC names in their English form (서준 → Noah), other names romanized. */
export function englishOnly(text: string): string {
  const t = /[가-힣]/.test(text) ? text.replace(/[가-힣]+/g, (w) => FAMILY_EN[w] ?? nameEn(w) ?? romanize(w)) : text;
  return plainEnglish(t);
}

/**
 * English reads unnaturally with Korean-style punctuation: no tildes ("Hmm~", "Thanks~!") and no em
 * dashes. "Look — I made…" → "Look, I made…"; a line that trails off ("Wait—") → "Wait…".
 */
export function plainEnglish(text: string): string {
  if (!/[~—]/.test(text)) return text;
  return text
    .replace(/(\d)\s*~\s*(\d)/g, "$1 to $2")
    .replace(/~+/g, "")
    .replace(/\s*—\s*(?=$|[)"'’”…])/g, "…")
    .replace(/([.!?…][)"'’”]*)\s*—\s*/g, "$1 ")
    .replace(/(^|[(“‘])\s*—\s*/g, "$1")
    .replace(/\s*—\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/ {2,}/g, " ");
}

/** Deep copy of a UI payload with every string passed through fn. */
export function mapPayload<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === "string") return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => mapPayload(v, fn)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = mapPayload(v, fn);
    return out as T;
  }
  return value;
}

/** Deep copy of a UI payload with every string made English-only. */
export function englishPayload<T>(value: T): T {
  if (typeof value === "string") return englishOnly(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => englishPayload(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = englishPayload(v);
    return out as T;
  }
  return value;
}
