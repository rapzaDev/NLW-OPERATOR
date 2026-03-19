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
import { analysisSeverityEnum } from "./enums";
import { roasts } from "./roasts";

export const analysisItems = pgTable(
  "analysis_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    roastId: uuid()
      .notNull()
      .references(() => roasts.id, { onDelete: "cascade" }),
    severity: analysisSeverityEnum().notNull(),
    title: text().notNull(),
    description: text().notNull(),
    order: integer().notNull(),
    createdAt: timestamp({ withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("analysis_items_roast_id_order_unique").on(
      table.roastId,
      table.order,
    ),
    check("analysis_items_order_non_negative_check", sql`${table.order} >= 0`),
    check(
      "analysis_items_title_not_empty_check",
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      "analysis_items_description_not_empty_check",
      sql`char_length(btrim(${table.description})) > 0`,
    ),
  ],
);

export type AnalysisItem = typeof analysisItems.$inferSelect;
export type NewAnalysisItem = typeof analysisItems.$inferInsert;
