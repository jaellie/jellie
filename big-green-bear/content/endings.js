/*
 * endings.js — ending sequences.
 *
 * An ending is a list of steps played one at a time:
 *   { speaker?, text?, pause?, fx?, sound?, effects?, conditions? }
 *   - a step with only `pause` (ms) is silence; it moves on by itself
 *   - steps whose conditions fail are skipped (use this for variations,
 *     e.g. a line that only appears if the player found every clue)
 *   audio      what plays during the ending (default: silence)
 *   title      shown on the end screen
 *   epilogue   one line under the title
 *
 * Start an ending with the effect { type: "startEnding", id }.
 * Finishing any ending unlocks "Begin again" (New Game+).
 */
BGB.story.endings({
  /* End of the vertical slice. */
  slice_end: {
    title: { en: "Winter Night", ko: "겨울밤" },
    epilogue: {
      en: "End of the vertical slice. The rest of the night is still waiting to be remembered.",
      ko: "버티컬 슬라이스는 여기까지. 남은 밤은 아직 기억되기를 기다리고 있다.",
    },
    audio: { music: null, ambience: ["rain_heavy"] },
    steps: [
      { text: { en: "The rain doesn't stop.", ko: "비는 그치지 않는다." } },
      { pause: 1600 },
      {
        text: { en: "The town hall clock says 11:47.", ko: "시청 시계는 11시 47분을 가리킨다." },
        fx: ["clock1147"],
        effects: [{ type: "setClock", time: "23:47" }, { type: "fx", id: "tide" }],
      },
      {
        text: { en: "For the first time tonight, you think it might be right.", ko: "오늘 밤 처음으로, 저 시계가 맞을지도 모른다는 생각이 든다." },
        fx: ["clock1147", "cold"],
      },
      {
        conditions: [{ type: "deduced", id: "d_1147" }],
        text: { en: "You were right about it. You just don't know yet what you were right about.", ko: "그 시각에 대한 짐작은 맞았다. 무엇이 맞았는지 아직 모를 뿐." },
        fx: ["clock1147", "cold"],
      },
      { pause: 1200 },
    ],
  },

  /*
   * FINAL ENDING — STRUCTURE ONLY.
   * Lines below are placeholders from the design document, not final prose.
   * Reachable now only from the debug panel (Dialogue tab → Ending).
   */
  ending_home: {
    title: { en: "He Came Back", ko: "돌아왔다" },
    epilogue: { en: "[placeholder epilogue]", ko: "[임시 에필로그]" },
    audio: { music: null, ambience: [] },
    onStart: [{ type: "setFlag", id: "final_scene_unlocked" }],
    steps: [
      { text: { en: "[Nini is safely home.]", ko: "[니니는 무사히 집에 있다.]" }, fx: ["minimal", "still"] },
      { speaker: "bear", text: { en: "Is she home?", ko: "그 애, 집에 갔어요?" }, fx: ["minimal", "still"] },
      { speaker: "hazel", text: { en: "Yes.", ko: "네." }, fx: ["minimal", "still"] },
      { pause: 2500 },
      { speaker: "bear", text: { en: "Good.", ko: "다행이다." }, fx: ["minimal", "still"] },
      { pause: 4000, effects: [{ type: "setMemory", value: 0 }] },
      { text: { en: "[Years later. A small box.]", ko: "[몇 년 뒤. 작은 상자 하나.]" }, fx: ["minimal", "still"] },
      { text: { en: "[Inside: a small green bell.]", ko: "[그 안에: 작은 초록 종.]" }, fx: ["minimal", "still"] },
      { text: { en: "[She rings it once.]", ko: "[그녀가 종을 한 번 울린다.]" }, sound: "bell", fx: ["minimal", "still"] },
      { pause: 3000 },
      {
        conditions: [{ type: "flag", id: "all_evidence_found" }],
        text: { en: "[Optional line for completionists.]", ko: "[모든 단서를 찾은 플레이어를 위한 추가 문장.]" },
        fx: ["minimal", "still"],
      },
      { speaker: "nini", text: { en: "He came back for me.", ko: "그는 나를 데리러 돌아왔어." }, fx: ["minimal", "still"] },
      { pause: 3000 },
    ],
  },
});
