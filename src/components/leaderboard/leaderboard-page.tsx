import type { BundledLanguage } from "shiki";
import { CodeBlock } from "@/components/ui";

type LeaderboardEntry = {
  code: string[];
  language: BundledLanguage;
  rank: number;
  score: string;
  scoreLabel: string;
};

const leaderboardEntries = [
  {
    code: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ],
    language: "javascript",
    rank: 1,
    score: "1.2",
    scoreLabel: "score:",
  },
  {
    code: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ],
    language: "typescript",
    rank: 2,
    score: "1.8",
    scoreLabel: "score",
  },
  {
    code: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"],
    language: "sql",
    rank: 3,
    score: "2.1",
    scoreLabel: "score",
  },
  {
    code: ["catch (e) {", "  // ignore", "}"],
    language: "java",
    rank: 4,
    score: "2.3",
    scoreLabel: "score",
  },
  {
    code: [
      "const sleep = (ms) =>",
      "  new Date(Date.now() + ms)",
      "  while(new Date() < end) {}",
    ],
    language: "javascript",
    rank: 5,
    score: "2.5",
    scoreLabel: "score",
  },
] as const satisfies ReadonlyArray<LeaderboardEntry>;

function LeaderboardHero() {
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
        <span>2,847 submissions</span>
        <span className="font-display">·</span>
        <span>avg score: 4.2/10</span>
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
            <span className="text-subtle">{entry.scoreLabel}</span>
            <span className="text-[13px] font-bold text-critical">
              {entry.score}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-[12px] leading-none">
          <span className="text-muted">{entry.language}</span>
          <span className="text-subtle">{entry.code.length} lines</span>
        </div>
      </div>
      <CodeBlock code={entry.code.join("\n")} lang={entry.language} />
    </article>
  );
}

export async function LeaderboardPageScreen() {
  return (
    <main aria-labelledby="leaderboard-title" className="bg-background">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-20">
        <LeaderboardHero />

        <section className="flex flex-col gap-5">
          {leaderboardEntries.map((entry) => (
            <LeaderboardEntryCard entry={entry} key={entry.rank} />
          ))}
        </section>
      </div>
    </main>
  );
}
