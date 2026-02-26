"use server";

import { getLeaderboardCached, getQuestionsCached, getRoundOneQuestionsCached, invalidateLeaderboardCache, invalidateQuestionsCache } from "@/lib/cache";
import {
  addAdminUserToDb,
  addRoundOneQuestionToDb,
  addRoundOneQuestionsBulkToDb,
  addQuestionToDb,
  addRoundTwoQuestionsBulkToDb,
  calculateGameScore,
  getAdminByUsername,
  getAdminCount,
  insertSubmission,
  validateRoundOneAnswer,
  validateSingleQuestionAnswer,
} from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import type { AnswerPayload, LeaderboardEntry, PublicQuestion, PublicRoundOneQuestion, RoundOneAnswerPayload } from "@/lib/types";

type ActionError = {
  ok: false;
  error: string;
};

type QuestionsActionResult =
  | { ok: true; roundOneQuestions: PublicRoundOneQuestion[]; roundTwoQuestions: PublicQuestion[] }
  | ActionError;

type LeaderboardActionResult =
  | { ok: true; leaderboard: LeaderboardEntry[] }
  | ActionError;

type SubmitActionResult =
  | { ok: true; score: number; maxScore: number }
  | ActionError;

type ValidateQuestionActionResult =
  | { ok: true; questionScore: number; correctPicked: number; totalCorrect: number }
  | ActionError;

type ValidateRoundOneActionResult =
  | { ok: true; questionScore: number; isCorrect: boolean; correctOption: "left" | "right" }
  | ActionError;

type RoundOneCorrectOptionResult =
  | { ok: true; correctOption: "left" | "right" }
  | ActionError;

type AddQuestionActionResult =
  | { ok: true; questionId: number }
  | ActionError;

type AddBulkActionResult =
  | { ok: true; count: number }
  | ActionError;

type RevalidateActionResult =
  | { ok: true; target: "questions" | "leaderboard" | "all" }
  | ActionError;

type VerifyAdminActionResult =
  | { ok: true; message: string }
  | ActionError;

type AddAdminUserActionResult =
  | { ok: true; adminId: number }
  | ActionError;

type AdminCredentials = {
  username: string;
  password: string;
};

async function requireAdminAuth(input: AdminCredentials): Promise<{ ok: true } | ActionError> {
  const username = (input.username || "").trim();
  const password = input.password || "";

  if (!username || !password) {
    return { ok: false, error: "admin_credentials_required" };
  }

  const admin = await getAdminByUsername(username);
  if (!admin) {
    return { ok: false, error: "invalid_admin_credentials" };
  }

  if (!verifyPassword(password, admin.passwordHash)) {
    return { ok: false, error: "invalid_admin_credentials" };
  }

  return { ok: true };
}

export async function getQuestionsAction(): Promise<QuestionsActionResult> {
  try {
    const roundOneQuestions = await getRoundOneQuestionsCached();
    const roundTwoQuestions = await getQuestionsCached();

    const publicRoundOneQuestions: PublicRoundOneQuestion[] = roundOneQuestions.map((question) => ({
      id: question.id,
      leftImagePath: question.leftImagePath,
      rightImagePath: question.rightImagePath,
    }));

    const publicRoundTwoQuestions: PublicQuestion[] = roundTwoQuestions.map((question) => ({
      id: question.id,
      logoPath: question.logoPath,
      criteria: question.criteria.map((criterion) => ({
        id: criterion.id,
        textAr: criterion.textAr,
      })),
    }));

    return { ok: true, roundOneQuestions: publicRoundOneQuestions, roundTwoQuestions: publicRoundTwoQuestions };
  } catch {
    return { ok: false, error: "failed_to_load_questions" };
  }
}

export async function validateRoundOneQuestionAction(input: {
  questionId: number;
  selectedOption: "left" | "right";
}): Promise<ValidateRoundOneActionResult> {
  if (typeof input.questionId !== "number") {
    return { ok: false, error: "invalid_round_one_question_id" };
  }

  if (input.selectedOption !== "left" && input.selectedOption !== "right") {
    return { ok: false, error: "invalid_round_one_option" };
  }

  try {
    const questions = await getRoundOneQuestionsCached();
    const question = questions.find((item) => item.id === input.questionId);

    if (!question) {
      return { ok: false, error: "invalid_round_one_question_id" };
    }

    const result = validateRoundOneAnswer(question, input.selectedOption);
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed_to_validate_round_one_question",
    };
  }
}

export async function getRoundOneCorrectOptionAction(input: { questionId: number }): Promise<RoundOneCorrectOptionResult> {
  if (typeof input.questionId !== "number") {
    return { ok: false, error: "invalid_round_one_question_id" };
  }

  try {
    const questions = await getRoundOneQuestionsCached();
    const question = questions.find((item) => item.id === input.questionId);

    if (!question) {
      return { ok: false, error: "invalid_round_one_question_id" };
    }

    return { ok: true, correctOption: question.correctOption };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed_to_get_round_one_correct_option",
    };
  }
}

export async function validateQuestionAction(input: {
  questionId: number;
  selectedCriterionIds: number[];
}): Promise<ValidateQuestionActionResult> {
  if (typeof input.questionId !== "number") {
    return { ok: false, error: "invalid_question_id" };
  }

  if (!Array.isArray(input.selectedCriterionIds)) {
    return { ok: false, error: "selected_criteria_required" };
  }

  try {
    const questions = await getQuestionsCached();
    const question = questions.find((item) => item.id === input.questionId);

    if (!question) {
      return { ok: false, error: "invalid_question_id" };
    }

    const result = validateSingleQuestionAnswer(question, input.selectedCriterionIds);
    return { ok: true, ...result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "failed_to_validate_question",
    };
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
  roundOneAnswers: RoundOneAnswerPayload[];
  roundTwoAnswers: AnswerPayload[];
}): Promise<SubmitActionResult> {
  const playerName = (input.playerName || "").trim();

  if (!playerName) {
    return { ok: false, error: "player_name_required" };
  }

  if (!Array.isArray(input.roundOneAnswers) || !Array.isArray(input.roundTwoAnswers)) {
    return { ok: false, error: "answers_required" };
  }

  try {
    const { score, maxScore } = await calculateGameScore({
      roundOneAnswers: input.roundOneAnswers,
      roundTwoAnswers: input.roundTwoAnswers,
    });

    await insertSubmission(
      playerName,
      {
        roundOneAnswers: input.roundOneAnswers,
        roundTwoAnswers: input.roundTwoAnswers,
      },
      score,
      maxScore
    );

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
  admin: AdminCredentials;
  logoPath: string;
  criteria: Array<{ textAr: string; isOmitted: boolean }>;
}): Promise<AddQuestionActionResult> {
  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

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

export async function addRoundOneQuestionAction(input: {
  admin: AdminCredentials;
  leftImagePath: string;
  rightImagePath: string;
  correctOption: "left" | "right";
}): Promise<AddQuestionActionResult> {
  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

  const leftImagePath = (input.leftImagePath || "").trim();
  const rightImagePath = (input.rightImagePath || "").trim();

  if (!leftImagePath || !rightImagePath) {
    return { ok: false, error: "round_one_image_paths_required" };
  }

  if (input.correctOption !== "left" && input.correctOption !== "right") {
    return { ok: false, error: "invalid_round_one_option" };
  }

  try {
    const questionId = await addRoundOneQuestionToDb({
      leftImagePath,
      rightImagePath,
      correctOption: input.correctOption,
    });

    if (!questionId) {
      return { ok: false, error: "failed_to_add_round_one_question" };
    }

    invalidateQuestionsCache();
    return { ok: true, questionId };
  } catch {
    return { ok: false, error: "failed_to_add_round_one_question" };
  }
}

export async function addRoundOneQuestionsBulkAction(input: {
  admin: AdminCredentials;
  questions: Array<{ leftImagePath: string; rightImagePath: string; correctOption: "left" | "right" }>;
}): Promise<AddBulkActionResult> {
  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    return { ok: false, error: "bulk_questions_required" };
  }

  const cleaned = input.questions
    .map((question) => ({
      leftImagePath: (question.leftImagePath || "").trim(),
      rightImagePath: (question.rightImagePath || "").trim(),
      correctOption: question.correctOption,
    }))
    .filter((question) => question.leftImagePath && question.rightImagePath && (question.correctOption === "left" || question.correctOption === "right"));

  if (cleaned.length === 0) {
    return { ok: false, error: "valid_bulk_round_one_questions_required" };
  }

  try {
    const count = await addRoundOneQuestionsBulkToDb(cleaned);
    invalidateQuestionsCache();
    return { ok: true, count };
  } catch {
    return { ok: false, error: "failed_to_add_bulk_round_one_questions" };
  }
}

export async function addRoundTwoQuestionsBulkAction(input: {
  admin: AdminCredentials;
  questions: Array<{ logoPath: string; criteria: Array<{ textAr: string; isOmitted: boolean }> }>;
}): Promise<AddBulkActionResult> {
  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    return { ok: false, error: "bulk_questions_required" };
  }

  const cleaned = input.questions
    .map((question) => ({
      logoPath: (question.logoPath || "").trim(),
      criteria: Array.isArray(question.criteria)
        ? question.criteria
            .map((criterion) => ({ textAr: (criterion.textAr || "").trim(), isOmitted: Boolean(criterion.isOmitted) }))
            .filter((criterion) => criterion.textAr.length > 0)
        : [],
    }))
    .filter((question) => {
      if (!question.logoPath || question.criteria.length === 0) {
        return false;
      }
      return question.criteria.some((criterion) => criterion.isOmitted);
    });

  if (cleaned.length === 0) {
    return { ok: false, error: "valid_bulk_round_two_questions_required" };
  }

  try {
    const count = await addRoundTwoQuestionsBulkToDb(cleaned);
    invalidateQuestionsCache();
    return { ok: true, count };
  } catch {
    return { ok: false, error: "failed_to_add_bulk_round_two_questions" };
  }
}

export async function revalidateCacheAction(input: { admin: AdminCredentials; target: "questions" | "leaderboard" | "all" }): Promise<RevalidateActionResult> {
  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

  const target = input.target;
  if (target === "questions" || target === "all") {
    invalidateQuestionsCache();
  }

  if (target === "leaderboard" || target === "all") {
    invalidateLeaderboardCache();
  }

  return { ok: true, target };
}

export async function verifyAdminAction(input: AdminCredentials): Promise<VerifyAdminActionResult> {
  const authResult = await requireAdminAuth(input);
  if (!authResult.ok) {
    return authResult;
  }

  return { ok: true, message: "admin_authenticated" };
}

export async function addAdminUserAction(input: {
  admin: AdminCredentials;
  newUsername: string;
  newPassword: string;
}): Promise<AddAdminUserActionResult> {
  const existingAdminCount = await getAdminCount();
  if (existingAdminCount === 0) {
    return { ok: false, error: "no_admin_exists_seed_from_db" };
  }

  const authResult = await requireAdminAuth(input.admin);
  if (!authResult.ok) {
    return authResult;
  }

  const newUsername = (input.newUsername || "").trim();
  const newPassword = input.newPassword || "";

  if (!newUsername || !newPassword) {
    return { ok: false, error: "new_admin_credentials_required" };
  }

  const exists = await getAdminByUsername(newUsername);
  if (exists) {
    return { ok: false, error: "admin_username_exists" };
  }

  const passwordHash = hashPassword(newPassword);
  const adminId = await addAdminUserToDb({ username: newUsername, passwordHash });

  if (!adminId) {
    return { ok: false, error: "failed_to_add_admin" };
  }

  return { ok: true, adminId };
}
