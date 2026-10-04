/*
 * evidence.js — everything that can go on the evidence board.
 *
 *   title, description     what the player sees first (the APPARENT meaning)
 *   kind                   item | document | testimony | observation | photo
 *   source                 who/where it came from
 *   reliability            firsthand | document | testimony | hearsay | memory | unknown
 *   tags, related          related = ids that "feel connected" when compared
 *   interpretations        [{ conditions, text }] — the LAST one whose conditions
 *                          pass is shown. List them from apparent to real meaning.
 *                          The board marks the card "reread" when it changes.
 *   realMeaning            writer's note (debug panel only)
 *   chapter                where it is normally found (documentation only —
 *                          evidence stays valid whenever it is collected)
 */
var NGP = { type: "ngPlus" };

BGB.story.evidence({
  clock_1147: {
    title: { en: "The town hall clock", ko: "시청 시계" },
    kind: "observation",
    source: { en: "Bellflower Square", ko: "벨플라워 광장" },
    reliability: "firsthand",
    tags: ["1147", "time"],
    chapter: "ch1",
    related: ["gate_notice"],
    description: {
      en: "The clock on the town hall says 11:47. It always has. Nobody ever fixes it.",
      ko: "시청 시계는 11시 47분을 가리킨다. 늘 그랬다. 아무도 고치지 않는다.",
    },
    interpretations: [
      {
        conditions: [{ type: "flag", id: "gate_1147_seen" }],
        text: {
          en: "The town hall clock says 11:47. It always has.\n\nBut at the passage gate, for a moment, the time was 11:47 there too. There's no clock at the gate.",
          ko: "시청 시계는 11시 47분을 가리킨다. 늘 그랬다.\n\n그런데 통로 철문 앞에서도 잠깐, 시각이 11시 47분이었다. 철문 앞에는 시계가 없는데.",
        },
      },
      {
        conditions: [{ type: "deduced", id: "d_1147" }],
        text: {
          en: "11:47. Not a broken clock — a time. Something happened at 11:47 tonight. You just can't see it yet.",
          ko: "11시 47분. 고장 난 시계가 아니라, 하나의 시각이다. 오늘 밤 11시 47분에 무슨 일이 있었다. 아직 보이지 않을 뿐.",
        },
      },
      {
        conditions: [NGP],
        text: {
          en: "11:47 PM. The last moment you remember clearly. Everything after it, you have had to put back together yourself.",
          ko: "밤 11시 47분. 또렷하게 기억나는 마지막 순간. 그 뒤의 일은 전부, 스스로 이어 붙여야 했다.",
        },
      },
    ],
    realMeaning: "23:47 — Nini is out of the passage. The last coherent point in Bear's memory.",
  },

  festival_schedule: {
    title: { en: "Festival schedule", ko: "축제 일정표" },
    kind: "document",
    source: { en: "Poster in the square", ko: "광장 게시판 포스터" },
    reliability: "document",
    tags: ["time"],
    chapter: "ch1",
    description: {
      en: "BELLFLOWER WINTER NIGHT\n5:00 PM  Opening\n7:00 PM  Lantern Parade\n9:00 PM  Bell Choir\n11:00 PM  Closing — see you next year!",
      ko: "벨플라워 겨울밤\n오후 5:00  개막\n오후 7:00  등불 퍼레이드\n오후 9:00  종소리 합창\n오후 11:00  폐막 — 내년에 만나요!",
    },
    realMeaning: "Anchors the real timeline. The parade (19:00) happens long before Nini goes missing (23:35).",
  },

  nini_promise: {
    title: { en: "A promise", ko: "약속" },
    kind: "testimony",
    source: { en: "Nini", ko: "니니" },
    reliability: "memory",
    tags: ["nini"],
    chapter: "ch1",
    description: {
      en: "\"You're coming too, right?\"\n\"Of course.\"",
      ko: "\"곰도 올 거지?\"\n\"물론이지.\"",
    },
    interpretations: [
      {
        conditions: [NGP],
        text: {
          en: "\"You're coming too, right?\"\n\"Of course.\"\n\nYou've heard her ask that twice. Only one time was about the parade.",
          ko: "\"곰도 올 거지?\"\n\"물론이지.\"\n\n그 말을 두 번 들었다. 퍼레이드 얘기였던 건 한 번뿐이다.",
        },
      },
    ],
    realMeaning: "Echo of 23:47: 'Are you coming?' 'Go.' 'But you're coming too, right?' 'Of course.'",
  },

  weather_radio: {
    title: { en: "The radio forecast", ko: "라디오 일기예보" },
    kind: "testimony",
    source: { en: "Lily, who heard it on the radio", ko: "라디오에서 들었다는 릴리" },
    reliability: "hearsay",
    tags: ["rain", "warning"],
    chapter: "ch1",
    related: ["t_finch_pump", "t_lily_packing"],
    description: {
      en: "Lily heard on the radio that the rain might get much heavier later tonight. \"They always say that.\"",
      ko: "릴리가 라디오에서 들었다. 밤늦게 비가 훨씬 거세질 수도 있다고. \"맨날 그렇게 말하잖아요.\"",
    },
    realMeaning: "A heavy-rain advisory was issued at 18:00. Several people heard it; nobody acted on it.",
  },

  t_finch_pump: {
    title: { en: "Mr. Moss's worry", ko: "모스 씨의 걱정" },
    kind: "testimony",
    source: { en: "Mr. Finch", ko: "핀치 씨" },
    reliability: "hearsay",
    tags: ["pump", "passage", "warning"],
    chapter: "ch1",
    related: ["clogged_drain", "gate_notice"],
    description: {
      en: "Mr. Moss came to Mr. Finch, worried about a pump near the old passage. Mr. Finch told him they would look at it after the festival.",
      ko: "모스 씨가 핀치 씨를 찾아와 오래된 통로 근처 펌프가 걱정된다고 했다. 핀치 씨는 축제 끝나고 보자고 했다.",
    },
    realMeaning: "The pump failed at 21:00. Its repair had been postponed twice before the festival.",
  },

  t_lily_nini: {
    title: { en: "Lily: Nini at the fountain", ko: "릴리: 분수 쪽의 니니" },
    kind: "testimony",
    source: { en: "Lily", ko: "릴리" },
    reliability: "testimony",
    tags: ["nini", "time"],
    chapter: "ch1",
    description: {
      en: "Lily says Nini ran toward the fountain right before the parade, looking upset, like she'd lost something. Lily remembers because she was packing up her wet flowers.",
      ko: "릴리 말로는 퍼레이드 직전에 니니가 분수 쪽으로 뛰어갔다. 뭔가 잃어버린 듯 속상한 얼굴이었다고. 젖은 꽃을 정리하던 중이라 기억한단다.",
    },
    interpretations: [
      {
        conditions: [{ type: "deduced", id: "d_lily_timing" }],
        text: {
          en: "Lily saw Nini run toward the fountain while she was packing up — after ten, not before the parade. She remembered what she was doing more clearly than when.",
          ko: "릴리가 니니를 본 건 꽃을 정리하던 때 — 퍼레이드 전이 아니라 밤 열 시 이후다. 언제였는지보다 무얼 하고 있었는지를 더 또렷하게 기억했던 것이다.",
        },
      },
    ],
    realMeaning: "About 23:30. Nini, having lost the bell at 23:20, was told it might be by the passage.",
  },

  t_finch_nini: {
    title: { en: "Mr. Finch: Nini at the stage", ko: "핀치 씨: 무대 앞의 니니" },
    kind: "testimony",
    source: { en: "Mr. Finch", ko: "핀치 씨" },
    reliability: "testimony",
    tags: ["nini", "time"],
    chapter: "ch1",
    description: {
      en: "Mr. Finch says Nini was at the stage during the parade, with her mother, ringing a little bell the whole time.",
      ko: "핀치 씨 말로는 퍼레이드 내내 니니가 엄마랑 무대 앞에 있었다. 작은 종을 계속 흔들면서.",
    },
    realMeaning: "True. 19:00, the parade. Nini was safe and had her bell.",
  },

  clogged_drain: {
    title: { en: "The blocked drain", ko: "막힌 빗물받이" },
    kind: "observation",
    source: { en: "The old fountain", ko: "오래된 분수" },
    reliability: "firsthand",
    tags: ["water", "drain"],
    chapter: "ch1",
    related: ["t_finch_pump", "weather_radio"],
    description: {
      en: "One of Lily's garlands has slipped down over the drain by the fountain. Petals and ribbon are packed into the grate. The water isn't going down. It's going sideways — toward the passage steps.",
      ko: "릴리의 꽃장식 하나가 분수 옆 빗물받이 위로 흘러내렸다. 꽃잎과 리본이 쇠살 사이에 꽉 끼어 있다. 물이 아래로 빠지지 않고 옆으로 흐른다 — 통로 계단 쪽으로.",
    },
    realMeaning: "Noticed ~19:10 by a stallholder, who pulled some petals out and moved on. Nobody reported it.",
  },

  gate_notice: {
    title: { en: "Notice on the passage gate", ko: "통로 철문의 안내문" },
    kind: "document",
    source: { en: "The service passage gate", ko: "관리 통로 철문" },
    reliability: "document",
    tags: ["passage", "time", "1147"],
    chapter: "ch1",
    related: ["t_finch_pump", "clock_1147"],
    description: {
      en: "SERVICE PASSAGE — STAFF ONLY\nCLOSED 21:15 BY ORDER OF FESTIVAL STAFF\n\nYou read it before nine o'clock.",
      ko: "관리 통로 — 관계자 외 출입 금지\n축제 운영진 지시로 21:15 폐쇄\n\n이걸 읽은 건 아홉 시도 되기 전이었다.",
    },
    interpretations: [
      {
        conditions: [{ type: "evidence", id: "t_finch_locked" }],
        text: {
          en: "SERVICE PASSAGE — STAFF ONLY\nCLOSED 21:15 BY ORDER OF FESTIVAL STAFF\n\nMr. Finch says Mr. Moss locked it at a quarter past nine because water was getting in. So the notice is real. But you read it before nine o'clock.",
          ko: "관리 통로 — 관계자 외 출입 금지\n축제 운영진 지시로 21:15 폐쇄\n\n핀치 씨 말로는 물이 들어와서 모스 씨가 아홉 시 십오 분에 잠갔다고 한다. 그러니 안내문은 진짜다. 그런데 나는 이걸 아홉 시 전에 읽었다.",
        },
      },
    ],
    realMeaning: "Real notice, posted 21:15. Bear saw it later that night (around 23:40); his memory placed it earlier.",
  },

  green_bell: {
    title: { en: "Nini's green bell", ko: "니니의 초록 종" },
    kind: "item",
    source: { en: "A puddle at the top of the passage steps", ko: "통로 계단 위 웅덩이" },
    reliability: "firsthand",
    tags: ["nini", "bell", "water"],
    chapter: "ch1",
    related: ["t_lily_nini", "the_ringing"],
    description: {
      en: "A small green bell, like the ones you hand out at the festival. You found it in a puddle at the top of the passage steps. It is wet and very cold.",
      ko: "축제에서 나눠 주는 것과 똑같은 작은 초록 종. 통로 계단 위 웅덩이에서 찾았다. 젖어 있고, 아주 차갑다.",
    },
    interpretations: [
      {
        conditions: [{ type: "deduced", id: "d_lily_timing" }],
        text: {
          en: "Nini's green bell. If Lily saw her looking for something after ten, then this is what she lost — late, near the passage. Long after the parade.",
          ko: "니니의 초록 종. 릴리가 열 시 넘어서 뭔가 찾는 니니를 봤다면, 니니가 잃어버린 건 이거다 — 늦은 밤, 통로 근처에서. 퍼레이드가 끝나고 한참 뒤에.",
        },
      },
      {
        conditions: [NGP],
        text: {
          en: "Nini's green bell. You didn't find it in a puddle. You found it down there, in the water, and you closed her hand around it before you lifted her out.",
          ko: "니니의 초록 종. 웅덩이에서 주운 게 아니다. 저 아래, 물속에서 찾았다. 그리고 니니를 들어 올리기 전에, 그 작은 손에 쥐여 주었다.",
        },
      },
    ],
    realMeaning: "Bear found the bell in the passage while searching for Nini and gave it back to her before pushing her out through the hatch. She kept it all her life.",
  },

  t_lily_packing: {
    title: { en: "Lily packed up late", ko: "늦게 정리한 릴리" },
    kind: "testimony",
    source: { en: "Lily", ko: "릴리" },
    reliability: "testimony",
    tags: ["time", "rain"],
    chapter: "ch2",
    related: ["t_lily_nini", "weather_radio"],
    description: {
      en: "Lily held out as long as she could. She only started packing up after ten, when the rain really came down.",
      ko: "릴리는 버틸 수 있을 만큼 버텼다. 비가 정말 쏟아지기 시작한 밤 열 시 이후에야 짐을 싸기 시작했다.",
    },
    realMeaning: "22:30, heavy rain begins.",
  },

  t_finch_locked: {
    title: { en: "Mr. Finch: the passage was locked", ko: "핀치 씨: 통로를 잠갔다" },
    kind: "testimony",
    source: { en: "Mr. Finch", ko: "핀치 씨" },
    reliability: "testimony",
    tags: ["passage", "door"],
    chapter: "ch2",
    related: ["gate_notice", "t_finch_pump"],
    description: {
      en: "Mr. Finch says Mr. Moss locked the old passage at a quarter past nine, because water was getting in. \"Safety first.\"",
      ko: "핀치 씨 말로는 물이 들어와서 모스 씨가 아홉 시 십오 분에 오래된 통로를 잠갔다고 한다. \"안전이 제일이죠.\"",
    },
    realMeaning: "Moss locked the gate at 21:15. The far end, by the cafe, stayed unlocked. This matters later.",
  },

  the_ringing: {
    title: { en: "Something rang below", ko: "아래에서 울린 소리" },
    kind: "observation",
    source: { en: "The passage gate", ko: "통로 철문" },
    reliability: "memory",
    tags: ["bell", "sound"],
    chapter: "ch2",
    related: ["green_bell"],
    description: {
      en: "At the gate, you heard something ring in the dark below. Once. Thin and bright.\n\nNini's bell was in your paw the whole time.",
      ko: "철문 앞에서, 아래 어둠 속에서 무언가 울리는 소리를 들었다. 한 번. 가늘고 맑게.\n\n니니의 종은 그동안 내내 내 손에 있었다.",
    },
    realMeaning: "The hospital heart monitor bleeding into the memory. It 'rings' more often as the game goes on.",
  },
});
