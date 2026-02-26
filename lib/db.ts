import { asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { adminUsers, criteria, questions, roundOneQuestions, submissions } from "@/lib/schema";
import type { AnswerPayload, LeaderboardEntry, Question, RoundOneAnswerPayload, RoundOneQuestion } from "@/lib/types";

let initPromise: Promise<void> | null = null;

const roundTwoSeedData = [
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

const roundOneSeedData: Array<{ leftImagePath: string; rightImagePath: string; correctOption: "left" | "right" }> = [
    {
        leftImagePath: "/AI.png",
        rightImagePath: "/Graphic.png",
        correctOption: "left",
    },
    {
        leftImagePath: "/Freelancing.png",
        rightImagePath: "/Cyber security.png",
        correctOption: "right",
    },
    {
        leftImagePath: "/Game Development.png",
        rightImagePath: "/Computer Vision.png",
        correctOption: "left",
    },
];

async function seedRoundTwoQuestionsIfEmpty() {
    const [result] = await db.select({ value: count() }).from(questions);
    const existingCount = Number(result?.value ?? 0);

    if (existingCount > 0) {
        return;
    }

    await db.transaction(async (tx) => {
        for (const item of roundTwoSeedData) {
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

async function seedRoundOneQuestionsIfEmpty() {
    const [result] = await db.select({ value: count() }).from(roundOneQuestions);
    const existingCount = Number(result?.value ?? 0);

    if (existingCount > 0) {
        return;
    }

    await db.insert(roundOneQuestions).values(roundOneSeedData);
}

export async function initDb() {
    if (!initPromise) {
        initPromise = (async () => {
            //await seedRoundTwoQuestionsIfEmpty();
            //await seedRoundOneQuestionsIfEmpty();
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

export async function getRoundOneQuestionsFromDb(): Promise<RoundOneQuestion[]> {
    await initDb();

    const rows = await db
        .select({
            id: roundOneQuestions.id,
            leftImagePath: roundOneQuestions.leftImagePath,
            rightImagePath: roundOneQuestions.rightImagePath,
            correctOption: roundOneQuestions.correctOption,
        })
        .from(roundOneQuestions)
        .orderBy(asc(roundOneQuestions.id));

    return rows.map((row) => ({
        id: row.id,
        leftImagePath: row.leftImagePath,
        rightImagePath: row.rightImagePath,
        correctOption: row.correctOption as "left" | "right",
    }));
}

export function validateRoundOneAnswer(question: RoundOneQuestion, selectedOption: "left" | "right") {
    return {
        isCorrect: selectedOption === question.correctOption,
        correctOption: question.correctOption,
        questionScore: selectedOption === question.correctOption ? 1 : 0,
    };
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

export async function calculateGameScore(input: {
    roundOneAnswers: RoundOneAnswerPayload[];
    roundTwoAnswers: AnswerPayload[];
}) {
    const roundOneQuestionsFromDb = await getRoundOneQuestionsFromDb();
    const roundTwoQuestionsFromDb = await getQuestionsFromDb();

    const roundOneQuestionMap = new Map(roundOneQuestionsFromDb.map((q) => [q.id, q]));
    const answeredRoundOneQuestionIds = new Set<number>();

    let roundOneScore = 0;

    for (const answer of input.roundOneAnswers) {
        if (!answer || typeof answer.questionId !== "number") {
            throw new Error("invalid_round_one_answer_shape");
        }

        if (answer.selectedOption !== "left" && answer.selectedOption !== "right") {
            throw new Error("invalid_round_one_option");
        }

        if (!roundOneQuestionMap.has(answer.questionId)) {
            throw new Error("invalid_round_one_question_id");
        }

        if (answeredRoundOneQuestionIds.has(answer.questionId)) {
            throw new Error("duplicate_round_one_question_id");
        }

        answeredRoundOneQuestionIds.add(answer.questionId);

        const question = roundOneQuestionMap.get(answer.questionId)!;
        const result = validateRoundOneAnswer(question, answer.selectedOption);
        roundOneScore += result.questionScore;
    }

    if (input.roundTwoAnswers.length !== roundTwoQuestionsFromDb.length) {
        throw new Error("answers_length_mismatch");
    }

    const roundTwoQuestionMap = new Map(roundTwoQuestionsFromDb.map((q) => [q.id, q]));
    const answeredRoundTwoQuestionIds = new Set<number>();

    const roundTwoMaxScore = roundTwoQuestionsFromDb.reduce((sum, question) => {
        const questionMax = question.criteria.filter((criterion) => criterion.isOmitted).length;
        return sum + questionMax;
    }, 0);

    let roundTwoScore = 0;

    for (const answer of input.roundTwoAnswers) {
        if (!answer || typeof answer.questionId !== "number" || !Array.isArray(answer.selectedCriterionIds)) {
            throw new Error("invalid_answer_shape");
        }

        if (!roundTwoQuestionMap.has(answer.questionId)) {
            throw new Error("invalid_question_id");
        }

        if (answeredRoundTwoQuestionIds.has(answer.questionId)) {
            throw new Error("duplicate_question_id");
        }

        answeredRoundTwoQuestionIds.add(answer.questionId);

        const question = roundTwoQuestionMap.get(answer.questionId)!;
        const result = validateSingleQuestionAnswer(question, answer.selectedCriterionIds);
        roundTwoScore += result.questionScore;
    }

    return {
        score: roundOneScore + roundTwoScore,
        maxScore: roundOneQuestionsFromDb.length + roundTwoMaxScore,
    };
}

export async function insertSubmission(
    playerName: string,
    input: { roundOneAnswers: RoundOneAnswerPayload[]; roundTwoAnswers: AnswerPayload[] },
    score: number,
    maxScore: number
) {
    await initDb();

    await db.insert(submissions).values({
        playerName,
        score,
        maxScore,
        answersJson: JSON.stringify(input),
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

export async function addRoundOneQuestionToDb(input: {
    leftImagePath: string;
    rightImagePath: string;
    correctOption: "left" | "right";
}) {
    await initDb();

    const inserted = await db
        .insert(roundOneQuestions)
        .values({
            leftImagePath: input.leftImagePath,
            rightImagePath: input.rightImagePath,
            correctOption: input.correctOption,
        })
        .returning({ id: roundOneQuestions.id });

    return inserted[0]?.id ?? null;
}

export async function addRoundOneQuestionsBulkToDb(
    input: Array<{ leftImagePath: string; rightImagePath: string; correctOption: "left" | "right" }>
) {
    await initDb();

    if (input.length === 0) {
        return 0;
    }

    await db.insert(roundOneQuestions).values(
        input.map((item) => ({
            leftImagePath: item.leftImagePath,
            rightImagePath: item.rightImagePath,
            correctOption: item.correctOption,
        }))
    );

    return input.length;
}

export async function addRoundTwoQuestionsBulkToDb(input: Array<{ logoPath: string; criteria: Array<{ textAr: string; isOmitted: boolean }> }>) {
    await initDb();

    if (input.length === 0) {
        return 0;
    }

    await db.transaction(async (tx) => {
        for (const item of input) {
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

    return input.length;
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
