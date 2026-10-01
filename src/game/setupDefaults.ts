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
    /** Where you live now (for the story only; the charts use the birthplace). Same city list as the birthplace. */
    home: ko ? "서울" : "Seoul",
    homeQuestion: ko ? "현재 어디 살고 있나요?" : "Where do you live now?",
    homeHint: ko ? "사주·점성술엔 영향 없어요. 이야기의 무대가 돼요." : "Doesn't change your chart — it's where your story takes place.",
    fated: { status: "stranger" as const, from: "same" as const },
  };
}
