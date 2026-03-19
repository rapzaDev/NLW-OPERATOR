import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { roastVerdictEnum } from "./enums";

export const roasts = pgTable(
  "roasts",
  {
    id: uuid().defaultRandom().primaryKey(),
    code: text().notNull(),
    language: varchar({ length: 64 }).notNull(),
    lineCount: integer().notNull(),
    roastMode: boolean().notNull(),
    score: real().notNull(),
    verdict: roastVerdictEnum().notNull(),
    roastQuote: text().notNull(),
    suggestedFix: text().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("roasts_score_idx").on(table.score),
    check(
      "roasts_code_not_empty_check",
      sql`char_length(btrim(${table.code})) > 0`,
    ),
    check(
      "roasts_language_not_empty_check",
      sql`char_length(btrim(${table.language})) > 0`,
    ),
    check("roasts_line_count_positive_check", sql`${table.lineCount} > 0`),
    check(
      "roasts_score_range_check",
      sql`${table.score} >= 0 and ${table.score} <= 10`,
    ),
    check(
      "roasts_roast_quote_not_empty_check",
      sql`char_length(btrim(${table.roastQuote})) > 0`,
    ),
    check(
      "roasts_suggested_fix_not_empty_check",
      sql`char_length(btrim(${table.suggestedFix})) > 0`,
    ),
  ],
);

export type Roast = typeof roasts.$inferSelect;
export type NewRoast = typeof roasts.$inferInsert;
