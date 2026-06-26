import type { ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  // Weekly plant count shown in the status bar (instead of signal bars).
  plantsThisWeek?: number;
  plantTarget?: number;
  // Optional right-side status text (e.g. the date).
  statusRight?: ReactNode;
}

// The green LCD "phone screen" inside a dark handheld bezel.
export default function Screen({
  children,
  plantsThisWeek,
  plantTarget = 30,
  statusRight,
}: ScreenProps) {
  return (
    <div className="app-shell">
      <div className="handheld">
        <p className="handheld__brand">YUMSHI&nbsp;·&nbsp;handheld</p>
        <div className="screen">
          <div className="statusbar">
            <div className="statusbar__left">
              <span className="statusbar__plant" title="plants this week">
                <PlantPip />
                <span>
                  {plantsThisWeek ?? 0}/{plantTarget}
                </span>
              </span>
            </div>
            <div className="statusbar__right">
              {statusRight ?? <BatteryPip />}
            </div>
          </div>
          <div className="screen__body">{children}</div>
        </div>
      </div>
    </div>
  );
}

// A tiny plant glyph for the status bar.
function PlantPip() {
  return (
    <svg width="10" height="10" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden>
      <rect x="3" y="4" width="2" height="4" fill="var(--lcd-dark)" />
      <rect x="1" y="2" width="2" height="2" fill="var(--lcd-mid)" />
      <rect x="5" y="2" width="2" height="2" fill="var(--lcd-mid)" />
      <rect x="3" y="1" width="2" height="3" fill="var(--lcd-dark)" />
    </svg>
  );
}

function BatteryPip() {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" shapeRendering="crispEdges" aria-hidden>
      <rect x="0" y="1" width="15" height="8" fill="none" stroke="var(--lcd-dark)" strokeWidth="1" />
      <rect x="15" y="3" width="2" height="4" fill="var(--lcd-dark)" />
      <rect x="2" y="3" width="9" height="4" fill="var(--lcd-dark)" />
    </svg>
  );
}
