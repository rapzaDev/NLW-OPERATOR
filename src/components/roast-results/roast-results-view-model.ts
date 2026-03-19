import type { BundledLanguage } from "shiki";
import type { RoastDetails } from "@/db/queries/roasts";
import { codeEditorLanguages } from "@/lib/code-languages";
import { DEFAULT_ROAST_LANGUAGE } from "@/lib/roast";
import { buildRoastDiffLines } from "@/lib/roast-diff";

const supportedLanguageSet = new Set<string>(
  codeEditorLanguages.map((language) => language.value),
);

type RoastBadgeTone = "critical" | "warning" | "success";

function getVerdictTone(verdict: RoastDetails["verdict"]): RoastBadgeTone {
  switch (verdict) {
    case "needs_serious_help":
      return "critical";
    case "rough_around_edges":
    case "decent_code":
      return "warning";
    case "solid_work":
    case "exceptional":
      return "success";
  }
}

function getAnalysisTone(
  severity: RoastDetails["analysisItems"][number]["severity"],
): RoastBadgeTone {
  switch (severity) {
    case "critical":
      return "critical";
    case "warning":
      return "warning";
    case "good":
      return "success";
  }
}

function getHighlightLanguage(language: string): BundledLanguage {
  if (supportedLanguageSet.has(language)) {
    return language as BundledLanguage;
  }

  return DEFAULT_ROAST_LANGUAGE as BundledLanguage;
}

function formatLineCount(lineCount: number) {
  return `${lineCount} ${lineCount === 1 ? "line" : "lines"}`;
}

export function createRoastResultsViewModel(roast: RoastDetails) {
  return {
    analysisItems: roast.analysisItems.map((item) => ({
      ...item,
      badgeTone: getAnalysisTone(item.severity),
    })),
    diffLines: buildRoastDiffLines(roast.code, roast.suggestedFix),
    highlightLanguage: getHighlightLanguage(roast.language),
    lineCountLabel: formatLineCount(roast.lineCount),
    scoreLabel: roast.score.toFixed(1),
    verdictTone: getVerdictTone(roast.verdict),
  };
}
