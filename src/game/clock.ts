import { MINUTES_PER_DAY, MINUTES_PER_HOUR, YEAR_LENGTH_DAYS } from "./catalog";
import type { GameState } from "./types";

export interface Clock {
  year: number;
  day: number;
  hour: number;
  minute: number;
  totalDays: number;
}

export function yearCapMinutes(s: Pick<GameState, "yearStartMinutes">): number {
  return s.yearStartMinutes + YEAR_LENGTH_DAYS * MINUTES_PER_DAY;
}

export function readClock(s: Pick<GameState, "year" | "yearStartMinutes" | "gameMinutes">): Clock {
  const elapsed = Math.max(0, s.gameMinutes - s.yearStartMinutes);
  const capped = Math.min(elapsed, YEAR_LENGTH_DAYS * MINUTES_PER_DAY - 1);
  const day = Math.floor(capped / MINUTES_PER_DAY) + 1;
  const rem = capped % MINUTES_PER_DAY;
  const hour = Math.floor(rem / MINUTES_PER_HOUR);
  const minute = rem % MINUTES_PER_HOUR;
  const totalDays = Math.max(1, Math.floor(s.gameMinutes / MINUTES_PER_DAY) + 1);
  return { year: s.year, day, hour, minute, totalDays };
}

export function absoluteGameDay(
  s: Pick<GameState, "year" | "yearStartMinutes" | "gameMinutes">,
): number {
  const clock = readClock(s);
  return (s.year - 1) * YEAR_LENGTH_DAYS + clock.day;
}

export function isOpenHour(hour: number): boolean {
  return hour >= 8 && hour < 22;
}

export function formatGameTimestamp(gameMinutes: number): string {
  const safeMin = Math.max(0, Math.floor(gameMinutes));
  const yearMin = YEAR_LENGTH_DAYS * MINUTES_PER_DAY;
  const year = Math.floor(safeMin / yearMin) + 1;
  const remYear = safeMin % yearMin;
  const day = Math.floor(remYear / MINUTES_PER_DAY) + 1;
  const remDay = remYear % MINUTES_PER_DAY;
  const hour = Math.floor(remDay / MINUTES_PER_HOUR);
  const minute = remDay % MINUTES_PER_HOUR;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `Jahr ${year} · Tag ${day}, ${hh}:${mm} Uhr`;
}

let seq = 0;
export function nid(prefix: string): string {
  seq += 1;
  return `${prefix}_${s32(Date.now() + seq)}_${seq.toString(36)}`;
}

function s32(n: number): string {
  return Math.abs(n | 0).toString(36);
}

/** mulberry32 — returns [0,1) and next seed. */
export function rngNext(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const next = t | 0;
  const n = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [n, next];
}

export function pick<T>(seed: number, list: readonly T[]): [T, number] {
  const [n, next] = rngNext(seed);
  const item = list[Math.floor(n * list.length) % list.length] as T;
  return [item, next];
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
