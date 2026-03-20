import type { HTMLAttributes } from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const loadingDotDelays = [0, 120, 240] as const;

export interface LoadingDotsProps extends HTMLAttributes<HTMLSpanElement> {}

export function LoadingDots({ className, ...props }: LoadingDotsProps) {
  return (
    <span
      aria-hidden="true"
      className={joinClasses(
        "inline-flex items-center gap-1 text-current",
        className,
      )}
      {...props}
    >
      {loadingDotDelays.map((delay) => (
        <span
          className="size-1 rounded-full bg-current opacity-70 animate-pulse"
          data-loading-dot=""
          key={delay}
          style={{
            animationDelay: `${delay}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </span>
  );
}
