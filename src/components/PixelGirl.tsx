import { useEffect, useRef } from "react";
import { GIRL, PALETTE, drawMatrix, matrixHeight, matrixWidth } from "../lib/sprites";

interface PixelGirlProps {
  scale?: number; // px per pixel-cell
  bob?: boolean; // gentle idle bobbing
  color?: string; // override fill color
}

// The friendly landing-screen sprite, drawn crisply on a canvas.
export default function PixelGirl({ scale = 7, bob = true, color }: PixelGirlProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = matrixWidth(GIRL);
  const h = matrixHeight(GIRL);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(ctx, GIRL, 0, 0, scale, color ?? PALETTE.dark);
  }, [scale, color, w, h]);

  return (
    <canvas
      ref={ref}
      width={w * scale}
      height={h * scale}
      className={`pixel-girl ${bob ? "pixel-girl--bob" : ""}`}
      style={{ width: w * scale, height: h * scale }}
      aria-label="pixel girl"
      role="img"
    />
  );
}
