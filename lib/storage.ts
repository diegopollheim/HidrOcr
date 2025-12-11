"use client";

export type Reading = {
  reading: number;
  timestamp: string;
  geo?: { lat: number; lng: number } | undefined;
};

const KEY = "hidrocr_readings";

export function getReadings(): Reading[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  try {
    const arr = raw ? (JSON.parse(raw) as Reading[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getLastReading(): Reading | null {
  const all = getReadings();
  if (all.length === 0) return null;
  return all[all.length - 1] ?? null;
}

export function addReading(value: number, geo?: { lat: number; lng: number }) {
  if (typeof window === "undefined") return;
  const arr = getReadings();
  const record: Reading = {
    reading: value,
    timestamp: new Date().toISOString(),
    geo
  };
  arr.push(record);
  window.localStorage.setItem(KEY, JSON.stringify(arr));
}

export function updateReading(index: number, value: number) {
  if (typeof window === "undefined") return;
  const arr = getReadings();
  if (index < 0 || index >= arr.length) return;
  arr[index] = { ...arr[index], reading: value };
  window.localStorage.setItem(KEY, JSON.stringify(arr));
}

export function deleteReading(index: number) {
  if (typeof window === "undefined") return;
  const arr = getReadings();
  if (index < 0 || index >= arr.length) return;
  arr.splice(index, 1);
  window.localStorage.setItem(KEY, JSON.stringify(arr));
}
