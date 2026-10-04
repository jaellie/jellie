/*
 * timeline.js — the REAL chronology of Bellflower Winter Night.
 *
 * This is the backbone of the mystery: everything the bear "remembers" must
 * be reconcilable with this list. The board's Timeline tab shows an entry
 * only once revealWhen passes; until then the slot shows "??:??".
 *
 *   time        "HH:MM" (24h)        order   sort key (past midnight = 24xx)
 *   text        what the PLAYER knows (supports variants / ngPlusText)
 *   truth       writer's note: what actually happened
 *   revealWhen  conditions
 *   timeKnownWhen  optional: the event is known but its exact time isn't yet
 *
 * Entries revealed by flags named tl_*_known are for later chapters.
 */
BGB.story.timeline({
  tl_1700: {
    time: "17:00", order: 1700,
    text: { en: "The festival begins.", ko: "축제가 시작된다." },
    truth: "Festival opens.",
    revealWhen: [{ type: "evidence", id: "festival_schedule" }],
  },
  tl_1830: {
    time: "18:30", order: 1830,
    text: { en: "It starts to rain.", ko: "비가 내리기 시작한다." },
    truth: "Rain begins. A heavy-rain advisory had been issued at 18:00.",
    revealWhen: [{ type: "flag", id: "rain_started" }],
  },
  tl_1900: {
    time: "19:00", order: 1900,
    text: { en: "The lantern parade. Mr. Finch sees Nini at the stage, ringing her bell.", ko: "등불 퍼레이드. 핀치 씨가 무대 앞에서 종을 흔드는 니니를 본다." },
    truth: "Nini is safe at the parade with her mother.",
    revealWhen: [{ type: "evidence", id: "t_finch_nini" }],
  },
  tl_1910: {
    time: "19:10", order: 1910,
    text: { en: "The drain by the fountain is blocked by petals and ribbon.", ko: "분수 옆 빗물받이가 꽃잎과 리본으로 막힌다." },
    truth: "A stallholder notices, pulls out a few petals, and moves on.",
    revealWhen: [{ type: "evidence", id: "clogged_drain" }, { type: "flag", id: "rain_started" }],
  },
  tl_1930: {
    time: "19:30", order: 1930,
    text: { en: "The festival goes on. Mr. Moss's worry about the pump can wait.", ko: "축제는 계속된다. 펌프에 대한 모스 씨의 걱정은 미뤄진다." },
    truth: "Mr. Finch decides not to cancel.",
    revealWhen: [{ type: "evidence", id: "t_finch_pump" }],
  },
  tl_2015: {
    time: "20:15", order: 2015,
    text: { en: "Water begins entering the old passage.", ko: "오래된 통로로 물이 들어오기 시작한다." },
    truth: "Mabel hears it under the cafe and assumes it's festival noise.",
    revealWhen: [{ type: "flag", id: "tl_2015_known" }],
  },
  tl_2100: {
    time: "21:00", order: 2100,
    text: { en: "The drainage pump fails.", ko: "배수 펌프가 멈춘다." },
    truth: "Repair had been postponed twice.",
    revealWhen: [{ type: "flag", id: "tl_2100_known" }],
  },
  tl_2115: {
    time: "21:15", order: 2115,
    text: { en: "The old passage is closed, according to the notice on the gate.", ko: "철문 안내문에 따르면, 오래된 통로가 폐쇄된다." },
    truth: "Mr. Moss locks the square-side gate. The cafe-side door stays unlocked.",
    revealWhen: [{ type: "evidence", id: "gate_notice" }],
  },
  tl_2230: {
    time: "22:30", order: 2230,
    text: { en: "The rain gets much heavier. Lily packs up.", ko: "비가 훨씬 거세진다. 릴리가 노점을 정리한다." },
    truth: "Heavy rain.",
    revealWhen: [{ type: "evidence", id: "t_lily_packing" }],
  },
  tl_2320: {
    time: "23:20", order: 2320,
    text: { en: "Nini realizes she has lost her bell.", ko: "니니가 종을 잃어버린 걸 알아챈다." },
    truth: "Nini notices the bell is gone.",
    revealWhen: [{ type: "flag", id: "tl_2320_known" }],
  },
  tl_2335: {
    time: "23:35", order: 2335,
    text: { en: "Some time after ten, Nini runs toward the fountain, looking for something.", ko: "열 시가 넘은 어느 때, 니니가 무언가를 찾으며 분수 쪽으로 뛰어간다." },
    truth: "Someone told her the bell may have dropped near the passage.",
    revealWhen: [{ type: "deduced", id: "d_lily_timing" }],
    timeKnownWhen: [{ type: "flag", id: "tl_2320_known" }], // until then: "??:??"
  },
  tl_2340: {
    time: "23:40", order: 2340,
    text: { en: "You realize Nini is missing.", ko: "니니가 없어졌다는 걸 알아챈다." },
    truth: "Bear starts searching.",
    revealWhen: [{ type: "flag", id: "search_time_reconstructed" }],
  },
  tl_2345: { time: "23:45", order: 2345, text: { en: "You find Nini.", ko: "니니를 찾는다." }, truth: "In the passage, water to her chest.", revealWhen: [{ type: "flag", id: "tl_2345_known" }] },
  tl_2347: { time: "23:47", order: 2347, text: { en: "Nini is out.", ko: "니니가 밖으로 나간다." }, truth: "Bear lifts her through the cafe-side opening. Last coherent memory.", revealWhen: [{ type: "flag", id: "tl_2347_known" }] },
  tl_2348: { time: "23:48", order: 2348, text: { en: "You are not.", ko: "나는 나가지 못한다." }, truth: "The costume, soaked, catches; the water rises.", revealWhen: [{ type: "flag", id: "tl_2348_known" }] },
  tl_0005: { time: "00:05", order: 2405, text: { en: "Someone calls for help.", ko: "누군가 구조를 요청한다." }, truth: "Emergency call. Delay: everyone assumed someone else had called.", revealWhen: [{ type: "flag", id: "tl_0005_known" }] },
  tl_0030: { time: "00:30", order: 2430, text: { en: "The rescue team arrives.", ko: "구조대가 도착한다." }, truth: "Rescue arrives.", revealWhen: [{ type: "flag", id: "tl_0030_known" }] },
  tl_0042: { time: "00:42", order: 2442, text: { en: "They reach you.", ko: "그들이 나에게 닿는다." }, truth: "Bear is pulled out. Twenty minutes too late.", revealWhen: [{ type: "flag", id: "tl_0042_known" }] },
  tl_0100: { time: "01:00", order: 2500, text: { en: "A bright room.", ko: "환한 방." }, truth: "Transported to hospital.", revealWhen: [{ type: "flag", id: "tl_0100_known" }] },
  tl_0117: { time: "01:17", order: 2517, text: { en: "Quiet.", ko: "고요." }, truth: "Big Green Bear dies.", revealWhen: [{ type: "flag", id: "tl_0117_known" }] },
});
