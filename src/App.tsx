import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type {
  AppData,
  DayLog,
  LearnedFood,
  Settings,
  SupplementItem,
} from "./lib/storage";
import { EMPTY_DATA, getDay } from "./lib/storage";
import { fetchAppData, saveAppData } from "./lib/store";
import { supabase, signOut as supabaseSignOut } from "./lib/supabase";
import { computeWeeklyStats } from "./lib/nutrition";
import { lastNKeys, todayKey } from "./lib/dates";
import Landing from "./screens/Landing";
import LogEntry from "./screens/LogEntry";
import DailyGame from "./screens/DailyGame";
import Weekly from "./screens/Weekly";
import SettingsScreen from "./screens/Settings";
import Intro from "./screens/Intro";
import Screen from "./components/Screen";

export type ScreenName = "landing" | "log" | "game" | "weekly" | "settings";

export interface ScreenProps {
  data: AppData;
  activeDate: string;
  plantsThisWeek: number; // weekly plant points (rounded), for the status bar
  authed: boolean;
  userEmail?: string;
  signOut: () => void;
  go: (screen: ScreenName, date?: string) => void;
  updateDay: (date: string, day: DayLog) => void;
  updateSettings: (settings: Settings) => void;
  updateSupplements: (supplements: SupplementItem[]) => void;
  addLearned: (food: LearnedFood) => void;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [screen, setScreen] = useState<ScreenName>("landing");
  const [activeDate, setActiveDate] = useState<string>(() => todayKey());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Keep the freshest data/userId reachable for flush-before-signout.
  const dataRef = useRef<AppData | null>(null);
  const userIdRef = useRef<string | undefined>(undefined);
  const loadedRef = useRef(false); // don't echo the just-fetched blob back

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

  // Keep refs current so a sign-out can flush the very latest data.
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // ---- Load this user's data when they sign in ----------------------------
  useEffect(() => {
    if (!userId) {
      setData(null);
      setScreen("landing");
      loadedRef.current = false;
      return;
    }
    let cancelled = false;
    loadedRef.current = false;
    fetchAppData(userId).then((d) => {
      if (cancelled) return;
      setData(d);
      // mark loaded on the next tick so the load itself isn't saved back
      setTimeout(() => (loadedRef.current = true), 0);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- Persist (debounced) on every real change ---------------------------
  useEffect(() => {
    if (!userId || !data || !loadedRef.current) return;
    const t = setTimeout(() => {
      void saveAppData(userId, data).then((err) => setSyncError(err));
    }, 500);
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

  const updateSupplements = useCallback((supplements: SupplementItem[]) => {
    setData((prev) => (prev ? { ...prev, supplements } : prev));
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

  const markIntroSeen = useCallback(() => {
    setData((prev) => (prev ? { ...prev, hasSeenIntro: true } : prev));
  }, []);

  const signOut = useCallback(async () => {
    // Flush the freshest data before the session goes away.
    const uid = userIdRef.current;
    const d = dataRef.current;
    if (uid && d) {
      const err = await saveAppData(uid, d);
      if (err) {
        setSyncError(err);
        // don't sign out on a failed save — the user would lose the data
        return;
      }
    }
    await supabaseSignOut();
  }, []);

  // Weekly plant points (rolling 7 days ending today) for the status bar.
  const plantsThisWeek = useMemo(() => {
    if (!data) return 0;
    const keys = lastNKeys(7);
    const logs = keys.map((k) => data.days[k]);
    return Math.round(
      computeWeeklyStats(logs, keys, data.settings.weeklyPlantTarget).totalPoints
    );
  }, [data]);

  // ---- Render gates -------------------------------------------------------
  if (!authReady) return <Splash message="warming up the cartridge…" />;
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
    updateSupplements,
    addLearned,
  };

  // Signed out → only the landing screen (with the sign-in button).
  if (!session) return <Landing {...shared} />;

  // First run for this user → the one-time science intro.
  if (data && !data.hasSeenIntro) {
    return <Intro {...shared} onContinue={markIntroSeen} />;
  }

  const activeDay = getDay(effectiveData, activeDate);

  return (
    <>
      {screen === "landing" && <Landing {...shared} />}
      {screen === "log" && <LogEntry {...shared} day={activeDay} />}
      {screen === "game" && <DailyGame {...shared} day={activeDay} />}
      {screen === "weekly" && <Weekly {...shared} />}
      {screen === "settings" && <SettingsScreen {...shared} />}
      {syncError && (
        <div className="toast" role="status">
          couldn't save to the cloud — is the database set up? ({syncError})
        </div>
      )}
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
