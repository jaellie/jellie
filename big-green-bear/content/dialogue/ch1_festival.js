/*
 * Chapter 1 dialogue — "Winter Night".
 *
 * NODE FORMAT
 *   speaker      character id ("bear", "lily"...) — omit for narration
 *   text         { en, ko }
 *   ngPlusText   replaces text on a second playthrough
 *   variants     [{ conditions, text }] — first match replaces text
 *   effects      run when the line appears
 *   next         "node_id"  or  [{ conditions, to: "node_id" }, { to: "fallback" }]
 *                (no next = conversation ends)
 *   choices      [{ text, next, conditions?, effects?, once? }]
 *   conditions   if they fail, the node is skipped (goes to `else` or `next`)
 *   fx           visual effects while this line is shown: echo, drift, clock1147, cold, minimal
 *   sound        one-shot sound: bell, thunder, page...
 *   audio        temporary audio while this line is shown
 *
 * A node with no text and no choices is a silent "logic" node.
 */
var RAINING = { type: "flag", id: "rain_started" };
var MET_NINI = { type: "flag", id: "met_nini" };

BGB.story.dialogue({
  /* ---------- opening ---------- */

  intro_01: {
    text: {
      en: "Every winter, Bellflower Town holds a festival. Paper lanterns. Hot cider. A small parade that goes once around the square and calls it a night.",
      ko: "벨플라워 마을은 겨울마다 축제를 연다. 종이 등불. 따뜻한 사과주. 광장을 한 바퀴 돌고 나면 끝나는 조그만 퍼레이드.",
    },
    next: "intro_02",
  },
  intro_02: {
    text: { en: "And every winter, somebody has to be the bear.", ko: "그리고 겨울마다, 누군가는 곰이 되어야 한다." },
    next: "intro_03",
  },
  intro_03: {
    text: { en: "This year, it's you.", ko: "올해는 너다." },
    ngPlusText: { en: "This year, it was you.", ko: "그해에는, 너였다." },
    next: "intro_04",
  },
  intro_04: {
    text: {
      en: "Your fur is warm and heavy. Children wave at you from across the square. Somewhere, a bell choir is warming up.",
      ko: "털은 따뜻하고 묵직하다. 광장 건너편에서 아이들이 손을 흔든다. 어디선가 종소리 합창단이 연습을 하고 있다.",
    },
    ngPlusText: {
      en: "Your fur is warm and heavy. It will get heavier. Children wave at you from across the square.",
      ko: "털은 따뜻하고 묵직하다. 앞으로 더 무거워질 것이다. 광장 건너편에서 아이들이 손을 흔든다.",
    },
  },

  /* ---------- the square ---------- */

  sq_clock_01: {
    text: { en: "The town hall clock says 11:47.", ko: "시청 시계는 11시 47분을 가리킨다." },
    effects: [
      { type: "setFlag", id: "11_47_noticed" },
      { type: "unlockEvidence", id: "clock_1147" },
    ],
    next: "sq_clock_02",
  },
  sq_clock_02: {
    text: {
      en: "It has said 11:47 for as long as you can remember. Nobody ever fixes it. People just check their phones.",
      ko: "기억하는 한 저 시계는 늘 11시 47분이었다. 아무도 고치지 않는다. 사람들은 그냥 휴대폰을 본다.",
    },
    ngPlusText: {
      en: "It has said 11:47 for as long as you can remember.\n\nWhich, tonight, is exactly how long.",
      ko: "기억하는 한 저 시계는 늘 11시 47분이었다.\n\n오늘 밤에는, 딱 그만큼이 전부다.",
    },
    variants: [
      {
        conditions: [{ type: "flag", id: "gate_1147_seen" }, { type: "not", condition: { type: "ngPlus" } }],
        text: {
          en: "It has said 11:47 for as long as you can remember.\n\nYou saw that time somewhere else tonight, too. Where there wasn't a clock.",
          ko: "기억하는 한 저 시계는 늘 11시 47분이었다.\n\n오늘 밤 다른 곳에서도 그 시각을 봤다. 시계가 없는 곳에서.",
        },
      },
    ],
  },

  sq_schedule_01: {
    text: {
      en: "A poster on the notice board, the corners curling.\n\nBELLFLOWER WINTER NIGHT\n5:00 PM Opening · 7:00 PM Lantern Parade · 9:00 PM Bell Choir · 11:00 PM Closing",
      ko: "게시판의 포스터. 귀퉁이가 말려 올라가 있다.\n\n벨플라워 겨울밤\n오후 5:00 개막 · 오후 7:00 등불 퍼레이드 · 오후 9:00 종소리 합창 · 오후 11:00 폐막",
    },
    effects: [{ type: "unlockEvidence", id: "festival_schedule" }],
    next: "sq_schedule_02",
  },
  sq_schedule_02: {
    text: {
      en: "Someone has drawn a small bear next to \"Lantern Parade\". It's waving.",
      ko: "누군가 '등불 퍼레이드' 옆에 작은 곰을 그려 놓았다. 손을 흔들고 있다.",
    },
  },

  sq_lights_01: {
    text: {
      en: "The lights are strung lower than usual this year, looping over the stalls and down toward the fountain. Mr. Finch wanted the whole square to glow.",
      ko: "올해는 전구 줄이 평소보다 낮게 걸려 있다. 노점 위로 늘어졌다가 분수 쪽까지 이어진다. 광장 전체가 빛나길 핀치 씨가 바랐다.",
    },
    variants: [
      {
        conditions: [RAINING],
        text: {
          en: "Rain runs along the strings of lights and drips from every bulb. They flicker, but they hold.",
          ko: "빗물이 전구 줄을 따라 흘러 전구마다 똑똑 떨어진다. 깜박거리긴 해도, 버틴다.",
        },
      },
    ],
  },

  /* ---------- Nini ---------- */

  nini_hello_01: {
    speaker: "nini",
    text: { en: "Bear! Bear! Is it true you have bells?", ko: "곰! 곰! 진짜 종 갖고 있어?" },
    next: "nini_hello_02",
  },
  nini_hello_02: {
    choices: [
      { text: { en: "\"I saved one for you.\"", ko: "\"너 주려고 하나 남겨 뒀지.\"" }, next: "nini_hello_03" },
      { text: { en: "\"Only for kids who say please.\"", ko: "\"'주세요' 하는 어린이한테만 줘.\"" }, next: "nini_hello_please" },
    ],
  },
  nini_hello_please: {
    speaker: "nini",
    text: { en: "Pleeease!", ko: "주세요오!" },
    next: "nini_hello_03",
  },
  nini_hello_03: {
    text: {
      en: "You hand her a small green bell. She shakes it, and it rings once — a thin, bright sound that cuts through the whole square.",
      ko: "작은 초록 종을 건넨다. 니니가 흔들자 종이 한 번 울린다. 가늘고 맑은 소리가 광장을 가로지른다.",
    },
    sound: "bell",
    effects: [{ type: "setFlag", id: "bell_given" }],
    next: "nini_hello_04",
  },
  nini_hello_04: {
    speaker: "nini",
    text: { en: "It's green like you!", ko: "너처럼 초록색이다!" },
    next: "nini_hello_05",
  },
  nini_hello_05: {
    speaker: "nini",
    text: {
      en: "I'm gonna show Mom. Then the parade. You're coming too, right?",
      ko: "엄마한테 보여 줄 거야. 그다음엔 퍼레이드! 곰도 올 거지?",
    },
    next: "nini_hello_06",
  },
  nini_hello_06: {
    speaker: "bear",
    text: { en: "Of course.", ko: "물론이지." },
    effects: [{ type: "unlockEvidence", id: "nini_promise" }],
    next: "nini_hello_07",
  },
  nini_hello_07: {
    text: {
      en: "She runs off, ringing the bell at everything: a lamppost, a dog, a very surprised man with a pretzel.",
      ko: "니니가 뛰어간다. 가로등에도, 개한테도, 프레첼을 든 아저씨한테도 종을 흔들어 댄다. 아저씨가 깜짝 놀란다.",
    },
  },

  nini_parade_01: {
    speaker: "nini",
    text: { en: "Seven o'clock! Don't forget! I'll be right at the front.", ko: "일곱 시야! 까먹으면 안 돼! 나 맨 앞에 있을 거야." },
    next: "nini_parade_02",
  },
  nini_parade_02: {
    speaker: "nini",
    text: { en: "If you can't see me, just listen for the bell.", ko: "내가 안 보이면, 종소리를 들으면 돼." },
  },

  /* ---------- the rain begins (chapter event) ---------- */

  rain_01: {
    text: { en: "Something cold taps you on the nose.", ko: "뭔가 차가운 게 코끝을 톡 건드린다." },
    effects: [
      { type: "setFlag", id: "rain_started" },
      { type: "setClock", time: "18:30" },
    ],
    next: "rain_02",
  },
  rain_02: {
    text: {
      en: "Then another. Then the whole square looks up at once, the way crowds do.",
      ko: "또 하나. 그러더니 광장의 사람들이 다 같이 하늘을 올려다본다. 사람들은 늘 그렇게 한꺼번에 올려다본다.",
    },
    sound: "thunder",
    next: [{ conditions: [MET_NINI], to: "rain_03_met" }, { to: "rain_03_unmet" }],
  },
  rain_03_met: {
    text: {
      en: "You look for a yellow raincoat in the crowd. You listen for a small green bell.\n\nYou don't hear it.",
      ko: "사람들 사이에서 노란 우비를 찾는다. 작은 초록 종소리에 귀를 기울인다.\n\n들리지 않는다.",
    },
    next: "rain_04",
  },
  rain_03_unmet: {
    text: {
      en: "There was a little girl earlier, in a yellow raincoat. She asked if you had bells. You gave her the last green one.\n\nDidn't you? You don't remember doing it. But your paw is empty.",
      ko: "아까 노란 우비를 입은 꼬마가 있었다. 종 있느냐고 물었다. 마지막 남은 초록 종을 그 애한테 줬다.\n\n그랬던가? 준 기억은 없다. 그런데 손이 비어 있다.",
    },
    effects: [{ type: "setFlag", id: "bell_given" }, { type: "setFlag", id: "bell_memory_gap" }],
    next: "rain_04",
  },
  rain_04: {
    speaker: "bear",
    text: { en: "Nini?", ko: "니니?" },
    effects: [
      { type: "setFlag", id: "nini_missing" },
      { type: "setFlag", id: "nini_left" },
      { type: "setClock", time: "19:05" },
    ],
    next: "rain_05",
  },
  rain_05: {
    text: {
      en: "The parade starts without you noticing. Lanterns bob past in the rain. You wave, because you're the bear, and the bear waves.\n\nShe isn't at the front.",
      ko: "어느새 퍼레이드가 시작된다. 빗속에서 등불이 둥실둥실 지나간다. 손을 흔든다. 곰이니까. 곰은 손을 흔드니까.\n\n맨 앞에 니니가 없다.",
    },
  },

  /* ---------- Lily ---------- */

  lily_hello_01: {
    speaker: "lily",
    text: {
      en: "Bear! Don't you look festive. Did you see the garlands? Mr. Finch ordered twice as many this year.",
      ko: "곰! 오늘 아주 축제 분위기네요. 꽃장식 봤어요? 핀치 씨가 올해는 두 배로 주문했거든요.",
    },
    next: "lily_hello_02",
  },
  lily_hello_02: {
    speaker: "bear",
    text: { en: "They're everywhere.", ko: "온 데 다 걸려 있던데요." },
    next: "lily_hello_03",
  },
  lily_hello_03: {
    speaker: "lily",
    text: {
      en: "Everywhere! The railings, the lampposts, the stage. I even wrapped one around that ugly old drain by the fountain. It looked so bare.",
      ko: "온 데 다요! 난간에도, 가로등에도, 무대에도. 분수 옆에 있는 그 못생긴 빗물받이에도 하나 둘러 줬어요. 너무 휑해 보여서요.",
    },
    effects: [{ type: "setFlag", id: "lily_interviewed" }, { type: "setFlag", id: "garland_on_drain_heard" }],
  },

  lily_rain_01: {
    speaker: "lily",
    text: { en: "Oh, this? The rain isn't that bad.", ko: "아, 이거요? 비 별로 안 와요." },
    next: "lily_rain_02",
  },
  lily_rain_02: {
    speaker: "lily",
    text: {
      en: "The radio said it might get much heavier later tonight. But they always say that, don't they?",
      ko: "라디오에선 밤늦게 훨씬 세질 수도 있다던데. 근데 맨날 그렇게 말하잖아요, 그쵸?",
    },
    effects: [
      { type: "unlockEvidence", id: "weather_radio" },
      { type: "setFlag", id: "rain_warning_seen" },
    ],
    next: "lily_rain_03",
  },
  lily_rain_03: {
    speaker: "lily",
    text: {
      en: "My petals are going everywhere, though. Look at them, sailing off down the gutter like little boats.",
      ko: "꽃잎이 사방으로 날리는 건 좀 그렇네요. 봐요, 도랑 따라 쪼그만 배처럼 떠내려가잖아요.",
    },
  },

  lily_nini_01: {
    speaker: "bear",
    text: {
      en: "Have you seen a little girl? Yellow raincoat. She has a green bell.",
      ko: "혹시 꼬마 여자애 못 봤어요? 노란 우비 입고, 초록 종 들고 있는.",
    },
    next: "lily_nini_02",
  },
  lily_nini_02: {
    speaker: "lily",
    text: { en: "Nini? Oh, she was just here!", ko: "니니요? 아, 방금 여기 있었는데!" },
    next: "lily_nini_03",
  },
  lily_nini_03: {
    speaker: "lily",
    text: {
      en: "She ran off toward the fountain, right before the parade. I remember because I was packing up the wet flowers.",
      ko: "분수 쪽으로 뛰어갔어요. 퍼레이드 바로 전에요. 젖은 꽃을 정리하고 있었으니까 기억나요.",
    },
    effects: [{ type: "unlockEvidence", id: "t_lily_nini" }],
    next: "lily_nini_04",
  },
  lily_nini_04: {
    speaker: "lily",
    text: {
      en: "She looked upset. Like she'd lost something.",
      ko: "속상해 보였어요. 뭘 잃어버린 것처럼.",
    },
    fx: ["echo"],
  },

  lily_p_bell: {
    speaker: "lily",
    text: {
      en: "That's one of your bells! Is it Nini's? Oh, she'll be heartbroken. Give it back to her the second you see her.",
      ko: "곰이 나눠 주는 종이잖아요! 니니 거예요? 아이고, 엄청 속상해하겠다. 보자마자 돌려줘요.",
    },
  },
  lily_p_clock: {
    speaker: "lily",
    text: { en: "That old clock? It's been stuck forever. Don't set your watch by it.", ko: "그 오래된 시계요? 몇 년째 멈춰 있잖아요. 그거 보고 시간 맞추면 안 돼요." },
  },
  lily_p_schedule: {
    speaker: "lily",
    text: {
      en: "A seven o'clock parade. In December! I told Mr. Finch the little ones would be soaked.",
      ko: "일곱 시 퍼레이드라니. 그것도 12월에! 꼬마들 다 젖을 거라고 핀치 씨한테 말했는데.",
    },
  },
  lily_p_finch: {
    speaker: "lily",
    text: {
      en: "At the stage? During the parade? No, no. I saw her by the fountain, right before. I'm sure of it.",
      ko: "무대 앞이요? 퍼레이드 때요? 아니, 아니에요. 분수 쪽에서 봤어요. 퍼레이드 직전에. 확실해요.",
    },
    next: "lily_p_finch_02",
  },
  lily_p_finch_02: {
    speaker: "lily",
    text: { en: "…I think.", ko: "…아마도요." },
    effects: [{ type: "findContradiction", id: "c_nini_parade" }],
  },
  lily_p_default: {
    speaker: "lily",
    text: { en: "Hm. I'm not sure what that means, Bear.", ko: "음. 그게 무슨 뜻인지 잘 모르겠어요, 곰." },
  },

  /* ---------- Mr. Finch ---------- */

  finch_hello_01: {
    speaker: "finch",
    text: {
      en: "Bear! Wonderful, wonderful. Parade at seven sharp. Wave a lot. The children love the waving.",
      ko: "곰! 좋아요, 아주 좋아. 퍼레이드는 일곱 시 정각이에요. 손 많이 흔들어 줘요. 애들이 그걸 아주 좋아해요.",
    },
    next: "finch_hello_02",
  },
  finch_hello_02: {
    speaker: "bear",
    text: { en: "Is everything ready?", ko: "준비는 다 됐어요?" },
    next: "finch_hello_03",
  },
  finch_hello_03: {
    speaker: "finch",
    text: {
      en: "Forty-one years, Bear. Bellflower Winter Night has never once been cancelled. Not for snow, not for the flu, not for the year the stage fell over.",
      ko: "41년이에요, 곰. 벨플라워 겨울밤은 단 한 번도 취소된 적이 없어요. 눈이 와도, 독감이 돌아도, 무대가 무너진 해에도요.",
    },
    effects: [{ type: "setFlag", id: "finch_interviewed" }],
  },

  finch_rain_01: {
    speaker: "bear",
    text: { en: "Should we stop? The rain's picking up.", ko: "멈춰야 하지 않을까요? 비가 세지는데요." },
    next: "finch_rain_02",
  },
  finch_rain_02: {
    speaker: "finch",
    text: {
      en: "A little rain! It'll pass. The families have come all this way.",
      ko: "비 좀 오는 거 가지고! 금방 그쳐요. 다들 여기까지 와 줬는데.",
    },
    next: "finch_rain_03",
  },
  finch_rain_03: {
    speaker: "finch",
    text: {
      en: "Mr. Moss came by earlier, muttering about the pump under the old passage. Moss always worries. I told him we'd look at it after the festival.",
      ko: "아까 모스 씨가 와서 오래된 통로 밑 펌프 얘기를 중얼거리더라고요. 모스 씨는 늘 걱정이 많아요. 축제 끝나고 보자고 했죠.",
    },
    effects: [
      { type: "unlockEvidence", id: "t_finch_pump" },
      { type: "setFlag", id: "pump_mentioned" },
    ],
    next: "finch_rain_04",
  },
  finch_rain_04: {
    choices: [
      {
        text: { en: "\"What if he's right?\"", ko: "\"모스 씨 말이 맞으면요?\"" },
        next: "finch_rain_05a",
      },
      { text: { en: "\"You know best.\"", ko: "\"핀치 씨가 잘 아시겠죠.\"" }, next: "finch_rain_05b" },
    ],
  },
  finch_rain_05a: {
    speaker: "finch",
    text: {
      en: "Then we'll fix it on Monday, and he can say he told me so. That's what Mondays are for.",
      ko: "그럼 월요일에 고치면 되죠. 그때 모스 씨가 '거봐요' 하면 되고. 월요일이 그러라고 있는 거예요.",
    },
  },
  finch_rain_05b: {
    speaker: "finch",
    text: { en: "Forty-one years, Bear!", ko: "41년이에요, 곰!" },
  },

  finch_nini_01: {
    speaker: "bear",
    text: { en: "Have you seen Nini? Little girl, yellow raincoat.", ko: "니니 못 봤어요? 노란 우비 입은 꼬마요." },
    next: "finch_nini_02",
  },
  finch_nini_02: {
    speaker: "finch",
    text: {
      en: "Nini? Yes, yes — she was right here at the stage during the parade, with her mother. Ringing a little bell the whole time. Lovely.",
      ko: "니니? 네, 네. 퍼레이드 내내 엄마랑 여기 무대 앞에 있었어요. 작은 종을 계속 흔들면서. 아주 귀여웠죠.",
    },
    effects: [{ type: "unlockEvidence", id: "t_finch_nini" }],
    next: "finch_nini_03",
  },
  finch_nini_03: {
    choices: [
      { text: { en: "\"During the parade? You're sure?\"", ko: "\"퍼레이드 때요? 확실해요?\"" }, next: "finch_nini_04" },
      { text: { en: "\"Thank you.\"", ko: "\"고마워요.\"" } },
    ],
  },
  finch_nini_04: {
    speaker: "finch",
    text: { en: "I never forget a bell, Bear.", ko: "종소리는 절대 안 잊어버려요, 곰." },
  },

  finch_p_lily: {
    speaker: "finch",
    text: {
      en: "The fountain? No, no. She was here, at the stage, during the parade. I could hear that bell over the band.",
      ko: "분수요? 아니, 아니. 퍼레이드 때 여기 무대 앞에 있었어요. 밴드 소리 너머로 종소리가 들렸다니까요.",
    },
    effects: [{ type: "findContradiction", id: "c_nini_parade" }],
  },
  finch_p_bell: {
    speaker: "finch",
    text: {
      en: "Hm! Well, she was ringing one exactly like it. Exactly like it.",
      ko: "흠! 니니가 흔들던 거랑 똑같이 생겼네요. 정말 똑같이.",
    },
    fx: ["echo"],
  },
  finch_p_schedule: {
    speaker: "finch",
    text: { en: "Every minute planned. Every single minute.", ko: "1분 1초까지 다 계획돼 있어요. 1분 1초까지." },
  },
  finch_p_gate: {
    speaker: "finch",
    text: {
      en: "Closed at quarter past nine? It isn't nine yet, Bear. Somebody's put that up early. Moss, probably.",
      ko: "아홉 시 십오 분에 폐쇄? 아직 아홉 시도 안 됐는데요, 곰. 누가 미리 붙여 놨나 보네. 모스 씨겠지.",
    },
    variants: [
      {
        conditions: [{ type: "chapterAtLeast", id: "ch2" }],
        text: {
          en: "Quarter past nine, that's right. Moss locked it himself. Safety first.",
          ko: "아홉 시 십오 분, 맞아요. 모스 씨가 직접 잠갔어요. 안전이 제일이니까.",
        },
      },
    ],
  },
  finch_p_default: {
    speaker: "finch",
    text: { en: "Not now, Bear, not now. Wave! Wave!", ko: "지금은 말고요, 곰. 손 흔들어요! 손!" },
  },

  /* ---------- the fountain ---------- */

  fn_gate_01: {
    text: {
      en: "An iron sign on the gate: SERVICE PASSAGE — STAFF ONLY.",
      ko: "철문에 걸린 쇠 표지판. '관리 통로 — 관계자 외 출입 금지'.",
    },
    next: "fn_gate_02",
  },
  fn_gate_02: {
    text: {
      en: "Below it, a newer notice, laminated and beaded with water:\n\nCLOSED 21:15 BY ORDER OF FESTIVAL STAFF",
      ko: "그 아래, 코팅된 새 안내문. 물방울이 송골송골 맺혀 있다.\n\n축제 운영진 지시로 21:15 폐쇄",
    },
    effects: [
      { type: "unlockEvidence", id: "gate_notice" },
      { type: "setFlag", id: "passage_seen" },
      { type: "setFlag", id: "door_locked_seen" },
    ],
    next: "fn_gate_03",
  },
  fn_gate_03: {
    text: {
      en: "A quarter past nine.\n\nIt isn't nine yet. Is it?",
      ko: "아홉 시 십오 분.\n\n아직 아홉 시도 안 됐다. 그렇지?",
    },
    fx: ["clock1147", "echo"],
    effects: [{ type: "setFlag", id: "gate_1147_seen" }, { type: "fx", id: "flicker" }],
    next: "fn_gate_04",
  },
  fn_gate_04: {
    text: {
      en: "You read the notice again. It still says 21:15. The steps go down into the dark.",
      ko: "안내문을 다시 읽는다. 여전히 21:15다. 계단은 어둠 속으로 이어진다.",
    },
    variants: [
      {
        conditions: [RAINING],
        text: {
          en: "You read the notice again. It still says 21:15. Water slides past your feet and down the steps into the dark.",
          ko: "안내문을 다시 읽는다. 여전히 21:15다. 물이 발밑을 스쳐 계단을 타고 어둠 속으로 흘러내린다.",
        },
      },
    ],
  },

  fn_drain_01: {
    text: {
      en: "A storm drain beside the fountain, with one of Lily's garlands wound around the grate. Very festive.",
      ko: "분수 옆 빗물받이. 쇠살에 릴리의 꽃장식이 둘둘 감겨 있다. 아주 축제답다.",
    },
    variants: [
      {
        conditions: [RAINING],
        text: {
          en: "Lily's garland has slipped down over the drain. Petals and ribbon are packed tight into the grate.\n\nThe water isn't going down. It's going sideways — toward the passage steps.",
          ko: "릴리의 꽃장식이 빗물받이 위로 흘러내렸다. 꽃잎과 리본이 쇠살 사이에 꽉 끼어 있다.\n\n물이 아래로 빠지지 않는다. 옆으로 흐른다 — 통로 계단 쪽으로.",
        },
      },
    ],
    next: [{ conditions: [RAINING], to: "fn_drain_02" }],
  },
  fn_drain_02: {
    choices: [
      {
        text: { en: "Pull some of the petals out", ko: "꽃잎을 좀 걷어 낸다" },
        next: "fn_drain_03",
      },
      { text: { en: "Leave it. Someone will sort it out.", ko: "그냥 둔다. 누군가 치우겠지." }, next: "fn_drain_04" },
    ],
  },
  fn_drain_03: {
    text: {
      en: "You scoop out a pawful of petals. The water gulps, drops an inch, and then the next wave of petals slides in behind it.",
      ko: "한 움큼 꽃잎을 걷어 낸다. 물이 꿀꺽하더니 손가락 한 마디만큼 내려간다. 그리고 뒤따라온 꽃잎이 다시 미끄러져 들어온다.",
    },
    effects: [{ type: "unlockEvidence", id: "clogged_drain" }, { type: "setFlag", id: "drain_touched" }],
  },
  fn_drain_04: {
    text: {
      en: "Someone will sort it out. Somebody always does.",
      ko: "누군가 치우겠지. 늘 누군가는 하니까.",
    },
    ngPlusText: {
      en: "Someone will sort it out. That's what everybody thought.",
      ko: "누군가 치우겠지. 다들 그렇게 생각했다.",
    },
    effects: [{ type: "unlockEvidence", id: "clogged_drain" }, { type: "setFlag", id: "drain_left" }],
  },

  fn_bell_01: {
    text: {
      en: "Something small and green glints in the puddle at the top of the steps.",
      ko: "계단 맨 위 웅덩이에서 작고 초록색인 무언가가 반짝인다.",
    },
    next: "fn_bell_02",
  },
  fn_bell_02: {
    text: { en: "You pick it up. It rings once, very softly.", ko: "주워 든다. 아주 작게, 한 번 울린다." },
    sound: "bell",
    effects: [
      { type: "unlockEvidence", id: "green_bell" },
      { type: "setFlag", id: "green_bell_found" },
    ],
    next: "fn_bell_03",
  },
  fn_bell_03: {
    speaker: "bear",
    text: { en: "Nini's bell.", ko: "니니의 종." },
    next: "fn_bell_04",
  },
  fn_bell_04: {
    text: {
      en: "It's wet, and colder than the rain. Cold like it has been lying in water for a long time.",
      ko: "젖어 있고, 빗물보다 차갑다. 아주 오랫동안 물속에 잠겨 있었던 것처럼.",
    },
    ngPlusText: {
      en: "It's wet, and colder than the rain. Your paw closes around it like it has done this before.",
      ko: "젖어 있고, 빗물보다 차갑다. 손이 마치 전에도 이렇게 했던 것처럼 종을 감싸 쥔다.",
    },
    next: "fn_bell_05",
  },
  fn_bell_05: {
    text: {
      en: "Below you, in the dark of the passage, water is running.",
      ko: "발아래, 통로의 어둠 속에서 물이 흐르고 있다.",
    },
    effects: [{ type: "setFlag", id: "passage_hint" }],
    fx: ["cold"],
  },
});
