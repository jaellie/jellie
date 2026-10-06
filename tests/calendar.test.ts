import { describe, expect, it } from "vitest";
import { calculateFourPillars, dayPillarForCivilDate, hourPillar, monthPillar, yearPillarForSajuYear } from "../src/saju/calendar/fourPillars";
import { dateFromJulianDay, lichunMoment, nextJie, julianDayFromDate } from "../src/saju/calendar/astronomy";
import { cycleIndexOfPillar, pillarFromCycleIndex, pillarToHanja, shiftPillar, type FourPillars } from "../src/saju/types";
import { EXAMPLE_PLAYER, Y2K_NOON } from "./fixtures";

const hanja = (fp: FourPillars) => [fp.year, fp.month, fp.day, fp.hour].map((p) => (p ? pillarToHanja(p) : "--")).join(" ");

describe("Layer A — calendar → Four Pillars", () => {
  it("2000-01-01 12:00 KST → 己卯 丙子 戊午 戊午", () => {
    expect(hanja(calculateFourPillars(Y2K_NOON).fourPillars)).toBe("己卯 丙子 戊午 戊午");
  });

  it("1997-09-28 09:30 KST → 丁丑 己酉 癸酉 丁巳", () => {
    expect(hanja(calculateFourPillars(EXAMPLE_PLAYER).fourPillars)).toBe("丁丑 己酉 癸酉 丁巳");
  });

  it("1949-10-01 is a 甲子 day", () => {
    expect(pillarToHanja(dayPillarForCivilDate(1949, 10, 1))).toBe("甲子");
  });

  it("the day cycle advances by one each day across month/year boundaries", () => {
    const a = cycleIndexOfPillar(dayPillarForCivilDate(1999, 12, 31));
    const b = cycleIndexOfPillar(dayPillarForCivilDate(2000, 1, 1));
    expect((b - a + 60) % 60).toBe(1);
  });

  it("year pillars: 1984 甲子, 2024 甲辰, 2026 丙午", () => {
    expect(pillarToHanja(yearPillarForSajuYear(1984))).toBe("甲子");
    expect(pillarToHanja(yearPillarForSajuYear(2024))).toBe("甲辰");
    expect(pillarToHanja(yearPillarForSajuYear(2026))).toBe("丙午");
  });

  it("立春 2024 is computed within 15 minutes of 2024-02-04 08:27 UTC", () => {
    const t = dateFromJulianDay(lichunMoment(2024)).getTime();
    expect(Math.abs(t - Date.UTC(2024, 1, 4, 8, 27)) / 60000).toBeLessThan(15);
  });

  it("year and month pillars switch at 立春, not at New Year", () => {
    const before = calculateFourPillars({ year: 2024, month: 2, day: 4, hour: 15, minute: 0, sex: "MALE" }).fourPillars;
    const after = calculateFourPillars({ year: 2024, month: 2, day: 4, hour: 19, minute: 0, sex: "MALE" }).fourPillars;
    expect(pillarToHanja(before.year)).toBe("癸卯");
    expect(pillarToHanja(before.month)).toBe("乙丑");
    expect(pillarToHanja(after.year)).toBe("甲辰");
    expect(pillarToHanja(after.month)).toBe("丙寅");
    const jan = calculateFourPillars({ year: 2024, month: 1, day: 20, hour: 12, minute: 0, sex: "MALE" }).fourPillars;
    expect(pillarToHanja(jan.year)).toBe("癸卯");
  });

  it("flags births close to a solar-term boundary", () => {
    const r = calculateFourPillars({ year: 2024, month: 2, day: 4, hour: 17, minute: 20, sex: "MALE" });
    expect(r.nearSolarTermBoundary).toBe(true);
    expect(calculateFourPillars(Y2K_NOON).nearSolarTermBoundary).toBe(false);
  });

  it("五虎遁 month stems", () => {
    expect(pillarToHanja(monthPillar("JIA", 0))).toBe("丙寅");
    expect(pillarToHanja(monthPillar("YI", 0))).toBe("戊寅");
    expect(pillarToHanja(monthPillar("BING", 0))).toBe("庚寅");
    expect(pillarToHanja(monthPillar("DING", 0))).toBe("壬寅");
    expect(pillarToHanja(monthPillar("WU", 0))).toBe("甲寅");
    expect(pillarToHanja(monthPillar("JI", 11))).toBe("丁丑");
  });

  it("五鼠遁 hour stems", () => {
    expect(pillarToHanja(hourPillar("JIA", 0))).toBe("甲子");
    expect(pillarToHanja(hourPillar("YI", 0))).toBe("丙子");
    expect(pillarToHanja(hourPillar("BING", 0))).toBe("戊子");
    expect(pillarToHanja(hourPillar("DING", 0))).toBe("庚子");
    expect(pillarToHanja(hourPillar("WU", 0))).toBe("壬子");
    expect(pillarToHanja(hourPillar("WU", 6))).toBe("戊午");
  });

  it("23:00 zi-hour boundary is configurable", () => {
    const b = { year: 2000, month: 1, day: 1, hour: 23, minute: 30, sex: "MALE" as const };
    const early = calculateFourPillars(b, { ziHourDayBoundary: "23:00" }).fourPillars;
    const late = calculateFourPillars(b, { ziHourDayBoundary: "00:00" }).fourPillars;
    expect(pillarToHanja(early.day)).toBe("己未"); // next day
    expect(pillarToHanja(late.day)).toBe("戊午"); // same day
    expect(early.hour!.earthlyBranch).toBe("ZI");
    expect(early.hour).toEqual(late.hour); // hour stem from the next day in both conventions
  });

  it("true solar time shifts the hour pillar for Seoul (127°E)", () => {
    const b = { year: 2000, month: 1, day: 1, hour: 13, minute: 10, longitude: 127, sex: "MALE" as const };
    expect(calculateFourPillars(b).fourPillars.hour!.earthlyBranch).toBe("WEI");
    expect(calculateFourPillars(b, { useTrueSolarTime: true }).fourPillars.hour!.earthlyBranch).toBe("WU");
  });

  it("unknown birth time → no hour pillar", () => {
    const r = calculateFourPillars({ year: 2000, month: 1, day: 1, sex: "FEMALE" });
    expect(r.fourPillars.hour).toBeUndefined();
    expect(r.timeKnown).toBe(false);
  });

  it("sexagenary helpers round-trip and reject invalid pillars", () => {
    for (let i = 0; i < 60; i++) expect(cycleIndexOfPillar(pillarFromCycleIndex(i))).toBe(i);
    expect(pillarToHanja(shiftPillar({ heavenlyStem: "GUI", earthlyBranch: "HAI" }, 1))).toBe("甲子");
    expect(() => cycleIndexOfPillar({ heavenlyStem: "JIA", earthlyBranch: "CHOU" })).toThrow();
  });

  it("next 節 after 1997-09-28 is 寒露 around Oct 8", () => {
    const t = nextJie(julianDayFromDate(new Date(Date.UTC(1997, 8, 28))));
    expect(t.nameHanja).toBe("寒露");
    expect(dateFromJulianDay(t.jdUT).getUTCDate()).toBe(8);
  });
});
