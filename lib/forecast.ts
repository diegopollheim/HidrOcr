import type { Reading } from "./storage";

function daysBetween(a: Date, b: Date) {
  const diffMs = Math.abs(b.getTime() - a.getTime());
  return diffMs / 86400000;
}

export function computeDailyAverage(readings: Reading[]): number {
  if (!readings || readings.length < 2) return 0;
  const sorted = [...readings].sort((x, y) => new Date(x.timestamp).getTime() - new Date(y.timestamp).getTime());
  let sumPerDay = 0;
  let segments = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const delta = curr.reading - prev.reading;
    const d = daysBetween(new Date(prev.timestamp), new Date(curr.timestamp));
    if (delta >= 0 && d > 0) {
      sumPerDay += delta / d;
      segments++;
    }
  }
  if (segments === 0) return 0;
  return sumPerDay / segments;
}

export function estimateForDays(readings: Reading[], days: number): number {
  const avg = computeDailyAverage(readings);
  return avg * days;
}
