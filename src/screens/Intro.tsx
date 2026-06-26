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
            A huge study of over 10,000 people (the American Gut Project) found
            that people eating <b>30+ different plants a week</b> had the most
            diverse gut microbiomes — far more than people eating 10 or fewer.
          </p>
          <p className="text-sm" style={{ lineHeight: 1.9 }}>
            A more diverse gut is <b>linked to</b> better digestion, a stronger
            immune system, lower inflammation, and even better mood.
          </p>
          <p className="text-sm" style={{ lineHeight: 1.9 }}>
            The best part: it counts for everyone, whether or not you eat meat.
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
