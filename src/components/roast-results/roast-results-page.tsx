import {
  CodeBlock,
  DiffLineCode,
  DiffLinePrefix,
  DiffLineRoot,
  StatusBadgeDot,
  StatusBadgeRoot,
  StatusBadgeText,
} from "@/components/ui";
import type { RoastDetails } from "@/db/queries/roasts";
import { createRoastResultsViewModel } from "./roast-results-view-model";

type RoastResultsPageScreenProps = {
  roast: RoastDetails;
};

const scoreTextClassName = {
  critical: "text-critical",
  success: "text-accent-green",
  warning: "text-warning",
} as const;

function ScoreRing({
  scoreLabel,
  tone,
}: {
  scoreLabel: string;
  tone: keyof typeof scoreTextClassName;
}) {
  return (
    <div className="relative size-[180px] shrink-0">
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(#ef4444_0deg,#f59e0b_126deg,#10b981_126deg,#10b981_360deg)]" />
      <div className="absolute inset-[4px] rounded-full bg-background" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-display text-[48px] font-bold leading-none ${scoreTextClassName[tone]}`}
        >
          {scoreLabel}
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

function AnalysisCard({
  item,
}: {
  item: ReturnType<typeof createRoastResultsViewModel>["analysisItems"][number];
}) {
  return (
    <article className="flex h-full flex-col gap-3 border border-stroke px-5 py-5">
      <StatusBadgeRoot
        className="text-[12px] font-medium"
        tone={item.badgeTone}
      >
        <StatusBadgeDot />
        <StatusBadgeText>{item.severity}</StatusBadgeText>
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
}: {
  lines: ReturnType<typeof createRoastResultsViewModel>["diffLines"];
}) {
  return (
    <div className="overflow-hidden border border-stroke bg-surface">
      <div className="flex h-10 items-center border-b border-stroke px-4">
        <span className="font-display text-[12px] font-medium leading-none text-muted">
          submitted_code {"->"} suggested_fix
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
  roast,
}: RoastResultsPageScreenProps) {
  const viewModel = createRoastResultsViewModel(roast);

  return (
    <main
      aria-labelledby="roast-results-title"
      className="bg-background"
      data-roast-id={roast.id}
    >
      <h1 className="sr-only" id="roast-results-title">
        Roast results
      </h1>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 pb-16 pt-10 sm:px-8 sm:pb-20 lg:px-20">
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <ScoreRing
            scoreLabel={viewModel.scoreLabel}
            tone={viewModel.verdictTone}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <StatusBadgeRoot
              className="w-fit text-[13px] font-medium"
              tone={viewModel.verdictTone}
            >
              <StatusBadgeDot />
              <StatusBadgeText>verdict: {roast.verdict}</StatusBadgeText>
            </StatusBadgeRoot>

            <p className="max-w-[66rem] font-body text-[20px] leading-[1.5] text-foreground">
              {roast.roastQuote}
            </p>

            <div className="flex flex-wrap items-center gap-4 font-display text-[12px] leading-none text-subtle">
              <span>lang: {roast.language}</span>
              <span aria-hidden="true">·</span>
              <span>{viewModel.lineCountLabel}</span>
              <span aria-hidden="true">·</span>
              <span>mode: {roast.roastMode ? "roast" : "honest"}</span>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-4">
          <SectionTitle title="your_submission" />
          <div className="overflow-hidden border border-stroke bg-surface">
            <CodeBlock code={roast.code} lang={viewModel.highlightLanguage} />
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-6">
          <SectionTitle title="detailed_analysis" />
          <div className="grid gap-5 md:grid-cols-2">
            {viewModel.analysisItems.map((item) => (
              <AnalysisCard item={item} key={item.id} />
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-stroke" />

        <section className="flex flex-col gap-6">
          <SectionTitle title="suggested_fix" />
          <DiffPreview lines={viewModel.diffLines} />
        </section>
      </div>
    </main>
  );
}
