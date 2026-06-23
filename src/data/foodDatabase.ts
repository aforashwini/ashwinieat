// data/foodDatabase.ts
// The magic layer: converts "kale, 2 cups" -> "2 servings of greens".
// Aim for breadth over precision. Servings are approximate Daily-Dozen units.

import type { Category } from "./targets";

export type ServingUnit =
  | "cup"
  | "halfCup"
  | "tbsp"
  | "piece"
  | "slice"
  | "glass";

export interface FoodDef {
  aliases: string[]; // "kale", "curly kale"
  category: Category;
  servingUnit: ServingUnit;
  servingsPerUnit: number; // how many target-servings one logged unit =
  kcalPerServing?: number; // optional, for the soft calorie estimate
  plant?: string; // canonical plant species for variety counting (defaults to aliases[0])
}

export const FOOD_DB: FoodDef[] = [
  // ---- Greens ------------------------------------------------------------
  { aliases: ["kale", "curly kale"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 33, plant: "kale" },
  { aliases: ["spinach", "baby spinach"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 7, plant: "spinach" },
  { aliases: ["rocket", "arugula"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 5, plant: "arugula" },
  { aliases: ["lettuce", "romaine", "mixed leaves", "salad leaves"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 8, plant: "lettuce" },
  { aliases: ["chard", "swiss chard"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 7, plant: "chard" },
  { aliases: ["collard greens", "collards"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 11, plant: "collards" },
  { aliases: ["watercress"], category: "greens", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 4, plant: "watercress" },

  // ---- Cruciferous -------------------------------------------------------
  { aliases: ["broccoli"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 27, plant: "broccoli" },
  { aliases: ["cauliflower"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 14, plant: "cauliflower" },
  { aliases: ["cabbage", "red cabbage"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 17, plant: "cabbage" },
  { aliases: ["bok choy", "pak choi"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 9, plant: "bok choy" },
  { aliases: ["brussels sprouts", "sprouts"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 28, plant: "brussels sprouts" },
  { aliases: ["broccoli sprouts"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 16, plant: "broccoli sprouts" },
  { aliases: ["radish", "radishes"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 9, plant: "radish" },
  { aliases: ["kohlrabi"], category: "cruciferous", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 18, plant: "kohlrabi" },

  // ---- Legumes -----------------------------------------------------------
  { aliases: ["lentils", "dal", "daal", "red lentils"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 115, plant: "lentils" },
  { aliases: ["tofu"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 94, plant: "soy" },
  { aliases: ["tempeh"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 160, plant: "soy (tempeh)" },
  { aliases: ["edamame", "soy beans", "soybeans"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 95, plant: "edamame" },
  { aliases: ["chickpeas", "garbanzo", "garbanzo beans"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 130, plant: "chickpeas" },
  { aliases: ["hummus"], category: "legumes", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 70, plant: "chickpeas (hummus)" },
  { aliases: ["black beans"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 114, plant: "black beans" },
  { aliases: ["kidney beans", "rajma"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 112, plant: "kidney beans" },
  { aliases: ["pinto beans"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 122, plant: "pinto beans" },
  { aliases: ["white beans", "cannellini", "navy beans", "butter beans"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 125, plant: "white beans" },
  { aliases: ["peas", "green peas"], category: "legumes", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 118, plant: "peas" },
  { aliases: ["split peas"], category: "legumes", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 116, plant: "split peas" },
  { aliases: ["soy milk", "soya milk"], category: "legumes", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 80, plant: "soy milk" },

  // ---- Berries -----------------------------------------------------------
  { aliases: ["blueberries", "blueberry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 42, plant: "blueberries" },
  { aliases: ["strawberries", "strawberry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 27, plant: "strawberries" },
  { aliases: ["raspberries", "raspberry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 32, plant: "raspberries" },
  { aliases: ["blackberries", "blackberry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 31, plant: "blackberries" },
  { aliases: ["cherries", "cherry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 44, plant: "cherries" },
  { aliases: ["cranberries", "cranberry"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 23, plant: "cranberries" },
  { aliases: ["goji berries", "goji"], category: "berries", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 23, plant: "goji" },
  { aliases: ["grapes"], category: "berries", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 52, plant: "grapes" },

  // ---- Other fruit -------------------------------------------------------
  { aliases: ["banana"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 105, plant: "banana" },
  { aliases: ["apple"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 95, plant: "apple" },
  { aliases: ["orange"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 62, plant: "orange" },
  { aliases: ["pear"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 101, plant: "pear" },
  { aliases: ["mango"], category: "otherFruit", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 99, plant: "mango" },
  { aliases: ["pineapple"], category: "otherFruit", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 82, plant: "pineapple" },
  { aliases: ["peach"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 59, plant: "peach" },
  { aliases: ["plum"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 30, plant: "plum" },
  { aliases: ["kiwi"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 42, plant: "kiwi" },
  { aliases: ["grapefruit"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 52, plant: "grapefruit" },
  { aliases: ["melon", "cantaloupe", "honeydew"], category: "otherFruit", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 54, plant: "melon" },
  { aliases: ["watermelon"], category: "otherFruit", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 46, plant: "watermelon" },
  { aliases: ["dates", "date"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 0.5, kcalPerServing: 66, plant: "dates" },
  { aliases: ["figs", "fig"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 0.5, kcalPerServing: 37, plant: "figs" },
  { aliases: ["pomegranate"], category: "otherFruit", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 72, plant: "pomegranate" },
  { aliases: ["papaya"], category: "otherFruit", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 62, plant: "papaya" },
  { aliases: ["apricot", "apricots"], category: "otherFruit", servingUnit: "piece", servingsPerUnit: 0.5, kcalPerServing: 17, plant: "apricot" },
  { aliases: ["raisins", "sultanas"], category: "otherFruit", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 54, plant: "raisins" },

  // ---- Whole grains ------------------------------------------------------
  { aliases: ["oats", "oatmeal", "porridge", "rolled oats"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 150, plant: "oats" },
  { aliases: ["quinoa"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 111, plant: "quinoa" },
  { aliases: ["brown rice", "rice"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 108, plant: "rice" },
  { aliases: ["couscous"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 88, plant: "wheat (couscous)" },
  { aliases: ["bread", "wholemeal bread", "toast", "whole wheat bread"], category: "wholeGrains", servingUnit: "slice", servingsPerUnit: 1, kcalPerServing: 80, plant: "wheat (bread)" },
  { aliases: ["tortilla", "wrap"], category: "wholeGrains", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 120, plant: "wheat (tortilla)" },
  { aliases: ["barley"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 96, plant: "barley" },
  { aliases: ["buckwheat"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 77, plant: "buckwheat" },
  { aliases: ["millet"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 104, plant: "millet" },
  { aliases: ["pasta", "wholewheat pasta", "spaghetti"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 99, plant: "wheat (pasta)" },
  { aliases: ["corn", "sweetcorn"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 88, plant: "corn" },
  { aliases: ["popcorn"], category: "wholeGrains", servingUnit: "cup", servingsPerUnit: 0.5, kcalPerServing: 31, plant: "popcorn" },
  { aliases: ["bulgur", "bulghur"], category: "wholeGrains", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 76, plant: "bulgur" },

  // ---- Other veg ---------------------------------------------------------
  { aliases: ["carrot", "carrots"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 25, plant: "carrot" },
  { aliases: ["tomato", "tomatoes", "cherry tomatoes"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 16, plant: "tomato" },
  { aliases: ["pepper", "bell pepper", "capsicum", "peppers"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 20, plant: "bell pepper" },
  { aliases: ["mushroom", "mushrooms"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 11, plant: "mushroom" },
  { aliases: ["onion", "onions", "red onion"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 32, plant: "onion" },
  { aliases: ["garlic"], category: "otherVeg", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 13, plant: "garlic" },
  { aliases: ["potato", "potatoes"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 67, plant: "potato" },
  { aliases: ["sweet potato", "sweet potatoes", "yam"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 90, plant: "sweet potato" },
  { aliases: ["zucchini", "courgette"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 10, plant: "zucchini" },
  { aliases: ["cucumber"], category: "otherVeg", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 16, plant: "cucumber" },
  { aliases: ["eggplant", "aubergine"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 17, plant: "eggplant" },
  { aliases: ["celery"], category: "otherVeg", servingUnit: "cup", servingsPerUnit: 1, kcalPerServing: 16, plant: "celery" },
  { aliases: ["beetroot", "beets", "beet"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 37, plant: "beetroot" },
  { aliases: ["pumpkin", "squash", "butternut squash"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 41, plant: "squash" },
  { aliases: ["green beans", "string beans"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 22, plant: "green beans" },
  { aliases: ["asparagus"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 20, plant: "asparagus" },
  { aliases: ["leek", "leeks"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 27, plant: "leek" },
  { aliases: ["avocado"], category: "otherVeg", servingUnit: "halfCup", servingsPerUnit: 1, kcalPerServing: 120, plant: "avocado" },

  // ---- Nuts & seeds ------------------------------------------------------
  { aliases: ["walnuts", "walnut"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 196, plant: "walnuts" },
  { aliases: ["almonds", "almond"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 207, plant: "almonds" },
  { aliases: ["cashews", "cashew"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 197, plant: "cashews" },
  { aliases: ["peanuts", "peanut"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 207, plant: "peanuts" },
  { aliases: ["pistachios", "pistachio"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 172, plant: "pistachios" },
  { aliases: ["pecans", "pecan"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 196, plant: "pecans" },
  { aliases: ["hazelnuts", "hazelnut"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 178, plant: "hazelnuts" },
  { aliases: ["nuts", "mixed nuts"], category: "nutsSeeds", servingUnit: "halfCup", servingsPerUnit: 2, kcalPerServing: 200, plant: "mixed nuts" },
  { aliases: ["peanut butter", "nut butter", "almond butter"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 94, plant: "peanut butter" },
  { aliases: ["chia", "chia seeds"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 58, plant: "chia" },
  { aliases: ["pumpkin seeds", "pepitas"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 63, plant: "pumpkin seeds" },
  { aliases: ["sunflower seeds"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 53, plant: "sunflower seeds" },
  { aliases: ["sesame seeds", "tahini"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 52, plant: "sesame" },
  { aliases: ["hemp seeds", "hemp hearts"], category: "nutsSeeds", servingUnit: "tbsp", servingsPerUnit: 0.5, kcalPerServing: 57, plant: "hemp" },

  // ---- Flax (own category) ----------------------------------------------
  { aliases: ["flaxseed", "flax", "ground flax", "linseed", "flax seeds"], category: "flax", servingUnit: "tbsp", servingsPerUnit: 1, kcalPerServing: 37, plant: "flax" },

  // ---- Brazil nut (own category, capped) --------------------------------
  { aliases: ["brazil nut", "brazil nuts"], category: "brazilNut", servingUnit: "piece", servingsPerUnit: 1, kcalPerServing: 33, plant: "brazil nut" },

  // ---- Herbs & spices (each counts as a plant!) -------------------------
  { aliases: ["turmeric"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "turmeric" },
  { aliases: ["cinnamon"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "cinnamon" },
  { aliases: ["ginger"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "ginger" },
  { aliases: ["basil"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "basil" },
  { aliases: ["cumin", "jeera"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "cumin" },
  { aliases: ["coriander", "cilantro"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "coriander" },
  { aliases: ["parsley"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "parsley" },
  { aliases: ["mint"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "mint" },
  { aliases: ["oregano"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "oregano" },
  { aliases: ["chili", "chilli", "chili flakes", "cayenne"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "chili" },
  { aliases: ["paprika"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "paprika" },
  { aliases: ["black pepper"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "black pepper" },
  { aliases: ["rosemary"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "rosemary" },
  { aliases: ["thyme"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "thyme" },
  { aliases: ["dill"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "dill" },
  { aliases: ["nutmeg"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "nutmeg" },
  { aliases: ["cardamom", "elaichi"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "cardamom" },
  { aliases: ["cloves"], category: "herbsSpices", servingUnit: "tbsp", servingsPerUnit: 1, plant: "cloves" },

  // ---- Water / beverages -------------------------------------------------
  { aliases: ["water"], category: "water", servingUnit: "glass", servingsPerUnit: 1, plant: undefined },
  { aliases: ["green tea", "tea"], category: "water", servingUnit: "glass", servingsPerUnit: 1, plant: undefined },
  { aliases: ["herbal tea"], category: "water", servingUnit: "glass", servingsPerUnit: 1, plant: undefined },
];
