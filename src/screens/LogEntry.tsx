import { useMemo, useState } from "react";
import type { ScreenProps } from "../App";
import type { DayLog, LoggedFood } from "../lib/storage";
import type { Category } from "../data/targets";
import { TARGETS, TARGET_BY_CATEGORY } from "../data/targets";
import type { ServingUnit } from "../data/foodDatabase";
import { findFood, quantityToServings, resolveLogRow } from "../lib/nutrition";
import { headerLabel } from "../lib/dates";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

interface Props extends ScreenProps {
  day: DayLog;
}

interface Row {
  raw: string;
  quantity: string;
}

// Default serving definition when the user assigns a category to an unknown food.
const DEFAULT_UNIT: Record<Category, ServingUnit> = {
  legumes: "halfCup",
  greens: "cup",
  cruciferous: "halfCup",
  otherVeg: "halfCup",
  berries: "halfCup",
  otherFruit: "piece",
  wholeGrains: "halfCup",
  nutsSeeds: "tbsp",
  flax: "tbsp",
  brazilNut: "piece",
  herbsSpices: "tbsp",
  water: "glass",
};

export default function LogEntry({
  data,
  activeDate,
  plantsThisWeek,
  go,
  updateDay,
  addLearned,
  day,
}: Props) {
  const initialRows: Row[] = useMemo(() => {
    const fromDay = day.foods.map((f) => ({ raw: f.raw, quantity: f.quantity }));
    return fromDay.length ? [...fromDay, { raw: "", quantity: "" }] : [{ raw: "", quantity: "" }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate]);

  const [rows, setRows] = useState<Row[]>(initialRows);

  // Unknown-food modal state.
  const [pending, setPending] = useState<Row | null>(null);
  const [queue, setQueue] = useState<Row[]>([]);
  const [resolved, setResolved] = useState<LoggedFood[]>([]);

  const setRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { raw: "", quantity: "" }]);

  const removeRow = (i: number) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  // Finish the resolution once the unknown queue is drained.
  const finalize = (foods: LoggedFood[]) => {
    const newDay: DayLog = { ...day, date: activeDate, foods };
    updateDay(activeDate, newDay);
    go("game", activeDate);
  };

  // Walk through a list of still-unknown rows, prompting one at a time.
  const drainQueue = (remaining: Row[], gathered: LoggedFood[]) => {
    if (remaining.length === 0) {
      finalize(gathered);
      return;
    }
    setResolved(gathered);
    setQueue(remaining.slice(1));
    setPending(remaining[0]);
  };

  const handleDone = () => {
    const filled = rows.filter((r) => r.raw.trim().length > 0);
    const gathered: LoggedFood[] = [];
    const unknowns: Row[] = [];

    for (const r of filled) {
      const res = resolveLogRow(r.raw, r.quantity, data.learned);
      if (res.status === "ok") gathered.push(res.food);
      else unknowns.push(r);
    }

    if (unknowns.length === 0) {
      finalize(gathered);
    } else {
      drainQueue(unknowns, gathered);
    }
  };

  // User picked a category for the pending unknown food.
  const assignCategory = (cat: Category) => {
    if (!pending) return;
    const unit = DEFAULT_UNIT[cat];
    const servingsPerUnit = 1;

    // teach the app for next time
    addLearned({
      alias: pending.raw.trim(),
      category: cat,
      servingUnit: unit,
      servingsPerUnit,
      plant: cat === "water" ? undefined : pending.raw.trim().toLowerCase(),
    });

    const servings = quantityToServings(
      { category: cat, servingUnit: unit, servingsPerUnit },
      pending.quantity
    );
    const food: LoggedFood = {
      raw: pending.raw.trim(),
      quantity: pending.quantity.trim(),
      category: cat,
      servings,
      plant: cat === "water" ? undefined : pending.raw.trim().toLowerCase(),
    };

    const gathered = [...resolved, food];
    setPending(null);
    drainQueue(queue, gathered);
  };

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(activeDate)}</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <h2 className="title-md">what did you nom today?</h2>

        <div className="log-head">
          <span>FOOD</span>
          <span>QTY</span>
          <span />
        </div>

        <div className="stack stack-2">
          {rows.map((row, i) => {
            const def = row.raw.trim() ? findFood(row.raw, data.learned) : null;
            const hint = row.raw.trim()
              ? def
                ? `→ ${TARGET_BY_CATEGORY[def.category].label}`
                : "→ new food (we'll ask)"
              : "";
            return (
              <div key={i} className="stack">
                <div className="log-row">
                  <input
                    className="pixel-input"
                    placeholder="e.g. kale"
                    value={row.raw}
                    onChange={(e) => setRow(i, { raw: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === rows.length - 1) addRow();
                    }}
                  />
                  <input
                    className="pixel-input"
                    placeholder="2 cups"
                    value={row.quantity}
                    onChange={(e) => setRow(i, { quantity: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (i === rows.length - 1) addRow();
                      }
                    }}
                  />
                  <button
                    className="icon-btn"
                    onClick={() => removeRow(i)}
                    aria-label="remove row"
                    title="remove"
                  >
                    ×
                  </button>
                </div>
                <span className="log-hint">{hint}</span>
              </div>
            );
          })}
        </div>

        <PixelButton small variant="ghost" onClick={addRow}>
          + add more
        </PixelButton>

        <div className="spacer" />

        <div className="stack stack-2">
          <PixelButton variant="primary" block onClick={handleDone}>
            done!
          </PixelButton>
          <PixelButton small variant="ghost" onClick={() => go("landing")}>
            back home
          </PixelButton>
        </div>
      </div>

      {pending && (
        <div className="modal-overlay">
          <div className="modal stack stack-3">
            <h3 className="title-md">what kind of food is</h3>
            <p className="text">“{pending.raw}”?</p>
            <p className="text-sm muted">tap a category — we'll remember it.</p>
            <div className="cat-grid">
              {TARGETS.map((t) => (
                <PixelButton
                  key={t.category}
                  small
                  onClick={() => assignCategory(t.category)}
                >
                  {t.label}
                </PixelButton>
              ))}
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
