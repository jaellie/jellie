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

export const CITY_KO: Record<string, string> = {
  Seoul: "서울", Busan: "부산", Daejeon: "대전", Daegu: "대구", Gwangju: "광주", Jeju: "제주",
  Toronto: "토론토", Vancouver: "밴쿠버", Montreal: "몬트리올", Tokyo: "도쿄", Osaka: "오사카", Fukuoka: "후쿠오카",
  Berlin: "베를린", Munich: "뮌헨", Hamburg: "함부르크", Sydney: "시드니", Melbourne: "멜버른",
  "New York": "뉴욕", "San Francisco": "샌프란시스코", Seattle: "시애틀", Boston: "보스턴", London: "런던", Edinburgh: "에든버러",
  Singapore: "싱가포르", Paris: "파리", Lyon: "리옹",
};
