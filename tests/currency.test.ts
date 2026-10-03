import { describe, expect, it } from "vitest";
import { currencyFor, formatMoney, localizeMoneyText } from "../src/game/currency";
import { createGame } from "../src/game/game";

describe("Money in the player's own currency", () => {
  it("picks the currency by nationality (US dollars when unknown) and converts at a rough rate", () => {
    expect(currencyFor("KR")).toBe("KRW");
    expect(currencyFor("FR")).toBe("EUR");
    expect(currencyFor("JP")).toBe("JPY");
    expect(currencyFor("ZZ")).toBe("USD");
    expect(formatMoney(78_992_232, "KRW")).toBe("₩78,992,232");
    expect(formatMoney(1_380_000, "USD", "en")).toBe("$1,000");
    expect(formatMoney(-1_750_000, "GBP", "en")).toBe("-£1,000");
  });

  it("rewrites won amounts inside story text, and leaves them alone for Korean nationals", () => {
    expect(localizeMoneyText("Amount due: ₩4,870,000.", "USD", "en")).toBe("Amount due: $3,500.");
    expect(localizeMoneyText("I made three million won in one night.", "USD", "en")).toBe("I made $2,200 in one night.");
    expect(localizeMoneyText("카드에 천만 원이 긁혀 있었다.", "USD", "ko")).toBe("카드에 $7,200가 긁혀 있었다.");
    expect(localizeMoneyText("Amount due: ₩4,870,000.", "KRW", "en")).toBe("Amount due: ₩4,870,000.");
  });

  it("the top bar shows dollars for an American player", () => {
    const g = createGame({ name: "Jae", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed: 1, lang: "en", nationality: "US", birthplace: "New York" } as never);
    expect(g.hud().money).toMatch(/^-?\$/);
    const k = createGame({ name: "제이", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed: 1 } as never);
    expect(k.hud().money).toMatch(/^-?₩/);
  });
});
