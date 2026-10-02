/**
 * Money is kept in won inside the engine; the player sees it in their own currency (by nationality),
 * at a rough exchange rate. Unknown countries get US dollars.
 */

const EURO = ["FR", "DE", "ES", "IT", "NL", "PT", "IE", "AT", "BE", "FI", "GR", "LU", "SK", "SI", "EE", "LV", "LT", "MT", "CY", "HR"];

const BY_COUNTRY: Record<string, string> = {
  KR: "KRW", US: "USD", JP: "JPY", CN: "CNY", TW: "TWD", HK: "HKD", MO: "MOP", SG: "SGD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
  CH: "CHF", IN: "INR", TH: "THB", VN: "VND", PH: "PHP", ID: "IDR", MY: "MYR", MX: "MXN", BR: "BRL", AE: "AED", SE: "SEK",
  NO: "NOK", DK: "DKK", CZ: "CZK", PL: "PLN", HU: "HUF", TR: "TRY", RU: "RUB", ZA: "ZAR", EG: "EGP", AR: "ARS", CL: "CLP",
  ...Object.fromEntries(EURO.map((c) => [c, "EUR"])),
};

/** Won per one unit of the currency (approximate, 2026). */
const WON_PER: Record<string, number> = {
  KRW: 1, USD: 1380, EUR: 1500, GBP: 1750, JPY: 9.2, CNY: 190, TWD: 43, HKD: 177, MOP: 172, SGD: 1030, CAD: 1000, AUD: 900,
  NZD: 820, CHF: 1550, INR: 16.5, THB: 39, VND: 0.054, PHP: 24, IDR: 0.085, MYR: 300, MXN: 75, BRL: 250, AED: 375, SEK: 130,
  NOK: 128, DKK: 200, CZK: 60, PLN: 350, HUF: 3.8, TRY: 40, RUB: 15, ZAR: 75, EGP: 28, ARS: 1.4, CLP: 1.45,
};

export function currencyFor(nationality: string | undefined): string {
  const c = BY_COUNTRY[String(nationality ?? "KR").toUpperCase()];
  return c && WON_PER[c] ? c : "USD";
}

/** "₩78,992,232", "$57,241", "€52,661" — whole units, minus sign for debt. */
export function formatMoney(won: number, currency: string, lang: "ko" | "en" = "ko"): string {
  const amount = Math.round(won / (WON_PER[currency] ?? 1));
  if (currency === "KRW") return (amount < 0 ? "-₩" : "₩") + Math.abs(amount).toLocaleString("ko-KR");
  try {
    return new Intl.NumberFormat(lang === "ko" ? "ko-KR" : "en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount < 0 ? "-" : ""}${currency} ${Math.abs(amount).toLocaleString("en-US")}`;
  }
}

/** A round-looking amount for story text ("about $3,500", not "$3,528.99"). */
function roundish(won: number, currency: string, lang: "ko" | "en"): string {
  const v = won / (WON_PER[currency] ?? 1);
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, Math.abs(v)))) - 1));
  return formatMoney(Math.round(v / mag) * mag * (WON_PER[currency] ?? 1), currency, lang);
}

const EN_NUM: Record<string, number> = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, fifty: 50, "a hundred": 100, "one hundred": 100, "five hundred": 500 };
const EN_SCALE: Record<string, number> = { thousand: 1e3, million: 1e6, billion: 1e9 };
const KO_DIGIT: Record<string, number> = { "": 1, 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9 };
const KO_SUB: Record<string, number> = { "": 1, 십: 10, 백: 100, 천: 1000 };

/** Won amounts written inside story text, shown in the player's currency when it isn't won. */
export function localizeMoneyText(text: string, currency: string, lang: "ko" | "en"): string {
  if (currency === "KRW" || !text) return text;
  let t = text.replace(/₩\s?([\d,]+)/g, (_, n: string) => roundish(Number(n.replace(/,/g, "")), currency, lang));
  t = t.replace(/\b(a hundred|one hundred|five hundred|a|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|fifty)\s+(thousand|million|billion)\s+won\b/gi, (m, num: string, scale: string) => {
    const v = (EN_NUM[num.toLowerCase()] ?? 1) * EN_SCALE[scale.toLowerCase()];
    const out = roundish(v, currency, lang);
    return /^[A-Z]/.test(m) && /^[a-z]/i.test(out) ? out[0].toUpperCase() + out.slice(1) : out;
  });
  // 만 원, 오만 원, 오십만 원, 백만 원, 천만 원, 삼백만 원 …
  t = t.replace(/(?:^|(?<=[\s(']))([일이삼사오육칠팔구]?)([십백천]?)(만|억) 원/g, (_, d: string, sub: string, unit: string) => {
    const v = (KO_DIGIT[d] ?? 1) * (KO_SUB[sub] ?? 1) * (unit === "억" ? 1e8 : 1e4);
    return roundish(v, currency, lang);
  });
  return t;
}
