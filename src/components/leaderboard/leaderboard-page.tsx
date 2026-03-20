import type { BundledLanguage } from "shiki";
import { CodeBlock } from "@/components/ui";
import { codeEditorLanguages } from "@/lib/code-languages";
import { DEFAULT_ROAST_LANGUAGE } from "@/lib/roast";
import { caller } from "@/trpc/server";

type LeaderboardEntry = {
  code: string;
  language: BundledLanguage;
  id: string;
  lineCount: number;
  rank: number;
  score: string;
};

const supportedLanguageSet = new Set<string>(
  codeEditorLanguages.map((language) => language.value),
);

function getHighlightLanguage(language: string): BundledLanguage {
  if (supportedLanguageSet.has(language)) {
    return language as BundledLanguage;
  }

  return DEFAULT_ROAST_LANGUAGE as BundledLanguage;
}

function LeaderboardHero({
  averageScore,
  codesRoasted,
}: {
  averageScore: number;
  codesRoasted: number;
}) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-display text-[28px] font-bold leading-none text-accent-green sm:text-[32px]">
          {">"}
        </span>
        <h1
          className="font-display text-[26px] font-bold leading-none tracking-tight text-foreground sm:text-[28px]"
          id="leaderboard-title"
        >
          shame_leaderboard
        </h1>
      </div>

      <p className="font-body text-sm leading-6 text-muted">
        {"// the most roasted code on the internet"}
      </p>

      <div className="flex flex-wrap items-center gap-2 font-body text-xs leading-5 text-subtle">
        <span>{codesRoasted} submissions</span>
        <span className="font-display">·</span>
        <span>avg score: {averageScore.toFixed(1)}/10</span>
      </div>
    </header>
  );
}

function LeaderboardEntryCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <article className="overflow-hidden border border-stroke bg-background">
      <div className="flex flex-col gap-3 border-b border-stroke px-4 py-3 sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5 font-display text-[13px] leading-none">
            <span className="text-subtle">#</span>
            <span className="font-bold text-warning">{entry.rank}</span>
          </div>

          <div className="flex items-center gap-1.5 font-display text-[12px] leading-none">
            <span className="text-subtle">score</span>
            <span className="text-[13px] font-bold text-critical">
              {entry.score}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[12px] leading-none">
          <span className="text-muted">{entry.language}</span>
          <span className="text-subtle">{entry.lineCount} lines</span>
        </div>
      </div>
      <CodeBlock code={entry.code} lang={entry.language} />
    </article>
  );
}

export async function LeaderboardPageScreen() {
  const [entries, stats] = await Promise.all([
    caller.leaderboard.list(),
    caller.leaderboard.stats(),
  ]);
  const leaderboardEntries: LeaderboardEntry[] = entries.map((entry) => ({
    code: entry.code,
    id: entry.id,
    language: getHighlightLanguage(entry.language),
    lineCount: entry.lineCount,
    rank: entry.rank,
    score: entry.score.toFixed(1),
  }));

  return (
    <main aria-labelledby="leaderboard-title" className="bg-background">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-20">
        <LeaderboardHero
          averageScore={stats.averageScore}
          codesRoasted={stats.codesRoasted}
        />

        <section className="flex flex-col gap-5">
          {leaderboardEntries.length > 0 ? (
            leaderboardEntries.map((entry) => (
              <LeaderboardEntryCard entry={entry} key={entry.id} />
            ))
          ) : (
            <div className="border border-stroke px-5 py-10 text-center font-body text-sm leading-6 text-subtle">
              {"// no roasts yet - submit code to populate the leaderboard"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
