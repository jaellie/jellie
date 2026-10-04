/*
 * hints.js — three-level hints.
 *
 * The Hint button shows the FIRST goal (in this file's order) that is
 * active: chapter matches, `when` passes, `done` does not.
 *   levels[0]  a nudge           (never spoils)
 *   levels[1]  a specific clue   (never spoils)
 *   levels[2]  nearly the answer (player is warned first)
 *
 * Every condition in a chapter's completeWhen should be covered by a goal
 * here — that's how a stuck player always has a way forward.
 */
BGB.story.hints({
  h1_meet: {
    chapter: "ch1",
    when: [{ type: "not", condition: { type: "flag", id: "rain_started" } }],
    done: [{ type: "flag", id: "rain_started" }],
    levels: [
      { en: "It's a festival. Have a look around the square.", ko: "축제다. 광장을 한번 둘러보자." },
      { en: "Someone small in a yellow raincoat wants to talk to you.", ko: "노란 우비를 입은 꼬마가 너랑 얘기하고 싶어 한다." },
      { en: "In Bellflower Square, choose \"Talk to Nini\". (Or simply keep exploring: the evening moves on either way.)", ko: "벨플라워 광장에서 '니니에게 말 걸기'를 고르자. (그냥 계속 둘러봐도 저녁은 흘러간다.)" },
    ],
  },
  h1_ask: {
    chapter: "ch1",
    when: [{ type: "flag", id: "nini_missing" }],
    done: [{ type: "evidence", id: "t_lily_nini" }, { type: "evidence", id: "t_finch_nini" }],
    levels: [
      { en: "Someone at the festival must have seen her.", ko: "축제에 있던 누군가는 니니를 봤을 거다." },
      { en: "Lily is at her flower stall. Mr. Finch is at the stage.", ko: "릴리는 꽃 노점에, 핀치 씨는 무대에 있다." },
      { en: "Ask both Lily and Mr. Finch: \"Have you seen Nini?\"", ko: "릴리와 핀치 씨 두 사람 모두에게 '니니 못 봤어요?'라고 물어보자." },
    ],
  },
  h1_compare: {
    chapter: "ch1",
    when: [{ type: "evidence", id: "t_lily_nini" }, { type: "evidence", id: "t_finch_nini" }],
    done: [{ type: "contradiction", id: "c_nini_parade" }],
    levels: [
      { en: "Do Lily and Mr. Finch agree about where Nini was?", ko: "니니가 어디 있었는지, 릴리와 핀치 씨의 말이 같은가?" },
      { en: "Open the board (B) and read what each of them said about Nini.", ko: "단서판(B)을 열고 두 사람이 니니에 대해 한 말을 읽어 보자." },
      { en: "On the board, select \"Lily: Nini at the fountain\" and \"Mr. Finch: Nini at the stage\", then Compare. (You can also show one statement to the other person.)", ko: "단서판에서 '릴리: 분수 쪽의 니니'와 '핀치 씨: 무대 앞의 니니'를 골라 비교하자. (한 사람의 말을 다른 사람에게 보여줘도 된다.)" },
    ],
  },
  h1_bell: {
    chapter: "ch1",
    when: [{ type: "flag", id: "nini_missing" }],
    done: [{ type: "evidence", id: "green_bell" }],
    levels: [
      { en: "Where did someone see Nini heading?", ko: "누군가 니니가 어디로 가는 걸 봤다고 했지?" },
      { en: "Lily saw Nini running toward the fountain.", ko: "릴리는 니니가 분수 쪽으로 뛰어가는 걸 봤다." },
      { en: "Go to the Old Fountain and look at the puddle by the steps.", ko: "오래된 분수로 가서 계단 옆 웅덩이를 보자." },
    ],
  },
  h2_lily: {
    chapter: "ch2",
    when: [],
    done: [{ type: "evidence", id: "t_lily_packing" }],
    levels: [
      { en: "Not everyone has gone home yet.", ko: "아직 모두가 집에 간 건 아니다." },
      { en: "Lily is still at her stall.", ko: "릴리가 아직 노점에 있다." },
      { en: "Go to Lily's Flower Stall and ask: \"Packing up?\"", ko: "릴리의 꽃 노점으로 가서 '가게 정리해요?'라고 물어보자." },
    ],
  },
  h2_deduce: {
    chapter: "ch2",
    when: [{ type: "evidence", id: "t_lily_packing" }],
    done: [{ type: "deduced", id: "d_lily_timing" }],
    levels: [
      { en: "Lily remembered what she was doing when she saw Nini.", ko: "릴리는 니니를 봤을 때 자기가 뭘 하고 있었는지 기억했다." },
      { en: "When did Lily start packing up her flowers?", ko: "릴리는 언제부터 꽃을 정리하기 시작했지?" },
      { en: "On the board, under Theories: Lily saw Nini while packing up — and she only packed up after ten.", ko: "단서판의 '추리'에서: 릴리는 꽃을 정리하다가 니니를 봤다 — 그리고 정리는 열 시 이후에야 시작했다." },
    ],
  },
  h2_gate: {
    chapter: "ch2",
    when: [],
    done: [{ type: "flag", id: "second_ring_heard" }],
    levels: [
      { en: "Nini was heading for the fountain.", ko: "니니는 분수 쪽으로 가고 있었다." },
      { en: "The gate by the fountain is worth another look.", ko: "분수 옆 철문을 다시 살펴볼 만하다." },
      { en: "Go to the Old Fountain and look at the gate.", ko: "오래된 분수로 가서 철문을 보자." },
    ],
  },
});
