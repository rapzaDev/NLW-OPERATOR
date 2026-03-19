import type { Metadata } from "next";
import { LeaderboardPageScreen } from "@/components/leaderboard/leaderboard-page";

export const metadata: Metadata = {
  title: "Shame Leaderboard | devroast",
  description: "Ranking dinâmico com os roasts reais persistidos no devroast.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  return <LeaderboardPageScreen />;
}
