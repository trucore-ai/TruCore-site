import { type ComponentPropsWithoutRef, forwardRef } from "react";

type Variant = "primary" | "secondary";
type Size = "sm" | "default";

type SharedProps = {
  variant?: Variant;
  size?: Size;
};

type AnchorProps = SharedProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof SharedProps> & { href: string };

type NativeButtonProps = SharedProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof SharedProps> & { href?: undefined };

export type ButtonProps = AnchorProps | NativeButtonProps;

const baseStyles =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950";

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  default: "px-4 py-2 text-sm",
};

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent-500 text-neutral-950 shadow-sm hover:bg-accent-400 hover:shadow-md",
  secondary:
    "border border-primary-300/40 bg-primary-500/10 text-primary-100 shadow-sm hover:border-primary-300/60 hover:bg-primary-500/20 hover:shadow-md",
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ variant = "primary", size = "default", className = "", ...rest }, ref) {
    const classes =
      `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

    if (rest.href !== undefined) {
      const { href, ...anchorRest } = rest as Omit<AnchorProps, keyof SharedProps | "className">;
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={classes} {...anchorRest}>
          {rest.children}
        </a>
      );
    }

    const { type = "button", ...btnRest } = rest as Omit<NativeButtonProps, keyof SharedProps | "className">;
    return (
      <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} type={type} {...btnRest}>
        {rest.children}
      </button>
    );
  },
);
