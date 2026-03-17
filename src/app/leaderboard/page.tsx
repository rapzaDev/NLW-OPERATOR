import { LeaderboardPreview } from "@/components/home/leaderboard-preview";

export default function LeaderboardPage() {
  return (
    <main className="bg-background">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-8 px-4 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pt-20">
        <LeaderboardPreview footerHref={null} headerActionHref={null} />
      </div>
    </main>
  );
}
