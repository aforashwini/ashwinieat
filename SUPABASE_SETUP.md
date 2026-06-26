# Yumshi — Supabase setup

Yumshi now stores every player's food logs in Supabase instead of the browser,
so your garden follows you to any device once you sign in with Google.

You only have to do this **once**. Three quick steps.

---

## 1. Run the SQL (creates the table + security rules)

Open your project's **SQL Editor** in the Supabase dashboard
(`https://supabase.com/dashboard/project/rognxqbilixrixaqjotg/sql/new`),
paste the whole block below, and click **Run**.

```sql
-- One row per user. The whole app blob (settings, days, supplements,
-- learned foods) lives in `data` as JSONB, keyed to the signed-in user's id.
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Turn ON Row Level Security so the table is locked down by default.
alter table public.user_data enable row level security;

-- Each user may only see and change THEIR OWN row (auth.uid() = user_id).
-- Re-runnable: drop existing policies first.
drop policy if exists "read own data"   on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
drop policy if exists "delete own data" on public.user_data;

create policy "read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

create policy "insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

create policy "update own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own data"
  on public.user_data for delete
  using (auth.uid() = user_id);
```

You should see **Success. No rows returned.** That's expected — it created the
table and policies. With RLS on and those four policies, nobody can read or
write a row whose `user_id` isn't their own logged-in id.

---

## 2. Tell Google where it's allowed to send people back

In the dashboard go to **Authentication → URL Configuration** and add both of
these under **Redirect URLs** (and set the Site URL to the production one):

- `https://aforashwini.github.io/ashwinieat/`  ← production
- `http://localhost:3000/ashwinieat/`          ← local development

The app asks Supabase to redirect back to whichever origin it's running on, so
these two entries cover both. (Google sign-in itself is already configured in
your dashboard — nothing to change there.)

---

## 3. You're done

- **Production:** push to the deploy branch and open
  `https://aforashwini.github.io/ashwinieat/` → tap **sign in with google**.
- **Local:** `npm run dev`, then open `http://localhost:3000/ashwinieat/`.

Sign in once and your logs sync across every device you use. Sign out from the
landing screen or **options**.

> The anon key shipped in the app is the public, browser-safe key — Row Level
> Security (step 1) is what actually protects the data, which is why turning it
> on and keeping those policies is the important part.
