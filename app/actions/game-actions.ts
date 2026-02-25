"use server";

import { getLeaderboardCached, getQuestionsCached, invalidateLeaderboardCache, invalidateQuestionsCache } from "@/lib/cache";
import { addQuestionToDb, calculateGameScore, insertSubmission } from "@/lib/db";
import type { AnswerPayload, LeaderboardEntry, Question } from "@/lib/types";

type ActionError = {
  ok: false;
  error: string;
};

type QuestionsActionResult =
  | { ok: true; questions: Question[] }
  | ActionError;

type LeaderboardActionResult =
  | { ok: true; leaderboard: LeaderboardEntry[] }
  | ActionError;

type SubmitActionResult =
  | { ok: true; score: number; maxScore: number }
  | ActionError;

type AddQuestionActionResult =
  | { ok: true; questionId: number }
  | ActionError;

type RevalidateActionResult =
  | { ok: true; target: "questions" | "leaderboard" | "all" }
  | ActionError;

export async function getQuestionsAction(): Promise<QuestionsActionResult> {
  try {
    const questions = await getQuestionsCached();
    return { ok: true, questions };
  } catch {
    return { ok: false, error: "failed_to_load_questions" };
  }
}

export async function getLeaderboardAction(): Promise<LeaderboardActionResult> {
  try {
    const leaderboard = await getLeaderboardCached();
    return { ok: true, leaderboard };
  } catch {
    return { ok: false, error: "failed_to_load_leaderboard" };
  }
}

export async function submitGameAction(input: {
  playerName: string;
  answers: AnswerPayload[];
}): Promise<SubmitActionResult> {
  const playerName = (input.playerName || "").trim();

  if (!playerName) {
    return { ok: false, error: "player_name_required" };
  }

  if (!Array.isArray(input.answers)) {
    return { ok: false, error: "answers_required" };
  }

  try {
    const { score, maxScore } = await calculateGameScore(input.answers);
    await insertSubmission(playerName, input.answers, score, maxScore);
    invalidateLeaderboardCache();

    return { ok: true, score, maxScore };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed_to_submit_game",
    };
  }
}

export async function addQuestionAction(input: {
  logoPath: string;
  criteria: Array<{ textAr: string; isOmitted: boolean }>;
}): Promise<AddQuestionActionResult> {
  const logoPath = (input.logoPath || "").trim();

  if (!logoPath) {
    return { ok: false, error: "logo_path_required" };
  }

  if (!Array.isArray(input.criteria) || input.criteria.length === 0) {
    return { ok: false, error: "criteria_required" };
  }

  const cleanedCriteria = input.criteria
    .map((criterion) => ({
      textAr: (criterion.textAr || "").trim(),
      isOmitted: Boolean(criterion.isOmitted),
    }))
    .filter((criterion) => criterion.textAr.length > 0);

  if (cleanedCriteria.length === 0) {
    return { ok: false, error: "valid_criteria_required" };
  }

  const omittedCount = cleanedCriteria.filter((criterion) => criterion.isOmitted).length;
  if (omittedCount === 0) {
    return { ok: false, error: "at_least_one_omitted_required" };
  }

  try {
    const questionId = await addQuestionToDb({
      logoPath,
      criteria: cleanedCriteria,
    });

    invalidateQuestionsCache();

    return { ok: true, questionId };
  } catch {
    return { ok: false, error: "failed_to_add_question" };
  }
}

export async function revalidateCacheAction(target: "questions" | "leaderboard" | "all"): Promise<RevalidateActionResult> {
  if (target === "questions" || target === "all") {
    invalidateQuestionsCache();
  }

  if (target === "leaderboard" || target === "all") {
    invalidateLeaderboardCache();
  }

  return { ok: true, target };
}
