import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoastResultsPageScreen } from "@/components/roast-results/roast-results-page";
import { createRoastPageMetadata } from "@/lib/roast-metadata";
import { caller } from "@/trpc/server";

type RoastResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getRoastId(params: RoastResultPageProps["params"]) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  return id;
}

export async function generateMetadata({
  params,
}: RoastResultPageProps): Promise<Metadata> {
  const roastId = await getRoastId(params);

  try {
    const roast = await caller.roast.getById({ id: roastId });

    return createRoastPageMetadata({
      id: roast.id,
      language: roast.language,
      roastQuote: roast.roastQuote,
      score: roast.score,
      verdict: roast.verdict,
    });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}

export default async function RoastResultPage({
  params,
}: RoastResultPageProps) {
  const roastId = await getRoastId(params);

  try {
    const roast = await caller.roast.getById({ id: roastId });

    return <RoastResultsPageScreen roast={roast} />;
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }
}
