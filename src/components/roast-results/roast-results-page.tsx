import {
  Button,
  CodeBlock,
  DiffLineCode,
  DiffLinePrefix,
  DiffLineRoot,
  StatusBadgeDot,
  StatusBadgeRoot,
  StatusBadgeText,
} from "@/components/ui";

type RoastResultsPageScreenProps = {
  roastId: string;
};

type RoastTone = "critical" | "warning" | "good";
type RoastBadgeTone = "critical" | "warning" | "success";
type RoastDiffLineKind = "context" | "removed" | "added";

type RoastAnalysisItem = {
  description: string;
  title: string;
  tone: RoastTone;
};

type RoastDiffLine = {
  content: string;
  kind: RoastDiffLineKind;
};

const submittedCode = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

const roastResult = {
  analysisItems: [
    {
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
      title: "using var instead of const/let",
      tone: "critical",
    },
    {
      description:
        "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
      title: "imperative loop pattern",
      tone: "warning",
    },
    {
      description:
        "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
      title: "clear naming conventions",
      tone: "good",
    },
    {
      description:
        "the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
      title: "single responsibility",
      tone: "good",
    },
  ] as RoastAnalysisItem[],
  diff: {
    lines: [
      {
        content: "function calculateTotal(items) {",
        kind: "context",
      },
      {
        content: "  var total = 0;",
        kind: "removed",
      },
      {
        content: "  for (var i = 0; i < items.length; i++) {",
        kind: "removed",
      },
      {
        content: "    total = total + items[i].price;",
        kind: "removed",
      },
      {
        content: "  }",
        kind: "removed",
      },
      {
        content: "  return total;",
        kind: "removed",
      },
      {
        content: "  return items.reduce((sum, item) => sum + item.price, 0);",
        kind: "added",
      },
      {
        content: "}",
        kind: "context",
      },
    ] as RoastDiffLine[],
    sourceLabel: "your_code.ts",
    targetLabel: "improved_code.ts",
  },
  headline:
    '"this code looks like it was written during a power outage... in 2005."',
  language: "javascript",
  lineCount: "7 lines",
  score: "3.5",
  verdictLabel: "needs_serious_help",
  verdictTone: "critical" as RoastTone,
};

const badgeToneByRoastTone = {
  critical: "critical",
  good: "success",
  warning: "warning",
} as const satisfies Record<RoastTone, RoastBadgeTone>;

function ScoreRing() {
  return (
    <div className="relative size-[180px] shrink-0">
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ef4444_0deg,#f59e0b_126deg,#10b981_126deg,#10b981_360deg)]" />
      <div className="absolute inset-[4px] rounded-full bg-background" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[48px] font-bold leading-none text-warning">
          {roastResult.score}
        </span>
        <span className="mt-3 font-display text-[16px] leading-none text-subtle">
          /10
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 font-display text-[14px] font-bold leading-none">
      <span className="text-accent-green">{"//"}</span>
      <span className="text-foreground">{title}</span>
    </div>
  );
}

function AnalysisCard({ item }: { item: RoastAnalysisItem }) {
  return (
    <article className="flex h-full flex-col gap-3 border border-stroke px-5 py-5">
      <StatusBadgeRoot
        className="text-[12px] font-medium"
        tone={badgeToneByRoastTone[item.tone]}
      >
        <StatusBadgeDot />
        <StatusBadgeText>{item.tone}</StatusBadgeText>
      </StatusBadgeRoot>

      <h3 className="font-display text-[13px] font-medium leading-5 text-foreground">
        {item.title}
      </h3>

      <p className="font-body text-[12px] leading-[1.5] text-muted">
        {item.description}
      </p>
    </article>
  );
}

function DiffPreview({
  lines,
  sourceLabel,
  targetLabel,
}: {
  lines: RoastDiffLine[];
  sourceLabel: string;
  targetLabel: string;
}) {
  return (
    <div className="overflow-hidden border border-stroke bg-surface">
      <div className="flex h-10 items-center border-b border-stroke px-4">
        <span className="font-display text-[12px] font-medium leading-none text-muted">
          {sourceLabel} {"->"} {targetLabel}
        </span>
      </div>

      <div className="flex flex-col py-1">
        {lines.map((line) => (
          <DiffLineRoot
            className="min-h-7 items-center px-4 py-0 text-[12px] leading-7"
            key={`${line.kind}-${line.content}`}
            kind={line.kind}
          >
            <DiffLinePrefix className="w-5 shrink-0" kind={line.kind} />
            <DiffLineCode className="whitespace-pre-wrap break-all text-[12px] leading-7">
              {line.content}
            </DiffLineCode>
          </DiffLineRoot>
        ))}
      </div>
    </div>
  );
}

export async function RoastResultsPageScreen({
  roastId,
}: RoastResultsPageScreenProps) {
  return (
    <main
      aria-labelledby="roast-results-title"
      className="bg-background"
      data-roast-id={roastId}
    >
      <h1 className="sr-only" id="roast-results-title">
        Roast results
      </h1>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-20">
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <ScoreRing />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <StatusBadgeRoot
              className="w-fit text-[13px] font-medium"
              tone={badgeToneByRoastTone[roastResult.verdictTone]}
            >
              <StatusBadgeDot />
              <StatusBadgeText>
                verdict: {roastResult.verdictLabel}
              </StatusBadgeText>
            </StatusBadgeRoot>

            <p className="max-w-[66rem] font-body text-[20px] leading-[1.5] text-foreground">
              {roastResult.headline}
            </p>

            <div className="flex flex-wrap items-center gap-4 font-display text-[12px] leading-none text-subtle">
              <span>lang: {roastResult.language}</span>
              <span aria-hidden="true">·</span>
              <span>{roastResult.lineCount}</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="px-4 text-[12px]"
                size="sm"
                variant="secondary"
              >
                $ share_roast
              </Button>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-4">
          <SectionTitle title="your_submission" />
          <div className="overflow-hidden border border-stroke bg-surface">
            <CodeBlock code={submittedCode} lang="javascript" />
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-6">
          <SectionTitle title="detailed_analysis" />
          <div className="grid gap-5 md:grid-cols-2">
            {roastResult.analysisItems.map((item) => (
              <AnalysisCard item={item} key={item.title} />
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-6">
          <SectionTitle title="suggested_fix" />
          <DiffPreview
            lines={roastResult.diff.lines}
            sourceLabel={roastResult.diff.sourceLabel}
            targetLabel={roastResult.diff.targetLabel}
          />
        </section>
      </div>
    </main>
  );
}
