export const MAX_ROAST_CHARACTERS = 2000;
export const DEFAULT_ROAST_LANGUAGE = "javascript";

export const roastVerdictValues = [
  "needs_serious_help",
  "rough_around_edges",
  "decent_code",
  "solid_work",
  "exceptional",
] as const;

export const analysisSeverityValues = ["critical", "warning", "good"] as const;

export type RoastVerdict = (typeof roastVerdictValues)[number];
export type AnalysisSeverity = (typeof analysisSeverityValues)[number];

export function countRoastLines(code: string) {
  return code.split(/\r\n|\r|\n/).length;
}
