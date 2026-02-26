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
                <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Logo Check Challenge</h1>
                <p style={{ lineHeight: 1.6, marginBottom: "16px" }}>
                    The game has two rounds. Round 1: Choose the real logo from the fake one before the 20-second timer expires. Round 2: Review a logo and its criteria, then identify which standards were not met by the designer."
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
