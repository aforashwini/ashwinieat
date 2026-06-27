import { useMemo, useState } from "react";
import type { ScreenProps } from "../App";
import type { DayLog, LoggedEntry, LoggedPlant } from "../lib/storage";
import type { Category } from "../data/foodDatabase";
import {
  findWholeFood,
  getPoints,
  quantityToServings,
  resolveEntry,
} from "../data/foodDatabase";
import { CATEGORIES, categoryLabel } from "../data/categories";
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

interface Chip {
  name: string;
  category: Category;
  points: number;
  servings: number;
  assumed: boolean;
  fromDish?: string;
}

type DraftKind = "plant" | "dish" | "treat" | "animal" | "refined" | "unknown";

interface Draft {
  id: number;
  kind: DraftKind;
  raw: string;
  title: string;
  chips: Chip[];
  refined: string[];
  animalNote?: string;
  soulNote?: string;
  prompt?: string; // clarifying question for vague dishes
  addText: string; // "add a plant" input buffer
}

let draftSeq = 1;

function soulNoteFor(title: string, qualifying: Chip[]): string {
  if (qualifying.length > 0) {
    const names = qualifying.map((c) => c.name).join(" & ");
    return `${title} — lovely. the ${names} count as plants, and the rest is pure joy. 😊`;
  }
  return `${title}! that one's for the soul. 😊 no notes, enjoy every bite.`;
}

function chipFromComponent(
  name: string,
  category: Category,
  assumed: boolean,
  fromDish?: string,
  servings = 1
): Chip {
  return { name, category, points: getPoints(name, category), servings, assumed, fromDish };
}

// Build a draft card from a single typed row (food + free-text quantity).
function buildDraft(raw: string, quantity: string): Draft {
  const res = resolveEntry(raw);
  const servings = quantityToServings(quantity);
  const base = { id: draftSeq++, raw, chips: [] as Chip[], refined: [] as string[], addText: "" };

  switch (res.type) {
    case "plant":
      return {
        ...base,
        kind: "plant",
        title: res.food.name,
        chips: [chipFromComponent(res.food.name, res.food.category, false, undefined, servings)],
      };
    case "dish": {
      if (res.dish.needsClarify) {
        return {
          ...base,
          kind: "dish",
          title: res.dish.name,
          prompt: res.dish.clarify,
        };
      }
      return {
        ...base,
        kind: "dish",
        title: res.dish.name,
        chips: res.dish.components.map((c) =>
          chipFromComponent(c.name, c.category, true, res.dish.name)
        ),
        refined: res.dish.refined ?? [],
        animalNote: res.dish.animalNote,
      };
    }
    case "treat": {
      const qualifying = (res.treat.qualifying ?? []).map((c) =>
        chipFromComponent(c.name, c.category, true, res.treat.name)
      );
      return {
        ...base,
        kind: "treat",
        title: res.treat.name,
        chips: qualifying,
        soulNote: soulNoteFor(res.treat.name, qualifying),
      };
    }
    case "animal":
      return {
        ...base,
        kind: "animal",
        title: res.name,
        animalNote:
          "Yumshi is all about plant variety, so I won't score this — but it's great you ate! anything plant-y with it? veggies, grains, beans, herbs — pop them in below.",
      };
    case "refined":
      return {
        ...base,
        kind: "refined",
        title: res.name,
        refined: [res.name],
      };
    case "unknown":
    default:
      return { ...base, kind: "unknown", title: res.name };
  }
}

export default function LogEntry({
  data,
  activeDate,
  plantsThisWeek,
  go,
  updateDay,
  addLearned,
  day,
}: Props) {
  const [phase, setPhase] = useState<"input" | "review">("input");
  const [rows, setRows] = useState<Row[]>([{ raw: "", quantity: "" }]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const existingCount = day.entries.length;

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, { raw: "", quantity: "" }]);
  const removeRow = (i: number) =>
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  // input phase hint
  const hintFor = (raw: string): string => {
    if (!raw.trim()) return "";
    const res = resolveEntry(raw);
    switch (res.type) {
      case "plant":
        return `→ ${categoryLabel(res.food.category)}`;
      case "dish":
        return res.dish.needsClarify ? "→ we'll ask what's in it" : "→ dish — we'll show the plants";
      case "treat":
        return "→ a treat for the soul 😊";
      case "animal":
        return "→ we'll count any plant sides";
      case "refined":
        return "→ refined (0 points, still fine!)";
      default:
        return "→ new food — you'll place it";
    }
  };

  const goReview = () => {
    const filled = rows.filter((r) => r.raw.trim());
    if (filled.length === 0) return;
    setDrafts(filled.map((r) => buildDraft(r.raw.trim(), r.quantity)));
    setPhase("review");
  };

  // ---- draft editing ----
  const patchDraft = (id: number, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));

  const removeChip = (id: number, idx: number) =>
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, chips: d.chips.filter((_, i) => i !== idx) } : d
      )
    );

  const addPlantToDraft = (id: number) =>
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const wf = findWholeFood(d.addText.trim().toLowerCase());
        if (!wf) return d; // ignore unrecognized; could become its own row
        if (d.chips.some((c) => c.name === wf.name)) return { ...d, addText: "" };
        return {
          ...d,
          addText: "",
          chips: [...d.chips, chipFromComponent(wf.name, wf.category, false)],
        };
      })
    );

  const removeDraft = (id: number) =>
    setDrafts((prev) => prev.filter((d) => d.id !== id));

  // user placed an unknown food into a category
  const placeUnknown = (id: number, cat: Category) =>
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        addLearned({ alias: d.raw.trim(), category: cat });
        return {
          ...d,
          kind: "plant",
          chips: [chipFromComponent(d.title || d.raw, cat, false)],
        };
      })
    );

  // remove an already-logged entry (supports editing past days)
  const removeExisting = (i: number) => {
    const next: DayLog = {
      ...day,
      entries: day.entries.filter((_, idx) => idx !== i),
    };
    updateDay(activeDate, next);
  };

  const confirmAndMunch = () => {
    const newEntries: LoggedEntry[] = [];
    for (const d of drafts) {
      const plants: LoggedPlant[] = d.chips.map((c) => ({
        name: c.name,
        category: c.category,
        servings: c.servings,
        points: c.points,
        assumed: c.assumed,
        fromDish: c.fromDish,
      }));
      if (d.kind === "animal") {
        newEntries.push({ raw: d.raw, entryType: "animal", plants, animalNote: d.animalNote });
      } else if (d.kind === "refined") {
        newEntries.push({ raw: d.raw, entryType: "refined", plants, refinedNote: d.refined.join(", ") });
      } else if (d.kind === "treat") {
        newEntries.push({ raw: d.raw, entryType: "treat", plants, soulNote: d.soulNote });
      } else if (d.kind === "dish") {
        if (plants.length === 0) continue; // skip an un-answered vague dish
        newEntries.push({ raw: d.raw, entryType: "composite", plants });
      } else if (d.kind === "plant") {
        newEntries.push({ raw: d.raw, entryType: "whole_food", plants });
      }
      // unresolved "unknown" drafts are skipped
    }
    const next: DayLog = { ...day, entries: [...day.entries, ...newEntries] };
    updateDay(activeDate, next);
    go("game", activeDate);
  };

  const hasUnplaced = useMemo(
    () => drafts.some((d) => d.kind === "unknown"),
    [drafts]
  );

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(activeDate)}</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        {phase === "input" ? (
          <>
            <h2 className="title-md">what did you nom?</h2>
            {existingCount > 0 && (
              <p className="text-sm muted">
                already logged today: {existingCount} thing{existingCount === 1 ? "" : "s"} — add more below.
              </p>
            )}

            <div className="log-head">
              <span>FOOD</span>
              <span>QTY</span>
              <span />
            </div>

            <div className="stack stack-2">
              {rows.map((row, i) => (
                <div key={i} className="stack">
                  <div className="log-row log-row--qty">
                    <input
                      className="pixel-input"
                      placeholder="e.g. kale, lentil soup, cake…"
                      value={row.raw}
                      autoFocus={i === rows.length - 1}
                      onChange={(e) => setRow(i, { raw: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && i === rows.length - 1 && row.raw.trim())
                          addRow();
                      }}
                    />
                    <input
                      className="pixel-input"
                      placeholder="1 cup, 2, 10g…"
                      value={row.quantity}
                      onChange={(e) => setRow(i, { quantity: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && i === rows.length - 1 && row.raw.trim())
                          addRow();
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
                  <span className="log-hint">{hintFor(row.raw)}</span>
                </div>
              ))}
            </div>

            <PixelButton small variant="ghost" onClick={addRow}>
              + add another
            </PixelButton>

            <div className="spacer" />

            <div className="stack stack-2">
              <PixelButton variant="primary" block onClick={goReview}>
                next »
              </PixelButton>
              <PixelButton small variant="ghost" onClick={() => go("landing")}>
                back home
              </PixelButton>
            </div>

            {existingCount > 0 && (
              <div className="panel panel--inset stack stack-2">
                <p className="text-sm muted">today's log</p>
                {day.entries.map((e, i) => (
                  <div className="log-row" key={i}>
                    <span className="text-sm">
                      {e.entryType === "treat" ? "🍰 " : e.entryType === "animal" ? "· " : "🌱 "}
                      {e.raw}
                    </span>
                    <button
                      className="icon-btn"
                      onClick={() => removeExisting(i)}
                      aria-label="remove"
                      title="remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="title-md">does this look right?</h2>
            <p className="text-sm muted">tap a plant to remove it, or add what's missing.</p>

            <div className="stack stack-3">
              {drafts.map((d) => (
                <DraftCard
                  key={d.id}
                  draft={d}
                  onRemoveChip={(idx) => removeChip(d.id, idx)}
                  onAddText={(t) => patchDraft(d.id, { addText: t })}
                  onAddPlant={() => addPlantToDraft(d.id)}
                  onRemoveDraft={() => removeDraft(d.id)}
                  onPlace={(cat) => placeUnknown(d.id, cat)}
                />
              ))}
            </div>

            {hasUnplaced && (
              <p className="text-sm muted text-center">
                pick a category for the new foods above, or they'll be skipped.
              </p>
            )}

            <div className="spacer" />

            <div className="stack stack-2">
              <PixelButton variant="primary" block onClick={confirmAndMunch}>
                confirm & munch! »
              </PixelButton>
              <PixelButton small variant="ghost" onClick={() => setPhase("input")}>
                « back to edit
              </PixelButton>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}

function DraftCard({
  draft,
  onRemoveChip,
  onAddText,
  onAddPlant,
  onRemoveDraft,
  onPlace,
}: {
  draft: Draft;
  onRemoveChip: (idx: number) => void;
  onAddText: (t: string) => void;
  onAddPlant: () => void;
  onRemoveDraft: () => void;
  onPlace: (cat: Category) => void;
}) {
  const d = draft;

  // Animal: gentle redirect, no chips to confirm (but allow adding sides).
  if (d.kind === "animal") {
    return (
      <div className="panel stack stack-2 draft-card">
        <div className="draft-card__head">
          <span className="text">{d.title}</span>
          <button className="icon-btn" onClick={onRemoveDraft} title="remove">×</button>
        </div>
        <p className="text-sm muted" style={{ lineHeight: 1.8 }}>{d.animalNote}</p>
        <AddPlant draft={d} onAddText={onAddText} onAddPlant={onAddPlant} />
        <Chips chips={d.chips} onRemove={onRemoveChip} />
      </div>
    );
  }

  if (d.kind === "refined") {
    return (
      <div className="panel stack stack-2 draft-card">
        <div className="draft-card__head">
          <span className="text">{d.title}</span>
          <button className="icon-btn" onClick={onRemoveDraft} title="remove">×</button>
        </div>
        <p className="text-sm muted">refined — 0 plant points, but always welcome on your plate.</p>
      </div>
    );
  }

  if (d.kind === "treat") {
    return (
      <div className="panel stack stack-2 draft-card">
        <div className="draft-card__head">
          <span className="text">🍰 {d.title}</span>
          <button className="icon-btn" onClick={onRemoveDraft} title="remove">×</button>
        </div>
        <p className="text-sm" style={{ lineHeight: 1.8 }}>{d.soulNote}</p>
        {d.chips.length > 0 && (
          <>
            <p className="text-sm muted">counts as plants:</p>
            <Chips chips={d.chips} onRemove={onRemoveChip} />
          </>
        )}
      </div>
    );
  }

  if (d.kind === "unknown") {
    return (
      <div className="panel stack stack-2 draft-card">
        <div className="draft-card__head">
          <span className="text">“{d.title}”</span>
          <button className="icon-btn" onClick={onRemoveDraft} title="remove">×</button>
        </div>
        <p className="text-sm muted">new food! where does it belong? (we'll remember.)</p>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <PixelButton key={c.category} small onClick={() => onPlace(c.category)}>
              {c.label}
            </PixelButton>
          ))}
        </div>
      </div>
    );
  }

  // plant or dish
  return (
    <div className="panel stack stack-2 draft-card">
      <div className="draft-card__head">
        <span className="text">{d.kind === "dish" ? `🍲 ${d.title}` : `🌱 ${d.title}`}</span>
        <button className="icon-btn" onClick={onRemoveDraft} title="remove">×</button>
      </div>

      {d.prompt && d.chips.length === 0 && (
        <p className="text-sm" style={{ lineHeight: 1.8 }}>{d.prompt}</p>
      )}

      {d.kind === "dish" && d.chips.length > 0 && (
        <p className="text-sm muted">we're guessing it had:</p>
      )}

      <Chips chips={d.chips} onRemove={onRemoveChip} />

      <AddPlant draft={d} onAddText={onAddText} onAddPlant={onAddPlant} />

      {d.refined.length > 0 && (
        <p className="text-sm muted">plus {d.refined.join(", ")} (0 points, still tasty)</p>
      )}
      {d.animalNote && (
        <p className="text-sm muted">note: {d.animalNote} — not scored, no worries.</p>
      )}
    </div>
  );
}

function Chips({ chips, onRemove }: { chips: Chip[]; onRemove: (idx: number) => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="chips">
      {chips.map((c, i) => (
        <button key={i} className="chip" onClick={() => onRemove(i)} title="tap to remove">
          {c.name}
          {c.points < 1 ? " ¼" : ""} ×
        </button>
      ))}
    </div>
  );
}

function AddPlant({
  draft,
  onAddText,
  onAddPlant,
}: {
  draft: Draft;
  onAddText: (t: string) => void;
  onAddPlant: () => void;
}) {
  return (
    <div className="log-row">
      <input
        className="pixel-input"
        placeholder="add a plant…"
        value={draft.addText}
        onChange={(e) => onAddText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onAddPlant();
        }}
      />
      <button className="icon-btn" onClick={onAddPlant} aria-label="add" title="add">
        +
      </button>
    </div>
  );
}
