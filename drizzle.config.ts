import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { DEFAULT_DATABASE_URL } from "./src/db/constants";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/db/schema/enums.ts",
    "./src/db/schema/roasts.ts",
    "./src/db/schema/analysis-items.ts",
    "./src/db/schema/submissions.ts",
    "./src/db/schema/submission-analyses.ts",
    "./src/db/schema/submission-analysis-items.ts",
    "./src/db/schema/submission-diff-blocks.ts",
    "./src/db/schema/submission-diff-lines.ts",
  ],
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
