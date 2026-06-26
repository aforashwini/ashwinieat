// lib/nutrition.ts
// The plant-diversity brain: turns logged entries into daily stats, weekly
// plant points, and friendly adequacy reads. No calories, no macro grams —
// ever. Amounts feed gentle qualitative nudges only.

import type { Category } from "../data/foodDatabase";
import { WHOLE_FOODS, getPoints } from "../data/foodDatabase";
import { ALL_CATEGORIES, categoryLabel } from "../data/categories";
import type { DayLog, LoggedPlant } from "./storage";

export function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function emptyByCategory(): Record<Category, number> {
  const r = {} as Record<Category, number>;
  for (const c of ALL_CATEGORIES) r[c] = 0;
  return r;
}

// All plants logged in a day (flattened across entries).
function plantsOf(day: DayLog): LoggedPlant[] {
  return day.entries.flatMap((e) => e.plants);
}

// ---- Daily ----------------------------------------------------------------

export interface DayStats {
  date: string;
  uniquePlants: string[]; // distinct plant names today
  plantCount: number; // = uniquePlants.length
  pointsToday: number; // sum of points, deduped by name within the day
  servingsByCategory: Record<Category, number>;
  categoriesTouched: Set<Category>;
  hasTreat: boolean;
  hasAnimal: boolean;
  soulNotes: string[];
}

export function computeDayStats(day: DayLog): DayStats {
  const servingsByCategory = emptyByCategory();
  const pointByPlant = new Map<string, number>();
  const categoriesTouched = new Set<Category>();
  let hasTreat = false;
  let hasAnimal = false;
  const soulNotes: string[] = [];

  for (const e of day.entries) {
    if (e.entryType === "treat") {
      hasTreat = true;
      if (e.soulNote) soulNotes.push(e.soulNote);
    }
    if (e.entryType === "animal") hasAnimal = true;
    for (const p of e.plants) {
      const key = norm(p.name);
      servingsByCategory[p.category] += p.servings;
      categoriesTouched.add(p.category);
      // keep the larger point value if the same plant appears twice
      pointByPlant.set(key, Math.max(pointByPlant.get(key) ?? 0, p.points));
    }
  }

  const uniquePlants = Array.from(pointByPlant.keys()).sort();
  const pointsToday = round2(
    Array.from(pointByPlant.values()).reduce((a, b) => a + b, 0)
  );

  return {
    date: day.date,
    uniquePlants,
    plantCount: uniquePlants.length,
    pointsToday,
    servingsByCategory,
    categoriesTouched,
    hasTreat,
    hasAnimal,
    soulNotes,
  };
}

// ---- Adequacy nudges (qualitative, never grams) ---------------------------

const FIBER_GROUPS: Category[] = [
  "legumes", "wholeGrains", "greens", "cruciferous", "alliums",
  "rainbowVeg", "starchyRoots", "berries", "citrus", "otherFruit",
];
const PROTEIN_GROUPS: Category[] = ["legumes", "soy", "nuts", "seeds", "wholeGrains"];
const IRON_GROUPS: Category[] = ["legumes", "greens", "seeds"];
const VITC_GROUPS: Category[] = ["citrus", "berries", "rainbowVeg", "cruciferous"];

function sumGroups(s: Record<Category, number>, groups: Category[]): number {
  return groups.reduce((a, c) => a + s[c], 0);
}

// Warm "you're covered" wins to lead with.
export function dailyWins(stats: DayStats): string[] {
  const s = stats.servingsByCategory;
  const wins: string[] = [];

  if (sumGroups(s, PROTEIN_GROUPS) >= 2) {
    wins.push("your beans, soy, nuts & grains have protein nicely covered");
  }
  // iron + vitamin C pairing cheer
  if (sumGroups(s, IRON_GROUPS) >= 1 && sumGroups(s, VITC_GROUPS) >= 1) {
    wins.push("nice — the vitamin C alongside your iron-rich plants helps you absorb more");
  }
  if (s.greens >= 1) wins.push("greens are in — lovely");
  if (sumGroups(s, FIBER_GROUPS) >= 4) {
    wins.push("plenty of fiber-rich plants today");
  }
  return wins;
}

// Gentle, optional next steps. At most two, most useful first.
export function dailyNudges(stats: DayStats): string[] {
  const s = stats.servingsByCategory;
  const nudges: string[] = [];

  if (stats.plantCount === 0) {
    return ["pop in whatever you ate — every plant is a win"];
  }
  if (s.greens === 0) {
    nudges.push("no greens yet — a handful of spinach or kale would be a perfect easy win");
  }
  if (sumGroups(s, FIBER_GROUPS) < 3) {
    nudges.push("a bit more fiber would feel great — beans, oats, or berries are easy wins");
  }
  if (sumGroups(s, PROTEIN_GROUPS) === 0) {
    nudges.push("some beans, tofu, or nuts would round out your protein");
  }
  if (nudges.length === 0 && s.berries === 0 && s.citrus === 0) {
    nudges.push("a few berries or an orange tomorrow would add lovely antioxidants");
  }
  return nudges.slice(0, 2);
}

// ---- Weekly ---------------------------------------------------------------

export type Badge = "none" | "bronze" | "silver" | "gold";

export interface WeekDay {
  date: string;
  plantCount: number; // unique plants that day
  points: number;
  hasData: boolean;
}

export interface WeeklyStats {
  pointsByPlant: Map<string, number>; // plant name -> points (deduped across week)
  totalPoints: number; // rounded
  target: number;
  badge: Badge;
  days: WeekDay[]; // oldest -> newest
  plantsList: string[]; // unique plant names, sorted
  servingsByCategory: Record<Category, number>;
  weakestCategories: Category[]; // lowest-served groups, for suggestions
  newPlants: string[]; // logged this week, never before
}

export function badgeFor(points: number): Badge {
  if (points >= 30) return "gold";
  if (points >= 20) return "silver";
  if (points >= 10) return "bronze";
  return "none";
}

export function computeWeeklyStats(
  dayLogs: (DayLog | undefined)[],
  dateKeys: string[],
  target = 30,
  priorPlants: Set<string> = new Set()
): WeeklyStats {
  const pointsByPlant = new Map<string, number>();
  const servingsByCategory = emptyByCategory();
  const days: WeekDay[] = [];

  dateKeys.forEach((date, i) => {
    const log = dayLogs[i];
    if (!log || log.entries.length === 0) {
      days.push({ date, plantCount: 0, points: 0, hasData: false });
      return;
    }
    const stats = computeDayStats(log);
    for (const p of plantsOf(log)) {
      const key = norm(p.name);
      pointsByPlant.set(key, Math.max(pointsByPlant.get(key) ?? 0, p.points));
      servingsByCategory[p.category] += p.servings;
    }
    days.push({
      date,
      plantCount: stats.plantCount,
      points: stats.pointsToday,
      hasData: true,
    });
  });

  const totalPoints = round2(
    Array.from(pointsByPlant.values()).reduce((a, b) => a + b, 0)
  );

  // weakest categories = those with the least servings this week (for ideas)
  const weakestCategories = [...ALL_CATEGORIES]
    .sort((a, b) => servingsByCategory[a] - servingsByCategory[b])
    .slice(0, 4);

  const newPlants = Array.from(pointsByPlant.keys())
    .filter((p) => !priorPlants.has(p))
    .sort();

  return {
    pointsByPlant,
    totalPoints,
    target,
    badge: badgeFor(totalPoints),
    days,
    plantsList: Array.from(pointsByPlant.keys()).sort(),
    servingsByCategory,
    weakestCategories,
    newPlants,
  };
}

// Suggest a few brand-new plants from the user's weakest categories.
export function suggestNewPlants(weekly: WeeklyStats, count = 4): string[] {
  const eaten = new Set(weekly.plantsList);
  const ideas: string[] = [];
  for (const cat of weekly.weakestCategories) {
    const pick = WHOLE_FOODS.find(
      (f) => f.category === cat && !eaten.has(norm(f.name))
    );
    if (pick) ideas.push(pick.name);
    if (ideas.length >= count) break;
  }
  return ideas;
}

// A positively-framed standout line for the week.
export function weeklyHeadline(weekly: WeeklyStats): string {
  const p = weekly.totalPoints;
  if (p >= weekly.target) return "30+ plants — your gut garden is thriving! 🌱";
  if (p >= 20) return "brilliant variety this week — gold is within reach!";
  if (p >= 10) return "lovely momentum — you're well on your way!";
  if (p > 0) return "every plant counts — a great start to the week!";
  return "a fresh week to fill with colour — let's go!";
}

// Single-letter green-shade heat level for the 7-day strip.
export function plantHeatLevel(plantCount: number): 0 | 1 | 2 | 3 {
  if (plantCount <= 0) return 0;
  if (plantCount >= 8) return 3;
  if (plantCount >= 4) return 2;
  return 1;
}

// ---- helpers --------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Re-exports for screens that want serving labels.
export { categoryLabel, getPoints };
