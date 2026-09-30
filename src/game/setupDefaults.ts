/**
 * The start screen's defaults, by language: pick the language first, then the form opens with these.
 */
export function setupDefaults(lang: "ko" | "en" = "ko") {
  const ko = lang === "ko";
  return {
    lang,
    name: ko ? "제이" : "Jae",
    gender: "F" as const,
    likes: "M" as const,
    birth: { year: 1997, month: 9, day: 28 },
    mbti: "ENFP",
    birthplace: ko ? "서울" : "Seoul",
    fated: { status: "stranger" as const, from: "same" as const },
  };
}
