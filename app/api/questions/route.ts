import { NextResponse } from "next/server";
import { getQuestionsCached } from "@/lib/cache";

export async function GET() {
  const questions = await getQuestionsCached();
  const publicQuestions = questions.map((question) => ({
    id: question.id,
    logoPath: question.logoPath,
    criteria: question.criteria.map((criterion) => ({
      id: criterion.id,
      textAr: criterion.textAr,
    })),
  }));

  return NextResponse.json({ questions: publicQuestions });
}
