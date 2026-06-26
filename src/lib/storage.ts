// lib/storage.ts
// Data shapes + small helpers shared across the app. Persistence itself lives
// in lib/store.ts (Supabase, per-user JSONB blob behind RLS). This file is
// storage-mechanism agnostic.

import type { Category } from "../data/foodDatabase";

export type EntryType =
  | "whole_food"
  | "packaged"
  | "composite"
  | "treat"
  | "animal"
  | "refined";

// One plant resolved from an entry (a whole food, or a component of a dish).
export interface LoggedPlant {
  name: string; // "spinach"
  category: Category;
  servings: number; // resolved servings (for adequacy nudges, never calories)
  points: number; // 1, or 0.25 for herbs/spices/coffee/tea/cacao/olive oil
  assumed: boolean; // inferred (e.g. a dish component) vs. typed directly
  fromDish?: string; // e.g. "lasagna"
}

export interface LoggedEntry {
  raw: string; // what the user typed
  entryType: EntryType;
  plants: LoggedPlant[]; // [] for pure treats / animal / refined
  soulNote?: string; // for treats ("feed your soul")
  animalNote?: string; // for animal entries (gentle redirect copy)
  refinedNote?: string; // for refined items (shown, 0 points)
}

// A nutrient the user can choose to keep an eye on / tick daily.
export interface SupplementItem {
  id: string; // "b12", "vitd", "custom-...":
  label: string;
  note?: string;
  enabled: boolean; // user opted in -> shows as a daily toggle
  custom?: boolean; // user-added
}

export interface DayLog {
  date: string; // "2026-06-23"
  entries: LoggedEntry[];
  supplementsTaken: Record<string, boolean>; // keyed by SupplementItem.id
}

export interface Settings {
  weeklyPlantTarget: number; // default 30
  rollingWeek: boolean; // rolling 7 days vs fixed Mon–Sun (default rolling)
}

// A food the user taught the app (unknown-food fallback) — just a category.
export interface LearnedFood {
  alias: string;
  category: Category;
}

export interface AppData {
  settings: Settings;
  days: Record<string, DayLog>; // keyed by date
  learned: LearnedFood[];
  supplements: SupplementItem[]; // the user's configured nutrient list
  hasSeenIntro: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  weeklyPlantTarget: 30,
  rollingWeek: true,
};

// The evidence-based "nutrients worth a thought on a plant-rich diet" list.
// Nothing is forced: every item starts disabled; the user opts in per item.
export const DEFAULT_SUPPLEMENTS: SupplementItem[] = [
  { id: "b12", label: "vitamin B12", enabled: false,
    note: "The big one — not reliably in plant foods. Often ~50 mcg daily or ~2,000 mcg weekly (cyanocobalamin). Worth confirming the dose with a doctor." },
  { id: "vitd", label: "vitamin D", enabled: false,
    note: "Most people run low, especially in winter or with little sun. A small regular dose is common." },
  { id: "omega3", label: "omega-3 (EPA/DHA)", enabled: false,
    note: "From algae for a plant-based source — complements the ALA in flax, chia, and walnuts." },
  { id: "iron", label: "iron", enabled: false,
    note: "Plant iron absorbs better with vitamin C. Test before supplementing — don't guess on iron." },
  { id: "iodine", label: "iodine", enabled: false,
    note: "Inconsistent in plant foods. Often covered by iodized salt, seaweed, or a small supplement." },
  { id: "zinc", label: "zinc", enabled: false,
    note: "In legumes, nuts, seeds, and wholegrains, but absorbed a little less easily from plants." },
  { id: "calcium", label: "calcium", enabled: false,
    note: "From fortified plant milks, calcium-set tofu, and low-oxalate greens (bok choy, kale, broccoli)." },
  { id: "selenium", label: "selenium (brazil nut)", enabled: false,
    note: "One or two brazil nuts a day usually covers it — no need to go past that." },
  { id: "protein", label: "protein (keep an eye on)", enabled: false,
    note: "Usually not a supplement — just a gentle check that beans, soy, nuts, and grains show up." },
];

export const EMPTY_DATA: AppData = {
  settings: { ...DEFAULT_SETTINGS },
  days: {},
  learned: [],
  supplements: DEFAULT_SUPPLEMENTS.map((s) => ({ ...s })),
  hasSeenIntro: false,
};

export function cloneData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// Merge any saved supplement list with the curated defaults so new default
// items appear, while preserving the user's enabled choices and custom items.
function mergeSupplements(saved?: SupplementItem[]): SupplementItem[] {
  const byId = new Map<string, SupplementItem>();
  for (const d of DEFAULT_SUPPLEMENTS) byId.set(d.id, { ...d });
  if (saved) {
    for (const s of saved) {
      const base = byId.get(s.id);
      if (base) byId.set(s.id, { ...base, enabled: s.enabled });
      else byId.set(s.id, { ...s }); // custom item
    }
  }
  return Array.from(byId.values());
}

// Coerce a (possibly partial / old-schema) blob into a complete AppData.
// Old v1 day logs used a `foods` shape that no longer applies; those days are
// dropped (start fresh) rather than mis-counted.
export function normalizeData(parsed: Partial<AppData> | null | undefined): AppData {
  if (!parsed) return cloneData(EMPTY_DATA);

  const days: Record<string, DayLog> = {};
  const srcDays = (parsed.days ?? {}) as Record<string, Partial<DayLog>>;
  for (const [date, d] of Object.entries(srcDays)) {
    if (d && Array.isArray((d as DayLog).entries)) {
      days[date] = {
        date,
        entries: (d as DayLog).entries,
        supplementsTaken: (d as DayLog).supplementsTaken ?? {},
      };
    }
  }

  return {
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    days,
    learned: parsed.learned ?? [],
    supplements: mergeSupplements(parsed.supplements),
    hasSeenIntro: !!parsed.hasSeenIntro,
  };
}

// ---- Convenience helpers --------------------------------------------------

export function emptyDay(date: string): DayLog {
  return { date, entries: [], supplementsTaken: {} };
}

export function getDay(data: AppData, date: string): DayLog {
  return data.days[date] ?? emptyDay(date);
}
