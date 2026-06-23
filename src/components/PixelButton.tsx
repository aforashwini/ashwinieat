import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "ghost";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
}

export default function PixelButton({
  variant = "default",
  small = false,
  block = false,
  className = "",
  children,
  ...rest
}: PixelButtonProps) {
  const classes = [
    "pixel-btn",
    variant === "primary" ? "pixel-btn--primary" : "",
    variant === "ghost" ? "pixel-btn--ghost" : "",
    small ? "pixel-btn--small" : "",
    block ? "pixel-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
