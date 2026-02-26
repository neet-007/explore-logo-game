"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
    getQuestionsAction,
    getRoundOneCorrectOptionAction,
    submitGameAction,
    validateQuestionAction,
    validateRoundOneQuestionAction,
} from "@/app/actions/game-actions";
import type { AnswerPayload, PublicQuestion, PublicRoundOneQuestion, RoundOneAnswerPayload } from "@/lib/types";

type RoundState = "round_one" | "round_two" | "finished";

export default function PlayClient() {
    const [nameInput, setNameInput] = useState("");
    const [playerName, setPlayerName] = useState("");

    const [roundOneQuestions, setRoundOneQuestions] = useState<PublicRoundOneQuestion[]>([]);
    const [roundTwoQuestions, setRoundTwoQuestions] = useState<PublicQuestion[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [roundState, setRoundState] = useState<RoundState>("round_one");

    const [roundOneTimeLeft, setRoundOneTimeLeft] = useState(20);
    const [roundOneTimerEnded, setRoundOneTimerEnded] = useState(false);
    const [roundOneIndex, setRoundOneIndex] = useState(0);
    const [roundOneAnswersByQuestion, setRoundOneAnswersByQuestion] = useState<Record<number, "left" | "right">>({});
    const [roundOneSubmittedByQuestion, setRoundOneSubmittedByQuestion] = useState<Record<number, boolean>>({});
    const [roundOneResultByQuestion, setRoundOneResultByQuestion] = useState<
        Record<number, { isCorrect: boolean; correctOption: "left" | "right"; questionScore: number }>
    >({});
    const [roundOneError, setRoundOneError] = useState("");
    const [validatingRoundOne, setValidatingRoundOne] = useState(false);

    const [roundTwoIndex, setRoundTwoIndex] = useState(0);
    const [selectedByQuestion, setSelectedByQuestion] = useState<Record<number, number[]>>({});
    const [submittedByQuestion, setSubmittedByQuestion] = useState<Record<number, boolean>>({});
    const [resultByQuestion, setResultByQuestion] = useState<Record<number, { correctPicked: number; totalCorrect: number }>>({});
    const [questionError, setQuestionError] = useState("");
    const [validatingRoundTwo, setValidatingRoundTwo] = useState(false);

    const [serverScore, setServerScore] = useState<{ score: number; maxScore: number } | null>(null);
    const [submitError, setSubmitError] = useState("");
    const [sendingResult, setSendingResult] = useState(false);
    const [hasSubmittedFinal, setHasSubmittedFinal] = useState(false);

    const gameStarted = playerName.length > 0;
    const currentRoundOneQuestion = gameStarted && roundOneIndex < roundOneQuestions.length ? roundOneQuestions[roundOneIndex] : null;
    const currentRoundTwoQuestion = gameStarted && roundTwoIndex < roundTwoQuestions.length ? roundTwoQuestions[roundTwoIndex] : null;

    const handleRoundOneTimerEnd = useCallback(async () => {
        if (roundOneTimerEnded) {
            return;
        }

        setRoundOneTimerEnded(true);

        if (!currentRoundOneQuestion) {
            return;
        }

        if (roundOneSubmittedByQuestion[currentRoundOneQuestion.id]) {
            return;
        }

        const result = await getRoundOneCorrectOptionAction({ questionId: currentRoundOneQuestion.id });
        if (!result.ok) {
            setRoundOneError(result.error || "Failed to load correct answer.");
            return;
        }

        setRoundOneSubmittedByQuestion((prev) => ({ ...prev, [currentRoundOneQuestion.id]: true }));
        setRoundOneResultByQuestion((prev) => ({
            ...prev,
            [currentRoundOneQuestion.id]: {
                isCorrect: false,
                correctOption: result.correctOption,
                questionScore: 0,
            },
        }));
    }, [roundOneTimerEnded, currentRoundOneQuestion, roundOneSubmittedByQuestion]);

    useEffect(() => {
        if (!gameStarted || roundState !== "round_one") {
            return;
        }

        if (roundOneTimerEnded) {
            return;
        }

        if (roundOneTimeLeft <= 0) {
            handleRoundOneTimerEnd();
            return;
        }

        const timer = window.setInterval(() => {
            setRoundOneTimeLeft((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [gameStarted, roundState, roundOneTimeLeft, roundOneTimerEnded, handleRoundOneTimerEnd]);

    useEffect(() => {
        if (roundState === "round_one" && roundOneIndex >= roundOneQuestions.length && roundOneQuestions.length > 0) {
            setRoundState("round_two");
        }
    }, [roundState, roundOneIndex, roundOneQuestions.length]);

    async function startGame() {
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

            if (result.roundOneQuestions.length === 0 || result.roundTwoQuestions.length === 0) {
                setLoadError("Questions are not configured yet.");
                return;
            }

            setPlayerName(cleanName);
            setRoundOneQuestions(result.roundOneQuestions);
            setRoundTwoQuestions(result.roundTwoQuestions);

            setRoundState("round_one");
            setRoundOneTimeLeft(20);
            setRoundOneTimerEnded(false);
            setRoundOneIndex(0);
            setRoundOneAnswersByQuestion({});
            setRoundOneSubmittedByQuestion({});
            setRoundOneResultByQuestion({});
            setRoundOneError("");

            setRoundTwoIndex(0);
            setSelectedByQuestion({});
            setSubmittedByQuestion({});
            setResultByQuestion({});
            setQuestionError("");

            setServerScore(null);
            setSubmitError("");
            setHasSubmittedFinal(false);
        } catch {
            setLoadError("Could not connect to server.");
        } finally {
            setLoading(false);
        }
    }

    async function submitRoundOneAnswer(selectedOption: "left" | "right") {
        if (!currentRoundOneQuestion) {
            return;
        }

        if (roundOneSubmittedByQuestion[currentRoundOneQuestion.id]) {
            return;
        }

        setValidatingRoundOne(true);
        setRoundOneError("");

        try {
            const result = await validateRoundOneQuestionAction({
                questionId: currentRoundOneQuestion.id,
                selectedOption,
            });

            if (!result.ok) {
                setRoundOneError(result.error || "Failed to validate answer.");
                return;
            }

            setRoundOneAnswersByQuestion((prev) => ({ ...prev, [currentRoundOneQuestion.id]: selectedOption }));
            setRoundOneSubmittedByQuestion((prev) => ({ ...prev, [currentRoundOneQuestion.id]: true }));
            setRoundOneResultByQuestion((prev) => ({
                ...prev,
                [currentRoundOneQuestion.id]: {
                    isCorrect: result.isCorrect,
                    correctOption: result.correctOption,
                    questionScore: result.questionScore,
                },
            }));
        } finally {
            setValidatingRoundOne(false);
        }
    }

    function nextRoundOneQuestion() {
        if (!currentRoundOneQuestion) {
            return;
        }

        if (!roundOneSubmittedByQuestion[currentRoundOneQuestion.id]) {
            return;
        }

        setRoundOneIndex((prev) => prev + 1);
    }

    function goToRoundTwo() {
        setRoundState("round_two");
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

    async function submitRoundTwoQuestion() {
        if (!currentRoundTwoQuestion) {
            return;
        }

        if (submittedByQuestion[currentRoundTwoQuestion.id]) {
            return;
        }

        const selectedUnique = Array.from(new Set(selectedByQuestion[currentRoundTwoQuestion.id] || []));
        setQuestionError("");
        setValidatingRoundTwo(true);

        try {
            const result = await validateQuestionAction({
                questionId: currentRoundTwoQuestion.id,
                selectedCriterionIds: selectedUnique,
            });

            if (!result.ok) {
                setQuestionError(result.error || "Failed to validate answer.");
                return;
            }

            setSelectedByQuestion((prev) => ({
                ...prev,
                [currentRoundTwoQuestion.id]: selectedUnique,
            }));

            setSubmittedByQuestion((prev) => ({
                ...prev,
                [currentRoundTwoQuestion.id]: true,
            }));
            setResultByQuestion((prev) => ({
                ...prev,
                [currentRoundTwoQuestion.id]: { correctPicked: result.correctPicked, totalCorrect: result.totalCorrect },
            }));
        } finally {
            setValidatingRoundTwo(false);
        }
    }

    async function submitFinalAnswers() {
        if (hasSubmittedFinal) {
            return;
        }

        const roundOneAnswers: RoundOneAnswerPayload[] = Object.entries(roundOneAnswersByQuestion).map(([questionId, selectedOption]) => ({
            questionId: Number(questionId),
            selectedOption,
        }));

        const roundTwoAnswers: AnswerPayload[] = roundTwoQuestions.map((q) => ({
            questionId: q.id,
            selectedCriterionIds: selectedByQuestion[q.id] || [],
        }));

        setSendingResult(true);
        setSubmitError("");

        try {
            const result = await submitGameAction({
                playerName,
                roundOneAnswers,
                roundTwoAnswers,
            });

            if (!result.ok) {
                setSubmitError(result.error || "Failed to submit final score.");
                return;
            }

            setServerScore({ score: result.score, maxScore: result.maxScore });
            setHasSubmittedFinal(true);
            setRoundState("finished");
        } catch {
            setSubmitError("Network error while submitting score.");
        } finally {
            setSendingResult(false);
        }
    }

    async function nextRoundTwoQuestionOrFinish() {
        if (!currentRoundTwoQuestion || !submittedByQuestion[currentRoundTwoQuestion.id]) {
            return;
        }

        const isLastQuestion = roundTwoIndex + 1 === roundTwoQuestions.length;
        if (isLastQuestion) {
            await submitFinalAnswers();
            return;
        }

        setRoundTwoIndex((prev) => prev + 1);
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
                    <button
                        onClick={startGame}
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
                    {loadError && <p style={{ color: "#fca5a5", marginTop: "10px" }}>{loadError}</p>}
                </section>
            )}

            {gameStarted && roundState === "round_one" && currentRoundOneQuestion && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Round 1: Quick Logo Pick</h2>
                    <p style={{ marginBottom: "10px", color: "#d4d4d8" }}>
                        Player: <strong>{playerName}</strong> | Question {roundOneIndex + 1} / {roundOneQuestions.length}
                    </p>
                    <p style={{ marginBottom: "12px", color: "#fca5a5" }}>Time left: {roundOneTimeLeft}s</p>

                    <p style={{ marginBottom: "10px" }}>Choose the correct logo image:</p>

                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                        <button
                            onClick={() => submitRoundOneAnswer("left")}
                            disabled={validatingRoundOne || roundOneTimerEnded || Boolean(roundOneSubmittedByQuestion[currentRoundOneQuestion.id])}
                            style={{
                                width: "100%",
                                maxWidth: "360px",
                                border: "1px solid #3f3f46",
                                borderRadius: "8px",
                                backgroundColor:
                                    roundOneSubmittedByQuestion[currentRoundOneQuestion.id] &&
                                        roundOneResultByQuestion[currentRoundOneQuestion.id]?.correctOption === "left"
                                        ? "#14532d"
                                        : "#111111",
                                padding: "8px",
                                marginRight: "10px",
                                marginBottom: "10px",
                                cursor: "pointer",
                            }}
                        >
                            <img src={currentRoundOneQuestion.leftImagePath} alt="Left option" style={{ width: "100%", height: "auto", borderRadius: "6px" }} />
                        </button>

                        <button
                            onClick={() => submitRoundOneAnswer("right")}
                            disabled={validatingRoundOne || roundOneTimerEnded || Boolean(roundOneSubmittedByQuestion[currentRoundOneQuestion.id])}
                            style={{
                                width: "100%",
                                maxWidth: "360px",
                                border: "1px solid #3f3f46",
                                borderRadius: "8px",
                                backgroundColor:
                                    roundOneSubmittedByQuestion[currentRoundOneQuestion.id] &&
                                        roundOneResultByQuestion[currentRoundOneQuestion.id]?.correctOption === "right"
                                        ? "#14532d"
                                        : "#111111",
                                padding: "8px",
                                marginBottom: "10px",
                                cursor: "pointer",
                            }}
                        >
                            <img src={currentRoundOneQuestion.rightImagePath} alt="Right option" style={{ width: "100%", height: "auto", borderRadius: "6px" }} />
                        </button>
                    </div>

                    {roundOneError && <p style={{ color: "#fca5a5", marginTop: "8px" }}>{roundOneError}</p>}

                    {roundOneTimerEnded && (
                        <div style={{ marginTop: "10px" }}>
                            <p style={{ marginBottom: "10px" }}>
                                {roundOneResultByQuestion[currentRoundOneQuestion.id]?.correctOption
                                    ? `Time ended. Correct answer was: ${roundOneResultByQuestion[currentRoundOneQuestion.id]?.correctOption === "left" ? "Left image" : "Right image"}`
                                    : "Time ended."}
                            </p>
                            <button
                                onClick={goToRoundTwo}
                                style={{
                                    padding: "10px 14px",
                                    backgroundColor: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Go To Round 2
                            </button>
                        </div>
                    )}

                    {!roundOneTimerEnded && roundOneSubmittedByQuestion[currentRoundOneQuestion.id] && (
                        <div style={{ marginTop: "10px" }}>
                            <p style={{ marginBottom: "10px" }}>
                                Correct answer was: <strong>{roundOneResultByQuestion[currentRoundOneQuestion.id]?.correctOption === "left" ? "Left image" : "Right image"}</strong>
                            </p>
                            <button
                                onClick={nextRoundOneQuestion}
                                style={{
                                    padding: "10px 14px",
                                    backgroundColor: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                {roundOneIndex + 1 === roundOneQuestions.length ? "Start Round 2" : "Next"}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {gameStarted && roundState === "round_two" && currentRoundTwoQuestion && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Round 2: Missing Criteria</h2>
                    <p style={{ marginBottom: "10px", color: "#d4d4d8" }}>
                        Player: <strong>{playerName}</strong> | Question {roundTwoIndex + 1} / {roundTwoQuestions.length}
                    </p>

                    <div style={{ width: "100%", textAlign: "center", marginBottom: "16px" }}>
                        <img src={currentRoundTwoQuestion.logoPath} alt={`Question ${roundTwoIndex + 1} logo`} style={{ maxWidth: "100%", width: "280px", height: "auto", borderRadius: "8px" }} />
                    </div>

                    <p style={{ marginBottom: "10px" }}>اختر المعايير غير المطبقة في الشعار:</p>

                    <div>
                        {currentRoundTwoQuestion.criteria.map((criterion) => {
                            const selected = (selectedByQuestion[currentRoundTwoQuestion.id] || []).includes(criterion.id);
                            const isSubmitted = Boolean(submittedByQuestion[currentRoundTwoQuestion.id]);

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
                                        onChange={() => toggleCriterion(currentRoundTwoQuestion.id, criterion.id)}
                                        style={{ marginRight: "8px" }}
                                    />
                                    {criterion.textAr}
                                </label>
                            );
                        })}
                    </div>

                    {!submittedByQuestion[currentRoundTwoQuestion.id] && (
                        <button
                            onClick={submitRoundTwoQuestion}
                            disabled={validatingRoundTwo}
                            style={{
                                marginTop: "8px",
                                padding: "10px 14px",
                                backgroundColor: validatingRoundTwo ? "#4b5563" : "#16a34a",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            {validatingRoundTwo ? "Checking..." : "Submit Answer"}
                        </button>
                    )}

                    {questionError && <p style={{ color: "#fca5a5", marginTop: "8px" }}>{questionError}</p>}

                    {submittedByQuestion[currentRoundTwoQuestion.id] && (
                        <div style={{ marginTop: "14px" }}>
                            <p style={{ marginBottom: "10px" }}>
                                You picked {resultByQuestion[currentRoundTwoQuestion.id]?.correctPicked ?? 0} correct choices out of{" "}
                                {resultByQuestion[currentRoundTwoQuestion.id]?.totalCorrect ?? 0} total correct choices.
                            </p>
                            <button
                                onClick={nextRoundTwoQuestionOrFinish}
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
                                {sendingResult ? "Submitting..." : roundTwoIndex + 1 === roundTwoQuestions.length ? "Finish Game" : "Next Question"}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {gameStarted && roundState === "finished" && (
                <section style={{ border: "1px solid #2a2a2a", borderRadius: "8px", padding: "16px", backgroundColor: "#111111" }}>
                    <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Game Finished</h2>
                    {sendingResult && <p>Submitting final answers to backend...</p>}
                    {serverScore && <p style={{ marginBottom: "6px" }}>Final score: {serverScore.score} / {serverScore.maxScore}</p>}
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
