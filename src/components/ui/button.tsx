import type { ButtonHTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariantOptions = ["primary", "secondary", "link"] as const;

export const buttonSizeOptions = ["sm", "md", "lg"] as const;

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 border font-display leading-none tracking-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 rounded-none",
  variants: {
    variant: {
      primary:
        "border-accent-green bg-accent-green text-background enabled:hover:border-accent-green-strong enabled:hover:bg-accent-green-strong",
      secondary:
        "border-stroke bg-transparent text-foreground enabled:hover:border-subtle enabled:hover:bg-surface-hover",
      link: "border-transparent bg-transparent text-muted enabled:hover:text-foreground",
    },
    size: {
      sm: "px-3 py-2 text-[11px]",
      md: "px-4 py-2 text-[12px]",
      lg: "px-6 py-2.5 text-[13px]",
    },
  },
  compoundVariants: [
    {
      className: "px-0 py-0",
      size: ["sm", "md", "lg"],
      variant: "link",
    },
  ],
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ className, variant, size })}
      type={type}
      {...props}
    />
  );
}

export { buttonVariants };
