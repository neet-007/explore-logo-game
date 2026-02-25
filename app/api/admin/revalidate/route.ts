import { NextResponse } from "next/server";
import { invalidateLeaderboardCache, invalidateQuestionsCache } from "@/lib/cache";

type RevalidateBody = {
  target?: "questions" | "leaderboard" | "all";
};

export async function POST(request: Request) {
  const body = (await request.json()) as RevalidateBody;
  const target = body.target || "all";

  if (target === "questions" || target === "all") {
    invalidateQuestionsCache();
  }

  if (target === "leaderboard" || target === "all") {
    invalidateLeaderboardCache();
  }

  return NextResponse.json({ message: "cache_revalidated", target });
}
