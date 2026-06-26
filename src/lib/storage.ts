// lib/storage.ts
// Data shapes + small helpers shared across the app. Persistence itself now
// lives in lib/store.ts (Supabase). This file is storage-mechanism agnostic.

import type { Category } from "../data/targets";
import { DEFAULT_SETTINGS } from "../data/targets";
import type { ServingUnit } from "../data/foodDatabase";

export interface LoggedFood {
  raw: string; // what she typed, e.g. "kale"
  quantity: string; // "2 cups"
  category: Category; // resolved (or user-picked)
  servings: number; // resolved servings toward target
  plant?: string; // canonical plant for variety counting
  kcal?: number;
}

export interface Supplements {
  d3: boolean;
  omega3: boolean;
  b12: boolean;
  brazilNut: boolean;
}

export interface DayLog {
  date: string; // "2026-06-23"
  foods: LoggedFood[];
  supplements: Supplements;
}

export interface Settings {
  calorieGoal: number; // default 1700
  waterTarget: number; // default 5
  weeklyPlantTarget: number; // default 30
}

// A food the user taught the app (unknown-food fallback).
export interface LearnedFood {
  alias: string;
  category: Category;
  servingUnit: ServingUnit;
  servingsPerUnit: number;
  plant?: string;
}

export interface AppData {
  settings: Settings;
  days: Record<string, DayLog>; // keyed by date
  learned: LearnedFood[];
}

export const EMPTY_DATA: AppData = {
  settings: { ...DEFAULT_SETTINGS },
  days: {},
  learned: [],
};

export function cloneData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// Normalize a (possibly partial / old) blob into a complete AppData, filling
// in any missing settings with defaults.
export function normalizeData(parsed: Partial<AppData> | null | undefined): AppData {
  if (!parsed) return cloneData(EMPTY_DATA);
  return {
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    days: parsed.days ?? {},
    learned: parsed.learned ?? [],
  };
}

// ---- Convenience helpers --------------------------------------------------

export function emptyDay(date: string): DayLog {
  return {
    date,
    foods: [],
    supplements: { d3: false, omega3: false, b12: false, brazilNut: false },
  };
}

export function getDay(data: AppData, date: string): DayLog {
  return data.days[date] ?? emptyDay(date);
}
