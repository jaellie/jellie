import { describe, expect, it } from "vitest";
import { createGame } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";
import { applyCulture, cultureRegion } from "../src/story/culture";

const KOREAN_FOOD = /라면|떡볶이|짜장면|국밥|미역국|소주|삼겹살|붕어빵|김치|ramyeon|tteokbokki|jjajangmyeon|gukbap|soju|kimchi/;

function play(nat: string, lang: "ko" | "en", seed: number): string[] {
  const g = createGame({ name: "Mina", gender: "F", likes: "M", birth: { year: 1985, month: 3, day: 3 }, mbti: "ENFP", seed, nationality: nat, birthplace: nat === "US" ? "newyork" : "seoul", home: nat === "US" ? "newyork" : "seoul", lang, fated: { name: "Ren", from: "same", status: "dating", since: { year: 2023, month: 1, day: 1 } } } as never);
  const rng = new SeededRandom(seed);
  const seen: string[] = [];
  for (let n = 0; n < 120 && !g.isOver(); n++) {
    for (let i = 0; i < 400; i++) {
      const beats = g.advance(g.s.minute + 30);
      for (const b of beats) {
        if (b.kind === "popup") {
          seen.push(b.popup.line, b.popup.title ?? "", ...b.popup.ch.map((c) => c.t));
          const r = g.choose(rng.int(0, b.popup.ch.length - 1));
          if (r) seen.push(r.line, r.quote ?? "");
        } else if ("text" in b && typeof b.text === "string") seen.push(b.text);
      }
      if (beats.some((b) => b.kind === "dayEnd")) break;
    }
    const e = g.endDay();
    seen.push(...e.lines, ...e.cards.map((c) => c.caption));
  }
  return seen;
}

describe("Food and customs follow your nationality", () => {
  it("resolves words and particles by region", () => {
    expect(cultureRegion("US")).toBe("NAM");
    expect(applyCulture("{f:ramen}을(를) 끓였다", "KR", "ko")).toBe("라면을 끓였다");
    expect(applyCulture("{f:ramen}을(를) 끓였다", "US", "ko")).toBe("마카로니 앤 치즈를 끓였다");
    expect(applyCulture("{f:delivery}(으)로 위로했다", "KR", "ko")).toBe("치킨으로 위로했다");
    expect(applyCulture("{f:street} again.", "JP", "en")).toBe("Takoyaki again.");
  });

  it("an American life (in Korean or English) never shows a token or Korean food", () => {
    for (const lang of ["ko", "en"] as const) {
      const all = play("US", lang, 3).join("\n");
      expect(all).not.toContain("{f:");
      expect(all).not.toMatch(KOREAN_FOOD);
    }
  }, 120000);

  it("a Korean life still gets Korean food", () => {
    const all = play("KR", "ko", 3).join("\n");
    expect(all).not.toContain("{f:");
  }, 120000);
});

import { eventView, lifeEvent } from "../src/story/lifeEvents";
describe("Unusual-age moments read their age", () => {
  it("a friend's wedding at 72 isn't written like one at 28", () => {
    const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 1960, month: 3, day: 3 }, mbti: "ENFP", seed: 1 } as never);
    const def = lifeEvent("INVITE_FRIEND_WEDDING")!;
    g.state.age = 72;
    expect(eventView(g.state, def, "u1").line.ko).toContain("이 나이에");
    g.state.age = 28;
    expect(eventView(g.state, def, "u2").line.ko).toBe(def.line.ko);
  });
});
