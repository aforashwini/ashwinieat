import { useEffect, useMemo, useRef, useState } from "react";
import type { ScreenProps } from "../App";
import type { DayLog } from "../lib/storage";
import {
  computeDayStats,
  dailyNudges,
  dailyWins,
} from "../lib/nutrition";
import { ALL_CATEGORIES, CATEGORY_META, categoryIcon } from "../data/categories";
import { headerLabel } from "../lib/dates";
import { GIRL_HEAD, ICONS, PALETTE, drawMatrix, type Matrix } from "../lib/sprites";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";
import PixelIcon from "../components/PixelIcon";

interface Props extends ScreenProps {
  day: DayLog;
}

interface Waypoint {
  x: number;
  y: number;
  icon: Matrix;
}

const CELL = 12;
const MARGIN = 5;
const ICON = 8;
const COLS = 7;
const SPEED = 7; // cells per second

export default function DailyGame({
  data,
  activeDate,
  plantsThisWeek,
  go,
  updateDay,
  day,
}: Props) {
  const stats = useMemo(() => computeDayStats(day), [day]);

  // One icon per unique plant eaten today, by its category.
  const plantCells = useMemo(() => {
    const cells: { name: string; icon: string }[] = [];
    const seen = new Set<string>();
    for (const e of day.entries) {
      for (const p of e.plants) {
        const key = p.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cells.push({ name: p.name, icon: categoryIcon(p.category) });
      }
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // Stable signature so the animation only (re)runs when the plant set changes
  // — NOT when supplement toggles change the day object.
  const boardKey = useMemo(
    () => `${activeDate}|${plantCells.map((c) => c.name).join(",")}`,
    [activeDate, plantCells]
  );

  // Serpentine board geometry.
  const board = useMemo(() => {
    const waypoints: Waypoint[] = [];
    plantCells.forEach((cell, i) => {
      const rowIdx = Math.floor(i / COLS);
      let col = i % COLS;
      if (rowIdx % 2 === 1) col = COLS - 1 - col; // snake back the other way
      waypoints.push({
        x: MARGIN + col * CELL,
        y: MARGIN + rowIdx * CELL,
        icon: ICONS[cell.icon] ?? ICONS.leaf,
      });
    });
    const usedCols = Math.min(plantCells.length, COLS);
    const rows = Math.max(1, Math.ceil(plantCells.length / COLS));
    const vw = MARGIN * 2 + Math.max(1, usedCols) * CELL;
    const vh = MARGIN * 2 + rows * CELL;
    return { waypoints, vw, vh };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardKey]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finished, setFinished] = useState(plantCells.length === 0);

  const pRef = useRef(-1);
  const processedRef = useRef(0);
  const eatenRef = useRef<Set<number>>(new Set());
  const munchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);

  const skip = () => {
    pRef.current = board.waypoints.length - 1;
  };

  useEffect(() => {
    if (board.waypoints.length === 0) {
      setFinished(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    pRef.current = -1;
    processedRef.current = 0;
    eatenRef.current = new Set();
    munchRef.current = null;
    doneRef.current = false;
    setFinished(false);

    const wps = board.waypoints;
    let last = performance.now();

    const headCenter = () => {
      const p = pRef.current;
      if (p < 0) {
        const f = p + 1;
        const b = wps[0];
        const ax = b.x - CELL;
        return { cx: ax + (b.x - ax) * f + ICON / 2, cy: b.y + ICON / 2 };
      }
      const i0 = Math.min(Math.floor(p), wps.length - 1);
      const i1 = Math.min(i0 + 1, wps.length - 1);
      const f = p - i0;
      const a = wps[i0];
      const b = wps[i1];
      return { cx: lerp(a.x, b.x, f) + ICON / 2, cy: lerp(a.y, b.y, f) + ICON / 2 };
    };

    const draw = () => {
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      wps.forEach((w, idx) => {
        if (!eatenRef.current.has(idx)) {
          drawMatrix(ctx, w.icon, w.x, w.y, 1, PALETTE.dark);
        }
      });

      // tail behind the head
      const i0 = Math.max(0, Math.min(Math.floor(pRef.current), wps.length - 1));
      for (let k = 1; k <= 3; k++) {
        const idx = i0 - k;
        if (idx < 0) break;
        const w = wps[idx];
        ctx.fillStyle = PALETTE.mid;
        ctx.fillRect(w.x + 1, w.y + 1, ICON - 2, ICON - 2);
        ctx.fillStyle = PALETTE.dark;
        ctx.fillRect(w.x + 2, w.y + 2, ICON - 4, ICON - 4);
      }

      const { cx, cy } = headCenter();
      drawMatrix(ctx, GIRL_HEAD, Math.round(cx - ICON / 2), Math.round(cy - ICON / 2), 1, PALETTE.dark);

      const m = munchRef.current;
      if (m && performance.now() - m.t < 220) {
        const age = (performance.now() - m.t) / 220;
        const r = Math.round(2 + age * 4);
        ctx.fillStyle = PALETTE.dark;
        ctx.fillRect(m.x - r, m.y, 2, 2);
        ctx.fillRect(m.x + r, m.y, 2, 2);
        ctx.fillRect(m.x, m.y - r, 2, 2);
        ctx.fillRect(m.x, m.y + r, 2, 2);
      }
    };

    const tick = (ts: number) => {
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      if (!doneRef.current) {
        pRef.current += SPEED * dt;
        const end = wps.length - 1;
        if (pRef.current >= end) pRef.current = end;

        while (processedRef.current <= Math.floor(pRef.current) && processedRef.current < wps.length) {
          const idx = processedRef.current;
          const w = wps[idx];
          eatenRef.current.add(idx);
          munchRef.current = { x: w.x + ICON / 2, y: w.y + ICON / 2, t: performance.now() };
          processedRef.current += 1;
        }

        if (pRef.current >= end && processedRef.current >= wps.length) {
          doneRef.current = true;
        }
      }

      draw();

      if (doneRef.current) {
        window.setTimeout(() => setFinished(true), 350);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [board, boardKey]);

  // ---- supplement toggles (NEVER trigger the animation) ----
  const enabledSupps = data.supplements.filter((s) => s.enabled);
  const toggleSupp = (id: string) => {
    const next: DayLog = {
      ...day,
      supplementsTaken: { ...day.supplementsTaken, [id]: !day.supplementsTaken[id] },
    };
    updateDay(activeDate, next);
  };

  const wins = dailyWins(stats);
  const nudges = dailyNudges(stats);
  const headline = pickHeadline(stats.plantCount);

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(activeDate)}</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="title-md">{finished ? "your feast!" : "munching…"}</h2>
          {!finished && plantCells.length > 0 && (
            <PixelButton small variant="ghost" onClick={skip}>
              skip »
            </PixelButton>
          )}
        </div>

        {plantCells.length > 0 && (
          <canvas
            ref={canvasRef}
            width={board.vw}
            height={board.vh}
            className="game-canvas"
            style={{ maxHeight: 220, objectFit: "contain" }}
          />
        )}

        {finished && (
          <div className="stack stack-3">
            <p className="text text-center">{headline}</p>

            {/* plant list */}
            {stats.plantCount > 0 ? (
              <div className="panel stack stack-2">
                <p className="text">
                  <b>{stats.plantCount}</b> different plant{stats.plantCount === 1 ? "" : "s"} today
                  {stats.pointsToday !== stats.plantCount && (
                    <span className="muted"> · {round1(stats.pointsToday)} pts</span>
                  )}
                </p>
                <div className="chips">
                  {stats.uniquePlants.map((p) => (
                    <span key={p} className="chip chip--static">{p}</span>
                  ))}
                </div>
                <p className="text-sm muted">
                  week so far: {plantsThisWeek}/{data.settings.weeklyPlantTarget} plant points
                </p>
              </div>
            ) : (
              <p className="text-sm text-center muted">
                no plants logged this time — that's okay! every day is a fresh start. 🌱
              </p>
            )}

            {/* category coverage (filled vs quiet, never failing) */}
            <div className="panel panel--inset stack stack-2">
              <p className="text-sm muted">groups you touched today</p>
              <div className="cov-grid">
                {ALL_CATEGORIES.map((c) => (
                  <div className="cov-cell" key={c} title={CATEGORY_META[c].label}>
                    <PixelIcon
                      icon={categoryIcon(c)}
                      filled={stats.categoriesTouched.has(c)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* wins + gentle nudges */}
            {(wins.length > 0 || nudges.length > 0) && (
              <div className="panel stack stack-2">
                {wins.slice(0, 2).map((w, i) => (
                  <p key={`w${i}`} className="text-sm">✓ {w}</p>
                ))}
                {nudges.map((n, i) => (
                  <p key={`n${i}`} className="text-sm muted">→ {n}</p>
                ))}
              </div>
            )}

            {/* soul food acknowledgement */}
            {stats.soulNotes.map((note, i) => (
              <p key={`s${i}`} className="text-sm text-center">{note}</p>
            ))}

            {/* supplements — toggles never animate */}
            <div className="panel stack stack-2">
              <p className="text-sm muted">today's supplements</p>
              {enabledSupps.length === 0 ? (
                <p className="text-sm muted">
                  none picked yet — choose any you like in options.
                </p>
              ) : (
                enabledSupps.map((s) => (
                  <div
                    key={s.id}
                    className="check-row"
                    onClick={() => toggleSupp(s.id)}
                    role="checkbox"
                    aria-checked={!!day.supplementsTaken[s.id]}
                  >
                    <span className={`check-box ${day.supplementsTaken[s.id] ? "is-on" : ""}`}>
                      {day.supplementsTaken[s.id] ? "✓" : ""}
                    </span>
                    <span>{s.label}</span>
                  </div>
                ))
              )}
            </div>

            <div className="stack stack-2">
              <div className="row gap-2">
                <PixelButton block onClick={() => go("weekly")}>
                  see weekly
                </PixelButton>
                <PixelButton block onClick={() => go("log", activeDate)}>
                  add more
                </PixelButton>
              </div>
              <PixelButton small variant="ghost" onClick={() => go("landing")}>
                home
              </PixelButton>
            </div>

            <p className="text-sm muted text-center" style={{ lineHeight: 1.7 }}>
              general wellbeing guidance, not medical advice.
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pickHeadline(plants: number): string {
  if (plants === 0) return "logged! tap add more whenever you eat. 🌱";
  if (plants >= 10) return "WOW — what a colourful day! 🌈";
  if (plants >= 6) return "great munching today! lovely variety.";
  if (plants >= 3) return "nice noms! your plants are adding up.";
  return "good start — every plant is a win!";
}
