import Link from "next/link";
import { buttonVariants } from "@/components/ui";

export function AppNavbar() {
  return (
    <header className="border-b border-stroke bg-background">
      <div className="flex h-14 items-center justify-between px-6 sm:px-8 lg:px-10">
        <Link
          className="inline-flex items-center gap-2 font-display text-[18px] font-medium text-foreground transition-colors hover:text-accent-green"
          href="/"
        >
          <span className="text-[20px] font-bold text-accent-green">{">"}</span>
          <span>devroast</span>
        </Link>

        <Link
          className={buttonVariants({
            className: "text-[13px] hover:text-foreground",
            size: "sm",
            variant: "link",
          })}
          href="/leaderboard"
        >
          leaderboard
        </Link>
      </div>
    </header>
  );
}
