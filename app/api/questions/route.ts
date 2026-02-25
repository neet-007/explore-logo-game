import { NextResponse } from "next/server";
import { getQuestionsCached } from "@/lib/cache";

export async function GET() {
  const questions = await getQuestionsCached();
  return NextResponse.json({ questions });
}
