"use client";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav
            className="sticky top-0 z-50 w-full border-b border-white/10"
            style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#000000',
                WebkitBackdropFilter: 'blur(20px)',
                backdropFilter: 'blur(20px)',
                width: '100%',
                zIndex: 1000
            }}
        >
            <div className="max-w-7xl mx-auto px-4" style={{ height: '64px' }}>
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}
                >
                    <div className="font-bold text-lg md:text-xl text-white">
                        <Link href="/" style={{ textDecoration: 'none', color: 'white', display: 'block' }}>
                            LENS<span style={{ color: '#3b82f6' }}>QUEST</span>
                        </Link>
                    </div>

                    <ul
                        style={{
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'row',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <NavLink href="/play">Play</NavLink>
                        <NavLink href="/leaderboard">Leaderboard</NavLink>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <li style={{ display: 'inline-block' }}>
            <Link
                href={href}
                className="text-gray-400 hover:text-white"
                style={{
                    display: 'block',
                    padding: '8px 12px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#9ca3af'
                }}
            >
                {children}
            </Link>
        </li>
    );
}
