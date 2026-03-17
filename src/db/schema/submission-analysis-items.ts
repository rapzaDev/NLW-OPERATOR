import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { feedbackToneEnum } from "./enums";
import { submissionAnalyses } from "./submission-analyses";

export const submissionAnalysisItems = pgTable(
  "submission_analysis_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    analysisId: uuid()
      .notNull()
      .references(() => submissionAnalyses.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    tone: feedbackToneEnum().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("submission_analysis_items_analysis_id_position_unique").on(
      table.analysisId,
      table.position,
    ),
    check(
      "submission_analysis_items_position_non_negative_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "submission_analysis_items_title_not_empty_check",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      "submission_analysis_items_description_not_empty_check",
      sql`char_length(btrim(${table.description})) > 0`,
    ),
  ],
);

export type SubmissionAnalysisItem =
  typeof submissionAnalysisItems.$inferSelect;
export type NewSubmissionAnalysisItem =
  typeof submissionAnalysisItems.$inferInsert;
