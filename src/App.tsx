import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppData, DayLog, LearnedFood, Settings } from "./lib/storage";
import { getDay, isStorageBroken, loadData, saveData } from "./lib/storage";
import { computeWeeklyProgress } from "./lib/nutrition";
import { lastNKeys, todayKey } from "./lib/dates";
import Landing from "./screens/Landing";
import LogEntry from "./screens/LogEntry";
import DailyGame from "./screens/DailyGame";
import Weekly from "./screens/Weekly";
import SettingsScreen from "./screens/Settings";

export type ScreenName = "landing" | "log" | "game" | "weekly" | "settings";

export interface ScreenProps {
  data: AppData;
  activeDate: string;
  plantsThisWeek: number;
  go: (screen: ScreenName, date?: string) => void;
  updateDay: (date: string, day: DayLog) => void;
  updateSettings: (settings: Settings) => void;
  addLearned: (food: LearnedFood) => void;
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [screen, setScreen] = useState<ScreenName>("landing");
  const [activeDate, setActiveDate] = useState<string>(() => todayKey());

  // Persist on every change.
  useEffect(() => {
    saveData(data);
  }, [data]);

  const go = useCallback((next: ScreenName, date?: string) => {
    if (date) setActiveDate(date);
    setScreen(next);
  }, []);

  const updateDay = useCallback((date: string, day: DayLog) => {
    setData((prev) => ({ ...prev, days: { ...prev.days, [date]: day } }));
  }, []);

  const updateSettings = useCallback((settings: Settings) => {
    setData((prev) => ({ ...prev, settings }));
  }, []);

  const addLearned = useCallback((food: LearnedFood) => {
    setData((prev) => {
      // replace any existing learned entry with the same alias
      const learned = prev.learned.filter(
        (l) => l.alias.toLowerCase() !== food.alias.toLowerCase()
      );
      learned.push(food);
      return { ...prev, learned };
    });
  }, []);

  // Weekly plant count (rolling 7 days ending today) for the status bar.
  const plantsThisWeek = useMemo(() => {
    const keys = lastNKeys(7);
    const logs = keys.map((k) => data.days[k]);
    return computeWeeklyProgress(logs, keys).plantCount;
  }, [data.days]);

  const shared: ScreenProps = {
    data,
    activeDate,
    plantsThisWeek,
    go,
    updateDay,
    updateSettings,
    addLearned,
  };

  // Make sure a fresh DayLog exists in memory for the active date when logging.
  const activeDay = getDay(data, activeDate);

  return (
    <>
      {screen === "landing" && <Landing {...shared} />}
      {screen === "log" && <LogEntry {...shared} day={activeDay} />}
      {screen === "game" && <DailyGame {...shared} day={activeDay} />}
      {screen === "weekly" && <Weekly {...shared} />}
      {screen === "settings" && <SettingsScreen {...shared} />}
      {isStorageBroken() && (
        <div className="toast" role="status">
          heads up: saving is off (private mode?). your noms stay only for this
          visit.
        </div>
      )}
    </>
  );
}
