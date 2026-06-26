import { useEffect, useRef } from "react";
import { ICONS, PALETTE, drawMatrix, drawOutline } from "../lib/sprites";

interface Props {
  icon: string; // sprite key
  filled: boolean; // filled (eaten/covered) vs hollow outline
  scale?: number;
  title?: string;
}

// A tiny 8x8 pixel food icon: solid when the group is covered, outline when
// it's quiet. Never a "fail" — just filled vs waiting.
export default function PixelIcon({ icon, filled, scale = 3, title }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const m = ICONS[icon] ?? ICONS.leaf;
  const size = 8 * scale;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (filled) drawMatrix(ctx, m, 0, 0, scale, PALETTE.dark);
    else drawOutline(ctx, m, 0, 0, scale, PALETTE.mid);
  }, [icon, filled, scale, m]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      title={title}
    />
  );
}
