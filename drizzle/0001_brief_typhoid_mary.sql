CREATE TYPE "public"."analysis_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."roast_verdict" AS ENUM('needs_serious_help', 'rough_around_edges', 'decent_code', 'solid_work', 'exceptional');--> statement-breakpoint
CREATE TABLE "roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"language" varchar(64) NOT NULL,
	"line_count" integer NOT NULL,
	"roast_mode" boolean NOT NULL,
	"score" real NOT NULL,
	"verdict" "roast_verdict" NOT NULL,
	"roast_quote" text NOT NULL,
	"suggested_fix" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roasts_code_not_empty_check" CHECK (char_length(btrim("roasts"."code")) > 0),
	CONSTRAINT "roasts_language_not_empty_check" CHECK (char_length(btrim("roasts"."language")) > 0),
	CONSTRAINT "roasts_line_count_positive_check" CHECK ("roasts"."line_count" > 0),
	CONSTRAINT "roasts_score_range_check" CHECK ("roasts"."score" >= 0 and "roasts"."score" <= 10),
	CONSTRAINT "roasts_roast_quote_not_empty_check" CHECK (char_length(btrim("roasts"."roast_quote")) > 0),
	CONSTRAINT "roasts_suggested_fix_not_empty_check" CHECK (char_length(btrim("roasts"."suggested_fix")) > 0)
);
--> statement-breakpoint
CREATE TABLE "analysis_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"roast_id" uuid NOT NULL,
	"severity" "analysis_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "analysis_items_roast_id_order_unique" UNIQUE("roast_id","order"),
	CONSTRAINT "analysis_items_order_non_negative_check" CHECK ("analysis_items"."order" >= 0),
	CONSTRAINT "analysis_items_title_not_empty_check" CHECK (char_length(btrim("analysis_items"."title")) > 0),
	CONSTRAINT "analysis_items_description_not_empty_check" CHECK (char_length(btrim("analysis_items"."description")) > 0)
);
--> statement-breakpoint
ALTER TABLE "analysis_items" ADD CONSTRAINT "analysis_items_roast_id_roasts_id_fk" FOREIGN KEY ("roast_id") REFERENCES "public"."roasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "roasts_score_idx" ON "roasts" USING btree ("score");