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
    flowType: "pkce",
  },
});

// Where Google should send the user back to after sign-in. This resolves to
// http://localhost:3000/ashwinieat/ in dev and
// https://aforashwini.github.io/ashwinieat/ in production, because BASE_URL is
// the Vite `base` ("/ashwinieat/"). This exact URL must be in Supabase →
// Authentication → URL Configuration → Redirect URLs.
export function authRedirectTo(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

// Returns an error message string on failure, or null on success (navigation
// to Google is about to happen). Surfacing this stops the button looking dead.
export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: authRedirectTo(),
      queryParams: { prompt: "select_account" },
    },
  });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// If the OAuth provider bounced us back with an error (bad redirect config,
// user cancelled, etc.), Supabase leaves it in the URL query or hash. Read it
// so we can show the real reason instead of a silent failure.
export function readOAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const parse = (s: string) => new URLSearchParams(s.replace(/^[?#]/, ""));
  for (const src of [window.location.search, window.location.hash]) {
    const p = parse(src);
    const desc = p.get("error_description") || p.get("error");
    if (desc) return decodeURIComponent(desc.replace(/\+/g, " "));
  }
  return null;
}
