import { useState } from "react";
import type { ScreenProps } from "../App";
import type { SupplementItem } from "../lib/storage";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";

export default function SettingsScreen({
  data,
  plantsThisWeek,
  userEmail,
  signOut,
  go,
  updateSettings,
  updateSupplements,
}: ScreenProps) {
  const { weeklyPlantTarget, rollingWeek } = data.settings;
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");

  const setTarget = (v: number) =>
    updateSettings({ ...data.settings, weeklyPlantTarget: v });

  const toggleEnabled = (id: string) =>
    updateSupplements(
      data.supplements.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label) return;
    const item: SupplementItem = {
      id: `custom-${Date.now()}`,
      label,
      enabled: true,
      custom: true,
    };
    updateSupplements([...data.supplements, item]);
    setCustomLabel("");
  };

  const removeCustom = (id: string) =>
    updateSupplements(data.supplements.filter((s) => s.id !== id));

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={weeklyPlantTarget}
      statusRight={<span className="text-sm">options</span>}
    >
      <div className="stack stack-4" style={{ flex: 1 }}>
        <h2 className="title-md">options</h2>

        {/* weekly plant target */}
        <div className="stack stack-2">
          <label className="text">weekly plant target</label>
          <div className="row gap-2">
            <PixelButton small onClick={() => setTarget(Math.max(5, weeklyPlantTarget - 1))}>
              −
            </PixelButton>
            <span className="text" style={{ minWidth: 30, textAlign: "center" }}>
              {weeklyPlantTarget}
            </span>
            <PixelButton small onClick={() => setTarget(Math.min(60, weeklyPlantTarget + 1))}>
              +
            </PixelButton>
          </div>
          <p className="text-sm muted">30 is the classic goal. herbs & spices count too!</p>
        </div>

        {/* rolling vs fixed week */}
        <div className="stack stack-2">
          <label className="text">week window</label>
          <div className="row gap-2">
            <PixelButton
              small
              variant={rollingWeek ? "primary" : "ghost"}
              onClick={() => updateSettings({ ...data.settings, rollingWeek: true })}
            >
              rolling 7 days
            </PixelButton>
            <PixelButton
              small
              variant={!rollingWeek ? "primary" : "ghost"}
              onClick={() => updateSettings({ ...data.settings, rollingWeek: false })}
            >
              mon–sun
            </PixelButton>
          </div>
        </div>

        {/* supplement tracker */}
        <div className="stack stack-2">
          <label className="text">nutrients worth a thought</label>
          <p className="text-sm muted" style={{ lineHeight: 1.8 }}>
            pick any you'd like to keep an eye on — only the ones you choose show
            up as daily ticks. nothing's required.
          </p>

          <div className="stack stack-2">
            {data.supplements.map((s) => (
              <div key={s.id} className="stack">
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    className="check-row"
                    onClick={() => toggleEnabled(s.id)}
                    role="checkbox"
                    aria-checked={s.enabled}
                    style={{ flex: 1 }}
                  >
                    <span className={`check-box ${s.enabled ? "is-on" : ""}`}>
                      {s.enabled ? "✓" : ""}
                    </span>
                    <span>{s.label}</span>
                  </div>
                  {s.note && (
                    <button
                      className="icon-btn"
                      title="what's this?"
                      onClick={() => setOpenNote(openNote === s.id ? null : s.id)}
                    >
                      ?
                    </button>
                  )}
                  {s.custom && (
                    <button className="icon-btn" title="remove" onClick={() => removeCustom(s.id)}>
                      ×
                    </button>
                  )}
                </div>
                {s.note && openNote === s.id && (
                  <p className="text-sm muted" style={{ paddingLeft: 24, lineHeight: 1.8 }}>
                    {s.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* add custom */}
          <div className="log-row">
            <input
              className="pixel-input"
              placeholder="add your own (e.g. magnesium)"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
              }}
            />
            <button className="icon-btn" onClick={addCustom} aria-label="add" title="add">
              +
            </button>
          </div>
        </div>

        {/* account */}
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

        <p className="text-sm muted" style={{ lineHeight: 1.9 }}>
          general wellbeing guidance, not medical advice. for B12 in particular,
          it's worth confirming your dose with a doctor.
        </p>

        <PixelButton variant="ghost" block onClick={() => go("landing")}>
          back home
        </PixelButton>
      </div>
    </Screen>
  );
}
