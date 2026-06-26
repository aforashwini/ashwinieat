// lib/supabase.ts
// Single shared Supabase client for auth + data sync.
//
// The anon key is a public, browser-safe key (Row Level Security is what
// actually protects the data). We default to the project's values but allow
// overriding via Vite env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://rognxqbilixrixaqjotg.supabase.co";

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZ254cWJpbGl4cml4YXFqb3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODY2NTQsImV4cCI6MjA5ODA2MjY1NH0.ApdnFqzI1MnvyqwNTERaifFQgSjoPxQLePGPwbKu82g";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // keep the user signed in across refreshes
    autoRefreshToken: true,
    detectSessionInUrl: true, // handle the OAuth redirect (?code=...) on return
  },
});

// Where Google should send the user back to after sign-in. This resolves to
// http://localhost:3000/ashwinieat/ in dev and
// https://aforashwini.github.io/ashwinieat/ in production, because BASE_URL is
// the Vite `base` ("/ashwinieat/").
export function authRedirectTo(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: authRedirectTo() },
  });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
