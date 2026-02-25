import { NextResponse } from "next/server";
import { getLeaderboardCached } from "@/lib/cache";

export async function GET() {
  const leaderboard = await getLeaderboardCached();
  return NextResponse.json({ leaderboard });
}
