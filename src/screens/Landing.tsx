import { useEffect, useState } from "react";
import type { ScreenProps } from "../App";
import Screen from "../components/Screen";
import PixelButton from "../components/PixelButton";
import PixelGirl from "../components/PixelGirl";
import { headerLabel, todayKey } from "../lib/dates";
import { readOAuthError, signInWithGoogle } from "../lib/supabase";

export default function Landing({
  data,
  plantsThisWeek,
  authed,
  userEmail,
  signOut,
  go,
}: ScreenProps) {
  const today = todayKey();
  const [authError, setAuthError] = useState<string | null>(null);

  // Show any error the OAuth provider bounced back with in the URL.
  useEffect(() => {
    setAuthError(readOAuthError());
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    const err = await signInWithGoogle();
    if (err) setAuthError(err);
  };

  return (
    <Screen
      plantsThisWeek={plantsThisWeek}
      plantTarget={data.settings.weeklyPlantTarget}
      statusRight={<span className="text-sm">{headerLabel(today)}</span>}
    >
      <div className="stack stack-3 text-center" style={{ flex: 1 }}>
        <div className="spacer" />

        <p className="text-sm">welcome to...</p>
        <h1 className="title-lg">YUMSHI</h1>

        <div className="row" style={{ justifyContent: "center", margin: "6px 0" }}>
          <PixelGirl scale={8} bob />
        </div>

        <p className="text" style={{ letterSpacing: 1 }}>
          {headerLabel(today)}
        </p>

        {authed ? (
          <>
            <p className="text-sm muted">
              {plantsThisWeek >= data.settings.weeklyPlantTarget
                ? "30+ plants — you're thriving!"
                : `${plantsThisWeek}/${data.settings.weeklyPlantTarget} plants this week`}
            </p>

            <div className="spacer" />

            <div className="stack stack-2">
              <PixelButton variant="primary" block onClick={() => go("log", today)}>
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

            <p className="text-sm muted" style={{ wordBreak: "break-all" }}>
              {userEmail}
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <PixelButton small variant="ghost" onClick={signOut}>
                sign out
              </PixelButton>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm muted" style={{ lineHeight: 1.8 }}>
              eat 30+ plants a week, one happy bite at a time. sign in to grow
              your garden on any device.
            </p>

            <div className="spacer" />

            <div className="stack stack-2">
              <PixelButton variant="primary" block onClick={() => void handleSignIn()}>
                sign in with google
              </PixelButton>
              <p className="text-sm muted">your noms sync everywhere you log in.</p>
              {authError && (
                <div className="panel panel--inset stack stack-2">
                  <p className="text-sm">couldn't sign in:</p>
                  <p className="text-sm muted" style={{ lineHeight: 1.7 }}>
                    {authError}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="spacer" />
      </div>
    </Screen>
  );
}
