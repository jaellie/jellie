/*
 * characters.js — who is in the story.
 *
 * Player-facing fields:
 *   name       localized name
 *   look       text shown when you talk to them (supports variants / ngPlusText)
 *   talk       topics you can ask about: [{ label, start, conditions, once }]
 *              start = the first dialogue node of that topic
 *   present    what they say when you show them evidence: { evidenceId: nodeId, default: nodeId }
 *
 * Writer-facing fields (never shown to the player; visible in the debug panel
 * and here, so the whole team shares one source of truth):
 *   role, truth (what really happened), memoryVersion (how the bear remembers them),
 *   emotion (default emotional state), clues, appearsIn
 */
BGB.story.characters({
  bear: {
    name: { en: "Big Green Bear", ko: "빅그린베어" },
    role: "Protagonist. The festival mascot.",
    truth: "A festival staff member working inside a heavy green bear costume. Rescued Nini from the flooding passage at 23:47, became trapped, and died in hospital at 01:17.",
    memoryVersion: "Remembers himself as a real bear. The costume's weight, heat and water appear as 'fur'.",
    emotion: "warm, tired, responsible",
  },

  nini: {
    name: { en: "Nini", ko: "니니" },
    role: "A small child at the festival.",
    truth: "Lost her green bell around 23:20. Someone told her it might have dropped near the passage; she went at 23:35. Pulled out by Bear at 23:47. Survives, grows up, keeps the bell.",
    memoryVersion: "A little lamb in a yellow raincoat. Her timeline is compressed into the early evening.",
    emotion: "excited, then frightened",
    look: {
      text: {
        en: "A little lamb in a yellow raincoat, bouncing on her toes in front of you.",
        ko: "노란 우비를 입은 꼬마 양이 네 앞에서 발끝으로 콩콩 뛰고 있다.",
      },
    },
    talk: [
      { label: { en: "Say hello", ko: "인사하기" }, start: "nini_hello_01", once: true },
      {
        label: { en: "About the parade", ko: "퍼레이드 얘기" },
        start: "nini_parade_01",
        conditions: [{ type: "seen", id: "nini_hello_01" }],
      },
    ],
  },

  lily: {
    name: { en: "Lily", ko: "릴리" },
    role: "Flower shop owner. Supplied the festival decorations.",
    truth: "Her garlands and petals helped block the drain by the fountain (noticed ~19:10). Packed up after 22:30. Saw Nini running toward the fountain around 23:30, asking about a bell. Not malicious.",
    memoryVersion: "A hedgehog florist. Her sighting of Nini is remembered as 'right before the parade'.",
    emotion: "cheerful, flustered by the rain",
    clues: ["weather_radio", "t_lily_nini", "t_lily_packing"],
    look: {
      text: {
        en: "Lily the hedgehog sells flowers from a cart under a striped awning. Her garlands hang all over the square.",
        ko: "고슴도치 릴리가 줄무늬 차양 아래 수레에서 꽃을 판다. 광장 곳곳에 그녀가 만든 꽃장식이 걸려 있다.",
      },
      variants: [
        {
          conditions: [{ type: "chapterAtLeast", id: "ch2" }],
          text: {
            en: "Lily is tying the last wet bundles onto her cart. Her quills are flat with rain.",
            ko: "릴리가 젖은 꽃다발 마지막 묶음을 수레에 묶고 있다. 가시가 빗물에 납작하게 눌려 있다.",
          },
        },
        {
          conditions: [{ type: "flag", id: "rain_started" }],
          text: {
            en: "Lily is wrapping flowers in newspaper. The striped awning drips onto her boots.",
            ko: "릴리가 꽃을 신문지에 싸고 있다. 줄무늬 차양에서 떨어진 빗물이 장화 위로 똑똑 떨어진다.",
          },
        },
      ],
    },
    talk: [
      { label: { en: "Say hello", ko: "인사하기" }, start: "lily_hello_01", conditions: [{ type: "chapter", id: "ch1" }] },
      {
        label: { en: "The rain", ko: "비" },
        start: "lily_rain_01",
        conditions: [{ type: "chapter", id: "ch1" }, { type: "flag", id: "rain_started" }],
      },
      {
        label: { en: "Have you seen Nini?", ko: "니니 못 봤어요?" },
        start: "lily_nini_01",
        conditions: [{ type: "chapter", id: "ch1" }, { type: "flag", id: "nini_missing" }],
      },
      { label: { en: "Packing up?", ko: "가게 정리해요?" }, start: "lily_late_01", conditions: [{ type: "chapter", id: "ch2" }] },
      {
        label: { en: "About Nini, earlier", ko: "아까 니니 말인데요" },
        start: "lily_late_nini_01",
        conditions: [{ type: "chapter", id: "ch2" }, { type: "evidence", id: "t_lily_packing" }],
      },
    ],
    present: {
      green_bell: "lily_p_bell",
      clock_1147: "lily_p_clock",
      festival_schedule: "lily_p_schedule",
      t_finch_nini: "lily_p_finch",
      default: "lily_p_default",
    },
  },

  finch: {
    name: { en: "Mr. Finch", ko: "핀치 씨" },
    role: "Festival organizer.",
    truth: "Was warned by Mr. Moss about the pump and by the forecast about heavier rain. Decided not to cancel (~19:30): 'forty-one years, never cancelled'. Not malicious. Saw Nini at the stage during the 19:00 parade.",
    memoryVersion: "A small round finch in a very large coat. Repeats himself as memory weakens.",
    emotion: "busy, proud, reassuring",
    clues: ["t_finch_pump", "t_finch_nini", "t_finch_locked"],
    look: {
      text: {
        en: "Mr. Finch — a small, round bird in a very large coat — hops between the speakers with a clipboard.",
        ko: "핀치 씨는 아주 큰 코트를 입은 작고 동그란 새다. 클립보드를 들고 스피커 사이를 폴짝폴짝 오간다.",
      },
      variants: [
        {
          conditions: [{ type: "chapterAtLeast", id: "ch2" }],
          text: {
            en: "Mr. Finch stands under a too-small umbrella, clipboard in a plastic bag, smiling at nobody.",
            ko: "핀치 씨가 너무 작은 우산 아래 서 있다. 클립보드는 비닐봉지에 넣어 두었고, 아무도 없는 쪽을 보며 웃고 있다.",
          },
        },
      ],
    },
    talk: [
      { label: { en: "Say hello", ko: "인사하기" }, start: "finch_hello_01", conditions: [{ type: "chapter", id: "ch1" }] },
      {
        label: { en: "Should we stop?", ko: "멈춰야 하지 않을까요?" },
        start: "finch_rain_01",
        conditions: [{ type: "chapter", id: "ch1" }, { type: "flag", id: "rain_started" }],
      },
      {
        label: { en: "Have you seen Nini?", ko: "니니 못 봤어요?" },
        start: "finch_nini_01",
        conditions: [{ type: "chapter", id: "ch1" }, { type: "flag", id: "nini_missing" }],
      },
      { label: { en: "Still going?", ko: "아직 계속해요?" }, start: "finch_late_01", conditions: [{ type: "chapter", id: "ch2" }] },
    ],
    present: {
      t_lily_nini: "finch_p_lily",
      green_bell: "finch_p_bell",
      festival_schedule: "finch_p_schedule",
      gate_notice: "finch_p_gate",
      default: "finch_p_default",
    },
  },

  /* ----- appear in later chapters (no dialogue yet) ----- */

  mabel: {
    name: { en: "Mabel", ko: "메이블" },
    role: "Cafe owner.",
    truth: "Heard strange gurgling and knocking from under the cafe floor (~20:15). Assumed it was festival noise. Did not report it.",
    memoryVersion: "A sleepy cat behind a steamed-up window.",
    emotion: "guilty in hindsight",
    appearsIn: "ch3",
  },
  oliver: {
    name: { en: "Oliver", ko: "올리버" },
    role: "Police officer.",
    truth: "Handling a car accident and two noise complaints. Receives the missing-child call late. Arrives after the 00:05 emergency call.",
    memoryVersion: "An owl who is always on the radio.",
    emotion: "overstretched",
    appearsIn: "ch4",
  },
  hazel: {
    name: { en: "Dr. Hazel", ko: "헤이즐 선생님" },
    role: "Emergency physician.",
    truth: "Treats Bear on arrival. Knows that 20 minutes sooner might have been survivable. Tells him Nini is home.",
    memoryVersion: "A calm deer whose voice comes from far away. Her voice leaks into earlier scenes.",
    emotion: "steady, quietly grieving",
    appearsIn: "final",
  },
  fox: {
    name: { en: "Fox", ko: "폭스" },
    role: "Journalist.",
    truth: "Investigates afterwards. Has the documents: pump logs, the 21:15 closure record, the 00:05 call log. Public story vs. what records show.",
    memoryVersion: "A fox with a notebook who seems to know how the story ends.",
    emotion: "persistent, fair",
    appearsIn: "ch4",
  },
  moss: {
    name: { en: "Mr. Moss", ko: "모스 씨" },
    role: "Maintenance worker.",
    truth: "Knew the pump under the old passage was failing; repair postponed twice. Pump failed 21:00. Locked the passage at 21:15 for safety, not knowing anyone would go in after.",
    memoryVersion: "A mole. Only ever heard about, never seen — until late.",
    emotion: "careful, then shattered",
    appearsIn: "ch3",
  },
});
