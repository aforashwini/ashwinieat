// data/targets.ts
// Daily targets based on Dr. Greger's Daily Dozen plus Ashwini's additions
// (ground flax, brazil nut, omega-3/D3/B12). These are a nutrient-density
// FLOOR to aim for — goals to "fill up", never limits.

export type Category =
  | "legumes"
  | "greens"
  | "cruciferous"
  | "otherVeg"
  | "berries"
  | "otherFruit"
  | "wholeGrains"
  | "nutsSeeds"
  | "flax"
  | "brazilNut"
  | "herbsSpices"
  | "water";

export interface TargetDef {
  category: Category;
  label: string; // short label for the UI
  target: number; // daily target servings
  serving: string; // "one serving =" description
  why: string; // why it matters
  icon: string; // sprite key (see PixelGirl / DailyGame sprite map)
}

// Ordered for a sensible top-to-bottom snake run.
export const TARGETS: TargetDef[] = [
  {
    category: "legumes",
    label: "beans & legumes",
    target: 3,
    serving: "½ cup cooked beans/lentils/tofu/tempeh, ¼ cup hummus, or 1 cup peas",
    why: "protein, fiber, longevity staple",
    icon: "bean",
  },
  {
    category: "greens",
    label: "leafy greens",
    target: 2,
    serving: "1 cup raw or ½ cup cooked",
    why: "folate, iron, vitamin K, nitrates",
    icon: "leaf",
  },
  {
    category: "cruciferous",
    label: "cruciferous veg",
    target: 1,
    serving: "½ cup broccoli, cabbage, kale, cauliflower, bok choy",
    why: "sulforaphane & unique phytonutrients",
    icon: "broccoli",
  },
  {
    category: "otherVeg",
    label: "other veg",
    target: 2,
    serving: "½ cup cooked or 1 cup raw",
    why: "broad micronutrient coverage",
    icon: "carrot",
  },
  {
    category: "berries",
    label: "berries",
    target: 1,
    serving: "½ cup fresh/frozen or ¼ cup dried",
    why: "antioxidants",
    icon: "berry",
  },
  {
    category: "otherFruit",
    label: "other fruit",
    target: 3,
    serving: "1 medium fruit or 1 cup chopped",
    why: "vitamins, fiber, natural sugars",
    icon: "apple",
  },
  {
    category: "wholeGrains",
    label: "whole grains",
    target: 3,
    serving: "½ cup cooked oats/quinoa/rice, 1 slice bread, or 1 tortilla",
    why: "energy, fiber, B vitamins",
    icon: "grain",
  },
  {
    category: "nutsSeeds",
    label: "nuts & seeds",
    target: 1,
    serving: "¼ cup nuts or 2 tbsp nut/seed butter",
    why: "healthy fats, vitamin E",
    icon: "nut",
  },
  {
    category: "flax",
    label: "ground flax",
    target: 1,
    serving: "1 tbsp ground",
    why: "plant omega-3 (ALA), lignans",
    icon: "flax",
  },
  {
    category: "brazilNut",
    label: "brazil nut",
    target: 1,
    serving: "exactly 1 nut",
    why: "selenium — 1/day is plenty",
    icon: "brazil",
  },
  {
    category: "herbsSpices",
    label: "herbs & spices",
    target: 1,
    serving: "any culinary amount (turmeric, ginger…)",
    why: "phytonutrients, anti-inflammatory",
    icon: "spice",
  },
  {
    category: "water",
    label: "water",
    target: 5,
    serving: "1 glass / cup",
    why: "hydration",
    icon: "water",
  },
];

export const TARGET_BY_CATEGORY: Record<Category, TargetDef> = TARGETS.reduce(
  (acc, t) => {
    acc[t.category] = t;
    return acc;
  },
  {} as Record<Category, TargetDef>
);

// Fuzzy unit → cups (or pieces) lookup for quantity parsing.
// Values are in "cups" unless the unit is intrinsically piece/slice/glass.
export const UNIT_TO_CUPS: Record<string, number> = {
  cup: 1,
  cups: 1,
  c: 1,
  bowl: 1,
  bowls: 1,
  handful: 0.25,
  handfuls: 0.25,
  halfcup: 0.5,
  "half cup": 0.5,
  tbsp: 1 / 16,
  tablespoon: 1 / 16,
  tablespoons: 1 / 16,
  tsp: 1 / 48,
  teaspoon: 1 / 48,
  teaspoons: 1 / 48,
  scoop: 0.5,
  scoops: 0.5,
  pinch: 1 / 96,
};

// Default settings
export const DEFAULT_SETTINGS = {
  calorieGoal: 1700,
  waterTarget: 5,
  weeklyPlantTarget: 30,
};

export const CALORIE_MIN = 1200;
export const CALORIE_MAX = 3000;
