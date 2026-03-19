import type { Metadata } from "next";
import type { RoastVerdict } from "./roast";

const verdictLabelByValue: Record<RoastVerdict, string> = {
  decent_code: "decent code",
  exceptional: "exceptional",
  needs_serious_help: "needs serious help",
  rough_around_edges: "rough around edges",
  solid_work: "solid work",
};

export function createRoastPageMetadata({
  language,
  roastQuote,
  score,
  verdict,
}: {
  id: string;
  language: string;
  roastQuote: string;
  score: number;
  verdict: RoastVerdict;
}): Pick<Metadata, "description" | "title"> {
  return {
    description: `${roastQuote.trim()} Verdict: ${verdictLabelByValue[verdict]}.`,
    title: `${language.trim().toLowerCase()} roast · ${score.toFixed(1)}/10 | devroast`,
  };
}
