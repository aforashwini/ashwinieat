import { useMemo } from "react";
import type { ScreenProps } from "../App";
import {
  computeWeeklyStats,
  plantHeatLevel,
  suggestNewPlants,
  weeklyHeadline,
} from "../lib/nutrition";
import { lastNKeys, shortDay } from "../lib/dates";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

const BADGE_LABEL: Record<string, string> = {
  none: "",
  bronze: "🥉 bronze (10+)",
  silver: "🥈 silver (20+)",
  gold: "🥇 gold (30+)",
};

export default function Weekly({ data, plantsThisWeek, go }: ScreenProps) {
  const target = data.settings.weeklyPlantTarget;

  const weekly = useMemo(() => {
    const keys = lastNKeys(7);
    const logs = keys.map((k) => data.days[k]);

    // plants seen before this window — to spotlight brand-new ones
    const windowSet = new Set(keys);
    const prior = new Set<string>();
    for (const [date, d] of Object.entries(data.days)) {
      if (windowSet.has(date)) continue;
      for (const e of d.entries) for (const p of e.plants) prior.add(p.name.toLowerCase());
    }
    return computeWeeklyStats(logs, keys, target, prior);
  }, [data.days, target]);

  const pts = weekly.totalPoints;
  const pct = Math.min(100, Math.round((pts / target) * 100));
  const ideas = suggestNewPlants(weekly);

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={target}
      statusRight={<span className="text-sm">7-day</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <h2 className="title-md">this week's garden</h2>

        <div className="panel stack stack-2 text-center">
          <p className="text-sm muted">plant points this week</p>
          <p className="title-lg">
            {round1(pts)} / {target}
          </p>
          <div className="pbar">
            <div className="pbar__fill" style={{ width: `${pct}%` }} />
          </div>
          {weekly.badge !== "none" && (
            <p className="text-sm">{BADGE_LABEL[weekly.badge]}</p>
          )}
          <p className="text-sm">{weeklyHeadline(weekly)}</p>
        </div>

        {/* 7-day plant strip */}
        <div className="stack stack-2">
          <p className="text-sm muted">plants each day</p>
          <div className="heatmap">
            {weekly.days.map((d) => {
              const lvl = plantHeatLevel(d.plantCount);
              return (
                <div className="heat-col" key={d.date}>
                  <div
                    className={`heat-cell heat-${lvl}`}
                    onClick={() => go("log", d.date)}
                    role="button"
                    title={`${d.plantCount} plants — tap to amend`}
                  >
                    {d.hasData ? d.plantCount : ""}
                  </div>
                  <span className="heat-label">{shortDay(d.date)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm muted text-center">tap a day to amend it</p>
        </div>

        {/* brand-new plants this week */}
        {weekly.newPlants.length > 0 && (
          <div className="panel panel--inset">
            <p className="text-sm" style={{ lineHeight: 1.8 }}>
              ✨ new plants you tried this week: {weekly.newPlants.join(", ")}
            </p>
          </div>
        )}

        {/* full variety list */}
        {weekly.plantsList.length > 0 && (
          <div className="panel panel--inset">
            <p className="text-sm muted" style={{ marginBottom: 6 }}>
              your {weekly.plantsList.length} plants this week:
            </p>
            <p className="text-sm" style={{ lineHeight: 2 }}>
              {weekly.plantsList.join(" · ")}
            </p>
          </div>
        )}

        {/* gentle ideas to push past 30 */}
        {ideas.length > 0 && pts < target && (
          <div className="panel stack stack-2">
            <p className="text-sm">
              want to grow your variety? a few easy new ones to try:
            </p>
            <p className="text-sm muted" style={{ lineHeight: 1.9 }}>
              {ideas.join(" · ")}
            </p>
          </div>
        )}

        <div className="spacer" />

        <div className="row gap-2">
          <PixelButton block onClick={() => go("log")}>
            log today
          </PixelButton>
          <PixelButton block variant="ghost" onClick={() => go("landing")}>
            home
          </PixelButton>
        </div>
      </div>
    </Screen>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
