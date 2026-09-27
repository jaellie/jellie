/** Small world tables (places, names). Pure data helpers for consequences. */
import type { SeededRandom } from "../core/rng";

export const COUNTRIES: Record<string, string[]> = {
  Korea: ["Seoul", "Busan", "Daejeon", "Daegu", "Gwangju", "Jeju"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  Japan: ["Tokyo", "Osaka", "Fukuoka"],
  Germany: ["Berlin", "Munich", "Hamburg"],
  Australia: ["Sydney", "Melbourne"],
  USA: ["New York", "San Francisco", "Seattle", "Boston"],
  UK: ["London", "Edinburgh"],
  Singapore: ["Singapore"],
  France: ["Paris", "Lyon"],
};

export const NPC_NAMES = ["Minji", "Jiwoo", "Haru", "Alex", "Sam", "Yuna", "Leo", "Noa", "Sora", "Kai", "Mina", "Theo", "Rin", "Jun", "Ella", "Dan"];

export function pickCity(rng: SeededRandom, country: string, except?: string): string {
  const cities = (COUNTRIES[country] ?? [country]).filter((c) => c !== except);
  return cities.length ? cities[rng.int(0, cities.length - 1)] : except ?? country;
}

export function pickForeignCountry(rng: SeededRandom, home: string): string {
  const options = Object.keys(COUNTRIES).filter((c) => c !== home);
  return options[rng.int(0, options.length - 1)];
}
