import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  type CreateRoastInput,
  createRoast as createRoastRecord,
  getRoastById as getPersistedRoastById,
  type RoastDetails,
} from "@/db/queries/roasts";
import {
  type GenerateRoastInput,
  generateRoastOutput as generateRoastOutputFromModel,
  type RoastOutput,
} from "@/lib/ai";
import {
  countRoastLines,
  DEFAULT_ROAST_LANGUAGE,
  MAX_ROAST_CHARACTERS,
} from "@/lib/roast";
import { createTRPCRouter, publicProcedure } from "../init";

type RoastRouterDependencies = {
  createRoast?: (
    input: CreateRoastInput,
    database: Parameters<typeof createRoastRecord>[1],
  ) => Promise<{
    createdAt: Date;
    id: string;
  }>;
  generateRoastOutput?: (input: GenerateRoastInput) => Promise<RoastOutput>;
  getRoastById?: (
    id: string,
    database: Parameters<typeof getPersistedRoastById>[1],
  ) => Promise<RoastDetails | null>;
};

export function createRoastRouter(dependencies: RoastRouterDependencies = {}) {
  const createRoast =
    dependencies.createRoast ??
    ((input, database) => createRoastRecord(input, database));
  const generateRoastOutput =
    dependencies.generateRoastOutput ?? generateRoastOutputFromModel;
  const getRoastById =
    dependencies.getRoastById ??
    ((id, database) => getPersistedRoastById(id, database));

  return createTRPCRouter({
    create: publicProcedure
      .input(
        z.object({
          code: z.string().trim().min(1).max(MAX_ROAST_CHARACTERS),
          language: z.string().trim().min(1),
          roastMode: z.boolean(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const language = input.language || DEFAULT_ROAST_LANGUAGE;
        let roastOutput: RoastOutput;

        try {
          roastOutput = await generateRoastOutput({
            code: input.code,
            language,
            roastMode: input.roastMode,
          });
        } catch (error) {
          throw new TRPCError({
            cause: error,
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to generate roast right now.",
          });
        }

        let roast: Awaited<ReturnType<typeof createRoast>>;

        try {
          roast = await createRoast(
            {
              analysisItems: roastOutput.analysisItems,
              code: input.code,
              language,
              lineCount: countRoastLines(input.code),
              roastMode: input.roastMode,
              roastQuote: roastOutput.roastQuote,
              score: roastOutput.score,
              suggestedFix: roastOutput.suggestedFix,
              verdict: roastOutput.verdict,
            },
            ctx.db,
          );
        } catch (error) {
          throw new TRPCError({
            cause: error,
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to save roast right now.",
          });
        }

        return {
          id: roast.id,
        };
      }),
    getById: publicProcedure
      .input(
        z.object({
          id: z.string().uuid(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const roast = await getRoastById(input.id, ctx.db);

        if (!roast) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Roast not found.",
          });
        }

        return roast;
      }),
  });
}

export const roastRouter = createRoastRouter();
