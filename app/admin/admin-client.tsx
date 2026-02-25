"use client";

import { useState } from "react";
import { addQuestionAction, revalidateCacheAction } from "@/app/actions/game-actions";

type CriterionInput = {
  textAr: string;
  isOmitted: boolean;
};

export default function AdminClient() {
  const [logoPath, setLogoPath] = useState("/AI.png");
  const [criteria, setCriteria] = useState<CriterionInput[]>([
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
  ]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateCriterion(index: number, next: CriterionInput) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? next : c)));
  }

  async function addQuestion() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await addQuestionAction({ logoPath, criteria });
      if (!result.ok) {
        setError(result.error || "Failed to add question.");
        return;
      }

      setMessage(`Question #${result.questionId} added and questions cache invalidated.`);
      setCriteria([
        { textAr: "", isOmitted: false },
        { textAr: "", isOmitted: false },
        { textAr: "", isOmitted: false },
        { textAr: "", isOmitted: false },
      ]);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function revalidate(target: "questions" | "leaderboard") {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await revalidateCacheAction(target);
      if (!result.ok) {
        setError(result.error || "Failed to revalidate cache.");
        return;
      }

      setMessage(`${target} cache invalidated.`);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: "26px", marginBottom: "12px" }}>Admin</h1>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Add Question</h2>

        <label style={{ display: "block", marginBottom: "6px" }}>Logo path (from public)</label>
        <input
          value={logoPath}
          onChange={(e) => setLogoPath(e.target.value)}
          placeholder="/AI.png"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #3f3f46",
            backgroundColor: "#09090b",
            color: "white",
            marginBottom: "10px",
          }}
        />

        {criteria.map((criterion, index) => (
          <div key={index} style={{ border: "1px solid #3f3f46", borderRadius: "6px", padding: "10px", marginBottom: "8px" }}>
            <input
              value={criterion.textAr}
              onChange={(e) => updateCriterion(index, { ...criterion, textAr: e.target.value })}
              placeholder={`معيار ${index + 1}`}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "6px",
                border: "1px solid #3f3f46",
                backgroundColor: "#09090b",
                color: "white",
                marginBottom: "8px",
              }}
            />
            <label>
              <input
                type="checkbox"
                checked={criterion.isOmitted}
                onChange={(e) => updateCriterion(index, { ...criterion, isOmitted: e.target.checked })}
                style={{ marginRight: "6px" }}
              />
              This criterion was NOT implemented
            </label>
          </div>
        ))}

        <button
          onClick={addQuestion}
          disabled={loading}
          style={{
            padding: "10px 14px",
            backgroundColor: loading ? "#4b5563" : "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Add Question
        </button>
      </section>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Manual Cache Invalidation</h2>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <button
            onClick={() => revalidate("questions")}
            disabled={loading}
            style={{
              padding: "10px 14px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px",
              marginBottom: "10px",
            }}
          >
            Revalidate Questions
          </button>

          <button
            onClick={() => revalidate("leaderboard")}
            disabled={loading}
            style={{
              padding: "10px 14px",
              backgroundColor: "#ea580c",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            Revalidate Leaderboard
          </button>
        </div>
      </section>

      {message && <p style={{ color: "#86efac", marginTop: "12px" }}>{message}</p>}
      {error && <p style={{ color: "#fca5a5", marginTop: "12px" }}>{error}</p>}
    </main>
  );
}
