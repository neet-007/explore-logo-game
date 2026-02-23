'use client';
import { useState, useEffect } from 'react';
import DetectiveReveal from "@/components/LogoLens";
import DetectiveRevealStatic from "@/components/LogoLensStatic";
import EEExplore from "@/components/EEExplore";
import EEExploreStatic from "@/components/EEExploreStatic";

export default function Header() {
    const [viewMode, setViewMode] = useState<'static' | 'modern'>('static');

    useEffect(() => {
        if (typeof document !== 'undefined' && 'aspectRatio' in document.documentElement.style) {
            setViewMode('modern');
        }
    }, []);

    const revealContent = (
        <div style={{ textAlign: 'center', color: 'white', fontSize: '14px' }}>
            <p>first reason</p>
            <p>second reason</p>
            <p>third reason</p>
            <p>fourth reason</p>
            <p>fifth reason</p>
        </div>
    );

    const baseContent = (
        <img
            src="/AI.webp"
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.2 }}
        />
    );

    return (
        <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-fr gap-4 p-2">

            <div>
                {viewMode === 'modern' ? (
                    <EEExplore />
                ) : (
                    <EEExploreStatic />
                )}
            </div>

            <div>
                {viewMode === 'modern' ? (
                    <DetectiveReveal
                        className="w-full h-96"
                        baseContent={baseContent}
                        revealContent={revealContent}
                    />
                ) : (
                    <DetectiveRevealStatic
                        className="w-full h-96"
                        baseContent={baseContent}
                        revealContent={revealContent}
                    />
                )}
            </div>
        </div>
    );
}
