import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppData, DayLog, LearnedFood, Settings } from "./lib/storage";
import { EMPTY_DATA, getDay } from "./lib/storage";
import { fetchAppData, saveAppData } from "./lib/store";
import { supabase, signOut as supabaseSignOut } from "./lib/supabase";
import { computeWeeklyProgress } from "./lib/nutrition";
import { lastNKeys, todayKey } from "./lib/dates";
import Landing from "./screens/Landing";
import LogEntry from "./screens/LogEntry";
import DailyGame from "./screens/DailyGame";
import Weekly from "./screens/Weekly";
import SettingsScreen from "./screens/Settings";
import Screen from "./components/Screen";

export type ScreenName = "landing" | "log" | "game" | "weekly" | "settings";

export interface ScreenProps {
  data: AppData;
  activeDate: string;
  plantsThisWeek: number;
  // Auth: present (email) when signed in, undefined when signed out.
  authed: boolean;
  userEmail?: string;
  signOut: () => void;
  go: (screen: ScreenName, date?: string) => void;
  updateDay: (date: string, day: DayLog) => void;
  updateSettings: (settings: Settings) => void;
  addLearned: (food: LearnedFood) => void;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [screen, setScreen] = useState<ScreenName>("landing");
  const [activeDate, setActiveDate] = useState<string>(() => todayKey());

  // ---- Auth lifecycle -----------------------------------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      setSession(s.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  // ---- Load this user's data when they sign in ----------------------------
  useEffect(() => {
    if (!userId) {
      setData(null);
      setScreen("landing");
      return;
    }
    let cancelled = false;
    fetchAppData(userId).then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- Persist (debounced) on every change --------------------------------
  useEffect(() => {
    if (!userId || !data) return;
    const t = setTimeout(() => {
      void saveAppData(userId, data);
    }, 600);
    return () => clearTimeout(t);
  }, [data, userId]);

  const go = useCallback((next: ScreenName, date?: string) => {
    if (date) setActiveDate(date);
    setScreen(next);
  }, []);

  const updateDay = useCallback((date: string, day: DayLog) => {
    setData((prev) =>
      prev ? { ...prev, days: { ...prev.days, [date]: day } } : prev
    );
  }, []);

  const updateSettings = useCallback((settings: Settings) => {
    setData((prev) => (prev ? { ...prev, settings } : prev));
  }, []);

  const addLearned = useCallback((food: LearnedFood) => {
    setData((prev) => {
      if (!prev) return prev;
      const learned = prev.learned.filter(
        (l) => l.alias.toLowerCase() !== food.alias.toLowerCase()
      );
      learned.push(food);
      return { ...prev, learned };
    });
  }, []);

  const signOut = useCallback(() => {
    void supabaseSignOut();
  }, []);

  // Weekly plant count (rolling 7 days ending today) for the status bar.
  const plantsThisWeek = useMemo(() => {
    if (!data) return 0;
    const keys = lastNKeys(7);
    const logs = keys.map((k) => data.days[k]);
    return computeWeeklyProgress(logs, keys).plantCount;
  }, [data]);

  // ---- Render gates -------------------------------------------------------
  // Still checking for an existing session.
  if (!authReady) return <Splash message="warming up the cartridge…" />;

  // Signed in, but the data row is still loading.
  if (session && !data) return <Splash message="loading your garden…" />;

  const effectiveData = data ?? EMPTY_DATA;

  const shared: ScreenProps = {
    data: effectiveData,
    activeDate,
    plantsThisWeek,
    authed: !!session,
    userEmail: session?.user.email ?? undefined,
    signOut,
    go,
    updateDay,
    updateSettings,
    addLearned,
  };

  // Signed out → only the landing screen (with the sign-in button) is reachable.
  if (!session) return <Landing {...shared} />;

  const activeDay = getDay(effectiveData, activeDate);

  return (
    <>
      {screen === "landing" && <Landing {...shared} />}
      {screen === "log" && <LogEntry {...shared} day={activeDay} />}
      {screen === "game" && <DailyGame {...shared} day={activeDay} />}
      {screen === "weekly" && <Weekly {...shared} />}
      {screen === "settings" && <SettingsScreen {...shared} />}
    </>
  );
}

function Splash({ message }: { message: string }) {
  return (
    <Screen statusRight={<span className="text-sm">···</span>}>
      <div
        className="stack stack-3 text-center"
        style={{ flex: 1, justifyContent: "center" }}
      >
        <p className="text blink">{message}</p>
      </div>
    </Screen>
  );
}
