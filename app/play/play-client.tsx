"use client";

import Link from "next/link";
import { useState } from "react";
import { getQuestionsAction, submitGameAction } from "@/app/actions/game-actions";
import type { AnswerPayload, Question } from "@/lib/types";

function calculateLocalQuestionScore(question: Question, selectedCriterionIds: number[]) {
    const correctIds = question.criteria.filter((c) => c.isOmitted).map((c) => c.id);
    const correctSet = new Set(correctIds);
    const scorePerChoice = correctIds.length > 0 ? 1 / correctIds.length : 0;

    let score = 0;
    for (const criterionId of selectedCriterionIds) {
        score += correctSet.has(criterionId) ? scorePerChoice : -scorePerChoice;
    }

    if (score < 0) score = 0;
    if (score > 1) score = 1;

    return Number(score.toFixed(4));
}

export default function PlayClient() {
    const [nameInput, setNameInput] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number[]>>({});
    const [submittedByQuestion, setSubmittedByQuestion] = useState<Record<number, boolean>>({});
    const [resultByQuestion, setResultByQuestion] = useState<Record<number, { correctPicked: number; totalCorrect: number }>>({});

    const [localScore, setLocalScore] = useState(0);
    const [serverScore, setServerScore] = useState<{ score: number; maxScore: number } | null>(null);
    const [submitError, setSubmitError] = useState("");
    const [sendingResult, setSendingResult] = useState(false);
    const [hasSubmittedFinal, setHasSubmittedFinal] = useState(false);

    const gameStarted = playerName.length > 0;
    const gameFinished = gameStarted && questions.length > 0 && currentIndex >= questions.length;
    const currentQuestion = gameStarted && questions.length > 0 && currentIndex < questions.length ? questions[currentIndex] : null;

    async function startGame() {
        alert("startGame");
        const cleanName = nameInput.trim();
        if (!cleanName) {
            setLoadError("Please enter your name first.");
            return;
        }

        setLoading(true);
        setLoadError("");

        try {
            const result = await getQuestionsAction();
            if (!result.ok) {
                setLoadError(result.error || "Failed to load questions.");
                return;
            }

            const loadedQuestions = (result.questions || []) as Question[];
            if (loadedQuestions.length === 0) {
                setLoadError("No questions available.");
                return;
            }

            setPlayerName(cleanName);
            setQuestions(loadedQuestions);
            setCurrentIndex(0);
            setSelectedByQuestion({});
            setSubmittedByQuestion({});
            setResultByQuestion({});
            setLocalScore(0);
            setServerScore(null);
            setSubmitError("");
            setHasSubmittedFinal(false);
        } catch {
            setLoadError("Could not connect to server.");
        } finally {
            setLoading(false);
        }
    }

    function handleStartGame() {
        startGame();
    }

    function toggleCriterion(questionId: number, criterionId: number) {
        if (submittedByQuestion[questionId]) {
            return;
        }

        const selected = selectedByQuestion[questionId] || [];
        const exists = selected.includes(criterionId);

        setSelectedByQuestion((prev) => ({
            ...prev,
            [questionId]: exists ? selected.filter((id) => id !== criterionId) : [...selected, criterionId],
        }));
    }

    function submitCurrentQuestion() {
        if (!currentQuestion) {
            return;
        }

        if (submittedByQuestion[currentQuestion.id]) {
            return;
        }

        const selectedUnique = Array.from(new Set(selectedByQuestion[currentQuestion.id] || []));
        const score = calculateLocalQuestionScore(currentQuestion, selectedUnique);
        const totalCorrect = currentQuestion.criteria.filter((criterion) => criterion.isOmitted).length;
        const correctPicked = selectedUnique.filter((criterionId) =>
            currentQuestion.criteria.some((criterion) => criterion.id === criterionId && criterion.isOmitted)
        ).length;

        setSelectedByQuestion((prev) => ({
            ...prev,
            [currentQuestion.id]: selectedUnique,
        }));

        setSubmittedByQuestion((prev) => ({
            ...prev,
            [currentQuestion.id]: true,
        }));
        setResultByQuestion((prev) => ({
            ...prev,
            [currentQuestion.id]: { correctPicked, totalCorrect },
        }));

        setLocalScore((prev) => Number((prev + score).toFixed(4)));
    }

    async function submitFinalAnswers() {
        if (hasSubmittedFinal) {
            return;
        }

        const answers: AnswerPayload[] = questions.map((q) => ({
            questionId: q.id,
            selectedCriterionIds: selectedByQuestion[q.id] || [],
        }));

        setSendingResult(true);
        setSubmitError("");

        try {
            const result = await submitGameAction({
                playerName,
                answers,
            });

            if (!result.ok) {
                setSubmitError(result.error || "Failed to submit final score.");
                return;
            }

            setServerScore({ score: result.score, maxScore: result.maxScore });
            setHasSubmittedFinal(true);
        } catch {
            setSubmitError("Network error while submitting score.");
        } finally {
            setSendingResult(false);
        }
    }

    async function nextOrFinish() {
        if (!currentQuestion || !submittedByQuestion[currentQuestion.id]) {
            return;
        }

        const isLastQuestion = currentIndex + 1 === questions.length;
        setCurrentIndex((prev) => prev + 1);

        if (isLastQuestion) {
            await submitFinalAnswers();
        }
    }

    return (
        <main style={{ maxWidth: "860px", margin: "0 auto", padding: "16px" }}>
            <h1 style={{ fontSize: "26px", marginBottom: "12px" }}>Play</h1>

            {!gameStarted && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <label htmlFor="playerName" style={{ display: "block", marginBottom: "8px" }}>
                        Enter your name
                    </label>
                    <input
                        id="playerName"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                        style={{
                            width: "100%",
                            maxWidth: "360px",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #3f3f46",
                            backgroundColor: "#09090b",
                            color: "white",
                            marginBottom: "10px",
                        }}
                    />
                    <div>
                        <button
                            onClick={handleStartGame}
                            disabled={loading}
                            style={{
                                padding: "10px 14px",
                                backgroundColor: loading ? "#4b5563" : "#2563eb",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            {loading ? "Loading..." : "Start Game"}
                        </button>
                    </div>
                    {loadError && <p style={{ color: "#fca5a5", marginTop: "10px" }}>{loadError}</p>}
                </section>
            )}

            {currentQuestion && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <p style={{ marginBottom: "10px", color: "#d4d4d8" }}>
                        Player: <strong>{playerName}</strong> | Question {currentIndex + 1} / {questions.length}
                    </p>

                    <div style={{ width: "100%", textAlign: "center", marginBottom: "16px" }}>
                        <img
                            src={currentQuestion.logoPath}
                            alt={`Question ${currentIndex + 1} logo`}
                            style={{ maxWidth: "100%", width: "280px", height: "auto", borderRadius: "8px" }}
                        />
                    </div>

                    <p style={{ marginBottom: "10px" }}>اختر المعايير غير المطبقة في الشعار:</p>

                    <div>
                        {currentQuestion.criteria.map((criterion) => {
                            const selected = (selectedByQuestion[currentQuestion.id] || []).includes(criterion.id);
                            const isSubmitted = Boolean(submittedByQuestion[currentQuestion.id]);

                            return (
                                <label
                                    key={criterion.id}
                                    style={{
                                        display: "block",
                                        padding: "10px",
                                        borderRadius: "6px",
                                        marginBottom: "8px",
                                        border: "1px solid #3f3f46",
                                        backgroundColor: selected ? "#18181b" : "#111111",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        disabled={isSubmitted}
                                        onChange={() => toggleCriterion(currentQuestion.id, criterion.id)}
                                        style={{ marginRight: "8px" }}
                                    />
                                    {criterion.textAr}
                                </label>
                            );
                        })}
                    </div>

                    {!submittedByQuestion[currentQuestion.id] && (
                        <button
                            onClick={submitCurrentQuestion}
                            style={{
                                marginTop: "8px",
                                padding: "10px 14px",
                                backgroundColor: "#16a34a",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            Submit Answer
                        </button>
                    )}

                    {submittedByQuestion[currentQuestion.id] && (
                        <div style={{ marginTop: "14px" }}>
                            <p style={{ marginBottom: "10px" }}>
                                You picked {resultByQuestion[currentQuestion.id]?.correctPicked ?? 0} correct choices out of{" "}
                                {resultByQuestion[currentQuestion.id]?.totalCorrect ?? 0} total correct choices.
                            </p>
                            <button
                                onClick={nextOrFinish}
                                disabled={sendingResult}
                                style={{
                                    padding: "10px 14px",
                                    backgroundColor: sendingResult ? "#4b5563" : "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                {sendingResult ? "Submitting..." : currentIndex + 1 === questions.length ? "Finish Game" : "Next Question"}
                            </button>
                        </div>
                    )}

                    <p style={{ marginTop: "14px", color: "#d4d4d8" }}>Local score: {localScore.toFixed(4)}</p>
                </section>
            )}

            {gameFinished && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Game Finished</h2>
                    <p style={{ marginBottom: "6px" }}>Local score (client): {localScore.toFixed(4)} / {questions.length}</p>
                    {sendingResult && <p>Submitting final answers to backend...</p>}
                    {serverScore && <p style={{ marginBottom: "6px" }}>Backend verified score: {serverScore.score} / {serverScore.maxScore}</p>}
                    {submitError && <p style={{ color: "#fca5a5", marginBottom: "6px" }}>{submitError}</p>}

                    <Link
                        href="/leaderboard"
                        style={{
                            display: "inline-block",
                            marginTop: "8px",
                            textDecoration: "none",
                            color: "#ffffff",
                            backgroundColor: "#2563eb",
                            padding: "10px 14px",
                            borderRadius: "6px",
                        }}
                    >
                        Go To Leaderboard
                    </Link>
                </section>
            )}
        </main>
    );
}
