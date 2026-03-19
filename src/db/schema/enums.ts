import { pgEnum } from "drizzle-orm/pg-core";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const analysisModeEnum = pgEnum("analysis_mode", ["honest", "roast"]);

export const languageSourceEnum = pgEnum("language_source", [
  "manual",
  "detected",
  "unknown",
]);

export const feedbackToneEnum = pgEnum("feedback_tone", [
  "critical",
  "warning",
  "good",
]);

export const diffLineKindEnum = pgEnum("diff_line_kind", [
  "context",
  "removed",
  "added",
]);

export const roastVerdictEnum = pgEnum("roast_verdict", [
  "needs_serious_help",
  "rough_around_edges",
  "decent_code",
  "solid_work",
  "exceptional",
]);

export const analysisSeverityEnum = pgEnum("analysis_severity", [
  "critical",
  "warning",
  "good",
]);

export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
export type AnalysisMode = (typeof analysisModeEnum.enumValues)[number];
export type LanguageSource = (typeof languageSourceEnum.enumValues)[number];
export type FeedbackTone = (typeof feedbackToneEnum.enumValues)[number];
export type DiffLineKind = (typeof diffLineKindEnum.enumValues)[number];
export type RoastVerdict = (typeof roastVerdictEnum.enumValues)[number];
export type AnalysisSeverity = (typeof analysisSeverityEnum.enumValues)[number];
