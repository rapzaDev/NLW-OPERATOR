import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  analysisModeEnum,
  languageSourceEnum,
  submissionStatusEnum,
} from "./enums";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().defaultRandom().primaryKey(),
    publicId: varchar({ length: 36 }).notNull(),
    sourceCode: text().notNull(),
    language: varchar({ length: 64 }).notNull(),
    languageSource: languageSourceEnum().notNull().default("unknown"),
    lineCount: integer().notNull(),
    analysisMode: analysisModeEnum().notNull(),
    status: submissionStatusEnum().notNull().default("pending"),
    errorMessage: text(),
    processedAt: timestamp({ withTimezone: true, mode: "date" }),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("submissions_public_id_unique").on(table.publicId),
    index("submissions_status_idx").on(table.status),
    check(
      "submissions_source_code_not_empty_check",
      sql`char_length(btrim(${table.sourceCode})) > 0`,
    ),
    check("submissions_line_count_positive_check", sql`${table.lineCount} > 0`),
  ],
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
