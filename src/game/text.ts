/** Small bilingual helpers for the game runtime. */
export type Lang = "ko" | "en";
export type Bi = { ko: string; en: string };
export const bi = (ko: string, en: string): Bi => ({ ko, en });

export const COUNTRY_KO: Record<string, string> = {
  Korea: "한국", Canada: "캐나다", Japan: "일본", Germany: "독일", Australia: "호주", USA: "미국", UK: "영국", Singapore: "싱가포르", France: "프랑스",
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
  return "₩" + Math.round(units * unitWon).toLocaleString("ko-KR");
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
  return text.replace(/\{(\w+)\}(이랑|으로|과|와|이|가|은|는|을|를|로|랑)?(?:\((?:과|와|이|가|은|는|을|를)\))?/g, (m, key: string, josa?: string) => {
    if (!(key in vars)) return m;
    const name = vars[key] ?? "";
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

export const CITY_KO: Record<string, string> = {
  Seoul: "서울", Busan: "부산", Daejeon: "대전", Daegu: "대구", Gwangju: "광주", Jeju: "제주",
  Toronto: "토론토", Vancouver: "밴쿠버", Montreal: "몬트리올", Tokyo: "도쿄", Osaka: "오사카", Fukuoka: "후쿠오카",
  Berlin: "베를린", Munich: "뮌헨", Hamburg: "함부르크", Sydney: "시드니", Melbourne: "멜버른",
  "New York": "뉴욕", "San Francisco": "샌프란시스코", Seattle: "시애틀", Boston: "보스턴", London: "런던", Edinburgh: "에든버러",
  Singapore: "싱가포르", Paris: "파리", Lyon: "리옹",
};
