import LeaderboardClient from "@/app/leaderboard/leaderboard-client";
import { getLeaderboardAction } from "@/app/actions/game-actions";
import type { LeaderboardEntry } from "@/lib/types";

export default async function LeaderboardPage() {
  const result = await getLeaderboardAction();

  const initialEntries: LeaderboardEntry[] = result.ok ? result.leaderboard : [];
  const initialError = result.ok ? "" : result.error;

  return <LeaderboardClient initialEntries={initialEntries} initialError={initialError} />;
}
