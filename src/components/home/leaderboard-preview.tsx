import Link from "next/link";
import {
  buttonVariants,
  StatusBadgeRoot,
  StatusBadgeText,
} from "@/components/ui";
import { caller } from "@/trpc/server";

type LeaderboardLine = {
  content: string;
  tone: "comment" | "default";
};

type LeaderboardEntry = {
  code: LeaderboardLine[];
  language: string;
  id: string;
  rank: number;
  rankTone: "muted" | "warning";
  score: string;
  scoreTone: "critical";
};

const lineToneClassName = {
  comment: "text-foreground-soft",
  default: "text-foreground",
} as const;

function getLeaderboardLineTone(content: string): LeaderboardLine["tone"] {
  const normalizedLine = content.trimStart();

  if (
    normalizedLine.startsWith("//") ||
    normalizedLine.startsWith("#") ||
    normalizedLine.startsWith("--")
  ) {
    return "comment";
  }

  return "default";
}

function getLeaderboardPreviewLines(code: string) {
  const previewLines = code
    .split(/\r\n|\r|\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(0, 3);

  if (previewLines.length === 0) {
    return [
      {
        content: "// no code preview available",
        tone: "comment" as const,
      },
    ];
  }

  return previewLines.map((content) => ({
    content,
    tone: getLeaderboardLineTone(content),
  }));
}

function LeaderboardCode({
  className,
  entry,
}: {
  className?: string;
  entry: LeaderboardEntry;
}) {
  return (
    <div className={["grid gap-1.5", className].filter(Boolean).join(" ")}>
      {entry.code.map((line) => (
        <p
          className={`${lineToneClassName[line.tone]} break-words`}
          key={`${entry.rank}-${line.content}`}
        >
          {line.content}
        </p>
      ))}
    </div>
  );
}

export interface LeaderboardPreviewProps {
  footerHref?: string | null;
  headerActionHref?: string | null;
}

export async function LeaderboardPreview({
  footerHref = "/leaderboard",
  headerActionHref = "/leaderboard",
}: LeaderboardPreviewProps) {
  const [entries, stats] = await Promise.all([
    caller.leaderboard.list({
      limit: 3,
    }),
    caller.leaderboard.stats(),
  ]);
  const leaderboardEntries: LeaderboardEntry[] = entries.map((entry) => ({
    code: getLeaderboardPreviewLines(entry.code),
    id: entry.id,
    language: entry.language,
    rank: entry.rank,
    rankTone: entry.rank === 1 ? "warning" : "muted",
    score: entry.score.toFixed(1),
    scoreTone: "critical",
  }));

  return (
    <section className="grid gap-6" id="leaderboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <div className="font-display text-sm font-bold uppercase tracking-[0.22em] text-accent-green">
            {"// shame_leaderboard"}
          </div>
          <p className="font-body text-sm text-subtle">
            {"// the worst code on the internet, ranked by shame"}
          </p>
        </div>

        {headerActionHref ? (
          <Link
            className={buttonVariants({
              className:
                "text-foreground-soft hover:border-subtle hover:bg-surface-hover hover:text-foreground",
              size: "sm",
              variant: "secondary",
            })}
            href={headerActionHref}
          >
            $ view_all &gt;&gt;
          </Link>
        ) : null}
      </div>

      <div className="overflow-hidden border border-stroke bg-surface">
        <div className="hidden h-10 grid-cols-[52px_64px_minmax(0,1fr)_112px] items-center gap-4 border-b border-stroke bg-surface-muted px-4 font-display text-[10px] uppercase tracking-[0.18em] text-subtle md:grid lg:grid-cols-[52px_72px_minmax(0,1fr)_128px] lg:gap-6 lg:px-5 lg:text-[11px] lg:tracking-[0.2em]">
          <span>rank</span>
          <span>score</span>
          <span>code</span>
          <span>lang</span>
        </div>

        {leaderboardEntries.length > 0 ? (
          leaderboardEntries.map((entry) => (
            <article
              className="border-b border-stroke px-4 py-4 last:border-b-0 lg:px-5"
              key={entry.id}
            >
              <div className="grid gap-4 md:hidden">
                <div className="flex items-center justify-between gap-4">
                  <div className="grid gap-1">
                    <span className="font-display text-[10px] uppercase tracking-[0.18em] text-subtle">
                      rank
                    </span>
                    <StatusBadgeRoot className="text-sm" tone={entry.rankTone}>
                      <StatusBadgeText>{entry.rank}</StatusBadgeText>
                    </StatusBadgeRoot>
                  </div>

                  <div className="grid justify-items-end gap-1 text-right">
                    <span className="font-display text-[10px] uppercase tracking-[0.18em] text-subtle">
                      score
                    </span>
                    <StatusBadgeRoot
                      className="text-sm font-bold tracking-tight"
                      tone={entry.scoreTone}
                    >
                      <StatusBadgeText>{entry.score}</StatusBadgeText>
                    </StatusBadgeRoot>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-[10px] uppercase tracking-[0.18em] text-subtle">
                      code
                    </span>
                    <span className="max-w-[9rem] break-all text-right font-display text-[11px] leading-5 text-muted">
                      {entry.language}
                    </span>
                  </div>

                  <LeaderboardCode
                    className="font-display text-[13px] leading-6"
                    entry={entry}
                  />
                </div>
              </div>

              <div className="hidden md:grid md:grid-cols-[52px_64px_minmax(0,1fr)_112px] md:items-start md:gap-4 lg:grid-cols-[52px_72px_minmax(0,1fr)_128px] lg:gap-6">
                <StatusBadgeRoot className="text-xs" tone={entry.rankTone}>
                  <StatusBadgeText>{entry.rank}</StatusBadgeText>
                </StatusBadgeRoot>

                <StatusBadgeRoot
                  className="text-xs font-bold tracking-tight"
                  tone={entry.scoreTone}
                >
                  <StatusBadgeText>{entry.score}</StatusBadgeText>
                </StatusBadgeRoot>

                <LeaderboardCode
                  className="min-w-0 font-display text-xs leading-5"
                  entry={entry}
                />

                <div className="min-w-0">
                  <span className="block break-all font-display text-xs leading-5 text-muted">
                    {entry.language}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="px-4 py-8 text-center font-body text-sm leading-6 text-subtle lg:px-5">
            {"// no roasts yet - submit code to start the shame leaderboard"}
          </div>
        )}
      </div>

      {footerHref && stats.codesRoasted > 0 ? (
        <div className="flex justify-center">
          <p className="max-w-[18rem] text-center font-body text-xs leading-5 text-subtle sm:max-w-none">
            <span>
              showing top {leaderboardEntries.length} of {stats.codesRoasted} ·{" "}
            </span>
            <Link
              className="transition-colors hover:text-foreground"
              href={footerHref}
            >
              view full leaderboard &gt;&gt;
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
