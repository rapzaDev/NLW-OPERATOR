import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { feedbackToneEnum } from "./enums";
import { submissions } from "./submissions";

export const submissionAnalyses = pgTable(
  "submission_analyses",
  {
    id: uuid().defaultRandom().primaryKey(),
    submissionId: uuid()
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    analysisVersion: varchar({ length: 64 }).notNull(),
    scoreTenths: smallint().notNull(),
    verdictLabel: varchar({ length: 64 }).notNull(),
    verdictTone: feedbackToneEnum().notNull(),
    headline: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("submission_analyses_submission_id_unique").on(table.submissionId),
    index("submission_analyses_score_tenths_idx").on(table.scoreTenths),
    check(
      "submission_analyses_score_tenths_range_check",
      sql`${table.scoreTenths} >= 0 and ${table.scoreTenths} <= 100`,
    ),
    check(
      "submission_analyses_verdict_label_not_empty_check",
      sql`char_length(btrim(${table.verdictLabel})) > 0`,
    ),
    check(
      "submission_analyses_headline_not_empty_check",
      sql`char_length(btrim(${table.headline})) > 0`,
    ),
  ],
);

export type SubmissionAnalysis = typeof submissionAnalyses.$inferSelect;
export type NewSubmissionAnalysis = typeof submissionAnalyses.$inferInsert;
