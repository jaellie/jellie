import { describe, expect, it } from "vitest";
import { birthplaceOptions, dstAtInstant, findPlace, offsetForLocalTime, resolveBirth } from "../src/destiny/birthplace";
import { birthJulianDay, calculateAstrologyChart } from "../src/astrology/chart";
import { calculateNatalChart } from "../src/saju/chart";
import { createGame } from "../src/game/game";

const F = "FEMALE" as const;
const at = (y: number, m: number, d: number, h?: number, mi = 0) => ({ year: y, month: m, day: d, hour: h, minute: h === undefined ? undefined : mi, sex: F });
const civilJd = (y: number, m: number, d: number, h: number, mi: number, offset: number) => birthJulianDay({ year: y, month: m, day: d, hour: h, minute: mi, utcOffsetMinutes: offset, sex: F });

describe("Birthplace: where + the clock that was on the wall there", () => {
  it("finds cities by Korean/English names and common forms", () => {
    expect(findPlace("부산")?.id).toBe("busan");
    expect(findPlace("부산광역시")?.id).toBe("busan");
    expect(findPlace("서울 강남구")?.id).toBe("seoul");
    expect(findPlace("New York, NY")?.id).toBe("newyork");
    expect(findPlace("LA")?.id).toBe("losangeles");
    expect(findPlace("엘에이")?.id).toBe("losangeles");
    expect(findPlace("도쿄")?.id).toBe("tokyo");
    expect(findPlace("어딘가")).toBeUndefined();
    const opts = birthplaceOptions("ko");
    expect(opts[0].name).toBe("서울");
    expect(opts.length).toBeGreaterThan(100);
  });

  it("uses the historical UTC offset: Korea's 1987–88 summer time, its UTC+8:30 years, DST abroad", () => {
    expect(offsetForLocalTime("Asia/Seoul", at(1997, 9, 28, 9, 30))).toBe(540);
    expect(offsetForLocalTime("Asia/Seoul", at(1987, 7, 15, 12))).toBe(600);
    expect(offsetForLocalTime("Asia/Seoul", at(1958, 1, 10, 12))).toBe(510);
    expect(offsetForLocalTime("America/New_York", at(1997, 7, 1, 12))).toBe(-240);
    expect(offsetForLocalTime("America/New_York", at(1997, 1, 15, 12))).toBe(-300);
    expect(offsetForLocalTime("Australia/Sydney", at(1997, 1, 15, 12))).toBe(660);
    // A permanent change is not daylight time (Korea: UTC+8:30 → UTC+9 in August 1961).
    expect(dstAtInstant("Asia/Seoul", Date.UTC(1961, 8, 1, 3))).toBe(0);
    expect(dstAtInstant("Asia/Seoul", Date.UTC(1987, 6, 15, 3))).toBe(60);
  });

  it("사주 reads standard time (daylight time taken out) — the instant, and so the astrology, is unchanged", () => {
    const r = resolveBirth(at(1987, 7, 15, 9, 30), "서울");
    expect(r.clockOffsetMinutes).toBe(600);
    expect(r.dstMinutes).toBe(60);
    expect([r.birth.hour, r.birth.minute, r.birth.utcOffsetMinutes]).toEqual([8, 30, 540]);
    expect(birthJulianDay(r.birth)).toBeCloseTo(civilJd(1987, 7, 15, 9, 30, 600), 8);
    // 08:30 standard = 辰時 (07:30–09:30 civil rules aside, the branch follows the standard clock).
    expect(calculateNatalChart(r.birth).fourPillars.hour!.earthlyBranch).toBe("CHEN");
    // Just after midnight in summer time is still the previous evening in standard time.
    const late = resolveBirth(at(1987, 7, 15, 0, 20), "서울");
    expect([late.birth.day, late.birth.hour]).toEqual([14, 23]);
  });

  it("the place moves the Ascendant and houses; the clock moves every planet", () => {
    const seoul = resolveBirth(at(1997, 9, 28, 9, 30), "서울");
    const ny = resolveBirth(at(1997, 9, 28, 9, 30), "뉴욕");
    expect(ny.place.name).toBe("New York");
    expect(ny.clockOffsetMinutes).toBe(-240);
    const a = calculateAstrologyChart(seoul.birth, seoul.place);
    const b = calculateAstrologyChart(ny.birth, ny.place);
    expect(b.jdUT - a.jdUT).toBeCloseTo(13 / 24, 6); // 09:30 in New York is 13 hours later than 09:30 in Seoul
    expect(a.positions.MOON!.longitude).not.toBeCloseTo(b.positions.MOON!.longitude, 0);
    // Same instant, different place → different angles.
    const sameInstant = calculateAstrologyChart(seoul.birth, ny.place);
    expect(sameInstant.positions.ASC!.longitude).not.toBeCloseTo(a.positions.ASC!.longitude, 0);
    expect(sameInstant.positions.SUN!.longitude).toBeCloseTo(a.positions.SUN!.longitude, 6);
  });

  it("unknown places fall back to Seoul (flagged); coordinates alone borrow the nearest city's time zone", () => {
    const u = resolveBirth(at(1997, 9, 28, 9, 30), "Atlantis");
    expect(u.known).toBe(false);
    expect(u.place.tz).toBe("Asia/Seoul");
    const c = resolveBirth(at(1997, 7, 1, 12), { lat: 40.73, lon: -73.99 });
    expect(c.place.tz).toBe("America/New_York");
    expect(c.clockOffsetMinutes).toBe(-240);
  });

  it("the game uses it: natal chart, 사주 clock, returns and 궁합", () => {
    const base = { name: "제이", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28, hour: 9, minute: 30 }, mbti: "ENFP", seed: 3 };
    const seoul = createGame({ ...base });
    const ny = createGame({ ...base, birthplace: "New York" });
    expect(seoul.birthInfo().birth.utcOffsetMinutes).toBe(540);
    expect(ny.birthInfo().place.name).toBe("New York");
    expect(ny.birthInfo().clockOffsetMinutes).toBe(-240);
    expect(ny.birthInfo().birth.utcOffsetMinutes).toBe(-300); // standard time (EDT taken out for 사주)
    expect(ny.birthInfo().birth.hour).toBe(8);
    // The destined person's chart defaults to the player's birthplace; their own can be given.
    const withFated = createGame({ ...base, birthplace: "부산", fated: { name: "Ren", birth: { year: 1996, month: 3, day: 2, hour: 7 }, birthplace: "Tokyo" } });
    expect(withFated.state.story?.compat).toBeDefined();
  });
});
