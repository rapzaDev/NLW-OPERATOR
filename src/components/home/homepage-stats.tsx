import { caller } from "@/trpc/server";
import { HomepageStatsNumber } from "./homepage-stats-number";

function HomeStatSkeleton({ widthClassName }: { widthClassName: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3.5 animate-pulse bg-surface-subtle ${widthClassName}`}
    />
  );
}

export function HomepageStatsSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-body text-center text-xs leading-5 text-subtle">
      <div className="flex items-center gap-4">
        <HomeStatSkeleton widthClassName="w-32 sm:w-36" />
      </div>

      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="font-display text-muted">
          ·
        </span>
        <HomeStatSkeleton widthClassName="w-28 sm:w-32" />
      </div>
    </div>
  );
}

export async function HomepageStats() {
  const stats = await caller.home.stats();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-body text-center text-xs leading-5 text-subtle">
      <div className="flex items-center gap-4">
        <span>
          <HomepageStatsNumber value={stats.codesRoasted} /> codes roasted
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="font-display text-muted">
          ·
        </span>
        <span>
          avg score:{" "}
          <HomepageStatsNumber
            format={{
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }}
            value={stats.averageScore}
          />
          /10
        </span>
      </div>
    </div>
  );
}
