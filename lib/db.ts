import { asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { adminUsers, criteria, questions, submissions } from "@/lib/schema";
import type { AnswerPayload, LeaderboardEntry, Question } from "@/lib/types";

let initPromise: Promise<void> | null = null;

const seedData = [
  {
    logoPath: "/AI.png",
    criteria: [
      { textAr: "يوجد رمز عدسة", isOmitted: true },
      { textAr: "يحتوي على لون أزرق", isOmitted: false },
      { textAr: "يتضمن نصًا واضحًا", isOmitted: true },
      { textAr: "يعبر عن الذكاء الاصطناعي", isOmitted: false },
    ],
  },
  {
    logoPath: "/Cyber security.png",
    criteria: [
      { textAr: "يحتوي على درع", isOmitted: false },
      { textAr: "يظهر عنصر قفل", isOmitted: true },
      { textAr: "فيه تدرج لوني", isOmitted: false },
      { textAr: "يتضمن حروف EE", isOmitted: true },
    ],
  },
  {
    logoPath: "/Game Development.png",
    criteria: [
      { textAr: "فيه يد تحكم", isOmitted: false },
      { textAr: "يحتوي على شكل نجمة", isOmitted: true },
      { textAr: "الألوان زاهية", isOmitted: false },
      { textAr: "يحتوي على إطار دائري", isOmitted: true },
    ],
  },
];

async function seedQuestionsIfEmpty() {
  const [result] = await db.select({ value: count() }).from(questions);
  const existingCount = Number(result?.value ?? 0);

  if (existingCount > 0) {
    return;
  }

  await db.transaction(async (tx) => {
    for (const item of seedData) {
      const inserted = await tx.insert(questions).values({ logoPath: item.logoPath }).returning({ id: questions.id });
      const questionId = inserted[0]?.id;

      if (!questionId) {
        throw new Error("failed_to_insert_question");
      }

      await tx.insert(criteria).values(
        item.criteria.map((criterion) => ({
          questionId,
          textAr: criterion.textAr,
          isOmitted: criterion.isOmitted,
        }))
      );
    }
  });
}

export async function initDb() {
  if (!initPromise) {
    initPromise = (async () => {
      await seedQuestionsIfEmpty();
    })();
  }

  await initPromise;
}

export async function getQuestionsFromDb(): Promise<Question[]> {
  await initDb();

  const rows = await db
    .select({
      questionId: questions.id,
      logoPath: questions.logoPath,
      criterionId: criteria.id,
      criterionTextAr: criteria.textAr,
      criterionIsOmitted: criteria.isOmitted,
    })
    .from(questions)
    .innerJoin(criteria, eq(criteria.questionId, questions.id))
    .orderBy(asc(questions.id), asc(criteria.id));

  const byQuestion = new Map<number, Question>();

  for (const row of rows) {
    const existing = byQuestion.get(row.questionId);

    if (!existing) {
      byQuestion.set(row.questionId, {
        id: row.questionId,
        logoPath: row.logoPath,
        criteria: [],
      });
    }

    byQuestion.get(row.questionId)?.criteria.push({
      id: row.criterionId,
      textAr: row.criterionTextAr,
      isOmitted: row.criterionIsOmitted,
    });
  }

  return Array.from(byQuestion.values());
}

export function calculateQuestionScore(question: Question, selectedCriterionIds: number[]): number {
  const correctIds = question.criteria.filter((c) => c.isOmitted).map((c) => c.id);
  const correctSet = new Set(correctIds);
  let questionScore = 0;
  let hasWrongChoice = false;

  for (const selectedId of selectedCriterionIds) {
    if (correctSet.has(selectedId)) {
      questionScore += 1;
    } else {
      hasWrongChoice = true;
    }
  }

  if (hasWrongChoice) {
    questionScore = 0;
  }

  return questionScore;
}

export function validateSingleQuestionAnswer(question: Question, selectedCriterionIds: number[]) {
  const validCriterionIds = new Set(question.criteria.map((criterion) => criterion.id));
  const correctIds = question.criteria.filter((criterion) => criterion.isOmitted).map((criterion) => criterion.id);
  const correctSet = new Set(correctIds);

  for (const criterionId of selectedCriterionIds) {
    if (typeof criterionId !== "number") {
      throw new Error("invalid_criterion_id_type");
    }

    if (!validCriterionIds.has(criterionId)) {
      throw new Error("invalid_criterion_for_question");
    }
  }

  const uniqueSelected = Array.from(new Set(selectedCriterionIds));
  const hasWrongChoice = uniqueSelected.some((criterionId) => !correctSet.has(criterionId));
  const correctPicked = uniqueSelected.filter((criterionId) => correctSet.has(criterionId)).length;
  const totalCorrect = correctIds.length;
  const questionScore = hasWrongChoice ? 0 : correctPicked;

  return {
    questionScore,
    correctPicked,
    totalCorrect,
  };
}

export async function calculateGameScore(answers: AnswerPayload[]) {
  const questionsFromDb = await getQuestionsFromDb();

  if (answers.length !== questionsFromDb.length) {
    throw new Error("answers_length_mismatch");
  }

  const questionMap = new Map(questionsFromDb.map((q) => [q.id, q]));
  const answeredQuestionIds = new Set<number>();
  const maxScore = questionsFromDb.reduce((sum, question) => {
    const questionMax = question.criteria.filter((criterion) => criterion.isOmitted).length;
    return sum + questionMax;
  }, 0);

  let totalScore = 0;

  for (const answer of answers) {
    if (!answer || typeof answer.questionId !== "number" || !Array.isArray(answer.selectedCriterionIds)) {
      throw new Error("invalid_answer_shape");
    }

    if (!questionMap.has(answer.questionId)) {
      throw new Error("invalid_question_id");
    }

    if (answeredQuestionIds.has(answer.questionId)) {
      throw new Error("duplicate_question_id");
    }

    answeredQuestionIds.add(answer.questionId);

    const question = questionMap.get(answer.questionId)!;
    const result = validateSingleQuestionAnswer(question, answer.selectedCriterionIds);
    totalScore += result.questionScore;
  }

  return {
    score: totalScore,
    maxScore,
  };
}

export async function insertSubmission(playerName: string, answers: AnswerPayload[], score: number, maxScore: number) {
  await initDb();

  await db.insert(submissions).values({
    playerName,
    score,
    maxScore,
    answersJson: JSON.stringify(answers),
  });
}

export async function getLeaderboardFromDb(): Promise<LeaderboardEntry[]> {
  await initDb();

  const rows = await db
    .select({
      id: submissions.id,
      playerName: submissions.playerName,
      score: submissions.score,
      maxScore: submissions.maxScore,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .orderBy(desc(submissions.score), asc(submissions.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    playerName: row.playerName,
    score: Number(row.score),
    maxScore: Number(row.maxScore),
    createdAt: row.createdAt,
  }));
}

export async function addQuestionToDb(input: { logoPath: string; criteria: Array<{ textAr: string; isOmitted: boolean }> }) {
  await initDb();

  const questionId = await db.transaction(async (tx) => {
    const inserted = await tx.insert(questions).values({ logoPath: input.logoPath }).returning({ id: questions.id });
    const newQuestionId = inserted[0]?.id;

    if (!newQuestionId) {
      throw new Error("failed_to_insert_question");
    }

    await tx.insert(criteria).values(
      input.criteria.map((criterion) => ({
        questionId: newQuestionId,
        textAr: criterion.textAr,
        isOmitted: criterion.isOmitted,
      }))
    );

    return newQuestionId;
  });

  return questionId;
}

export async function getAdminByUsername(username: string) {
  await initDb();

  const rows = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      passwordHash: adminUsers.passwordHash,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  return rows[0] || null;
}

export async function getAdminCount() {
  await initDb();
  const [result] = await db.select({ value: count() }).from(adminUsers);
  return Number(result?.value ?? 0);
}

export async function addAdminUserToDb(input: { username: string; passwordHash: string }) {
  await initDb();

  const inserted = await db
    .insert(adminUsers)
    .values({
      username: input.username,
      passwordHash: input.passwordHash,
    })
    .returning({ id: adminUsers.id });

  return inserted[0]?.id ?? null;
}
