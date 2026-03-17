"use client";

import NumberFlow, { type Format } from "@number-flow/react";
import { startTransition, useEffect, useState } from "react";

export interface HomepageStatsNumberProps {
  className?: string;
  format?: Format;
  value: number;
}

export function HomepageStatsNumber({
  className,
  format,
  value,
}: HomepageStatsNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      startTransition(() => {
        setDisplayValue(value);
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <NumberFlow
      className={["font-display tabular-nums text-foreground", className]
        .filter(Boolean)
        .join(" ")}
      format={format}
      locales="en-US"
      trend={1}
      value={displayValue}
      willChange
    />
  );
}
