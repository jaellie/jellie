/*
 * Chapter 2 dialogue — "The Rain" (vertical-slice portion).
 * See ch1_festival.js for the node format.
 */
BGB.story.dialogue({
  ch2_intro_01: {
    text: {
      en: "The parade is over. You don't remember it ending.",
      ko: "퍼레이드가 끝났다. 끝나는 걸 본 기억은 없다.",
    },
    next: "ch2_intro_02",
  },
  ch2_intro_02: {
    text: {
      en: "The rain isn't light anymore. It comes down in long grey ropes, and your fur has stopped shedding it and started drinking it.",
      ko: "비는 더 이상 가늘지 않다. 회색 밧줄처럼 길게 내리꽂힌다. 털은 이제 빗물을 털어 내지 못하고 빨아들이기 시작했다.",
    },
    ngPlusText: {
      en: "The rain isn't light anymore. Your fur has stopped shedding it and started drinking it. Every step is heavier than the last.",
      ko: "비는 더 이상 가늘지 않다. 털은 이제 빗물을 털어 내지 못하고 빨아들인다. 한 걸음 한 걸음이 앞 걸음보다 무겁다.",
    },
    next: "ch2_intro_03",
  },
  ch2_intro_03: {
    text: {
      en: "You still have Nini's bell. You still haven't found Nini.",
      ko: "니니의 종은 아직 손에 있다. 니니는 아직 찾지 못했다.",
    },
  },

  sql_clock_01: {
    text: { en: "The town hall clock says 11:47.", ko: "시청 시계는 11시 47분을 가리킨다." },
    effects: [{ type: "setFlag", id: "11_47_noticed" }, { type: "unlockEvidence", id: "clock_1147" }],
    next: "sql_clock_02",
  },
  sql_clock_02: {
    text: {
      en: "For the first time all evening, it doesn't look wrong.",
      ko: "저녁 내내 처음으로, 저 시각이 틀려 보이지 않는다.",
    },
    fx: ["clock1147"],
  },

  /* ---------- Mr. Finch, late ---------- */

  finch_late_01: {
    speaker: "finch",
    text: {
      en: "A little rain! It'll pass. The families have come all this way.",
      ko: "비 좀 오는 거 가지고! 금방 그쳐요. 다들 여기까지 와 줬는데.",
    },
    fx: ["echo"],
    next: "finch_late_02",
  },
  finch_late_02: {
    choices: [
      { text: { en: "\"You said that before.\"", ko: "\"아까도 그 말 했잖아요.\"" }, next: "finch_late_03" },
      { text: { en: "\"Most of them have gone home.\"", ko: "\"다들 벌써 집에 갔어요.\"" }, next: "finch_late_04" },
    ],
  },
  finch_late_03: {
    speaker: "finch",
    text: { en: "Did I? Well. It's still true.", ko: "내가요? 뭐. 그래도 맞는 말이잖아요." },
    next: "finch_late_05",
  },
  finch_late_04: {
    speaker: "finch",
    text: {
      en: "Good. Good! Home, warm and dry. That's how every Winter Night should end.",
      ko: "잘됐네요. 잘됐어! 집에서, 따뜻하고 뽀송하게. 겨울밤은 원래 그렇게 끝나야죠.",
    },
    next: "finch_late_05",
  },
  finch_late_05: {
    speaker: "finch",
    text: {
      en: "And don't worry about the old passage. Moss locked it at a quarter past nine — water was getting in. Locked it himself. Safety first.",
      ko: "오래된 통로는 걱정 마요. 물이 들어와서 모스 씨가 아홉 시 십오 분에 잠갔어요. 직접요. 안전이 제일이죠.",
    },
    effects: [{ type: "unlockEvidence", id: "t_finch_locked" }],
    next: "finch_late_06",
  },
  finch_late_06: {
    speaker: "finch",
    text: { en: "Nobody's going down there tonight.", ko: "오늘 밤엔 아무도 거기 안 내려가요." },
    fx: ["cold"],
  },

  /* ---------- Lily, late ---------- */

  lily_late_01: {
    speaker: "lily",
    text: { en: "Bear! You're soaked.", ko: "곰! 홀딱 젖었네요." },
    next: "lily_late_02",
  },
  lily_late_02: {
    speaker: "lily",
    text: { en: "Doesn't all that fur get heavy?", ko: "그 털, 무겁지 않아요?" },
    ngPlusText: { en: "Doesn't all that get heavy?", ko: "그거, 무겁지 않아요?" },
    next: "lily_late_03",
  },
  lily_late_03: {
    choices: [
      { text: { en: "\"A little.\"", ko: "\"조금요.\"" }, next: "lily_late_04" },
      { text: { en: "\"I'm fine.\"", ko: "\"괜찮아요.\"" }, next: "lily_late_04" },
    ],
  },
  lily_late_04: {
    speaker: "lily",
    text: {
      en: "I'm finally packing up. I held out as long as I could, but after ten it just came down. Look at my roses. Drowned.",
      ko: "드디어 정리해요. 버틸 수 있을 만큼 버텼는데, 열 시 넘으니까 그냥 쏟아지더라고요. 내 장미 좀 봐요. 다 물에 빠졌어.",
    },
    effects: [{ type: "unlockEvidence", id: "t_lily_packing" }],
    next: "lily_late_05",
  },
  lily_late_05: {
    speaker: "lily",
    text: { en: "You should go home, Bear. Get warm.", ko: "곰도 이제 집에 가요. 몸 좀 녹이고." },
    ngPlusText: { en: "You should go home, Bear.", ko: "곰도 이제 집에 가요." },
  },

  lily_late_nini_01: {
    speaker: "bear",
    text: {
      en: "Earlier, you said you saw Nini while you were packing up.",
      ko: "아까 정리하다가 니니를 봤다고 했죠.",
    },
    next: "lily_late_nini_02",
  },
  lily_late_nini_02: {
    speaker: "lily",
    text: {
      en: "Did I? …Yes. I was packing up. She ran past, toward the fountain, asking if anyone had seen a little bell.",
      ko: "내가요? …네. 정리하고 있었어요. 니니가 분수 쪽으로 뛰어가면서, 혹시 작은 종 못 봤냐고 물어보고 다녔어요.",
    },
    next: "lily_late_nini_03",
  },
  lily_late_nini_03: {
    speaker: "lily",
    text: {
      en: "That's all I remember, honestly. Wet flowers and a yellow coat.",
      ko: "솔직히 기억나는 건 그게 다예요. 젖은 꽃이랑, 노란 우비.",
    },
  },

  /* ---------- the gate, late ---------- */

  fnl_gate_01: {
    text: {
      en: "The gate is chained now. A padlock, new and bright, already beaded with rain.",
      ko: "철문에 이제 쇠사슬이 감겨 있다. 새로 산 듯 반짝이는 자물쇠에 벌써 빗방울이 맺혀 있다.",
    },
    next: [{ conditions: [{ type: "evidence", id: "gate_notice" }], to: "fnl_gate_02a" }, { to: "fnl_gate_02b" }],
  },
  fnl_gate_02a: {
    text: {
      en: "The laminated notice still says 21:15. It said that hours ago, too.",
      ko: "코팅된 안내문은 여전히 21:15다. 몇 시간 전에도 그랬다.",
    },
    next: "fnl_gate_03",
  },
  fnl_gate_02b: {
    text: {
      en: "A laminated notice: CLOSED 21:15 BY ORDER OF FESTIVAL STAFF.",
      ko: "코팅된 안내문. '축제 운영진 지시로 21:15 폐쇄'.",
    },
    effects: [{ type: "setFlag", id: "passage_seen" }, { type: "setFlag", id: "door_locked_seen" }],
    next: "fnl_gate_03",
  },
  fnl_gate_03: {
    text: {
      en: "Water pours past your feet, down the steps, into the dark.",
      ko: "물이 발밑을 지나 계단을 타고 어둠 속으로 쏟아진다.",
    },
    next: "fnl_gate_04",
  },
  fnl_gate_04: {
    text: { en: "Somewhere below, something rings. Once. Thin and bright.", ko: "저 아래 어딘가에서 무언가 울린다. 한 번. 가늘고 맑게." },
    sound: "bell",
    fx: ["clock1147"],
    effects: [
      { type: "setFlag", id: "second_ring_heard" },
      { type: "unlockEvidence", id: "the_ringing" },
      { type: "fx", id: "ripple" },
    ],
    next: "fnl_gate_05",
  },
  fnl_gate_05: {
    text: {
      en: "You open your paw. Nini's bell is still there. Wet, and silent.",
      ko: "손을 펴 본다. 니니의 종은 그대로 있다. 젖은 채로, 조용히.",
    },
    fx: ["cold"],
  },
});
