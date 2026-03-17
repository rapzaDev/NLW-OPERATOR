import type { HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const statusBadgeToneOptions = [
  "critical",
  "warning",
  "success",
  "muted",
] as const;

const statusBadgeVariants = tv({
  base: "inline-flex items-center gap-2 font-display text-[12px] leading-none rounded-none",
  variants: {
    tone: {
      critical: "text-critical",
      warning: "text-warning",
      success: "text-accent-green",
      muted: "text-muted",
    },
  },
  defaultVariants: {
    tone: "muted",
  },
});

export interface StatusBadgeRootProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadgeRoot({
  children,
  className,
  tone,
  ...props
}: StatusBadgeRootProps) {
  return (
    <span className={statusBadgeVariants({ className, tone })} {...props}>
      {children}
    </span>
  );
}

export interface StatusBadgeDotProps extends HTMLAttributes<HTMLSpanElement> {}

export function StatusBadgeDot({ className, ...props }: StatusBadgeDotProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClasses("size-2 rounded-full bg-current", className)}
      {...props}
    />
  );
}

export interface StatusBadgeTextProps extends HTMLAttributes<HTMLSpanElement> {}

export function StatusBadgeText({
  children,
  className,
  ...props
}: StatusBadgeTextProps) {
  return (
    <span className={joinClasses("min-w-0", className)} {...props}>
      {children}
    </span>
  );
}

export type StatusBadgeProps = StatusBadgeRootProps;
export { statusBadgeVariants };
