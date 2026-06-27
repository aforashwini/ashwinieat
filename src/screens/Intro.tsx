import type { ScreenProps } from "../App";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";
import PixelGirl from "../components/PixelGirl";

interface Props extends ScreenProps {
  onContinue: () => void;
}

// First-run science intro — shown once per user (hasSeenIntro).
export default function Intro({ plantsThisWeek, data, onContinue }: Props) {
  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">hello!</span>}
    >
      <div className="stack stack-3" style={{ flex: 1 }}>
        <div className="row" style={{ justifyContent: "center" }}>
          <PixelGirl scale={6} bob />
        </div>

        <h2 className="title-md text-center">why 30 plants a week?</h2>

        <div className="panel stack stack-2">
          <p className="text-sm" style={{ lineHeight: 1.9 }}>
            Eating <b>30+ different plants a week</b> is linked to a healthier,
            more diverse gut — which supports digestion, immunity, and overall
            long-term health.
          </p>
          <p className="text-sm" style={{ lineHeight: 1.9 }}>
            Yumshi isn't about restriction or what else is on your plate. It
            counts for everyone — it's simply about eating <b>enough good plant
            food</b> to feel great for years to come.
          </p>
          <p className="text-sm" style={{ lineHeight: 1.9 }}>
            It's about <b>variety, not perfection</b>. Every new plant is a win.
          </p>
        </div>

        <p className="text-sm muted text-center" style={{ lineHeight: 1.8 }}>
          herbs, spices, tea & coffee count as quarter-plants — they add up!
        </p>

        <div className="spacer" />

        <PixelButton variant="primary" block onClick={onContinue}>
          let's get munching!
        </PixelButton>

        <p className="text-sm muted text-center" style={{ lineHeight: 1.7 }}>
          general wellbeing guidance, not medical advice.
        </p>
      </div>
    </Screen>
  );
}
