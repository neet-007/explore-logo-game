import { unstable_cache, revalidateTag } from "next/cache";
import { getLeaderboardFromDb, getQuestionsFromDb, getRoundOneQuestionsFromDb } from "@/lib/db";

export const getQuestionsCached = unstable_cache(async () => {
  return getQuestionsFromDb();
}, ["questions-cache-v1"], {
  tags: ["questions"],
});

export const getRoundOneQuestionsCached = unstable_cache(async () => {
  return getRoundOneQuestionsFromDb();
}, ["round-one-questions-cache-v1"], {
  tags: ["round-one-questions"],
});

export const getLeaderboardCached = unstable_cache(async () => {
  return getLeaderboardFromDb();
}, ["leaderboard-cache-v1"], {
  tags: ["leaderboard"],
});

export function invalidateQuestionsCache() {
  revalidateTag("questions", "max");
  revalidateTag("round-one-questions", "max");
}

export function invalidateLeaderboardCache() {
  revalidateTag("leaderboard", "max");
}
