import { NextResponse } from "next/server";
import { getQuestionsCached, getRoundOneQuestionsCached } from "@/lib/cache";

export async function GET() {
  const roundOneQuestions = await getRoundOneQuestionsCached();
  const roundTwoQuestions = await getQuestionsCached();

  const publicRoundOneQuestions = roundOneQuestions.map((question) => ({
    id: question.id,
    leftImagePath: question.leftImagePath,
    rightImagePath: question.rightImagePath,
  }));

  const publicRoundTwoQuestions = roundTwoQuestions.map((question) => ({
    id: question.id,
    logoPath: question.logoPath,
    criteria: question.criteria.map((criterion) => ({
      id: criterion.id,
      textAr: criterion.textAr,
    })),
  }));

  return NextResponse.json({
    roundOneQuestions: publicRoundOneQuestions,
    roundTwoQuestions: publicRoundTwoQuestions,
  });
}
