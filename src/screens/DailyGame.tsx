import { useEffect, useMemo, useRef, useState } from "react";
import type { ScreenProps } from "../App";
import type { DayLog, Supplements } from "../lib/storage";
import { computeDayProgress } from "../lib/nutrition";
import { TARGETS } from "../data/targets";
import { headerLabel } from "../lib/dates";
import {
  GIRL_HEAD,
  ICONS,
  PALETTE,
  drawMatrix,
  drawOutline,
  type Matrix,
} from "../lib/sprites";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

interface Props extends ScreenProps {
  day: DayLog;
}

type SlotKind = "fill" | "bonus" | "miss";
interface Waypoint {
  x: number; // icon top-left (virtual px)
  y: number;
  kind: SlotKind;
  icon: Matrix;
}

const CELL = 12;
const MARGIN = 5;
const ICON = 8;
const MAX_BONUS = 3;
const SPEED = 6; // cells per second

export default function DailyGame({
  data,
  activeDate,
  plantsThisWeek,
  go,
  updateDay,
  day,
}: Props) {
  const progress = useMemo(() => computeDayProgress(day), [day]);

  // Build the serpentine board: one lane per category, icons across.
  const board = useMemo(() => {
    const waypoints: Waypoint[] = [];
    let maxSlots = 0;

    TARGETS.forEach((t, lane) => {
      const cp = progress.byCategory[t.category];
      const eaten = Math.round(cp.servings);
      const filled = Math.min(eaten, t.target);
      const bonus = Math.min(Math.max(0, eaten - t.target), MAX_BONUS);
      const slots = t.target + bonus;
      maxSlots = Math.max(maxSlots, slots);
      const icon = ICONS[t.icon] ?? ICONS.bean;
      const y = MARGIN + lane * CELL;
      for (let j = 0; j < slots; j++) {
        let kind: SlotKind;
        if (j < filled) kind = "fill";
        else if (j < t.target) kind = "miss";
        else kind = "bonus";
        waypoints.push({ x: MARGIN + j * CELL, y, kind, icon });
      }
    });

    const vw = MARGIN * 2 + maxSlots * CELL;
    const vh = MARGIN * 2 + TARGETS.length * CELL;
    const start = { x: MARGIN - CELL, y: MARGIN };
    return { waypoints, vw, vh, start };
  }, [progress]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finished, setFinished] = useState(false);

  // animation refs
  const pRef = useRef(-1);
  const processedRef = useRef(0);
  const eatenRef = useRef<Set<number>>(new Set());
  const tailRef = useRef(0);
  const munchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);

  const totalFill = useMemo(
    () => board.waypoints.filter((w) => w.kind !== "miss").length,
    [board]
  );

  const skip = () => {
    pRef.current = board.waypoints.length - 1;
  };

  // Run the eating animation.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    // reset state
    pRef.current = -1;
    processedRef.current = 0;
    eatenRef.current = new Set();
    tailRef.current = 0;
    munchRef.current = null;
    doneRef.current = false;
    setFinished(false);

    const wps = board.waypoints;
    let last = performance.now();

    const headCenter = () => {
      const p = pRef.current;
      if (wps.length === 0) return { cx: board.start.x + ICON / 2, cy: board.start.y + ICON / 2, hop: 0 };
      if (p < 0) {
        const f = p + 1; // 0..1 sliding in
        const a = board.start;
        const b = wps[0];
        return {
          cx: lerp(a.x, b.x, f) + ICON / 2,
          cy: lerp(a.y, b.y, f) + ICON / 2,
          hop: 0,
        };
      }
      const i0 = Math.min(Math.floor(p), wps.length - 1);
      const i1 = Math.min(i0 + 1, wps.length - 1);
      const f = p - i0;
      const a = wps[i0];
      const b = wps[i1];
      // hop arc when approaching a missed icon
      const hop = b.kind === "miss" && i1 !== i0 ? Math.sin(f * Math.PI) * 7 : 0;
      return { cx: lerp(a.x, b.x, f) + ICON / 2, cy: lerp(a.y, b.y, f) + ICON / 2, hop };
    };

    const draw = () => {
      // background
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // slots
      wps.forEach((w, idx) => {
        if (w.kind === "miss") {
          drawOutline(ctx, w.icon, w.x, w.y, 1, PALETTE.mid);
        } else if (!eatenRef.current.has(idx)) {
          drawMatrix(ctx, w.icon, w.x, w.y, 1, w.kind === "bonus" ? PALETTE.mid : PALETTE.dark);
        }
      });

      // tail (trailing body squares along visited waypoints)
      const i0 = Math.max(0, Math.min(Math.floor(pRef.current), wps.length - 1));
      const tail = tailRef.current;
      for (let k = 1; k <= tail; k++) {
        const idx = i0 - k;
        if (idx < 0) break;
        const w = wps[idx];
        ctx.fillStyle = PALETTE.mid;
        ctx.fillRect(w.x + 1, w.y + 1, ICON - 2, ICON - 2);
        ctx.fillStyle = PALETTE.dark;
        ctx.fillRect(w.x + 2, w.y + 2, ICON - 4, ICON - 4);
      }

      // head
      const { cx, cy, hop } = headCenter();
      drawMatrix(ctx, GIRL_HEAD, Math.round(cx - ICON / 2), Math.round(cy - ICON / 2 - hop), 1, PALETTE.dark);

      // munch sparkle
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

        // process arrivals
        while (processedRef.current <= Math.floor(pRef.current) && processedRef.current < wps.length) {
          const idx = processedRef.current;
          const w = wps[idx];
          if (w.kind !== "miss") {
            eatenRef.current.add(idx);
            tailRef.current += 1;
            munchRef.current = { x: w.x + ICON / 2, y: w.y + ICON / 2, t: performance.now() };
          }
          processedRef.current += 1;
        }

        if (pRef.current >= end && processedRef.current >= wps.length) {
          doneRef.current = true;
        }
      }

      draw();

      if (doneRef.current) {
        // settle one more frame then show summary
        window.setTimeout(() => setFinished(true), 350);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [board, totalFill, activeDate]);

  // ---- supplement toggles ----
  const setSupp = (key: keyof Supplements) => {
    const next: DayLog = {
      ...day,
      supplements: { ...day.supplements, [key]: !day.supplements[key] },
    };
    updateDay(activeDate, next);
  };

  const plantsToday = progress.plants.size;
  const headline = pickHeadline(progress.categoriesMet, progress.totalCategories, day.foods.length);

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(activeDate)}</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="title-md">{finished ? "your feast!" : "munching…"}</h2>
          {!finished && (
            <PixelButton small variant="ghost" onClick={skip}>
              skip »
            </PixelButton>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={board.vw}
          height={board.vh}
          className="game-canvas"
          style={{ maxHeight: 260, objectFit: "contain" }}
        />

        {day.foods.length === 0 && (
          <p className="text-sm text-center muted">
            nothing logged yet — let's get munching!
          </p>
        )}

        {finished && (
          <div className="stack stack-3">
            <p className="text text-center">{headline}</p>

            {/* category results */}
            <div className="panel panel--inset stack stack-2">
              {TARGETS.map((t) => {
                const cp = progress.byCategory[t.category];
                const eaten = Math.round(cp.servings);
                return (
                  <div className="cat-row" key={t.category}>
                    <span className="cat-row__name">
                      {cp.met ? "✓ " : "· "}
                      {t.label}
                    </span>
                    <span className="cat-row__pips">
                      {Array.from({ length: t.target }).map((_, j) => (
                        <span
                          key={j}
                          className={`pip ${j < Math.min(eaten, t.target) ? "is-filled" : ""}`}
                        />
                      ))}
                      {Array.from({ length: Math.min(Math.max(0, eaten - t.target), MAX_BONUS) }).map(
                        (_, j) => (
                          <span key={`b${j}`} className="pip is-bonus" />
                        )
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* plant variety + calories */}
            <div className="panel stack stack-2">
              <p className="text">
                plants today: <b>{plantsToday}</b>
              </p>
              <p className="text-sm muted">
                week so far: {plantsThisWeek}/{data.settings.weeklyPlantTarget} plants
              </p>
              <hr className="divider" />
              <p className="text-sm">
                ~{progress.kcal} kcal so far{" "}
                <span className="muted">(goal {data.settings.calorieGoal})</span>
              </p>
              {progress.brazilNutCount > 1 && (
                <p className="text-sm muted">
                  psst: 1 brazil nut a day is plenty for selenium 🌰
                </p>
              )}
            </div>

            {/* supplements checklist */}
            <div className="panel stack stack-2">
              <p className="text-sm muted">daily supplements</p>
              <SuppRow label="vitamin d3" on={day.supplements.d3} onClick={() => setSupp("d3")} />
              <SuppRow
                label="omega-3 (algal)"
                on={day.supplements.omega3}
                onClick={() => setSupp("omega3")}
              />
              <SuppRow
                label="vitamin b12"
                on={day.supplements.b12}
                onClick={() => setSupp("b12")}
                note="~50mcg daily — confirm dosing w/ a doctor"
              />
              <SuppRow
                label="brazil nut (1)"
                on={day.supplements.brazilNut}
                onClick={() => setSupp("brazilNut")}
              />
            </div>

            <div className="stack stack-2">
              <div className="row gap-2">
                <PixelButton block onClick={() => go("weekly")}>
                  see weekly
                </PixelButton>
                <PixelButton block onClick={() => go("log", activeDate)}>
                  amend
                </PixelButton>
              </div>
              <PixelButton small variant="ghost" onClick={() => go("landing")}>
                home
              </PixelButton>
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
}

function SuppRow({
  label,
  on,
  onClick,
  note,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  note?: string;
}) {
  return (
    <div>
      <div className="check-row" onClick={onClick} role="checkbox" aria-checked={on}>
        <span className={`check-box ${on ? "is-on" : ""}`}>{on ? "✓" : ""}</span>
        <span>{label}</span>
      </div>
      {note && <p className="text-sm muted" style={{ paddingLeft: 24 }}>{note}</p>}
    </div>
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pickHeadline(met: number, total: number, foodCount: number): string {
  if (foodCount === 0) return "nothing logged yet — tap amend to add noms!";
  if (met >= total) return "WOW. every category filled. legend! 🌟";
  if (met >= total - 2) return "great munching today! so close to a full board!";
  if (met >= total / 2) return "nice noms! a few gaps to fill — you got this.";
  if (met > 0) return "good start! plenty more plants to munch.";
  return "let's get those plants in — every nom counts!";
}
