import { Suspense } from "react";
import { CodeInputPanel } from "@/components/home/code-input-panel";
import {
  HomepageStats,
  HomepageStatsSkeleton,
} from "@/components/home/homepage-stats";
import { LeaderboardPreview } from "@/components/home/leaderboard-preview";

export default async function Home() {
  return (
    <main aria-labelledby="home-title" className="bg-background">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pt-20">
        <section className="mx-auto flex max-w-[680px] flex-col items-center gap-3 text-center sm:gap-4">
          <div className="inline-flex items-start gap-2 font-display text-[30px] font-bold leading-[0.95] tracking-tight text-foreground sm:items-center sm:gap-3 sm:text-4xl">
            <span className="text-accent-green">$</span>
            <h1 id="home-title">paste your code. get roasted.</h1>
          </div>
          <p className="max-w-[34rem] font-body text-sm leading-6 text-muted">
            {
              "// drop your code below and we'll rate it - brutally honest or full roast mode"
            }
          </p>
        </section>

        <CodeInputPanel />

        <Suspense fallback={<HomepageStatsSkeleton />}>
          <HomepageStats />
        </Suspense>

        <div className="h-8" />

        <LeaderboardPreview />
      </div>
    </main>
  );
}
