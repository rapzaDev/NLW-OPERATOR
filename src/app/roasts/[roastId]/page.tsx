import { redirect } from "next/navigation";

type LegacyRoastResultPageProps = {
  params: Promise<{
    roastId: string;
  }>;
};

export default async function LegacyRoastResultPage({
  params,
}: LegacyRoastResultPageProps) {
  const { roastId } = await params;

  redirect(`/roast/${roastId}`);
}
