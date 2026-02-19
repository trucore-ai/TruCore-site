import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-xl px-7 py-4 text-xl font-semibold transition-colors";

const variantStyles: Record<"primary" | "secondary", string> = {
  primary: "bg-accent-500 text-neutral-950 hover:bg-accent-400",
  secondary:
    "border border-primary-300/40 bg-primary-500/10 text-primary-100 hover:border-primary-300/70 hover:bg-primary-500/20",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";
  const classes = `${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled}>
      {children}
    </button>
  );
}
