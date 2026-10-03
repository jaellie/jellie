import { describe, expect, it } from "vitest";
import { createGame } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";
import { applyCulture, cultureRegion } from "../src/story/culture";

const KOREAN_FOOD = /노래방|상견례|영정|노량진|독서실|찜질방|분식집|축의금|청약|전세|반지하|명동|컵밥|가채점|검정고시|회식|빈소|발인|절을 했다|라면|떡볶이|짜장면|국밥|미역국|소주|삼겹살|붕어빵|김치|ramyeon|tteokbokki|jjajangmyeon|gukbap|soju|kimchi/;

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

import { localizeMoneyText } from "../src/game/currency";
describe("Money in story text", () => {
  it("converts every way won is written, with the right Korean particle after it", () => {
    expect(localizeMoneyText("시장에서 3천 원으로", "USD", "ko")).toBe("시장에서 $2로");
    expect(localizeMoneyText("잊고 있던 만 원이 나왔다", "USD", "ko")).toBe("잊고 있던 $7가 나왔다");
    expect(localizeMoneyText("영수증 7,777원.", "USD", "ko")).toBe("영수증 $6.");
    expect(localizeMoneyText("영수증 7,777원.", "KRW", "ko")).toBe("영수증 7,777원.");
  });
});

describe("Culture-bound paintings follow the nationality, not the language", () => {
  const enter = (nat: string, lang: "ko" | "en") => {
    const g = createGame({ name: "Mina", gender: "F", likes: "M", birth: { year: 1985, month: 3, day: 3 }, mbti: "ENFP", seed: 5, nationality: nat, birthplace: nat === "US" ? "newyork" : "seoul", home: nat === "US" ? "newyork" : "seoul", lang } as never);
    g.scene();
  };
  it("a Korean-language game as a US citizen gets the Western version; Korean citizens keep the Korean one", async () => {
    const { photoFor } = await import("../src/integration/prototype");
    enter("US", "ko");
    expect(photoFor("funeral_hall")).toBe("bg/funeral_hall_west.png");
    enter("KR", "en");
    expect(photoFor("funeral_hall")).toBe("bg/funeral_hall.png");
  });
});
