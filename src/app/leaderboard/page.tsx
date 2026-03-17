import type { Metadata } from "next";
import { LeaderboardPageScreen } from "@/components/leaderboard/leaderboard-page";

export const metadata: Metadata = {
  title: "Shame Leaderboard | devroast",
  description: "Ranking estático com os snippets mais roasted do devroast.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  return <LeaderboardPageScreen />;
}
