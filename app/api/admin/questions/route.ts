import { NextResponse } from "next/server";
import { addQuestionToDb } from "@/lib/db";
import { invalidateQuestionsCache } from "@/lib/cache";

type AdminQuestionBody = {
  logoPath?: string;
  criteria?: Array<{ textAr?: string; isOmitted?: boolean }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AdminQuestionBody;
  const logoPath = (body.logoPath || "").trim();

  if (!logoPath) {
    return NextResponse.json({ error: "logo_path_required" }, { status: 400 });
  }

  if (!Array.isArray(body.criteria) || body.criteria.length === 0) {
    return NextResponse.json({ error: "criteria_required" }, { status: 400 });
  }

  const cleanedCriteria = body.criteria
    .map((c) => ({ textAr: (c.textAr || "").trim(), isOmitted: Boolean(c.isOmitted) }))
    .filter((c) => c.textAr.length > 0);

  if (cleanedCriteria.length === 0) {
    return NextResponse.json({ error: "valid_criteria_required" }, { status: 400 });
  }

  const omittedCount = cleanedCriteria.filter((c) => c.isOmitted).length;
  if (omittedCount === 0) {
    return NextResponse.json({ error: "at_least_one_omitted_required" }, { status: 400 });
  }

  const questionId = await addQuestionToDb({
    logoPath,
    criteria: cleanedCriteria,
  });

  invalidateQuestionsCache();

  return NextResponse.json({ message: "question_added", questionId });
}
