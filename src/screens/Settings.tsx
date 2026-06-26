import { useState } from "react";
import type { ScreenProps } from "../App";
import { CALORIE_MAX, CALORIE_MIN } from "../data/targets";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

export default function SettingsScreen({
  data,
  plantsThisWeek,
  userEmail,
  signOut,
  go,
  updateSettings,
}: ScreenProps) {
  const [calorieGoal, setCalorieGoal] = useState(data.settings.calorieGoal);
  const [waterTarget, setWaterTarget] = useState(data.settings.waterTarget);
  const [weeklyPlantTarget, setWeeklyPlantTarget] = useState(
    data.settings.weeklyPlantTarget
  );

  // persist immediately on each change
  const persist = (patch: Partial<typeof data.settings>) => {
    const next = { calorieGoal, waterTarget, weeklyPlantTarget, ...patch };
    updateSettings(next);
  };

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={weeklyPlantTarget}
      statusRight={<span className="text-sm">options</span>}
    >
      <div className="stack stack-4" style={{ flex: 1 }}>
        <h2 className="title-md">options</h2>

        <div className="stack stack-2">
          <label className="text">calorie goal</label>
          <p className="text-sm muted">a soft reference, never a ceiling.</p>
          <input
            className="pixel-input"
            type="range"
            min={CALORIE_MIN}
            max={CALORIE_MAX}
            step={50}
            value={calorieGoal}
            onChange={(e) => {
              const v = Number(e.target.value);
              setCalorieGoal(v);
              persist({ calorieGoal: v });
            }}
          />
          <p className="text text-center">{calorieGoal} kcal</p>
        </div>

        <div className="stack stack-2">
          <label className="text">water target (glasses)</label>
          <div className="row gap-2">
            <PixelButton
              small
              onClick={() => {
                const v = Math.max(1, waterTarget - 1);
                setWaterTarget(v);
                persist({ waterTarget: v });
              }}
            >
              −
            </PixelButton>
            <span className="text" style={{ minWidth: 30, textAlign: "center" }}>
              {waterTarget}
            </span>
            <PixelButton
              small
              onClick={() => {
                const v = Math.min(15, waterTarget + 1);
                setWaterTarget(v);
                persist({ waterTarget: v });
              }}
            >
              +
            </PixelButton>
          </div>
        </div>

        <div className="stack stack-2">
          <label className="text">weekly plant target</label>
          <div className="row gap-2">
            <PixelButton
              small
              onClick={() => {
                const v = Math.max(5, weeklyPlantTarget - 1);
                setWeeklyPlantTarget(v);
                persist({ weeklyPlantTarget: v });
              }}
            >
              −
            </PixelButton>
            <span className="text" style={{ minWidth: 30, textAlign: "center" }}>
              {weeklyPlantTarget}
            </span>
            <PixelButton
              small
              onClick={() => {
                const v = Math.min(60, weeklyPlantTarget + 1);
                setWeeklyPlantTarget(v);
                persist({ weeklyPlantTarget: v });
              }}
            >
              +
            </PixelButton>
          </div>
          <p className="text-sm muted">30 is the classic goal. herbs count!</p>
        </div>

        <div className="spacer" />

        <p className="text-sm muted" style={{ lineHeight: 1.9 }}>
          targets are based on the daily dozen + plant-based guidance. general
          guidance, not medical advice.
        </p>

        <div className="stack stack-2">
          <label className="text">account</label>
          {userEmail && (
            <p className="text-sm muted" style={{ wordBreak: "break-all" }}>
              signed in as {userEmail}
            </p>
          )}
          <PixelButton variant="ghost" block onClick={signOut}>
            sign out
          </PixelButton>
        </div>

        <PixelButton variant="ghost" block onClick={() => go("landing")}>
          back home
        </PixelButton>
      </div>
    </Screen>
  );
}
