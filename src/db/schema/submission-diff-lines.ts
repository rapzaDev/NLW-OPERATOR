import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { diffLineKindEnum } from "./enums";
import { submissionDiffBlocks } from "./submission-diff-blocks";

export const submissionDiffLines = pgTable(
  "submission_diff_lines",
  {
    id: uuid().defaultRandom().primaryKey(),
    diffBlockId: uuid()
      .notNull()
      .references(() => submissionDiffBlocks.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    kind: diffLineKindEnum().notNull(),
    content: text().notNull(),
  },
  (table) => [
    unique("submission_diff_lines_diff_block_id_position_unique").on(
      table.diffBlockId,
      table.position,
    ),
    check(
      "submission_diff_lines_position_non_negative_check",
      sql`${table.position} >= 0`,
    ),
    check(
      "submission_diff_lines_content_not_empty_check",
      sql`char_length(${table.content}) > 0`,
    ),
  ],
);

export type SubmissionDiffLine = typeof submissionDiffLines.$inferSelect;
export type NewSubmissionDiffLine = typeof submissionDiffLines.$inferInsert;
