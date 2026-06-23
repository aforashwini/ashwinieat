import type { ScreenProps } from "../App";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";
import PixelGirl from "../components/PixelGirl";
import { headerLabel, todayKey } from "../lib/dates";

export default function Landing({ data, plantsThisWeek, go }: ScreenProps) {
  const today = todayKey();

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(today)}</span>}
    >
      <div className="stack stack-3 text-center" style={{ flex: 1 }}>
        <div className="spacer" />

        <p className="text-sm">welcome to...</p>
        <h1 className="title-lg">ASHWINIEAT</h1>

        <div className="row" style={{ justifyContent: "center", margin: "6px 0" }}>
          <PixelGirl scale={8} bob />
        </div>

        <p className="text" style={{ letterSpacing: 1 }}>
          {headerLabel(today)}
        </p>
        <p className="text-sm muted">
          {plantsThisWeek >= data.settings.weeklyPlantTarget
            ? "30+ plants — you're thriving!"
            : `${plantsThisWeek}/${data.settings.weeklyPlantTarget} plants this week`}
        </p>

        <div className="spacer" />

        <div className="stack stack-2">
          <PixelButton
            variant="primary"
            block
            onClick={() => go("log", today)}
          >
            enter today's nom noms
          </PixelButton>
          <div className="row gap-2" style={{ justifyContent: "center" }}>
            <PixelButton small variant="ghost" onClick={() => go("weekly")}>
              this week
            </PixelButton>
            <PixelButton small variant="ghost" onClick={() => go("settings")}>
              options
            </PixelButton>
          </div>
        </div>

        <div className="spacer" />
      </div>
    </Screen>
  );
}
