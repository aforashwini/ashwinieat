// lib/store.ts
// Reads/writes the user's whole app blob to Supabase. The entire AppData
// (settings, days, supplements, learned foods) is stored as a single JSONB row
// keyed to the logged-in user's id, protected by Row Level Security so a user
// can only ever touch their own row.

import { supabase } from "./supabase";
import type { AppData } from "./storage";
import { cloneData, EMPTY_DATA, normalizeData } from "./storage";

const TABLE = "user_data";

// Load this user's data. A brand-new user has no row yet → start empty.
export async function fetchAppData(userId: string): Promise<AppData> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[store] fetch failed:", error.message);
    return cloneData(EMPTY_DATA);
  }
  if (!data) return cloneData(EMPTY_DATA);
  return normalizeData(data.data as Partial<AppData>);
}

// Upsert the whole blob for this user. Returns an error message on failure so
// the UI can surface it (e.g. the user_data table/policies aren't set up).
export async function saveAppData(userId: string, appData: AppData): Promise<string | null> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      data: appData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[store] save failed:", error.message);
    return error.message;
  }
  return null;
}
