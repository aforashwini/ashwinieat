# Yumshi 🌱🎮

> Repo/paths are still named `ashwinieat` (GitHub Pages serves it at
> `/ashwinieat/`); **Yumshi** is just the display name players see.

A single-page **retro pixel nutrition game**. Log what you ate, and a Nokia-green
pixel girl munches her way Snake-style through everything you hit against a
whole-food plant-based set of targets — celebrating progress toward **30+ different
plants a week**.

It's a tiny toy, not a clinical dashboard: encouraging, abundance-focused, and a
little silly ("nom noms", "great munching today!").

## Stack

- **React + Vite + TypeScript** — no UI libraries.
- **Supabase** for auth (Google sign-in) + cloud sync, so logs follow you across
  devices. Row Level Security keeps each user to their own rows. See
  [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the one-time SQL.
- **HTML `<canvas>`** for the Snake-style daily game (hand-drawn pixel sprites via `fillRect`).
- **Press Start 2P** font + a classic 4-shade green LCD palette.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000/ashwinieat/
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## How it works

1. **Landing** — the pixel girl, today's date, and your weekly plant count.
2. **Log entry** — type foods + quantities (`kale`, `2 cups`). Free-text quantities
   like `handful`, `1 bowl`, `½ cup` are parsed into target-servings. Unknown foods
   prompt a one-tap category picker and are remembered for next time.
3. **Daily game** — the canvas board draws each category's target as pixel-food icons.
   The girl snakes through, **eating** what you logged and **hopping over** what you
   missed (left hollow, never punished). A summary shows categories filled/missed,
   today's plant variety, a soft calorie estimate, and a supplement checklist
   (D3 / omega-3 / B12 / brazil nut).
4. **Weekly** — rolling 7-day plant-variety counter (`X / 30`), a pixel heatmap of
   categories hit per day (tap a day to amend it), and the full list of plants eaten.
5. **Options** — calorie goal (soft reference), water target, weekly plant target.

## Project structure

```
src/
  App.tsx                  # state, navigation, persistence
  styles/pixel.css         # palette, font, pixel design system
  data/
    targets.ts             # Daily-Dozen-based targets + serving/unit definitions
    foodDatabase.ts        # ~100 foods -> {category, serving, kcal, plant}
  lib/
    storage.ts             # app data shapes + helpers
    supabase.ts            # Supabase client + Google auth helpers
    store.ts               # fetch/save the user's data (JSONB) via Supabase
    nutrition.ts           # quantity parsing + day/week progress engine
    sprites.ts             # pixel matrices + canvas draw helpers
    dates.ts               # local-date helpers
  components/
    Screen.tsx             # green LCD bezel + status bar
    PixelButton.tsx
    PixelGirl.tsx          # the friendly canvas sprite
  screens/
    Landing / LogEntry / DailyGame / Weekly / Settings
```

## A note on the nutrition targets

Targets are based on **Dr. Greger's Daily Dozen** and standard whole-food
plant-based guidance, with ground flax, a daily brazil nut, omega-3, D3, and a B12
flag added. They're a nutrient-density **floor to aim for**, never a calorie cap or a
set of rules. This is **general guidance, not personalized medical advice** — a
registered dietitian can tailor it, and B12 dosing is worth confirming with a doctor.
