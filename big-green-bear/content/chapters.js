/*
 * chapters.js — the order of the story.
 *
 * Chapters run in the order they are registered here.
 *   title / subtitle   shown on the chapter card
 *   memory             memory reliability when the chapter begins (0-100)
 *   clock              in-world time when the chapter begins ("HH:MM", 24h)
 *   startScene         where the player stands when the chapter begins
 *   onEnter            effects when the chapter begins (often: start a dialogue)
 *   events             one-time happenings checked whenever the player is
 *                      free to act: [{ id, conditions, dialogue?, effects? }]
 *   completeWhen       conditions that end the chapter -> card for `next`
 *   audio              { music, ambience } or a list of [{ conditions, music, ambience }]
 *
 * SOFT-LOCK RULE: everything in completeWhen must be reachable no matter
 * what order the player does things in, and must have a hint (hints.js).
 */
BGB.story.chapters({
  ch1: {
    title: { en: "Winter Night", ko: "겨울밤" },
    subtitle: { en: "Bellflower Town. A quarter to six.", ko: "벨플라워 마을. 여섯 시 십오 분 전." },
    memory: 100,
    clock: "17:40",
    startScene: "square",
    onEnter: [{ type: "startDialogue", id: "intro_01" }],
    audio: [
      { conditions: [{ type: "flag", id: "rain_started" }], music: "theme", ambience: ["festival", "rain_light"] },
      { music: "theme", ambience: ["festival"] },
    ],
    events: [
      {
        // The rain comes whether or not the player has met Nini (no soft-lock).
        id: "ch1_rain",
        conditions: [
          {
            type: "any",
            of: [
              { type: "all", of: [{ type: "flag", id: "met_nini" }, { type: "turns", gte: 3 }] },
              { type: "turns", gte: 7 },
            ],
          },
        ],
        dialogue: "rain_01",
      },
    ],
    completeWhen: [
      { type: "contradiction", id: "c_nini_parade" },
      { type: "evidence", id: "green_bell" },
    ],
    next: "ch2",
  },

  ch2: {
    title: { en: "The Rain", ko: "비" },
    subtitle: { en: "Later. You aren't sure how much later.", ko: "나중. 얼마나 지났는지는 모르겠다." },
    memory: 95,
    clock: "22:30",
    startScene: "square_late",
    onEnter: [{ type: "startDialogue", id: "ch2_intro_01" }],
    audio: { music: "theme", ambience: ["rain_heavy"] },
    events: [
      {
        // End of the vertical slice.
        id: "ch2_slice_end",
        conditions: [
          { type: "deduced", id: "d_lily_timing" },
          { type: "flag", id: "second_ring_heard" },
        ],
        effects: [{ type: "startEnding", id: "slice_end" }],
      },
    ],
  },
});
