import { unstable_cache, revalidateTag } from "next/cache";
import { getLeaderboardFromDb, getQuestionsFromDb } from "@/lib/db";

export const getQuestionsCached = unstable_cache(async () => {
  return getQuestionsFromDb();
}, ["questions-cache-v1"], {
  tags: ["questions"],
});

export const getLeaderboardCached = unstable_cache(async () => {
  return getLeaderboardFromDb();
}, ["leaderboard-cache-v1"], {
  tags: ["leaderboard"],
});

export function invalidateQuestionsCache() {
  revalidateTag("questions");
}

export function invalidateLeaderboardCache() {
  revalidateTag("leaderboard");
}
