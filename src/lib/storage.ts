// lib/storage.ts
// Single localStorage blob under one key, with a graceful in-memory fallback
// for environments where storage is unavailable (private mode, etc).

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

const KEY = "ashwinieat:data";

const EMPTY_DATA: AppData = {
  settings: { ...DEFAULT_SETTINGS },
  days: {},
  learned: [],
};

// in-memory fallback if localStorage throws
let memoryFallback: AppData | null = null;
let storageBroken = false;

export function isStorageBroken(): boolean {
  return storageBroken;
}

function safeParse(raw: string | null): AppData {
  if (!raw) return structuredCloneSafe(EMPTY_DATA);
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      days: parsed.days ?? {},
      learned: parsed.learned ?? [],
    };
  } catch {
    return structuredCloneSafe(EMPTY_DATA);
  }
}

function structuredCloneSafe<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function loadData(): AppData {
  if (storageBroken && memoryFallback) return memoryFallback;
  try {
    const raw = localStorage.getItem(KEY);
    const data = safeParse(raw);
    memoryFallback = data;
    return data;
  } catch {
    storageBroken = true;
    if (!memoryFallback) memoryFallback = structuredCloneSafe(EMPTY_DATA);
    return memoryFallback;
  }
}

export function saveData(data: AppData): void {
  memoryFallback = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    storageBroken = true;
    // keep working from memory for the session
  }
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
