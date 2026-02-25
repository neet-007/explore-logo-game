"use client";

import Link from "next/link";
import { useState } from "react";
import { getLeaderboardAction } from "@/app/actions/game-actions";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardClient({
  initialEntries,
  initialError,
}: {
  initialEntries: LeaderboardEntry[];
  initialError: string;
}) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  async function refreshLeaderboard() {
    setLoading(true);
    setError("");

    try {
      const result = await getLeaderboardAction();
      if (!result.ok) {
        setError(result.error || "Failed to load leaderboard.");
        return;
      }

      setEntries(result.leaderboard || []);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: "26px", marginBottom: "12px" }}>Leaderboard</h1>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px", backgroundColor: "#111111", overflowX: "auto" }}>
        {loading && <p>Loading leaderboard...</p>}
        {error && <p style={{ color: "#fca5a5" }}>{error}</p>}

        {!loading && !error && entries.length === 0 && <p>No entries yet.</p>}

        {!loading && !error && entries.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "420px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #3f3f46", padding: "8px" }}>#</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #3f3f46", padding: "8px" }}>Player</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #3f3f46", padding: "8px" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={entry.id}>
                  <td style={{ borderBottom: "1px solid #27272a", padding: "8px" }}>{idx + 1}</td>
                  <td style={{ borderBottom: "1px solid #27272a", padding: "8px" }}>{entry.playerName}</td>
                  <td style={{ borderBottom: "1px solid #27272a", padding: "8px" }}>
                    {entry.score} / {entry.maxScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div style={{ marginTop: "12px" }}>
        <button
          onClick={refreshLeaderboard}
          disabled={loading}
          style={{
            marginRight: "8px",
            textDecoration: "none",
            color: "#ffffff",
            backgroundColor: loading ? "#4b5563" : "#2563eb",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>

        <Link
          href="/play"
          style={{
            textDecoration: "none",
            color: "#ffffff",
            backgroundColor: "#16a34a",
            padding: "10px 14px",
            borderRadius: "6px",
            display: "inline-block",
          }}
        >
          Play Again
        </Link>
      </div>
    </main>
  );
}
