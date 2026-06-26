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

1. **First-run intro** — the "why 30 plants a week?" science card, shown once per user.
2. **Landing** — the pixel girl, today's date, and your weekly plant points.
3. **Log entry** — type anything (`kale`, `lentil soup`, `cake`, `chicken and rice`).
   Each entry is routed locally (no AI) to **plant / dish / treat / animal / refined /
   unknown**. Dishes show their assumed plant components to confirm/amend; vague
   entries (`soup`, `curry`, `salad`, `smoothie`) ask a clarifying question; treats
   "feed the soul" (qualifying plants inside still count); animal foods get a gentle
   redirect; unknowns get a one-tap category picker that's remembered next time.
4. **Daily game** — the girl snakes through and **eats** each plant you logged (runs
   only when a food log is confirmed). The wrap-up celebrates the win first, shows
   your plant list, category coverage (filled vs quiet — never failing), one or two
   gentle next steps, and your opted-in supplement ticks.
5. **Weekly** — rolling 7-day **plant points** (`X / 30`, ¼ pt for herbs/spices/etc.),
   Bronze/Silver/Gold badges, a pixel day-strip (tap a day to amend), the full variety
   list, and easy new-plant ideas from your quietest groups.
6. **Options** — weekly plant target, week window (rolling vs Mon–Sun), and a fully
   customizable supplement tracker (B12, D, omega-3, iron, iodine, zinc, calcium,
   selenium, protein + your own). Nothing is forced; supplement ticks never animate.

## Project structure

```
src/
  App.tsx                  # state, navigation, persistence
  styles/pixel.css         # palette, font, pixel design system
  data/
    foodDatabase.ts        # the entire local food-recognition layer (no AI)
    categories.ts          # 16-category display metadata (labels + icon keys)
  lib/
    storage.ts             # app data shapes + helpers (entries, plants, supplements)
    supabase.ts            # Supabase client + Google auth helpers
    store.ts               # fetch/save the user's data (JSONB) via Supabase
    nutrition.ts           # plant-points engine + adequacy nudges + weekly stats
    sprites.ts             # pixel matrices + canvas draw helpers
    dates.ts               # local-date helpers
  components/
    Screen.tsx             # green LCD bezel + status bar
    PixelButton.tsx
    PixelGirl.tsx          # the friendly canvas sprite
    PixelIcon.tsx          # tiny filled/outline category icon
  screens/
    Intro / Landing / LogEntry / DailyGame / Weekly / Settings
```

## A note on the nutrition approach

The headline metric is **plant variety** — how many different plants you eat across a
rolling week, toward **30+ plant points** (the American Gut Project guideline). Herbs,
spices, tea, coffee, cacao, and olive oil count as ¼ point each; refined/juiced forms
count as 0. There is **no calorie counting and no macro grams** — amounts only feed
gentle, qualitative "are you getting enough" nudges (fiber, protein, iron + vitamin C,
greens). No food is ever labelled bad, and treats are always welcome. This is **general
wellbeing guidance, not medical advice** — and B12 dosing is worth confirming with a doctor.
