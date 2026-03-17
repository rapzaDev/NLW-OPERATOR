import type { HTMLAttributes } from "react";
import { tv, type VariantProps } from "tailwind-variants";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const diffLineKindOptions = ["removed", "added", "context"] as const;

const diffLineVariants = tv({
  base: "flex w-full items-start gap-2 px-4 py-2 font-display text-[13px] leading-5 rounded-none",
  variants: {
    kind: {
      removed: "bg-diff-removed text-muted",
      added: "bg-diff-added text-foreground",
      context: "bg-transparent text-muted",
    },
  },
  defaultVariants: {
    kind: "context",
  },
});

export interface DiffLineRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof diffLineVariants> {}

export function DiffLineRoot({
  children,
  className,
  kind,
  ...props
}: DiffLineRootProps) {
  const resolvedKind = kind ?? "context";

  return (
    <div
      className={diffLineVariants({ className, kind: resolvedKind })}
      data-kind={resolvedKind}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DiffLinePrefixProps extends HTMLAttributes<HTMLSpanElement> {
  kind?: (typeof diffLineKindOptions)[number];
}

export function DiffLinePrefix({
  children,
  className,
  kind = "context",
  ...props
}: DiffLinePrefixProps) {
  const defaultPrefixByKind = {
    added: "+",
    context: "\u00a0",
    removed: "-",
  } as const;

  return (
    <span
      aria-hidden="true"
      className={joinClasses(
        kind === "removed"
          ? "shrink-0 text-critical"
          : kind === "added"
            ? "shrink-0 text-accent-green"
            : "shrink-0 text-subtle",
        className,
      )}
      {...props}
    >
      {children ?? defaultPrefixByKind[kind]}
    </span>
  );
}

export interface DiffLineCodeProps extends HTMLAttributes<HTMLElement> {}

export function DiffLineCode({
  children,
  className,
  ...props
}: DiffLineCodeProps) {
  return (
    <code
      className={joinClasses(
        "min-w-0 whitespace-pre-wrap break-all",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

export type DiffLineProps = DiffLineRootProps;
export { diffLineVariants };
