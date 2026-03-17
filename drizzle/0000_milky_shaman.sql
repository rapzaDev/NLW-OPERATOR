CREATE TYPE "public"."analysis_mode" AS ENUM('honest', 'roast');--> statement-breakpoint
CREATE TYPE "public"."diff_line_kind" AS ENUM('context', 'removed', 'added');--> statement-breakpoint
CREATE TYPE "public"."feedback_tone" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."language_source" AS ENUM('manual', 'detected', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(36) NOT NULL,
	"source_code" text NOT NULL,
	"language" varchar(64) NOT NULL,
	"language_source" "language_source" DEFAULT 'unknown' NOT NULL,
	"line_count" integer NOT NULL,
	"analysis_mode" "analysis_mode" NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "submissions_source_code_not_empty_check" CHECK (char_length(btrim("submissions"."source_code")) > 0),
	CONSTRAINT "submissions_line_count_positive_check" CHECK ("submissions"."line_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "submission_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"analysis_version" varchar(64) NOT NULL,
	"score_tenths" smallint NOT NULL,
	"verdict_label" varchar(64) NOT NULL,
	"verdict_tone" "feedback_tone" NOT NULL,
	"headline" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_analyses_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "submission_analyses_score_tenths_range_check" CHECK ("submission_analyses"."score_tenths" >= 0 and "submission_analyses"."score_tenths" <= 100),
	CONSTRAINT "submission_analyses_verdict_label_not_empty_check" CHECK (char_length(btrim("submission_analyses"."verdict_label")) > 0),
	CONSTRAINT "submission_analyses_headline_not_empty_check" CHECK (char_length(btrim("submission_analyses"."headline")) > 0)
);
--> statement-breakpoint
CREATE TABLE "submission_analysis_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"tone" "feedback_tone" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_analysis_items_analysis_id_position_unique" UNIQUE("analysis_id","position"),
	CONSTRAINT "submission_analysis_items_position_non_negative_check" CHECK ("submission_analysis_items"."position" >= 0),
	CONSTRAINT "submission_analysis_items_title_not_empty_check" CHECK (char_length(btrim("submission_analysis_items"."title")) > 0),
	CONSTRAINT "submission_analysis_items_description_not_empty_check" CHECK (char_length(btrim("submission_analysis_items"."description")) > 0)
);
--> statement-breakpoint
CREATE TABLE "submission_diff_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analysis_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"source_label" varchar(255) NOT NULL,
	"target_label" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_diff_blocks_analysis_id_position_unique" UNIQUE("analysis_id","position"),
	CONSTRAINT "submission_diff_blocks_position_non_negative_check" CHECK ("submission_diff_blocks"."position" >= 0),
	CONSTRAINT "submission_diff_blocks_source_label_not_empty_check" CHECK (char_length(btrim("submission_diff_blocks"."source_label")) > 0),
	CONSTRAINT "submission_diff_blocks_target_label_not_empty_check" CHECK (char_length(btrim("submission_diff_blocks"."target_label")) > 0)
);
--> statement-breakpoint
CREATE TABLE "submission_diff_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diff_block_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" "diff_line_kind" NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "submission_diff_lines_diff_block_id_position_unique" UNIQUE("diff_block_id","position"),
	CONSTRAINT "submission_diff_lines_position_non_negative_check" CHECK ("submission_diff_lines"."position" >= 0),
	CONSTRAINT "submission_diff_lines_content_not_empty_check" CHECK (char_length("submission_diff_lines"."content") > 0)
);
--> statement-breakpoint
ALTER TABLE "submission_analyses" ADD CONSTRAINT "submission_analyses_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_analysis_items" ADD CONSTRAINT "submission_analysis_items_analysis_id_submission_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."submission_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_diff_blocks" ADD CONSTRAINT "submission_diff_blocks_analysis_id_submission_analyses_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."submission_analyses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_diff_lines" ADD CONSTRAINT "submission_diff_lines_diff_block_id_submission_diff_blocks_id_fk" FOREIGN KEY ("diff_block_id") REFERENCES "public"."submission_diff_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_analyses_score_tenths_idx" ON "submission_analyses" USING btree ("score_tenths");