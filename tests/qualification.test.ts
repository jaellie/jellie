import { describe, it, expect } from "vitest";
import { qualifies } from "../src/shared/qualification";

describe("qualifies (meaningful activity rule)", () => {
  it("5 seconds + click -> false", () => {
    expect(qualifies(5, ["click"])).toBe(false);
  });

  it("59 seconds + click -> false", () => {
    expect(qualifies(59, ["click"])).toBe(false);
  });

  it("60 seconds + no interaction -> false", () => {
    expect(qualifies(60, [])).toBe(false);
  });

  it("60 seconds + click -> true", () => {
    expect(qualifies(60, ["click"])).toBe(true);
  });

  it("60 seconds + scroll -> true", () => {
    expect(qualifies(60, ["scroll"])).toBe(true);
  });

  it("60 seconds + keyboard -> true", () => {
    expect(qualifies(60, ["keyboard"])).toBe(true);
  });

  it("600 seconds background only (no interaction) -> false", () => {
    expect(qualifies(600, [])).toBe(false);
  });

  it("61 seconds + multiple interactions -> true", () => {
    expect(qualifies(61, ["scroll", "click"])).toBe(true);
  });
});
