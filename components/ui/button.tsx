import type { ReactNode, MouseEventHandler } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "default";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

const sizeStyles: Record<"sm" | "default", string> = {
  sm: "px-5 py-2.5 text-sm",
  default: "px-7 py-4 text-xl",
};

const variantStyles: Record<"primary" | "secondary", string> = {
  primary: "bg-accent-500 text-neutral-950 hover:bg-accent-400 shadow-sm hover:shadow-md",
  secondary:
    "border border-primary-300/40 bg-primary-500/10 text-primary-100 hover:border-primary-300/60 hover:bg-primary-500/20",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "default",
  className = "",
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  const disabledStyles = disabled ? "opacity-60 cursor-not-allowed" : "";
  const classes = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick as MouseEventHandler<HTMLAnchorElement>}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} disabled={disabled} onClick={onClick as MouseEventHandler<HTMLButtonElement>}>
      {children}
    </button>
  );
}
