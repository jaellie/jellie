import { describe, expect, it } from "vitest";
import data from "../data/world/names.json";
import { createGame } from "../src/game/game";
import { englishOnly } from "../src/game/text";
import { SeededRandom } from "../src/core/rng";
import { generateNpc, createWorldState } from "../src/world/npcs";
import { cultureOf, nameEn, nameKo, pickName } from "../src/world/names";

const JAE = { name: "제이", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP" };
const date = { year: 2030, month: 5, day: 1 };
const pools = data.cultures as Record<string, Record<"MALE" | "FEMALE", Array<{ ko: string; en: string }>>>;

describe("NPC names fit the language, the place and the person", () => {
  it("every generated name is a ko/en pair; Korean forms are Hangul, English forms are Latin; no duplicates", () => {
    const ko = new Set<string>();
    for (const c of Object.values(pools))
      for (const list of Object.values(c))
        for (const p of list) {
          expect(p.ko).toMatch(/^[가-힣]+$/);
          expect(p.en).toMatch(/^[A-Za-zÀ-ÿ]+$/);
          expect(ko.has(p.ko)).toBe(false);
          ko.add(p.ko);
        }
  });

  it("a person's name matches their sex (a boyfriend is never 예린)", () => {
    const rng = new SeededRandom(1);
    for (let i = 0; i < 200; i++) {
      const w = createWorldState();
      const npc = generateNpc(w, rng, { type: "regular_customer", region: "home_city", date, aroundAge: 30, persistence: "PERSISTENT", sex: "MALE" });
      expect(npc.sex).toBe("MALE");
      expect(nameKo(npc.name)?.sex).toBe("MALE");
    }
  });

  it("names follow the place: Korea → Korean, living in Tokyo → Japanese, a trip to Paris → French", () => {
    const rng = new SeededRandom(2);
    const count = (country: string | undefined, region: string) => {
      const w = createWorldState();
      w.country = country;
      const cultures: Record<string, number> = {};
      for (let i = 0; i < 200; i++) {
        const n = generateNpc(w, rng, { type: "regular_customer", region, date, aroundAge: 30, persistence: "TEMPORARY" });
        const c = Object.entries(pools).find(([, v]) => [...v.MALE, ...v.FEMALE].some((p) => p.ko === n.name))![0];
        cultures[c] = (cultures[c] ?? 0) + 1;
      }
      return cultures;
    };
    expect(count("Korea", "home_city").KR).toBeGreaterThan(180);
    expect(count("Japan", "home_city").JP).toBeGreaterThan(150);
    expect(count("Korea", "paris").FR).toBeGreaterThan(150);
    expect(cultureOf("USA")).toBe("ANGLO");
    expect(cultureOf("TH")).toBe("TH");
  });

  it("English UI shows the English pair; Korean UI shows Hangul only", () => {
    expect(englishOnly("Chatted with 서준.")).toBe("Chatted with Noah.");
    expect(englishOnly("Met 하루토 at the café.")).toBe("Met Haruto at the café.");
    expect(nameEn("예린")).toBe("Hannah");
    expect(pickName("FEMALE", "FR", new SeededRandom(3))).toMatch(/^[가-힣]+$/);
  });

  it("in a played life, Korean text never shows a Latin generated name; English text never shows Hangul", () => {
    for (const lang of ["ko", "en"] as const) {
      const g = createGame({ ...JAE, name: lang === "en" ? "Jae" : "제이", seed: 5, lang, fated: { name: lang === "en" ? "Ren" : "렌", gender: "M", from: "same", status: "dating" } });
      const latin = new Set(Object.values(pools).flatMap((c) => [...c.MALE, ...c.FEMALE].map((p) => p.en)));
      for (let d = 0; d < 10 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) {
            const texts = b.kind === "popup" ? [b.popup.line, b.popup.name ?? "", ...b.popup.ch.map((c) => c.t)] : b.kind === "toast" ? [b.text, b.from] : [];
            for (const t of texts) {
              if (lang === "en") expect(t).not.toMatch(/[가-힣]/);
              else for (const w of t.match(/[A-Za-z]+/g) ?? []) expect(latin.has(w)).toBe(false);
            }
            if (b.kind === "popup") g.choose(0);
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
  });

  it("a baby named in the English UI is stored as the pair and gets the name's sex", () => {
    expect(nameKo("Liam")).toEqual({ ko: "도윤", sex: "MALE" });
    expect(nameKo("Audrey")).toEqual({ ko: "서윤", sex: "FEMALE" });
  });
});
