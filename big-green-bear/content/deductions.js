/*
 * deductions.js — questions the player can answer on the board ("Theories").
 *
 * The player's answer is a HYPOTHESIS. Only the right answer becomes
 * confirmed truth (condition: { type: "deduced", id }). Wrong answers are
 * recorded and can be retried; they never block progress or change endings.
 *
 *   question        localized
 *   conditions      when the question appears (it stays once solved)
 *   options         [{ id, text, wrongText? }]
 *   answer          option id (or a list of ids, if more than one is right)
 *   correctText / wrongText
 *   onCorrect       effects
 *
 * A deduction can be available long before the story "reveals" the answer.
 * That is intentional: players who figure it out early are allowed to be right.
 */
BGB.story.deductions({
  d_lily_timing: {
    question: { en: "When did Lily really see Nini run toward the fountain?", ko: "릴리가 분수 쪽으로 뛰어가는 니니를 본 건 실제로 언제였을까?" },
    conditions: [
      { type: "evidence", id: "t_lily_nini" },
      { type: "evidence", id: "t_lily_packing" },
    ],
    options: [
      {
        id: "before",
        text: { en: "Right before the parade, like she said", ko: "그녀 말대로, 퍼레이드 직전" },
        wrongText: { en: "Lily remembered something specific about what she was doing at the time.", ko: "릴리는 그때 자기가 뭘 하고 있었는지를 구체적으로 기억했다." },
      },
      {
        id: "during",
        text: { en: "During the parade", ko: "퍼레이드 도중" },
        wrongText: { en: "During the parade, Mr. Finch saw Nini at the stage. And Lily was at her stall.", ko: "퍼레이드 도중이라면 핀치 씨가 무대 앞에서 니니를 봤다. 릴리는 노점에 있었고." },
      },
      { id: "after_ten", text: { en: "After ten, while she was packing up", ko: "열 시 넘어서, 꽃을 정리하던 중에" } },
      {
        id: "never",
        text: { en: "She never saw her", ko: "사실 못 봤다" },
        wrongText: { en: "Lily described her yellow coat, and what she was looking for. She saw someone.", ko: "릴리는 노란 우비도, 니니가 뭘 찾고 있었는지도 말했다. 누군가를 보긴 봤다." },
      },
    ],
    answer: "after_ten",
    correctText: {
      en: "After ten. Lily remembered what she was doing more clearly than when she was doing it. People do.",
      ko: "열 시 이후다. 릴리는 '언제'보다 '무얼 하고 있었는지'를 더 또렷하게 기억했다. 사람은 원래 그렇다.",
    },
    onCorrect: [{ type: "setFlag", id: "lily_timing_deduced" }],
  },

  d_1147: {
    question: { en: "Why does 11:47 keep appearing?", ko: "왜 자꾸 11시 47분이 보일까?" },
    conditions: [
      { type: "flag", id: "11_47_noticed" },
      { type: "flag", id: "gate_1147_seen" },
    ],
    options: [
      {
        id: "broken",
        text: { en: "The clock is just broken", ko: "그냥 시계가 고장 난 거다" },
        wrongText: { en: "Maybe. But you didn't only see it on the clock.", ko: "그럴 수도. 하지만 시계에서만 본 게 아니다." },
      },
      {
        id: "message",
        text: { en: "Someone is leaving it as a message", ko: "누군가 메시지로 남기고 있다" },
        wrongText: { en: "Who would? And how would they put it where there's no clock at all?", ko: "누가? 그리고 시계도 없는 곳에 그걸 어떻게 남긴다는 걸까?" },
      },
      { id: "happened", text: { en: "Something happened at 11:47", ko: "11시 47분에 무슨 일이 있었다" } },
      {
        id: "coincidence",
        text: { en: "It's a coincidence", ko: "우연이다" },
        wrongText: { en: "Twice is a coincidence. Keep count.", ko: "두 번이면 우연이다. 계속 세어 보자." },
      },
    ],
    answer: "happened",
    correctText: {
      en: "You can't say what, yet. But it isn't the clock that's stuck. It's the time.",
      ko: "무슨 일인지는 아직 모른다. 하지만 멈춘 건 시계가 아니다. 그 시각이다.",
    },
    onCorrect: [{ type: "setFlag", id: "deduced_1147_early" }],
  },

  d_blame: {
    // Lets the player accuse someone without breaking anything.
    question: { en: "Whose fault is it that Nini is missing?", ko: "니니가 사라진 건 누구 탓일까?" },
    conditions: [{ type: "contradiction", id: "c_nini_parade" }],
    options: [
      {
        id: "lily",
        text: { en: "Lily", ko: "릴리" },
        wrongText: { en: "Lily sold flowers and remembered a yellow coat. Is that a crime?", ko: "릴리는 꽃을 팔았고, 노란 우비를 기억했을 뿐이다. 그게 죄일까?" },
      },
      {
        id: "finch",
        text: { en: "Mr. Finch", ko: "핀치 씨" },
        wrongText: { en: "He didn't cancel a festival. That's a decision. Whether it was the wrong one, you don't know yet.", ko: "그는 축제를 취소하지 않았다. 그건 하나의 결정이다. 잘못된 결정이었는지는 아직 모른다." },
      },
      {
        id: "nini",
        text: { en: "Nini herself", ko: "니니 자신" },
        wrongText: { en: "She's small. She was looking for something she loved.", ko: "니니는 아직 어리다. 아끼는 걸 찾고 있었을 뿐이다." },
      },
      { id: "unknown", text: { en: "You don't know enough yet", ko: "아직 판단할 만큼 모른다" } },
    ],
    answer: "unknown",
    correctText: {
      en: "Not yet. Maybe not ever, the way you mean it. Keep looking.",
      ko: "아직은. 어쩌면 지금 생각하는 그런 뜻으로는 영영. 계속 찾아보자.",
    },
  },
});
