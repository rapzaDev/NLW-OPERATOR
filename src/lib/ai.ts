import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  type AnalysisSeverity,
  analysisSeverityValues,
  type RoastVerdict,
  roastVerdictValues,
} from "./roast";

export const roastModel = openai("gpt-4o-mini");

export const roastOutputSchema = z.object({
  analysisItems: z.array(
    z.object({
      description: z.string().trim().min(1),
      severity: z.enum(analysisSeverityValues),
      title: z.string().trim().min(1),
    }),
  ),
  roastQuote: z.string().trim().min(1),
  score: z.number().min(0).max(10),
  suggestedFix: z.string().trim().min(1),
  verdict: z.enum(roastVerdictValues),
});

export type RoastOutput = z.infer<typeof roastOutputSchema>;

export function getSystemPrompt(roastMode: boolean) {
  const voice = roastMode
    ? "You are a sarcastic senior engineer delivering a funny but accurate roast."
    : "You are a constructive senior engineer delivering a clear, professional code review.";

  return `${voice}

Return only structured output with:
- score from 0 to 10
- verdict using exactly one allowed enum
- one roastQuote
- 3 to 6 analysisItems ordered by impact
- one full suggestedFix

Keep every title and description grounded in the submitted code.`;
}

export type GenerateRoastInput = {
  code: string;
  language: string;
  roastMode: boolean;
};

export async function generateRoastOutput({
  code,
  language,
  roastMode,
}: GenerateRoastInput): Promise<RoastOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to generate roasts.");
  }

  const { output } = await generateText({
    model: roastModel,
    output: Output.object({
      description: "Structured roast result for a submitted code snippet.",
      name: "roast_result",
      schema: roastOutputSchema,
    }),
    prompt: `Language: ${language}\n\nCode:\n${code}`,
    system: getSystemPrompt(roastMode),
  });

  return output;
}

export function getVerdictBadgeTone(
  verdict: RoastVerdict,
): AnalysisSeverity | "warning" {
  switch (verdict) {
    case "needs_serious_help":
      return "critical";
    case "rough_around_edges":
    case "decent_code":
      return "warning";
    case "solid_work":
    case "exceptional":
      return "good";
  }
}
