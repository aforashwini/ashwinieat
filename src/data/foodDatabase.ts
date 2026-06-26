// ============================================================================
// Yumshi Food Database  (local, free, no AI / no background compute)
// ============================================================================
//
// HOW THIS WORKS
// --------------
// Everything Yumshi needs to categorize food lives in this file. No API calls.
//
// Lookup flow when a user types an entry:
//   1. normalize(input): lowercase, trim, strip trailing "s" for simple plurals,
//      remove leading quantities/units ("2 cups of kale" -> "kale").
//   2. Try WHOLE_FOODS (match name or any alias). If found -> log 1 plant.
//   3. Else try DISHES (match name or alias). If found -> expand into its
//      `components` (each a plant) and `refined` items (shown, 0 points), then
//      show them to the user as editable assumptions to confirm or amend.
//   4. Else try TREATS -> show the soul-food message; if it has `qualifying`
//      plants (e.g. strawberries on cake), log those too.
//   5. Else try ANIMAL_FOODS -> show the gentle redirect message, log nothing,
//      invite plant sides.
//   6. Else -> unknown. Show a manual category picker (the 16 categories) so the
//      user can place it themselves, then cache their choice into localStorage
//      so it is instant and free next time.
//
// POINTS RULE (plant diversity)
//   - 1 point per unique whole plant per week (counted once per week).
//   - 0.25 point for herbs, spices, and the small "other plant" items
//     (coffee, tea, cacao, olive oil). See getPoints().
//   - Refined / juiced items (white bread, white rice, fruit juice) = 0 points.
//
// SERVINGS (for adequacy nudges, NOT calorie/macro counting)
//   - Each category has a default serving size in SERVINGS_BY_CATEGORY.
//   - Parse a leading quantity from the user's text with UNIT_MAP; default 1.
//
// Categories (each food has exactly one primary category):
//   greens, cruciferous, alliums, rainbowVeg, starchyRoots, legumes, soy,
//   wholeGrains, nuts, seeds, berries, citrus, otherFruit, herbsSpices,
//   fermented, otherPlant
// ============================================================================

export type Category =
  | "greens" | "cruciferous" | "alliums" | "rainbowVeg" | "starchyRoots"
  | "legumes" | "soy" | "wholeGrains" | "nuts" | "seeds"
  | "berries" | "citrus" | "otherFruit" | "herbsSpices" | "fermented" | "otherPlant";

export interface WholeFood {
  name: string;
  category: Category;
  aliases?: string[];
}

export interface DishComponent {
  name: string;       // should match a WHOLE_FOODS name where possible
  category: Category;
}

export interface Dish {
  name: string;
  aliases?: string[];
  components: DishComponent[];   // plant ingredients (editable assumptions)
  refined?: string[];            // shown but 0 points (e.g. "white pasta")
  animalNote?: string;           // e.g. "beef" if the classic version has meat
  needsClarify?: boolean;        // e.g. "soup" / "curry": ask which kind first
  clarify?: string;              // the question to ask
}

export interface Treat {
  name: string;
  aliases?: string[];
  qualifying?: DishComponent[];  // real plants inside it that still count
}

// Items that count for only a quarter point (besides everything in herbsSpices).
export const QUARTER_POINT_OTHER = new Set<string>([
  "coffee", "espresso", "tea", "green tea", "black tea", "matcha",
  "cacao", "cocoa", "dark chocolate", "olive oil", "extra virgin olive oil",
]);

export function getPoints(name: string, category: Category): number {
  if (category === "herbsSpices") return 0.25;
  if (QUARTER_POINT_OTHER.has(name)) return 0.25;
  return 1;
}

// Default serving size per category (plain-language, forgiving).
export const SERVINGS_BY_CATEGORY: Record<Category, string> = {
  greens: "1 cup raw or 1/2 cup cooked",
  cruciferous: "1/2 cup cooked or 1 cup raw",
  alliums: "1/4 cup or a small handful",
  rainbowVeg: "1/2 cup cooked or 1 cup raw",
  starchyRoots: "1/2 cup or 1 small potato",
  legumes: "1/2 cup cooked",
  soy: "1/2 cup tofu/tempeh or 1 cup soy milk",
  wholeGrains: "1/2 cup cooked or 1 slice bread",
  nuts: "1/4 cup or 2 tbsp butter",
  seeds: "1 to 2 tbsp",
  berries: "1/2 cup",
  citrus: "1 fruit",
  otherFruit: "1 fruit or 1 cup chopped",
  herbsSpices: "about 1 tsp (a pinch counts for diversity)",
  fermented: "1/4 cup",
  otherPlant: "1 cup (tea/coffee) or 1 tsp (oil)",
};

// Rough quantity words mapped to servings, for the adequacy nudges.
export const UNIT_MAP: Record<string, number> = {
  pinch: 0.25, tsp: 0.5, teaspoon: 0.5, tbsp: 1, tablespoon: 1,
  handful: 1, piece: 1, slice: 1, small: 0.75, medium: 1, large: 1.5,
  cup: 1, bowl: 1.5, plate: 2, glass: 1, can: 2, bunch: 2,
};

// ============================================================================
// WHOLE FOODS
// ============================================================================
export const WHOLE_FOODS: WholeFood[] = [
  // ---- Leafy greens ----
  { name: "spinach", category: "greens", aliases: ["baby spinach"] },
  { name: "kale", category: "greens", aliases: ["curly kale", "cavolo nero", "lacinato kale", "tuscan kale"] },
  { name: "collard greens", category: "greens", aliases: ["collards", "spring greens"] },
  { name: "swiss chard", category: "greens", aliases: ["chard", "silverbeet"] },
  { name: "arugula", category: "greens", aliases: ["rocket"] },
  { name: "romaine lettuce", category: "greens", aliases: ["romaine", "cos lettuce"] },
  { name: "lettuce", category: "greens", aliases: ["iceberg lettuce", "butter lettuce", "green leaf lettuce", "salad leaves", "mixed greens", "mesclun", "salad"] },
  { name: "watercress", category: "greens" },
  { name: "mustard greens", category: "greens" },
  { name: "dandelion greens", category: "greens" },
  { name: "endive", category: "greens", aliases: ["chicory"] },
  { name: "microgreens", category: "greens" },
  { name: "pea shoots", category: "greens" },
  { name: "sorrel", category: "greens" },

  // ---- Cruciferous ----
  { name: "broccoli", category: "cruciferous", aliases: ["broccolini", "tenderstem broccoli"] },
  { name: "cauliflower", category: "cruciferous", aliases: ["romanesco"] },
  { name: "cabbage", category: "cruciferous", aliases: ["green cabbage", "savoy cabbage"] },
  { name: "red cabbage", category: "cruciferous" },
  { name: "napa cabbage", category: "cruciferous", aliases: ["chinese cabbage"] },
  { name: "brussels sprouts", category: "cruciferous", aliases: ["brussel sprouts", "sprouts"] },
  { name: "bok choy", category: "cruciferous", aliases: ["pak choi", "pak choy"] },
  { name: "kohlrabi", category: "cruciferous" },
  { name: "radish", category: "cruciferous", aliases: ["radishes"] },
  { name: "daikon", category: "cruciferous", aliases: ["mooli"] },
  { name: "turnip", category: "cruciferous", aliases: ["turnips"] },
  { name: "rutabaga", category: "cruciferous", aliases: ["swede"] },
  { name: "broccoli sprouts", category: "cruciferous" },

  // ---- Alliums ----
  { name: "onion", category: "alliums", aliases: ["yellow onion", "white onion", "brown onion", "onions"] },
  { name: "red onion", category: "alliums" },
  { name: "shallot", category: "alliums", aliases: ["shallots"] },
  { name: "garlic", category: "alliums", aliases: ["garlic clove", "garlic cloves"] },
  { name: "leek", category: "alliums", aliases: ["leeks"] },
  { name: "spring onion", category: "alliums", aliases: ["scallion", "scallions", "green onion", "green onions"] },
  { name: "chives", category: "alliums" },

  // ---- Rainbow veg ----
  { name: "bell pepper", category: "rainbowVeg", aliases: ["pepper", "peppers", "red pepper", "green pepper", "yellow pepper", "capsicum"] },
  { name: "tomato", category: "rainbowVeg", aliases: ["tomatoes", "cherry tomato", "cherry tomatoes", "plum tomato"] },
  { name: "cucumber", category: "rainbowVeg" },
  { name: "zucchini", category: "rainbowVeg", aliases: ["courgette"] },
  { name: "eggplant", category: "rainbowVeg", aliases: ["aubergine"] },
  { name: "carrot", category: "rainbowVeg", aliases: ["carrots"] },
  { name: "celery", category: "rainbowVeg" },
  { name: "green beans", category: "rainbowVeg", aliases: ["string beans", "french beans"] },
  { name: "snap peas", category: "rainbowVeg", aliases: ["sugar snap peas", "snow peas", "mangetout"] },
  { name: "asparagus", category: "rainbowVeg" },
  { name: "mushroom", category: "rainbowVeg", aliases: ["mushrooms", "button mushroom", "cremini", "chestnut mushroom", "portobello", "shiitake", "oyster mushroom"] },
  { name: "corn", category: "rainbowVeg", aliases: ["sweetcorn", "sweet corn", "corn on the cob"] },
  { name: "okra", category: "rainbowVeg", aliases: ["ladies fingers"] },
  { name: "artichoke", category: "rainbowVeg" },
  { name: "fennel", category: "rainbowVeg" },
  { name: "chili pepper", category: "rainbowVeg", aliases: ["chilli", "chili", "jalapeno", "jalapeño", "serrano", "habanero"] },
  { name: "bean sprouts", category: "rainbowVeg", aliases: ["beansprouts"] },
  { name: "bamboo shoots", category: "rainbowVeg" },
  { name: "water chestnut", category: "rainbowVeg", aliases: ["water chestnuts"] },
  { name: "olives", category: "rainbowVeg", aliases: ["olive"] },

  // ---- Starchy veg & roots ----
  { name: "potato", category: "starchyRoots", aliases: ["potatoes", "white potato", "russet potato", "new potato"] },
  { name: "sweet potato", category: "starchyRoots", aliases: ["yam", "yams"] },
  { name: "butternut squash", category: "starchyRoots", aliases: ["butternut"] },
  { name: "acorn squash", category: "starchyRoots" },
  { name: "kabocha", category: "starchyRoots" },
  { name: "pumpkin", category: "starchyRoots" },
  { name: "beetroot", category: "starchyRoots", aliases: ["beet", "beets"] },
  { name: "parsnip", category: "starchyRoots", aliases: ["parsnips"] },
  { name: "celeriac", category: "starchyRoots", aliases: ["celery root"] },
  { name: "cassava", category: "starchyRoots", aliases: ["yuca"] },
  { name: "taro", category: "starchyRoots" },
  { name: "plantain", category: "starchyRoots" },
  { name: "jicama", category: "starchyRoots" },

  // ---- Legumes ----
  { name: "lentils", category: "legumes", aliases: ["lentil", "red lentils", "green lentils", "brown lentils", "puy lentils", "beluga lentils", "dal", "daal", "dahl"] },
  { name: "chickpeas", category: "legumes", aliases: ["chickpea", "garbanzo", "garbanzo beans"] },
  { name: "black beans", category: "legumes" },
  { name: "kidney beans", category: "legumes", aliases: ["red kidney beans"] },
  { name: "pinto beans", category: "legumes" },
  { name: "cannellini beans", category: "legumes", aliases: ["white beans"] },
  { name: "navy beans", category: "legumes", aliases: ["haricot beans"] },
  { name: "great northern beans", category: "legumes" },
  { name: "butter beans", category: "legumes", aliases: ["lima beans"] },
  { name: "black-eyed peas", category: "legumes", aliases: ["black eyed peas", "black-eyed beans"] },
  { name: "split peas", category: "legumes" },
  { name: "mung beans", category: "legumes" },
  { name: "adzuki beans", category: "legumes" },
  { name: "fava beans", category: "legumes", aliases: ["broad beans"] },
  { name: "borlotti beans", category: "legumes", aliases: ["cranberry beans"] },
  { name: "peas", category: "legumes", aliases: ["green peas", "garden peas", "petit pois"] },
  { name: "hummus", category: "legumes" },
  { name: "baked beans", category: "legumes" },
  { name: "refried beans", category: "legumes" },

  // ---- Soy ----
  { name: "tofu", category: "soy", aliases: ["firm tofu", "silken tofu", "bean curd"] },
  { name: "tempeh", category: "soy" },
  { name: "edamame", category: "soy", aliases: ["soybeans", "soya beans"] },
  { name: "soy milk", category: "soy", aliases: ["soya milk"] },
  { name: "soy yogurt", category: "soy", aliases: ["soya yogurt"] },
  { name: "textured vegetable protein", category: "soy", aliases: ["tvp", "soy mince", "soya mince"] },

  // ---- Whole grains ----
  { name: "oats", category: "wholeGrains", aliases: ["oatmeal", "porridge", "rolled oats", "steel-cut oats", "steel cut oats"] },
  { name: "brown rice", category: "wholeGrains" },
  { name: "wild rice", category: "wholeGrains" },
  { name: "quinoa", category: "wholeGrains" },
  { name: "barley", category: "wholeGrains", aliases: ["pearl barley"] },
  { name: "bulgur", category: "wholeGrains", aliases: ["bulgur wheat", "cracked wheat"] },
  { name: "farro", category: "wholeGrains" },
  { name: "freekeh", category: "wholeGrains" },
  { name: "millet", category: "wholeGrains" },
  { name: "buckwheat", category: "wholeGrains", aliases: ["soba"] },
  { name: "amaranth", category: "wholeGrains" },
  { name: "sorghum", category: "wholeGrains" },
  { name: "teff", category: "wholeGrains" },
  { name: "rye", category: "wholeGrains", aliases: ["rye bread"] },
  { name: "whole wheat bread", category: "wholeGrains", aliases: ["wholewheat bread", "wholemeal bread", "whole grain bread", "wholegrain bread", "brown bread"] },
  { name: "whole wheat pasta", category: "wholeGrains", aliases: ["wholewheat pasta", "wholemeal pasta", "whole grain pasta"] },
  { name: "spelt", category: "wholeGrains" },
  { name: "popcorn", category: "wholeGrains" },
  { name: "corn tortilla", category: "wholeGrains", aliases: ["corn tortillas"] },
  { name: "polenta", category: "wholeGrains", aliases: ["cornmeal"] },
  { name: "muesli", category: "wholeGrains" },
  { name: "granola", category: "wholeGrains" },
  { name: "whole grain cereal", category: "wholeGrains", aliases: ["bran flakes", "shredded wheat", "weetabix"] },
  { name: "whole wheat couscous", category: "wholeGrains", aliases: ["wholewheat couscous"] },

  // ---- Nuts ----
  { name: "almonds", category: "nuts", aliases: ["almond", "almond butter"] },
  { name: "walnuts", category: "nuts", aliases: ["walnut"] },
  { name: "cashews", category: "nuts", aliases: ["cashew", "cashew butter"] },
  { name: "pistachios", category: "nuts", aliases: ["pistachio"] },
  { name: "pecans", category: "nuts", aliases: ["pecan"] },
  { name: "hazelnuts", category: "nuts", aliases: ["hazelnut"] },
  { name: "brazil nuts", category: "nuts", aliases: ["brazil nut"] },
  { name: "macadamia", category: "nuts", aliases: ["macadamia nuts"] },
  { name: "pine nuts", category: "nuts" },
  { name: "peanuts", category: "nuts", aliases: ["peanut", "peanut butter"] },
  { name: "mixed nuts", category: "nuts" },
  { name: "chestnuts", category: "nuts", aliases: ["chestnut"] },

  // ---- Seeds ----
  { name: "flaxseed", category: "seeds", aliases: ["flax", "ground flax", "linseed", "flax seeds"] },
  { name: "chia seeds", category: "seeds", aliases: ["chia"] },
  { name: "pumpkin seeds", category: "seeds", aliases: ["pepitas"] },
  { name: "sunflower seeds", category: "seeds" },
  { name: "sesame seeds", category: "seeds", aliases: ["sesame", "tahini"] },
  { name: "hemp seeds", category: "seeds", aliases: ["hemp hearts", "hemp"] },
  { name: "poppy seeds", category: "seeds" },

  // ---- Berries ----
  { name: "blueberries", category: "berries", aliases: ["blueberry"] },
  { name: "strawberries", category: "berries", aliases: ["strawberry"] },
  { name: "raspberries", category: "berries", aliases: ["raspberry"] },
  { name: "blackberries", category: "berries", aliases: ["blackberry"] },
  { name: "cranberries", category: "berries", aliases: ["cranberry"] },
  { name: "goji berries", category: "berries", aliases: ["goji"] },
  { name: "mulberries", category: "berries", aliases: ["mulberry"] },
  { name: "acai", category: "berries" },
  { name: "blackcurrants", category: "berries", aliases: ["blackcurrant", "currants"] },
  { name: "gooseberries", category: "berries", aliases: ["gooseberry"] },
  { name: "cherries", category: "berries", aliases: ["cherry"] },
  { name: "grapes", category: "berries", aliases: ["grape", "red grapes", "green grapes", "raisins", "raisin", "sultanas"] },

  // ---- Citrus ----
  { name: "orange", category: "citrus", aliases: ["oranges", "blood orange"] },
  { name: "mandarin", category: "citrus", aliases: ["clementine", "satsuma", "tangerine"] },
  { name: "lemon", category: "citrus", aliases: ["lemons"] },
  { name: "lime", category: "citrus", aliases: ["limes"] },
  { name: "grapefruit", category: "citrus" },
  { name: "kumquat", category: "citrus", aliases: ["kumquats"] },
  { name: "pomelo", category: "citrus" },

  // ---- Other fruit ----
  { name: "apple", category: "otherFruit", aliases: ["apples", "apple sauce", "applesauce"] },
  { name: "banana", category: "otherFruit", aliases: ["bananas"] },
  { name: "pear", category: "otherFruit", aliases: ["pears"] },
  { name: "mango", category: "otherFruit", aliases: ["mangoes"] },
  { name: "pineapple", category: "otherFruit" },
  { name: "peach", category: "otherFruit", aliases: ["peaches", "nectarine", "nectarines"] },
  { name: "plum", category: "otherFruit", aliases: ["plums", "prune", "prunes"] },
  { name: "apricot", category: "otherFruit", aliases: ["apricots", "dried apricots"] },
  { name: "kiwi", category: "otherFruit", aliases: ["kiwifruit"] },
  { name: "melon", category: "otherFruit", aliases: ["cantaloupe", "honeydew"] },
  { name: "watermelon", category: "otherFruit" },
  { name: "papaya", category: "otherFruit" },
  { name: "pomegranate", category: "otherFruit" },
  { name: "fig", category: "otherFruit", aliases: ["figs"] },
  { name: "dates", category: "otherFruit", aliases: ["date"] },
  { name: "persimmon", category: "otherFruit" },
  { name: "passion fruit", category: "otherFruit" },
  { name: "guava", category: "otherFruit" },
  { name: "lychee", category: "otherFruit", aliases: ["lychees"] },
  { name: "dragon fruit", category: "otherFruit", aliases: ["pitaya"] },
  { name: "avocado", category: "otherFruit", aliases: ["avocados"] },
  { name: "coconut", category: "otherFruit", aliases: ["coconut milk", "desiccated coconut"] },
  { name: "rhubarb", category: "otherFruit" },

  // ---- Herbs & spices (quarter point) ----
  { name: "basil", category: "herbsSpices" },
  { name: "parsley", category: "herbsSpices" },
  { name: "cilantro", category: "herbsSpices", aliases: ["coriander", "coriander leaf"] },
  { name: "mint", category: "herbsSpices" },
  { name: "dill", category: "herbsSpices" },
  { name: "rosemary", category: "herbsSpices" },
  { name: "thyme", category: "herbsSpices" },
  { name: "oregano", category: "herbsSpices" },
  { name: "sage", category: "herbsSpices" },
  { name: "tarragon", category: "herbsSpices" },
  { name: "bay leaf", category: "herbsSpices", aliases: ["bay leaves"] },
  { name: "lemongrass", category: "herbsSpices" },
  { name: "cumin", category: "herbsSpices" },
  { name: "coriander seed", category: "herbsSpices" },
  { name: "turmeric", category: "herbsSpices" },
  { name: "ginger", category: "herbsSpices" },
  { name: "cinnamon", category: "herbsSpices" },
  { name: "nutmeg", category: "herbsSpices" },
  { name: "clove", category: "herbsSpices", aliases: ["cloves"] },
  { name: "cardamom", category: "herbsSpices" },
  { name: "paprika", category: "herbsSpices", aliases: ["smoked paprika"] },
  { name: "chili powder", category: "herbsSpices", aliases: ["cayenne", "chilli powder"] },
  { name: "black pepper", category: "herbsSpices", aliases: ["pepper", "peppercorns"] },
  { name: "mustard seed", category: "herbsSpices", aliases: ["mustard"] },
  { name: "fennel seed", category: "herbsSpices" },
  { name: "fenugreek", category: "herbsSpices" },
  { name: "star anise", category: "herbsSpices" },
  { name: "saffron", category: "herbsSpices" },
  { name: "vanilla", category: "herbsSpices" },
  { name: "allspice", category: "herbsSpices" },
  { name: "curry powder", category: "herbsSpices" },
  { name: "garam masala", category: "herbsSpices" },
  { name: "za'atar", category: "herbsSpices", aliases: ["zaatar"] },

  // ---- Fermented ----
  { name: "sauerkraut", category: "fermented" },
  { name: "kimchi", category: "fermented" },
  { name: "miso", category: "fermented" },
  { name: "kombucha", category: "fermented" },
  { name: "natto", category: "fermented" },
  { name: "pickles", category: "fermented", aliases: ["pickle", "gherkins"] },
  { name: "sourdough", category: "fermented", aliases: ["sourdough bread"] },

  // ---- Other plant ----
  { name: "coffee", category: "otherPlant", aliases: ["espresso", "latte"] },
  { name: "tea", category: "otherPlant", aliases: ["black tea", "green tea", "herbal tea"] },
  { name: "matcha", category: "otherPlant" },
  { name: "cacao", category: "otherPlant", aliases: ["cocoa", "cocoa powder"] },
  { name: "dark chocolate", category: "otherPlant", aliases: ["70% dark chocolate"] },
  { name: "olive oil", category: "otherPlant", aliases: ["extra virgin olive oil"] },
  { name: "seaweed", category: "otherPlant", aliases: ["nori", "kelp", "wakame", "kombu"] },
];

// Refined / juiced items: recognized, shown, but worth 0 points.
export const REFINED = new Set<string>([
  "white bread", "white rice", "white pasta", "pasta", "noodles", "white flour",
  "fruit juice", "orange juice", "apple juice", "couscous", "bagel", "naan",
  "white tortilla", "flour tortilla", "crackers", "rice cakes",
]);

// ============================================================================
// DISHES  (decomposed into plant components, no AI needed)
// All components are editable assumptions the user can confirm or amend.
// ============================================================================
export const DISHES: Dish[] = [
  { name: "lasagna", aliases: ["lasagne"], components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "spinach", category: "greens" },
    { name: "basil", category: "herbsSpices" }, { name: "oregano", category: "herbsSpices" },
  ], refined: ["pasta"], animalNote: "often contains beef and cheese" },

  { name: "spaghetti bolognese", aliases: ["bolognese", "spag bol", "pasta bolognese"], components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "oregano", category: "herbsSpices" },
  ], refined: ["pasta"], animalNote: "classically beef" },

  { name: "pasta with tomato sauce", aliases: ["pasta", "tomato pasta", "marinara"], components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "basil", category: "herbsSpices" },
  ], refined: ["pasta"] },

  { name: "pizza", aliases: ["margherita pizza", "cheese pizza"], components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "garlic", category: "alliums" },
    { name: "basil", category: "herbsSpices" }, { name: "oregano", category: "herbsSpices" },
  ], refined: ["pizza base"], animalNote: "usually cheese" },

  { name: "tomato soup", aliases: ["cream of tomato"], components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "basil", category: "herbsSpices" },
  ] },

  { name: "minestrone", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "zucchini", category: "rainbowVeg" },
    { name: "green beans", category: "rainbowVeg" }, { name: "cannellini beans", category: "legumes" },
    { name: "spinach", category: "greens" }, { name: "basil", category: "herbsSpices" },
  ], refined: ["pasta"] },

  { name: "lentil soup", components: [
    { name: "lentils", category: "legumes" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "tomato", category: "rainbowVeg" },
    { name: "cumin", category: "herbsSpices" },
  ] },

  { name: "vegetable soup", aliases: ["veg soup", "veggie soup"], components: [
    { name: "onion", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "potato", category: "starchyRoots" },
    { name: "tomato", category: "rainbowVeg" }, { name: "peas", category: "legumes" },
    { name: "green beans", category: "rainbowVeg" },
  ] },

  { name: "chicken noodle soup", components: [
    { name: "onion", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "celery", category: "rainbowVeg" }, { name: "parsley", category: "herbsSpices" },
  ], refined: ["noodles"], animalNote: "chicken" },

  { name: "chili", aliases: ["chilli", "chili con carne", "veggie chili", "bean chili"], components: [
    { name: "kidney beans", category: "legumes" }, { name: "black beans", category: "legumes" },
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "bell pepper", category: "rainbowVeg" },
    { name: "chili powder", category: "herbsSpices" }, { name: "cumin", category: "herbsSpices" },
  ], animalNote: "sometimes beef" },

  { name: "burrito", aliases: ["bean burrito"], components: [
    { name: "black beans", category: "legumes" }, { name: "brown rice", category: "wholeGrains" },
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "bell pepper", category: "rainbowVeg" }, { name: "avocado", category: "otherFruit" },
    { name: "cilantro", category: "herbsSpices" },
  ], refined: ["tortilla"] },

  { name: "tacos", aliases: ["taco"], components: [
    { name: "black beans", category: "legumes" }, { name: "tomato", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "cilantro", category: "herbsSpices" },
    { name: "avocado", category: "otherFruit" }, { name: "lime", category: "citrus" },
  ], refined: ["tortilla"], animalNote: "sometimes meat" },

  { name: "guacamole", aliases: ["guac"], components: [
    { name: "avocado", category: "otherFruit" }, { name: "onion", category: "alliums" },
    { name: "tomato", category: "rainbowVeg" }, { name: "lime", category: "citrus" },
    { name: "cilantro", category: "herbsSpices" }, { name: "garlic", category: "alliums" },
  ] },

  { name: "salsa", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "cilantro", category: "herbsSpices" }, { name: "lime", category: "citrus" },
    { name: "chili pepper", category: "rainbowVeg" }, { name: "garlic", category: "alliums" },
  ] },

  { name: "falafel", components: [
    { name: "chickpeas", category: "legumes" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "parsley", category: "herbsSpices" },
    { name: "cumin", category: "herbsSpices" }, { name: "cilantro", category: "herbsSpices" },
  ] },

  { name: "stir fry", aliases: ["vegetable stir fry", "veggie stir fry", "stir-fry"], components: [
    { name: "broccoli", category: "cruciferous" }, { name: "bell pepper", category: "rainbowVeg" },
    { name: "carrot", category: "rainbowVeg" }, { name: "snap peas", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "ginger", category: "herbsSpices" },
  ], refined: ["rice or noodles"] },

  { name: "fried rice", components: [
    { name: "peas", category: "legumes" }, { name: "carrot", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "spring onion", category: "alliums" },
  ], refined: ["white rice"], animalNote: "often egg" },

  { name: "chana masala", aliases: ["chickpea curry", "chole"], components: [
    { name: "chickpeas", category: "legumes" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "ginger", category: "herbsSpices" },
    { name: "tomato", category: "rainbowVeg" }, { name: "turmeric", category: "herbsSpices" },
    { name: "cumin", category: "herbsSpices" }, { name: "garam masala", category: "herbsSpices" },
  ] },

  { name: "dal", aliases: ["daal", "dahl", "dal tadka"], components: [
    { name: "lentils", category: "legumes" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "ginger", category: "herbsSpices" },
    { name: "turmeric", category: "herbsSpices" }, { name: "cumin", category: "herbsSpices" },
    { name: "tomato", category: "rainbowVeg" },
  ] },

  { name: "vegetable curry", aliases: ["veg curry", "veggie curry"], components: [
    { name: "potato", category: "starchyRoots" }, { name: "cauliflower", category: "cruciferous" },
    { name: "peas", category: "legumes" }, { name: "carrot", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "ginger", category: "herbsSpices" }, { name: "tomato", category: "rainbowVeg" },
    { name: "turmeric", category: "herbsSpices" }, { name: "cumin", category: "herbsSpices" },
  ] },

  { name: "curry", needsClarify: true, clarify: "Which curry? (e.g. chickpea, lentil dal, vegetable, or another kind)", components: [] },
  { name: "soup", needsClarify: true, clarify: "Which soup? (e.g. tomato, lentil, vegetable, minestrone)", components: [] },
  { name: "salad", needsClarify: true, clarify: "What was in the salad?", components: [] },
  { name: "smoothie", needsClarify: true, clarify: "What went in the smoothie?", components: [] },

  { name: "pad thai", components: [
    { name: "bean sprouts", category: "rainbowVeg" }, { name: "peanuts", category: "nuts" },
    { name: "spring onion", category: "alliums" }, { name: "lime", category: "citrus" },
    { name: "garlic", category: "alliums" },
  ], refined: ["rice noodles"], animalNote: "often egg or shrimp" },

  { name: "ramen", components: [
    { name: "spring onion", category: "alliums" }, { name: "mushroom", category: "rainbowVeg" },
    { name: "bok choy", category: "cruciferous" }, { name: "garlic", category: "alliums" },
    { name: "ginger", category: "herbsSpices" }, { name: "seaweed", category: "otherPlant" },
  ], refined: ["noodles"], animalNote: "often pork and egg" },

  { name: "sushi", aliases: ["veggie sushi", "veg sushi"], components: [
    { name: "seaweed", category: "otherPlant" }, { name: "cucumber", category: "rainbowVeg" },
    { name: "avocado", category: "otherFruit" }, { name: "carrot", category: "rainbowVeg" },
  ], refined: ["white rice"], animalNote: "often fish" },

  { name: "greek salad", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "cucumber", category: "rainbowVeg" },
    { name: "red onion", category: "alliums" }, { name: "bell pepper", category: "rainbowVeg" },
    { name: "olives", category: "rainbowVeg" },
  ], animalNote: "usually feta" },

  { name: "garden salad", aliases: ["green salad", "side salad"], components: [
    { name: "lettuce", category: "greens" }, { name: "tomato", category: "rainbowVeg" },
    { name: "cucumber", category: "rainbowVeg" }, { name: "carrot", category: "rainbowVeg" },
    { name: "onion", category: "alliums" },
  ] },

  { name: "coleslaw", aliases: ["slaw"], components: [
    { name: "cabbage", category: "cruciferous" }, { name: "carrot", category: "rainbowVeg" },
    { name: "onion", category: "alliums" },
  ] },

  { name: "ratatouille", components: [
    { name: "eggplant", category: "rainbowVeg" }, { name: "zucchini", category: "rainbowVeg" },
    { name: "bell pepper", category: "rainbowVeg" }, { name: "tomato", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "basil", category: "herbsSpices" }, { name: "thyme", category: "herbsSpices" },
  ] },

  { name: "shakshuka", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "bell pepper", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "paprika", category: "herbsSpices" }, { name: "cumin", category: "herbsSpices" },
  ], animalNote: "eggs" },

  { name: "oatmeal", aliases: ["porridge", "oats"], components: [
    { name: "oats", category: "wholeGrains" },
  ] },

  { name: "overnight oats", components: [
    { name: "oats", category: "wholeGrains" }, { name: "chia seeds", category: "seeds" },
  ] },

  { name: "avocado toast", components: [
    { name: "avocado", category: "otherFruit" }, { name: "whole wheat bread", category: "wholeGrains" },
    { name: "lemon", category: "citrus" },
  ] },

  { name: "peanut butter and jelly", aliases: ["pbj", "pb and j", "peanut butter sandwich"], components: [
    { name: "peanuts", category: "nuts" },
  ], refined: ["white bread"] },

  { name: "black bean burger", aliases: ["veggie burger", "bean burger"], components: [
    { name: "black beans", category: "legumes" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "corn", category: "rainbowVeg" },
  ], refined: ["bun"] },

  { name: "mashed potato", aliases: ["mashed potatoes", "mash"], components: [
    { name: "potato", category: "starchyRoots" }, { name: "garlic", category: "alliums" },
  ], animalNote: "often butter and milk" },

  { name: "baked beans on toast", components: [
    { name: "baked beans", category: "legumes" }, { name: "tomato", category: "rainbowVeg" },
  ], refined: ["white bread"] },

  { name: "gazpacho", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "cucumber", category: "rainbowVeg" },
    { name: "bell pepper", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" },
  ] },

  { name: "pesto", components: [
    { name: "basil", category: "herbsSpices" }, { name: "pine nuts", category: "nuts" },
    { name: "garlic", category: "alliums" }, { name: "olive oil", category: "otherPlant" },
  ], animalNote: "usually parmesan" },

  { name: "bruschetta", components: [
    { name: "tomato", category: "rainbowVeg" }, { name: "basil", category: "herbsSpices" },
    { name: "garlic", category: "alliums" },
  ], refined: ["bread"] },

  { name: "spring rolls", components: [
    { name: "cabbage", category: "cruciferous" }, { name: "carrot", category: "rainbowVeg" },
    { name: "bean sprouts", category: "rainbowVeg" }, { name: "spring onion", category: "alliums" },
  ], refined: ["wrapper"] },

  { name: "biryani", aliases: ["veg biryani"], components: [
    { name: "onion", category: "alliums" }, { name: "tomato", category: "rainbowVeg" },
    { name: "peas", category: "legumes" }, { name: "carrot", category: "rainbowVeg" },
    { name: "ginger", category: "herbsSpices" }, { name: "garlic", category: "alliums" },
    { name: "turmeric", category: "herbsSpices" }, { name: "cardamom", category: "herbsSpices" },
    { name: "cumin", category: "herbsSpices" },
  ], refined: ["white rice"], animalNote: "sometimes meat" },

  { name: "tabbouleh", components: [
    { name: "bulgur", category: "wholeGrains" }, { name: "parsley", category: "herbsSpices" },
    { name: "mint", category: "herbsSpices" }, { name: "tomato", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "lemon", category: "citrus" },
  ] },

  { name: "couscous salad", components: [
    { name: "whole wheat couscous", category: "wholeGrains" }, { name: "tomato", category: "rainbowVeg" },
    { name: "cucumber", category: "rainbowVeg" }, { name: "bell pepper", category: "rainbowVeg" },
    { name: "parsley", category: "herbsSpices" }, { name: "mint", category: "herbsSpices" },
    { name: "lemon", category: "citrus" },
  ] },

  { name: "chia pudding", components: [
    { name: "chia seeds", category: "seeds" },
  ] },

  { name: "trail mix", components: [
    { name: "mixed nuts", category: "nuts" }, { name: "grapes", category: "berries" },
    { name: "pumpkin seeds", category: "seeds" },
  ] },

  { name: "veggie omelette", aliases: ["vegetable omelette", "veggie omelet"], components: [
    { name: "bell pepper", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "tomato", category: "rainbowVeg" }, { name: "spinach", category: "greens" },
    { name: "mushroom", category: "rainbowVeg" },
  ], animalNote: "eggs" },

  { name: "nachos", components: [
    { name: "black beans", category: "legumes" }, { name: "tomato", category: "rainbowVeg" },
    { name: "chili pepper", category: "rainbowVeg" }, { name: "onion", category: "alliums" },
    { name: "avocado", category: "otherFruit" },
  ], refined: ["corn chips"], animalNote: "usually cheese" },

  { name: "saag", aliases: ["palak", "saag aloo", "palak paneer"], components: [
    { name: "spinach", category: "greens" }, { name: "onion", category: "alliums" },
    { name: "garlic", category: "alliums" }, { name: "ginger", category: "herbsSpices" },
    { name: "tomato", category: "rainbowVeg" }, { name: "cumin", category: "herbsSpices" },
  ], animalNote: "paneer version has cheese" },

  { name: "aloo gobi", components: [
    { name: "potato", category: "starchyRoots" }, { name: "cauliflower", category: "cruciferous" },
    { name: "onion", category: "alliums" }, { name: "tomato", category: "rainbowVeg" },
    { name: "turmeric", category: "herbsSpices" }, { name: "cumin", category: "herbsSpices" },
    { name: "ginger", category: "herbsSpices" },
  ] },

  { name: "samosa", aliases: ["samosas"], components: [
    { name: "potato", category: "starchyRoots" }, { name: "peas", category: "legumes" },
    { name: "onion", category: "alliums" }, { name: "cumin", category: "herbsSpices" },
    { name: "coriander seed", category: "herbsSpices" },
  ], refined: ["pastry"] },

  { name: "buddha bowl", aliases: ["grain bowl", "nourish bowl"], components: [
    { name: "quinoa", category: "wholeGrains" }, { name: "chickpeas", category: "legumes" },
    { name: "kale", category: "greens" }, { name: "sweet potato", category: "starchyRoots" },
    { name: "avocado", category: "otherFruit" }, { name: "sesame seeds", category: "seeds" },
  ] },

  { name: "poke bowl", aliases: ["poke"], components: [
    { name: "edamame", category: "soy" }, { name: "cucumber", category: "rainbowVeg" },
    { name: "avocado", category: "otherFruit" }, { name: "seaweed", category: "otherPlant" },
  ], refined: ["white rice"], animalNote: "often fish" },

  { name: "borscht", components: [
    { name: "beetroot", category: "starchyRoots" }, { name: "cabbage", category: "cruciferous" },
    { name: "onion", category: "alliums" }, { name: "carrot", category: "rainbowVeg" },
    { name: "potato", category: "starchyRoots" }, { name: "garlic", category: "alliums" },
    { name: "dill", category: "herbsSpices" },
  ] },

  { name: "pho", components: [
    { name: "onion", category: "alliums" }, { name: "ginger", category: "herbsSpices" },
    { name: "bean sprouts", category: "rainbowVeg" }, { name: "basil", category: "herbsSpices" },
    { name: "lime", category: "citrus" },
  ], refined: ["rice noodles"], animalNote: "usually beef" },

  { name: "chow mein", components: [
    { name: "cabbage", category: "cruciferous" }, { name: "carrot", category: "rainbowVeg" },
    { name: "bean sprouts", category: "rainbowVeg" }, { name: "spring onion", category: "alliums" },
    { name: "garlic", category: "alliums" },
  ], refined: ["noodles"] },

  { name: "mujadara", components: [
    { name: "lentils", category: "legumes" }, { name: "brown rice", category: "wholeGrains" },
    { name: "onion", category: "alliums" }, { name: "cumin", category: "herbsSpices" },
  ] },

  { name: "enchiladas", components: [
    { name: "black beans", category: "legumes" }, { name: "tomato", category: "rainbowVeg" },
    { name: "onion", category: "alliums" }, { name: "garlic", category: "alliums" },
    { name: "chili powder", category: "herbsSpices" },
  ], refined: ["tortilla"], animalNote: "sometimes chicken and cheese" },

  { name: "green smoothie", components: [
    { name: "spinach", category: "greens" }, { name: "banana", category: "otherFruit" },
    { name: "blueberries", category: "berries" },
  ] },
];

// ============================================================================
// TREATS  ("feed your soul", no category count unless qualifying plants exist)
// ============================================================================
export const TREATS: Treat[] = [
  { name: "cake", aliases: ["chocolate cake", "sponge cake", "birthday cake"] },
  { name: "carrot cake", qualifying: [
    { name: "carrot", category: "rainbowVeg" }, { name: "walnuts", category: "nuts" },
  ] },
  { name: "banana bread", qualifying: [
    { name: "banana", category: "otherFruit" }, { name: "walnuts", category: "nuts" },
  ] },
  { name: "apple pie", qualifying: [{ name: "apple", category: "otherFruit" }] },
  { name: "berry crumble", aliases: ["fruit crumble", "apple crumble"], qualifying: [
    { name: "blueberries", category: "berries" }, { name: "oats", category: "wholeGrains" },
  ] },
  { name: "strawberry shortcake", qualifying: [{ name: "strawberries", category: "berries" }] },
  { name: "cookies", aliases: ["cookie", "biscuit", "biscuits"] },
  { name: "brownie", aliases: ["brownies"] },
  { name: "ice cream", aliases: ["gelato"] },
  { name: "donut", aliases: ["doughnut", "donuts"] },
  { name: "candy", aliases: ["sweets", "candies"] },
  { name: "chocolate", aliases: ["milk chocolate", "chocolate bar"] },
  { name: "croissant", aliases: ["pastry", "danish"] },
  { name: "muffin", aliases: ["cupcake"] },
  { name: "cheesecake" },
  { name: "pancakes", aliases: ["pancake"] },
  { name: "waffles", aliases: ["waffle"] },
  { name: "french fries", aliases: ["fries", "chips"] },
  { name: "potato chips", aliases: ["crisps"] },
  { name: "pretzel", aliases: ["pretzels"] },
  { name: "soda", aliases: ["soft drink", "pop", "cola"] },
  { name: "baklava", qualifying: [{ name: "walnuts", category: "nuts" }] },
  { name: "pudding", aliases: ["custard"] },
  { name: "marshmallow", aliases: ["marshmallows"] },
  { name: "fudge" },
  { name: "churros" },
  { name: "gulab jamun" },
  { name: "jalebi" },
];

// ============================================================================
// ANIMAL FOODS  (gentle redirect, no count, invite plant sides)
// ============================================================================
export const ANIMAL_FOODS = new Set<string>([
  "chicken", "beef", "steak", "pork", "bacon", "ham", "sausage", "sausages",
  "turkey", "lamb", "mince", "ground beef", "meatballs", "burger patty",
  "fish", "salmon", "tuna", "cod", "haddock", "shrimp", "prawns", "seafood",
  "egg", "eggs", "cheese", "milk", "yogurt", "yoghurt", "butter", "cream",
  "paneer", "feta", "mozzarella", "parmesan", "honey",
]);

// ============================================================================
// HELPERS
// ============================================================================
export function normalize(input: string): { qty: number; food: string } {
  let s = input.toLowerCase().trim();
  // pull a leading number (incl simple fractions like 1/2)
  let qty = 1;
  const m = s.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s+/);
  if (m) {
    qty = m[1].includes("/") ? eval(m[1]) : parseFloat(m[1]);
    s = s.slice(m[0].length);
  }
  // strip a unit word if present, applying its serving multiplier
  const unitMatch = s.match(/^(\w+)\s+(?:of\s+)?/);
  if (unitMatch && UNIT_MAP[unitMatch[1]] !== undefined) {
    qty = qty * UNIT_MAP[unitMatch[1]];
    s = s.replace(/^(\w+)\s+(?:of\s+)?/, "");
  }
  s = s.replace(/^(a|an|some|the)\s+/, "").trim();
  // naive singularization for matching (keep both forms when looking up)
  return { qty, food: s };
}

export function findWholeFood(food: string): WholeFood | undefined {
  const singular = food.endsWith("s") ? food.slice(0, -1) : food;
  return WHOLE_FOODS.find(
    (f) =>
      f.name === food || f.name === singular ||
      (f.aliases || []).some((a) => a === food || a === singular)
  );
}

export function findDish(food: string): Dish | undefined {
  return DISHES.find(
    (d) => d.name === food || (d.aliases || []).some((a) => a === food)
  );
}

export function findTreat(food: string): Treat | undefined {
  return TREATS.find(
    (t) => t.name === food || (t.aliases || []).some((a) => a === food)
  );
}

export function isAnimal(food: string): boolean {
  const singular = food.endsWith("s") ? food.slice(0, -1) : food;
  return ANIMAL_FOODS.has(food) || ANIMAL_FOODS.has(singular);
}

export function isRefined(food: string): boolean {
  return REFINED.has(food);
}

// Top-level resolver. Returns what the UI should do with an entry.
export type Resolution =
  | { type: "plant"; food: WholeFood; qty: number; points: number }
  | { type: "dish"; dish: Dish; qty: number }
  | { type: "treat"; treat: Treat }
  | { type: "animal"; name: string }
  | { type: "refined"; name: string }
  | { type: "unknown"; name: string };

export function resolveEntry(input: string): Resolution {
  const { qty, food } = normalize(input);
  const whole = findWholeFood(food);
  if (whole) return { type: "plant", food: whole, qty, points: getPoints(whole.name, whole.category) };
  const dish = findDish(food);
  if (dish) return { type: "dish", dish, qty };
  const treat = findTreat(food);
  if (treat) return { type: "treat", treat };
  if (isAnimal(food)) return { type: "animal", name: food };
  if (isRefined(food)) return { type: "refined", name: food };
  return { type: "unknown", name: food };
}
