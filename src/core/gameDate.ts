/** In-game calendar date. The simulation ticks monthly; `day` is optional. */
export interface GameDate {
  year: number;
  /** 1–12 */
  month: number;
  day?: number;
}

export function compareGameDate(a: GameDate, b: GameDate): number {
  return a.year - b.year || a.month - b.month || (a.day ?? 1) - (b.day ?? 1);
}

export function addMonths(date: GameDate, months: number): GameDate {
  const total = date.year * 12 + (date.month - 1) + months;
  return { year: Math.floor(total / 12), month: (total % 12) + 1, day: date.day };
}

/** Age in fractional years between two dates (month resolution). */
export function ageAt(birth: GameDate, date: GameDate): number {
  const months = (date.year - birth.year) * 12 + (date.month - birth.month);
  const dayAdj = ((date.day ?? 15) - (birth.day ?? 15)) / 30;
  return (months + dayAdj) / 12;
}

export function formatGameDate(date: GameDate): string {
  return `${date.year}-${String(date.month).padStart(2, "0")}`;
}
