import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { tv, type VariantProps } from "tailwind-variants";

const buttonVariants = tv({
  base: "inline-flex items-center justify-center gap-2 px-6 py-2.5 font-mono text-[13px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-none",
  variants: {
    variant: {
      primary: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300",
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
      ghost: "bg-transparent text-zinc-100 hover:bg-zinc-900",
      outline:
        "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900",
    },
    size: {
      sm: "px-4 py-2 text-xs",
      md: "",
      lg: "px-8 py-3 text-sm",
      icon: "size-10 p-0",
    },
  },
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
      className={twMerge(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}

export { buttonVariants };
