import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { submissionAnalyses } from "./submission-analyses";

export const submissionDiffBlocks = pgTable(
  "submission_diff_blocks",
  {
    id: uuid().defaultRandom().primaryKey(),
    analysisId: uuid()
      .notNull()
      .references(() => submissionAnalyses.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    sourceLabel: varchar({ length: 255 }).notNull(),
    targetLabel: varchar({ length: 255 }).notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("submission_diff_blocks_analysis_id_position_unique").on(
      table.analysisId,
      table.position,
    ),
    check(
      "submission_diff_blocks_position_non_negative_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "submission_diff_blocks_source_label_not_empty_check",
      sql`char_length(btrim(${table.sourceLabel})) > 0`,
    ),
    check(
      "submission_diff_blocks_target_label_not_empty_check",
      sql`char_length(btrim(${table.targetLabel})) > 0`,
    ),
  ],
);

export type SubmissionDiffBlock = typeof submissionDiffBlocks.$inferSelect;
export type NewSubmissionDiffBlock = typeof submissionDiffBlocks.$inferInsert;
