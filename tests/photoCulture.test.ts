import { describe, expect, it, vi } from "vitest";

describe("Culture-bound paintings (Korean vs Western versions)", () => {
  it("the English game shows the Western painting once it exists; Korean keeps the Korean one", async () => {
    vi.resetModules();
    vi.doMock("../data/world/photos.json", async (orig) => {
      const real = ((await orig()) as { default: { have: string[] } }).default;
      return { default: { ...real, have: [...real.have, "funeral_hall_west"] } };
    });
    const { photoFor, setPhotoCulture } = await import("../src/integration/prototype");
    setPhotoCulture("ko");
    expect(photoFor("funeral_hall")).toBe("bg/funeral_hall.png");
    setPhotoCulture("west");
    expect(photoFor("funeral_hall")).toBe("bg/funeral_hall_west.png");
    expect(photoFor("park_day")).toBe("bg/park_day.png");
    vi.doUnmock("../data/world/photos.json");
  });

  it("English uses each Western painting that exists and falls back to the Korean one otherwise", async () => {
    vi.resetModules();
    const { photoFor, setPhotoCulture } = await import("../src/integration/prototype");
    setPhotoCulture("west");
    const data = (await import("../data/world/photos.json")).default as { have: string[]; west: Record<string, string> };
    for (const [ko, west] of Object.entries(data.west)) {
      expect(photoFor(ko)).toBe(`bg/${data.have.includes(west) ? west : ko}.png`);
    }
    setPhotoCulture("ko");
  });
});
