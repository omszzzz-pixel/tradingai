import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="lg:h-full lg:overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4">
        <Leaderboard />
      </div>
    </div>
  );
}
