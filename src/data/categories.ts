// data/categories.ts
// Display metadata for the 16 plant categories (labels, sprite icon keys,
// display order, and the groupings the adequacy nudges read from).
// The Category type itself is the single source of truth in foodDatabase.ts.

import type { Category } from "./foodDatabase";

export interface CategoryMeta {
  category: Category;
  label: string; // short, lower-case, playful
  icon: string; // sprite key in lib/sprites.ts ICONS
}

// Ordered for a sensible top-to-bottom board run.
export const CATEGORIES: CategoryMeta[] = [
  { category: "greens", label: "leafy greens", icon: "leaf" },
  { category: "cruciferous", label: "cruciferous", icon: "broccoli" },
  { category: "alliums", label: "alliums", icon: "onion" },
  { category: "rainbowVeg", label: "rainbow veg", icon: "carrot" },
  { category: "starchyRoots", label: "starchy & roots", icon: "potato" },
  { category: "legumes", label: "legumes", icon: "bean" },
  { category: "soy", label: "soy", icon: "tofu" },
  { category: "wholeGrains", label: "whole grains", icon: "grain" },
  { category: "nuts", label: "nuts", icon: "nut" },
  { category: "seeds", label: "seeds", icon: "seed" },
  { category: "berries", label: "berries", icon: "berry" },
  { category: "citrus", label: "citrus", icon: "citrus" },
  { category: "otherFruit", label: "other fruit", icon: "apple" },
  { category: "herbsSpices", label: "herbs & spices", icon: "spice" },
  { category: "fermented", label: "fermented", icon: "jar" },
  { category: "otherPlant", label: "other plant", icon: "cup" },
];

export const CATEGORY_META: Record<Category, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.category] = c;
    return acc;
  },
  {} as Record<Category, CategoryMeta>
);

export const ALL_CATEGORIES: Category[] = CATEGORIES.map((c) => c.category);

export function categoryLabel(c: Category): string {
  return CATEGORY_META[c]?.label ?? c;
}

export function categoryIcon(c: Category): string {
  return CATEGORY_META[c]?.icon ?? "leaf";
}
