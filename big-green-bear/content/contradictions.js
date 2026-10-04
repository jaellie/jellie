/*
 * contradictions.js — pairs of evidence that don't fit together.
 *
 * Found when the player compares the two pieces on the board (or by an
 * effect: { type: "findContradiction", id }). The game never says who is
 * lying — only that the memories don't match.
 *
 *   between      [evidenceA, evidenceB]
 *   title, text  shown on the board while unresolved
 *   partial / resolved / ambiguous:
 *                { conditions, text } — the state advances automatically when
 *                its conditions pass. States only move forward.
 *                "ambiguous" is a valid, final answer: some things can't be known.
 *   conditions   optional: comparing does nothing until these pass
 *   onFound      effects when first found
 */
BGB.story.contradictions({
  c_nini_parade: {
    between: ["t_lily_nini", "t_finch_nini"],
    title: { en: "Where was Nini during the parade?", ko: "퍼레이드 때 니니는 어디 있었나?" },
    text: {
      en: "Lily saw Nini running toward the fountain right before the parade. Mr. Finch saw her at the stage during it, ringing her bell. These memories do not match.",
      ko: "릴리는 퍼레이드 직전 니니가 분수 쪽으로 뛰어가는 걸 봤다. 핀치 씨는 퍼레이드 내내 니니가 무대 앞에서 종을 흔드는 걸 봤다. 두 기억이 맞지 않는다.",
    },
    partial: {
      conditions: [{ type: "deduced", id: "d_lily_timing" }],
      text: {
        en: "Lily saw Nini after ten. Mr. Finch saw her at seven. Both can be true.\n\nThen why were you already looking for her at seven?",
        ko: "릴리가 니니를 본 건 열 시 이후. 핀치 씨가 본 건 일곱 시. 둘 다 사실일 수 있다.\n\n그렇다면 나는 왜 일곱 시에 벌써 니니를 찾고 있었을까?",
      },
    },
    resolved: {
      conditions: [{ type: "flag", id: "search_time_reconstructed" }],
      text: {
        en: "You weren't looking for her at seven. You were looking for her at twenty to midnight. The evening folded the night in half.",
        ko: "일곱 시에 찾고 있던 게 아니었다. 자정 이십 분 전이었다. 저녁이 밤을 반으로 접어 버린 것이다.",
      },
    },
    onFound: [{ type: "setFlag", id: "first_contradiction_found" }],
  },

  c_bell_two_places: {
    // Optional: for players who compare everything.
    between: ["green_bell", "t_finch_nini"],
    title: { en: "One bell, two places", ko: "종 하나, 두 장소" },
    text: {
      en: "Mr. Finch saw Nini ringing her bell at the stage. But her bell was lying in a puddle by the passage steps.",
      ko: "핀치 씨는 무대 앞에서 종을 흔드는 니니를 봤다. 그런데 그 종은 통로 계단 옆 웅덩이에 떨어져 있었다.",
    },
    partial: {
      conditions: [{ type: "deduced", id: "d_lily_timing" }],
      text: {
        en: "She had it at seven. She lost it later — after ten, near the passage.",
        ko: "일곱 시엔 갖고 있었다. 잃어버린 건 나중이다 — 열 시 넘어, 통로 근처에서.",
      },
    },
  },

  c_ringing: {
    // Optional; designed to end "ambiguous" in a later chapter.
    between: ["the_ringing", "green_bell"],
    title: { en: "What rang?", ko: "무엇이 울렸나?" },
    text: {
      en: "Something rang below the gate, thin and bright like a bell. Nini's bell was in your paw.",
      ko: "철문 아래에서 종처럼 가늘고 맑은 소리가 울렸다. 니니의 종은 내 손에 있었다.",
    },
    ambiguous: {
      conditions: [{ type: "flag", id: "hospital_sound_heard" }],
      text: {
        en: "Maybe it was a bell. Maybe it was a machine in a bright room, keeping time. Maybe, by then, they sounded the same.",
        ko: "종이었을지도 모른다. 환한 방 안에서 박자를 세던 기계였을지도 모른다. 어쩌면 그때쯤엔, 둘이 같은 소리였을지도.",
      },
    },
  },
});
