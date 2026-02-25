import { NextResponse } from "next/server";
import { invalidateLeaderboardCache, invalidateQuestionsCache } from "@/lib/cache";
import { getAdminByUsername } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

type RevalidateBody = {
  admin?: { username?: string; password?: string };
  target?: "questions" | "leaderboard" | "all";
};

export async function POST(request: Request) {
  const body = (await request.json()) as RevalidateBody;

  const username = (body.admin?.username || "").trim();
  const password = body.admin?.password || "";

  if (!username || !password) {
    return NextResponse.json({ error: "admin_credentials_required" }, { status: 401 });
  }

  const admin = await getAdminByUsername(username);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "invalid_admin_credentials" }, { status: 401 });
  }

  const target = body.target || "all";

  if (target === "questions" || target === "all") {
    invalidateQuestionsCache();
  }

  if (target === "leaderboard" || target === "all") {
    invalidateLeaderboardCache();
  }

  return NextResponse.json({ message: "cache_revalidated", target });
}
