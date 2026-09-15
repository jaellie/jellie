import { describe, it, expect } from "vitest";
import { qualifies } from "../src/shared/qualification";

describe("qualifies (meaningful activity rule, 20s threshold)", () => {
  it("5 seconds + click -> false", () => {
    expect(qualifies(5, ["click"])).toBe(false);
  });

  it("15 seconds + scroll -> false", () => {
    expect(qualifies(15, ["scroll"])).toBe(false);
  });

  it("19 seconds + click -> false", () => {
    expect(qualifies(19, ["click"])).toBe(false);
  });

  it("20 seconds + no interaction -> false", () => {
    expect(qualifies(20, [])).toBe(false);
  });

  it("20 seconds + click -> true", () => {
    expect(qualifies(20, ["click"])).toBe(true);
  });

  it("20 seconds + scroll -> true", () => {
    expect(qualifies(20, ["scroll"])).toBe(true);
  });

  it("20 seconds + keyboard -> true", () => {
    expect(qualifies(20, ["keyboard"])).toBe(true);
  });

  it("600 seconds background only (no interaction) -> false", () => {
    expect(qualifies(600, [])).toBe(false);
  });

  it("600 seconds untouched -> false (time alone is never enough)", () => {
    expect(qualifies(600, [])).toBe(false);
  });

  it("21 seconds + multiple interactions -> true", () => {
    expect(qualifies(21, ["scroll", "click"])).toBe(true);
  });
});
