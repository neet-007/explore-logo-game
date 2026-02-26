import { NextResponse } from "next/server";
import { calculateGameScore, insertSubmission } from "@/lib/db";
import { invalidateLeaderboardCache } from "@/lib/cache";
import type { AnswerPayload, RoundOneAnswerPayload } from "@/lib/types";

type SubmitBody = {
  playerName?: string;
  roundOneAnswers?: RoundOneAnswerPayload[];
  roundTwoAnswers?: AnswerPayload[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitBody;
  const playerName = (body.playerName || "").trim();
  const roundOneAnswers = body.roundOneAnswers;
  const roundTwoAnswers = body.roundTwoAnswers;

  if (!playerName) {
    return NextResponse.json({ error: "player_name_required" }, { status: 400 });
  }

  if (!Array.isArray(roundOneAnswers) || !Array.isArray(roundTwoAnswers)) {
    return NextResponse.json({ error: "answers_required" }, { status: 400 });
  }

  try {
    const { score, maxScore } = await calculateGameScore({ roundOneAnswers, roundTwoAnswers });
    await insertSubmission(playerName, { roundOneAnswers, roundTwoAnswers }, score, maxScore);
    invalidateLeaderboardCache();

    return NextResponse.json({
      score,
      maxScore,
      message: "submission_saved",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 400 }
    );
  }
}
