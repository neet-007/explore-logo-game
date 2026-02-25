import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
    return (
        <main style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
            <Header />

            <section
                id="aaa"
                style={{
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    padding: "16px",
                    marginTop: "16px",
                    backgroundColor: "#111111",
                }}
            >
                <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Logo Criteria Challenge</h1>
                <p style={{ lineHeight: 1.6, marginBottom: "16px" }}>
                    In every round, you will see a logo and a list of criteria. Your goal is to choose which criteria were not implemented in that logo.
                    You can select multiple answers. Your local score is shown immediately, and the final score is verified by the backend.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap" }}>
                    <Link
                        href="/play"
                        style={{
                            textDecoration: "none",
                            color: "#ffffff",
                            backgroundColor: "#2563eb",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            marginRight: "12px",
                            marginBottom: "12px",
                        }}
                    >
                        Play Game
                    </Link>

                    <Link
                        href="/leaderboard"
                        style={{
                            textDecoration: "none",
                            color: "#111111",
                            backgroundColor: "#f3f4f6",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            marginBottom: "12px",
                        }}
                    >
                        Leaderboard
                    </Link>
                </div>
            </section>
        </main>
    );
}
