// lib/nutrition.ts
// Turns free-text food logs into category progress + plant-variety counts.

import type { Category } from "../data/targets";
import { TARGETS, TARGET_BY_CATEGORY, UNIT_TO_CUPS } from "../data/targets";
import { FOOD_DB } from "../data/foodDatabase";
import type { FoodDef, ServingUnit } from "../data/foodDatabase";
import type { DayLog, LearnedFood, LoggedFood } from "./storage";

// How many cups one "serving unit" of a volume food represents.
const CUPS_PER_UNIT: Record<string, number> = {
  cup: 1,
  halfCup: 0.5,
  tbsp: 1 / 16,
};

const DISCRETE_UNITS: ServingUnit[] = ["piece", "slice", "glass"];

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// ---- Food lookup ----------------------------------------------------------

export interface ResolvedDef {
  category: Category;
  servingUnit: ServingUnit;
  servingsPerUnit: number;
  kcalPerServing?: number;
  plant?: string;
}

// Build a lookup once from the static DB. Learned foods are merged per-call.
const DB_INDEX: Map<string, FoodDef> = (() => {
  const m = new Map<string, FoodDef>();
  for (const f of FOOD_DB) {
    for (const a of f.aliases) m.set(norm(a), f);
  }
  return m;
})();

export function findFood(
  rawName: string,
  learned: LearnedFood[] = []
): ResolvedDef | null {
  const key = norm(rawName);
  if (!key) return null;

  // exact alias match in static DB
  const hit = DB_INDEX.get(key);
  if (hit) {
    return {
      category: hit.category,
      servingUnit: hit.servingUnit,
      servingsPerUnit: hit.servingsPerUnit,
      kcalPerServing: hit.kcalPerServing,
      plant: hit.plant ?? hit.aliases[0],
    };
  }

  // learned foods (user taught these)
  const learnedHit = learned.find((l) => norm(l.alias) === key);
  if (learnedHit) {
    return {
      category: learnedHit.category,
      servingUnit: learnedHit.servingUnit,
      servingsPerUnit: learnedHit.servingsPerUnit,
      plant: learnedHit.plant ?? learnedHit.alias,
    };
  }

  // loose contains-match as a last resort ("kale salad" -> "kale")
  for (const [alias, def] of DB_INDEX) {
    if (key.includes(alias) && alias.length >= 4) {
      return {
        category: def.category,
        servingUnit: def.servingUnit,
        servingsPerUnit: def.servingsPerUnit,
        kcalPerServing: def.kcalPerServing,
        plant: def.plant ?? def.aliases[0],
      };
    }
  }

  return null;
}

// ---- Quantity parsing -----------------------------------------------------

export interface ParsedQty {
  num: number; // numeric amount (default 1)
  unit: string; // recognized unit token or ""
  hadNumber: boolean;
}

export function parseQuantity(text: string): ParsedQty {
  const t = norm(text);
  if (!t) return { num: 1, unit: "", hadNumber: false };

  let rest = t;
  let num = 1;
  let hadNumber = false;

  // leading unicode fraction (possibly after an integer: "1 ½")
  const intFrac = rest.match(/^(\d+)\s*([½¼¾⅓⅔⅕])/);
  if (intFrac) {
    num = parseInt(intFrac[1], 10) + (UNICODE_FRACTIONS[intFrac[2]] ?? 0);
    hadNumber = true;
    rest = rest.slice(intFrac[0].length).trim();
  } else if (UNICODE_FRACTIONS[rest[0]] !== undefined) {
    num = UNICODE_FRACTIONS[rest[0]];
    hadNumber = true;
    rest = rest.slice(1).trim();
  } else {
    // "1/2", "1.5", "3"
    const frac = rest.match(/^(\d+)\s*\/\s*(\d+)/);
    const dec = rest.match(/^(\d+(?:\.\d+)?)/);
    if (frac) {
      num = parseInt(frac[1], 10) / parseInt(frac[2], 10);
      hadNumber = true;
      rest = rest.slice(frac[0].length).trim();
    } else if (dec) {
      num = parseFloat(dec[1]);
      hadNumber = true;
      rest = rest.slice(dec[0].length).trim();
    }
  }

  // strip a trailing "of"
  rest = rest.replace(/^of\s+/, "").trim();

  return { num: num || 1, unit: rest, hadNumber };
}

// Convert a logged quantity + food definition into target-servings.
export function quantityToServings(def: ResolvedDef, quantityText: string): number {
  const { num, unit, hadNumber } = parseQuantity(quantityText);

  // Discrete foods (banana, slice, glass) count by piece.
  if (DISCRETE_UNITS.includes(def.servingUnit)) {
    return round2(num * def.servingsPerUnit);
  }

  // Volume foods: figure out cups.
  const cupsPerUnit = CUPS_PER_UNIT[def.servingUnit] ?? 0.5;

  // recognized volume unit -> convert through cups
  if (unit && UNIT_TO_CUPS[unit] !== undefined) {
    const cups = num * UNIT_TO_CUPS[unit];
    return round2((cups / cupsPerUnit) * def.servingsPerUnit);
  }

  // bare number, or unknown unit: treat number as count of the food's
  // native serving unit ("2" oats = 2 servings of oats).
  if (hadNumber) {
    return round2(num * def.servingsPerUnit);
  }

  // nothing parseable: assume one serving unit.
  return round2(def.servingsPerUnit);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- Resolve a single log row --------------------------------------------

export type ResolveResult =
  | { status: "ok"; food: LoggedFood }
  | { status: "unknown"; raw: string; quantity: string };

export function resolveLogRow(
  rawName: string,
  quantity: string,
  learned: LearnedFood[] = []
): ResolveResult {
  const def = findFood(rawName, learned);
  if (!def) {
    return { status: "unknown", raw: rawName, quantity };
  }
  const servings = quantityToServings(def, quantity);
  const kcal = def.kcalPerServing ? round2(def.kcalPerServing * servings) : undefined;
  return {
    status: "ok",
    food: {
      raw: rawName.trim(),
      quantity: quantity.trim(),
      category: def.category,
      servings,
      plant: def.category === "water" ? undefined : def.plant,
      kcal,
    },
  };
}

// ---- Day progress ---------------------------------------------------------

export interface CategoryProgress {
  category: Category;
  target: number;
  servings: number; // total logged servings (can exceed target)
  met: boolean;
}

export interface DayProgress {
  byCategory: Record<Category, CategoryProgress>;
  categoriesMet: number; // how many of the 12 categories hit target
  totalCategories: number;
  totalServings: number; // sum across all categories (snake tail length)
  plants: Set<string>; // unique plants this day
  kcal: number; // soft estimate
  brazilNutCount: number; // raw brazil nut servings, for the guardrail
}

export function computeDayProgress(day: DayLog): DayProgress {
  const byCategory = {} as Record<Category, CategoryProgress>;
  for (const t of TARGETS) {
    byCategory[t.category] = {
      category: t.category,
      target: t.target,
      servings: 0,
      met: false,
    };
  }

  const plants = new Set<string>();
  let kcal = 0;
  let totalServings = 0;
  let brazilNutCount = 0;

  for (const f of day.foods) {
    const cp = byCategory[f.category];
    if (cp) cp.servings = round2(cp.servings + f.servings);
    totalServings = round2(totalServings + f.servings);
    if (f.kcal) kcal += f.kcal;
    if (f.plant) plants.add(norm(f.plant));
    if (f.category === "brazilNut") brazilNutCount += f.servings;
  }

  let categoriesMet = 0;
  for (const t of TARGETS) {
    const cp = byCategory[t.category];
    // small epsilon so 0.99 of a serving from rounding still counts at target
    cp.met = cp.servings + 0.001 >= t.target;
    if (cp.met) categoriesMet++;
  }

  return {
    byCategory,
    categoriesMet,
    totalCategories: TARGETS.length,
    totalServings,
    plants,
    kcal: Math.round(kcal),
    brazilNutCount,
  };
}

// ---- Weekly aggregation ---------------------------------------------------

export interface DaySummary {
  date: string;
  categoriesMet: number;
  totalCategories: number;
  hasData: boolean;
}

export interface WeeklyProgress {
  plants: Set<string>;
  plantCount: number;
  days: DaySummary[]; // oldest -> newest
  bestDayMet: number;
}

export function computeWeeklyProgress(
  dayLogs: (DayLog | undefined)[],
  dateKeys: string[]
): WeeklyProgress {
  const plants = new Set<string>();
  const days: DaySummary[] = [];
  let bestDayMet = 0;

  dateKeys.forEach((date, i) => {
    const log = dayLogs[i];
    if (!log) {
      days.push({ date, categoriesMet: 0, totalCategories: TARGETS.length, hasData: false });
      return;
    }
    const prog = computeDayProgress(log);
    prog.plants.forEach((p) => plants.add(p));
    bestDayMet = Math.max(bestDayMet, prog.categoriesMet);
    days.push({
      date,
      categoriesMet: prog.categoriesMet,
      totalCategories: prog.totalCategories,
      hasData: log.foods.length > 0,
    });
  });

  return { plants, plantCount: plants.size, days, bestDayMet };
}

// Heat level 0-3 for the weekly mini grid, based on fraction of categories met.
export function heatLevel(met: number, total: number): 0 | 1 | 2 | 3 {
  if (met <= 0) return 0;
  const frac = met / total;
  if (frac >= 0.75) return 3;
  if (frac >= 0.4) return 2;
  return 1;
}

export { TARGET_BY_CATEGORY };
