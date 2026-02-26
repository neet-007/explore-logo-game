"use client";

import { useState } from "react";
import {
  addAdminUserAction,
  addQuestionAction,
  addRoundOneQuestionAction,
  addRoundOneQuestionsBulkAction,
  addRoundTwoQuestionsBulkAction,
  revalidateCacheAction,
  verifyAdminAction,
} from "@/app/actions/game-actions";

type CriterionInput = {
  textAr: string;
  isOmitted: boolean;
};

export default function AdminClient() {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [roundOneLeftImagePath, setRoundOneLeftImagePath] = useState("/AI.png");
  const [roundOneRightImagePath, setRoundOneRightImagePath] = useState("/Graphic.png");
  const [roundOneCorrectOption, setRoundOneCorrectOption] = useState<"left" | "right">("left");

  const [roundTwoLogoPath, setRoundTwoLogoPath] = useState("/AI.png");
  const [roundTwoCriteria, setRoundTwoCriteria] = useState<CriterionInput[]>([
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
    { textAr: "", isOmitted: false },
  ]);

  const [roundOneBulkJson, setRoundOneBulkJson] = useState(
    '[\n  {"leftImagePath":"/AI.png","rightImagePath":"/Graphic.png","correctOption":"left"}\n]'
  );
  const [roundTwoBulkJson, setRoundTwoBulkJson] = useState(
    '[\n  {"logoPath":"/AI.png","criteria":[{"textAr":"معيار 1","isOmitted":true},{"textAr":"معيار 2","isOmitted":false}]}\n]'
  );

  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function adminCreds() {
    return { username: adminUsername, password: adminPassword };
  }

  function updateRoundTwoCriterion(index: number, next: CriterionInput) {
    setRoundTwoCriteria((prev) => prev.map((c, i) => (i === index ? next : c)));
  }

  function addRoundTwoCriterion() {
    setRoundTwoCriteria((prev) => [...prev, { textAr: "", isOmitted: false }]);
  }

  function removeRoundTwoCriterion(index: number) {
    setRoundTwoCriteria((prev) => prev.filter((_, i) => i !== index));
  }

  async function loginAdmin() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await verifyAdminAction(adminCreds());
      if (!result.ok) {
        setError(result.error || "Invalid admin credentials.");
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setMessage("Authenticated as admin.");
    } catch {
      setError("Network error.");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function addRoundOneSingle() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await addRoundOneQuestionAction({
        admin: adminCreds(),
        leftImagePath: roundOneLeftImagePath,
        rightImagePath: roundOneRightImagePath,
        correctOption: roundOneCorrectOption,
      });

      if (!result.ok) {
        setError(result.error || "Failed to add round 1 question.");
        return;
      }

      setMessage(`Round 1 question #${result.questionId} added.`);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function addRoundTwoSingle() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await addQuestionAction({
        admin: adminCreds(),
        logoPath: roundTwoLogoPath,
        criteria: roundTwoCriteria,
      });

      if (!result.ok) {
        setError(result.error || "Failed to add round 2 question.");
        return;
      }

      setMessage(`Round 2 question #${result.questionId} added.`);
      setRoundTwoCriteria([
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

  async function addRoundOneBulk() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const parsed = JSON.parse(roundOneBulkJson) as Array<{ leftImagePath: string; rightImagePath: string; correctOption: "left" | "right" }>;
      const result = await addRoundOneQuestionsBulkAction({
        admin: adminCreds(),
        questions: parsed,
      });

      if (!result.ok) {
        setError(result.error || "Failed to bulk add round 1 questions.");
        return;
      }

      setMessage(`Bulk inserted ${result.count} round 1 question(s).`);
    } catch {
      setError("Invalid JSON for round 1 bulk input.");
    } finally {
      setLoading(false);
    }
  }

  async function addRoundTwoBulk() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const parsed = JSON.parse(roundTwoBulkJson) as Array<{ logoPath: string; criteria: Array<{ textAr: string; isOmitted: boolean }> }>;
      const result = await addRoundTwoQuestionsBulkAction({
        admin: adminCreds(),
        questions: parsed,
      });

      if (!result.ok) {
        setError(result.error || "Failed to bulk add round 2 questions.");
        return;
      }

      setMessage(`Bulk inserted ${result.count} round 2 question(s).`);
    } catch {
      setError("Invalid JSON for round 2 bulk input.");
    } finally {
      setLoading(false);
    }
  }

  async function revalidate(target: "questions" | "leaderboard") {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await revalidateCacheAction({ admin: adminCreds(), target });
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

  async function addAdminUser() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await addAdminUserAction({
        admin: adminCreds(),
        newUsername: newAdminUsername,
        newPassword: newAdminPassword,
      });

      if (!result.ok) {
        setError(result.error || "Failed to add admin user.");
        return;
      }

      setMessage(`Admin user added with id ${result.adminId}.`);
      setNewAdminUsername("");
      setNewAdminPassword("");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "980px", margin: "0 auto", padding: "16px" }}>
      <h1 style={{ fontSize: "26px", marginBottom: "12px" }}>Admin</h1>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Admin Login</h2>
        <p style={{ color: "#d4d4d8", marginBottom: "8px" }}>
          First admin must be inserted directly in DB. After login, you can manage both rounds and add new admins.
        </p>

        <input
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          placeholder="Admin username"
          style={{ width: "100%", maxWidth: "320px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px", display: "block" }}
        />

        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="Admin password"
          style={{ width: "100%", maxWidth: "320px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "10px", display: "block" }}
        />

        <button
          onClick={loginAdmin}
          disabled={loading}
          style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Login
        </button>
      </section>

      {isAuthenticated && (
        <>
          <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Round 1 Questions</h2>

            <div style={{ border: "1px solid #3f3f46", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Add Single Question</h3>
              <input
                value={roundOneLeftImagePath}
                onChange={(e) => setRoundOneLeftImagePath(e.target.value)}
                placeholder="Left image path"
                style={{ width: "100%", maxWidth: "420px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px", display: "block" }}
              />
              <input
                value={roundOneRightImagePath}
                onChange={(e) => setRoundOneRightImagePath(e.target.value)}
                placeholder="Right image path"
                style={{ width: "100%", maxWidth: "420px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px", display: "block" }}
              />
              <select
                value={roundOneCorrectOption}
                onChange={(e) => setRoundOneCorrectOption(e.target.value as "left" | "right")}
                style={{ width: "100%", maxWidth: "200px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "10px", display: "block" }}
              >
                <option value="left">Correct: Left</option>
                <option value="right">Correct: Right</option>
              </select>
              <button
                onClick={addRoundOneSingle}
                disabled={loading}
                style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Add Round 1 Question
              </button>
            </div>

            <div style={{ border: "1px solid #3f3f46", borderRadius: "8px", padding: "12px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Bulk Add (JSON Array)</h3>
              <textarea
                value={roundOneBulkJson}
                onChange={(e) => setRoundOneBulkJson(e.target.value)}
                style={{ width: "100%", minHeight: "150px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "10px" }}
              />
              <button
                onClick={addRoundOneBulk}
                disabled={loading}
                style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Bulk Add Round 1 Questions
              </button>
            </div>
          </section>

          <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Round 2 Questions</h2>

            <div style={{ border: "1px solid #3f3f46", borderRadius: "8px", padding: "12px", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Add Single Question</h3>
              <input
                value={roundTwoLogoPath}
                onChange={(e) => setRoundTwoLogoPath(e.target.value)}
                placeholder="Logo path"
                style={{ width: "100%", maxWidth: "420px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px", display: "block" }}
              />

              {roundTwoCriteria.map((criterion, index) => (
                <div key={index} style={{ border: "1px solid #3f3f46", borderRadius: "6px", padding: "10px", marginBottom: "8px" }}>
                  <input
                    value={criterion.textAr}
                    onChange={(e) => updateRoundTwoCriterion(index, { ...criterion, textAr: e.target.value })}
                    placeholder={`معيار ${index + 1}`}
                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px" }}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={criterion.isOmitted}
                      onChange={(e) => updateRoundTwoCriterion(index, { ...criterion, isOmitted: e.target.checked })}
                      style={{ marginRight: "6px" }}
                    />
                    This criterion was NOT implemented
                  </label>
                  <div style={{ marginTop: "8px" }}>
                    <button
                      onClick={() => removeRoundTwoCriterion(index)}
                      disabled={loading || roundTwoCriteria.length <= 2}
                      style={{ padding: "6px 10px", backgroundColor: roundTwoCriteria.length <= 2 ? "#4b5563" : "#b91c1c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
                    >
                      Remove Choice
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addRoundTwoCriterion}
                disabled={loading}
                style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "8px", marginBottom: "8px" }}
              >
                Add Another Choice
              </button>
              <button
                onClick={addRoundTwoSingle}
                disabled={loading}
                style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginBottom: "8px" }}
              >
                Add Round 2 Question
              </button>
            </div>

            <div style={{ border: "1px solid #3f3f46", borderRadius: "8px", padding: "12px" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>Bulk Add (JSON Array)</h3>
              <textarea
                value={roundTwoBulkJson}
                onChange={(e) => setRoundTwoBulkJson(e.target.value)}
                style={{ width: "100%", minHeight: "170px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "10px" }}
              />
              <button
                onClick={addRoundTwoBulk}
                disabled={loading}
                style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Bulk Add Round 2 Questions
              </button>
            </div>
          </section>

          <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Add Admin User</h2>
            <input
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              placeholder="New admin username"
              style={{ width: "100%", maxWidth: "320px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "8px", display: "block" }}
            />
            <input
              type="password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="New admin password"
              style={{ width: "100%", maxWidth: "320px", padding: "10px", borderRadius: "6px", border: "1px solid #3f3f46", backgroundColor: "#09090b", color: "white", marginBottom: "10px", display: "block" }}
            />
            <button
              onClick={addAdminUser}
              disabled={loading}
              style={{ padding: "10px 14px", backgroundColor: loading ? "#4b5563" : "#16a34a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Add Admin User
            </button>
          </section>

          <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>Manual Cache Invalidation</h2>
            <button
              onClick={() => revalidate("questions")}
              disabled={loading}
              style={{ padding: "10px 14px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "8px", marginBottom: "8px" }}
            >
              Revalidate Questions
            </button>
            <button
              onClick={() => revalidate("leaderboard")}
              disabled={loading}
              style={{ padding: "10px 14px", backgroundColor: "#ea580c", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", marginBottom: "8px" }}
            >
              Revalidate Leaderboard
            </button>
          </section>
        </>
      )}

      {message && <p style={{ color: "#86efac", marginTop: "12px" }}>{message}</p>}
      {error && <p style={{ color: "#fca5a5", marginTop: "12px" }}>{error}</p>}
    </main>
  );
}
