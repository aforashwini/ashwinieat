import { useMemo } from "react";
import type { ScreenProps } from "../App";
import { computeWeeklyProgress, heatLevel } from "../lib/nutrition";
import { lastNKeys, shortDay } from "../lib/dates";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

export default function Weekly({ data, plantsThisWeek, go }: ScreenProps) {
  const target = data.settings.weeklyPlantTarget;

  const weekly = useMemo(() => {
    const keys = lastNKeys(7);
    const logs = keys.map((k) => data.days[k]);
    return computeWeeklyProgress(logs, keys);
  }, [data.days]);

  const count = weekly.plantCount;
  const pct = Math.min(100, Math.round((count / target) * 100));
  const remaining = Math.max(0, target - count);

  const encouragement =
    count >= target
      ? "30+ plants — you're absolutely thriving! 🌱"
      : remaining <= 3
        ? `so close! just ${remaining} more plant${remaining === 1 ? "" : "s"} to hit ${target}!`
        : remaining <= 10
          ? `nice variety! ${remaining} more plants to reach ${target}.`
          : `${remaining} plants to go — mix it up with herbs & berries!`;

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={target}
      statusRight={<span className="text-sm">7-day</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <h2 className="title-md">this week's garden</h2>

        <div className="panel stack stack-2 text-center">
          <p className="text-sm muted">plants this week</p>
          <p className="title-lg">
            {count} / {target}
          </p>
          <div className="pbar">
            <div className="pbar__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm">{encouragement}</p>
        </div>

        {/* 7-day heatmap */}
        <div className="stack stack-2">
          <p className="text-sm muted">categories hit each day</p>
          <div className="heatmap">
            {weekly.days.map((d) => {
              const lvl = heatLevel(d.categoriesMet, d.totalCategories);
              return (
                <div className="heat-col" key={d.date}>
                  <div
                    className={`heat-cell heat-${lvl}`}
                    onClick={() => go("log", d.date)}
                    role="button"
                    title={`${d.categoriesMet}/${d.totalCategories} categories — tap to amend`}
                  >
                    {d.hasData ? d.categoriesMet : ""}
                  </div>
                  <span className="heat-label">{shortDay(d.date)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm muted text-center">tap a day to amend it</p>
        </div>

        {/* plant list */}
        {count > 0 && (
          <div className="panel panel--inset">
            <p className="text-sm muted" style={{ marginBottom: 6 }}>
              you've eaten:
            </p>
            <p className="text-sm" style={{ lineHeight: 2 }}>
              {Array.from(weekly.plants)
                .map((p) => p)
                .join(" · ")}
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
