"use client";
import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex h-16 items-center justify-between md:justify-center">

                    <div className="md:absolute md:left-6 font-bold text-xl tracking-tighter text-white">
                        <Link href="/">
                            LENS<span className="text-blue-500">QUEST</span>
                        </Link>
                    </div>

                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? "✕" : "☰"}
                    </button>

                    <ul className="hidden md:flex flex-row items-center gap-2">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/play">Play</NavLink>
                        <NavLink href="/leaderboard">Leaderboard</NavLink>
                    </ul>
                </div>

                {isOpen && (
                    <ul className="md:hidden flex flex-col items-center gap-4 pb-6 pt-2 border-t border-white/5">
                        <NavLink href="/" onClick={() => setIsOpen(false)}>Home</NavLink>
                        <NavLink href="/play" onClick={() => setIsOpen(false)}>Play</NavLink>
                        <NavLink href="/leaderboard" onClick={() => setIsOpen(false)}>Leaderboard</NavLink>
                    </ul>
                )}
            </div>
        </nav>
    );
}

function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
    return (
        <li className="list-none">
            <Link
                href={href}
                onClick={onClick}
                className="text-gray-400 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/5 block"
            >
                {children}
            </Link>
        </li>
    );
}
