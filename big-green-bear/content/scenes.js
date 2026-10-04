/*
 * scenes.js — places the player can be.
 *
 *   title              localized
 *   text               description (supports variants / ngPlusText)
 *   actions            what the player can do here:
 *       { type: "look", label, dialogue, conditions?, once? }
 *       { type: "talk", npc, conditions? }        label is automatic
 *       { type: "go",   to,  conditions? }        label is automatic
 *   onEnter / onFirstEnter   effects
 *   events             one-time happenings, like chapters.events
 *   fx                 authored visual effects while here (see css/memory.css)
 *   audio              overrides the chapter's audio
 */
var RAIN = { type: "flag", id: "rain_started" };
var NO_RAIN = { type: "not", condition: RAIN };

BGB.story.scenes({
  /* ===================== CHAPTER 1 ===================== */

  square: {
    title: { en: "Bellflower Square", ko: "벨플라워 광장" },
    text: {
      en: "Strings of lights sag between the lampposts. Children chase each other around the stalls, and the air smells of cinnamon and wet stone.\n\nAbove it all, the town hall clock looks down on the square.",
      ko: "가로등 사이로 전구 줄이 느슨하게 늘어져 있다. 아이들이 노점 사이를 뛰어다니고, 공기에서는 계피와 젖은 돌 냄새가 난다.\n\n그 모든 것 위에서, 시청 시계가 광장을 내려다보고 있다.",
    },
    variants: [
      {
        conditions: [RAIN],
        text: {
          en: "The lights are still on, but people have pulled up their hoods. Puddles gather under the stalls and the cinnamon smell has gone thin.\n\nAbove it all, the town hall clock looks down on the square.",
          ko: "전구는 아직 켜져 있지만 사람들은 모자를 뒤집어썼다. 노점 밑에 물웅덩이가 고이고, 계피 냄새도 옅어졌다.\n\n그 모든 것 위에서, 시청 시계가 광장을 내려다보고 있다.",
        },
      },
    ],
    actions: [
      { type: "talk", npc: "nini", conditions: [NO_RAIN] },
      { type: "look", label: { en: "Look at the town hall clock", ko: "시청 시계를 본다" }, dialogue: "sq_clock_01" },
      { type: "look", label: { en: "Read the festival schedule", ko: "축제 일정표를 읽는다" }, dialogue: "sq_schedule_01" },
      { type: "look", label: { en: "Look at the lights", ko: "전구를 본다" }, dialogue: "sq_lights_01" },
      { type: "go", to: "flower_stall" },
      { type: "go", to: "stage" },
      { type: "go", to: "fountain" },
    ],
  },

  flower_stall: {
    title: { en: "Lily's Flower Stall", ko: "릴리의 꽃 노점" },
    text: {
      en: "A cart heaped with winter roses, white heather and pine. Ribbon offcuts curl on the cobbles.",
      ko: "겨울 장미와 흰 히스, 솔가지가 수북한 수레. 잘라 낸 리본 조각이 돌바닥 위에 돌돌 말려 있다.",
    },
    variants: [
      {
        conditions: [RAIN],
        text: {
          en: "Rain beads on the roses. Loose petals slide off the cart and ride the water along the gutter, toward the fountain.",
          ko: "장미 위에 빗방울이 맺힌다. 떨어진 꽃잎이 수레에서 미끄러져 빗물을 타고 도랑을 따라 분수 쪽으로 흘러간다.",
        },
      },
    ],
    actions: [
      { type: "talk", npc: "lily" },
      { type: "go", to: "square" },
      { type: "go", to: "fountain" },
    ],
  },

  stage: {
    title: { en: "The Stage", ko: "무대" },
    text: {
      en: "A small wooden stage with a banner: BELLFLOWER WINTER NIGHT — 41 YEARS. Someone is testing a microphone. One, two. One, two.",
      ko: "작은 나무 무대에 현수막이 걸려 있다. '벨플라워 겨울밤 — 41년째'. 누군가 마이크를 시험하고 있다. 하나, 둘. 하나, 둘.",
    },
    variants: [
      {
        conditions: [RAIN],
        text: {
          en: "The banner sags with water: BELLFLOWER WINTER NIGHT — 41 YEARS. The speakers are under plastic sheets. The show goes on.",
          ko: "현수막이 물을 먹고 처졌다. '벨플라워 겨울밤 — 41년째'. 스피커에는 비닐이 덮여 있다. 공연은 계속된다.",
        },
      },
    ],
    actions: [
      { type: "talk", npc: "finch" },
      { type: "go", to: "square" },
    ],
  },

  fountain: {
    title: { en: "The Old Fountain", ko: "오래된 분수" },
    text: {
      en: "The old stone fountain at the edge of the square, switched off for winter. Beside it, a short iron gate and a stairway going down: the old service passage under the square.",
      ko: "광장 가장자리의 오래된 돌 분수. 겨울이라 물은 꺼져 있다. 그 옆에 낮은 철문과 아래로 내려가는 계단이 있다. 광장 밑을 지나는 오래된 관리 통로다.",
    },
    variants: [
      {
        conditions: [RAIN],
        text: {
          en: "The fountain is filling up for the first time all winter. Beside it, water slides over the top step of the service passage and disappears into the dark below.",
          ko: "겨우내 말라 있던 분수가 처음으로 차오르고 있다. 그 옆, 관리 통로 맨 윗계단을 넘은 빗물이 아래 어둠 속으로 사라진다.",
        },
      },
    ],
    audio: [{ conditions: [RAIN], ambience: ["rain_light", "drips"] }],
    actions: [
      { type: "look", label: { en: "Look at the gate", ko: "철문을 본다" }, dialogue: "fn_gate_01" },
      { type: "look", label: { en: "Look at the storm drain", ko: "빗물받이를 본다" }, dialogue: "fn_drain_01" },
      {
        type: "look",
        label: { en: "Look at the puddle by the steps", ko: "계단 옆 웅덩이를 본다" },
        dialogue: "fn_bell_01",
        conditions: [{ type: "flag", id: "nini_missing" }, { type: "not", condition: { type: "evidence", id: "green_bell" } }],
      },
      { type: "go", to: "square" },
      { type: "go", to: "flower_stall" },
    ],
  },

  /* ===================== CHAPTER 2 ===================== */

  square_late: {
    // Same name as the first square on purpose: the player should feel it is the same place.
    title: { en: "Bellflower Square", ko: "벨플라워 광장" },
    text: {
      en: "Most of the stalls are dark. Half the lights have gone out, and the ones left buzz. The rain has stopped being something you notice and started being something you're in.\n\nThe town hall clock looks down on the square.",
      ko: "노점은 대부분 불이 꺼졌다. 전구도 절반은 나갔고, 남은 것들은 지직거린다. 비는 이제 신경 쓰이는 정도가 아니라, 그 안에 들어와 있는 무언가가 되었다.\n\n시청 시계가 광장을 내려다보고 있다.",
    },
    actions: [
      { type: "talk", npc: "finch" },
      { type: "look", label: { en: "Look at the town hall clock", ko: "시청 시계를 본다" }, dialogue: "sql_clock_01" },
      { type: "go", to: "flower_stall_late" },
      { type: "go", to: "fountain_late" },
    ],
  },

  flower_stall_late: {
    title: { en: "Lily's Flower Stall", ko: "릴리의 꽃 노점" },
    text: {
      en: "The awning has been rolled up. The cart is nearly bare: a few drowned roses, a bucket of black water.",
      ko: "차양은 말아 올려져 있다. 수레는 거의 비었다. 물에 잠긴 장미 몇 송이와 시커먼 물이 담긴 양동이뿐.",
    },
    actions: [
      { type: "talk", npc: "lily" },
      { type: "go", to: "square_late" },
      { type: "go", to: "fountain_late" },
    ],
  },

  fountain_late: {
    title: { en: "The Old Fountain", ko: "오래된 분수" },
    text: {
      en: "The fountain has overflowed. Water runs across the stones in a sheet, over the top step of the service passage, and down.",
      ko: "분수가 넘쳤다. 물이 돌바닥 위로 얇게 퍼져 흐르다가 관리 통로 맨 윗계단을 넘어 아래로 쏟아진다.",
    },
    fx: ["cold"],
    audio: { ambience: ["rain_heavy", "drips"] },
    actions: [
      { type: "look", label: { en: "Look at the gate", ko: "철문을 본다" }, dialogue: "fnl_gate_01" },
      { type: "go", to: "square_late" },
      { type: "go", to: "flower_stall_late" },
    ],
  },
});
