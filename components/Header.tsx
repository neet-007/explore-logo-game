'use client';
import { useState, useEffect } from 'react';
import DetectiveReveal from "@/components/LogoLens";
import DetectiveRevealStatic from "@/components/LogoLensStatic";
import EEExplore from "@/components/EEExplore";
import EEExploreStatic from "@/components/EEExploreStatic";
import { LENS_CHECKLIST } from "@/constants";

export default function Header() {
    const [viewMode, setViewMode] = useState<'static' | 'modern'>('static');

    useEffect(() => {
        if (typeof document !== 'undefined' && 'aspectRatio' in document.documentElement.style) {
            setViewMode('modern');
        }
    }, []);

    const revealContent = (
        <div style={{ textAlign: 'center', color: 'white', fontSize: '14px' }}>
            {LENS_CHECKLIST.map((item, index) => {
                return (
                    <p key={index}>{item.text}<span>{item.is_check ? '✅' : '❌'}</span> </p>
                );
            })
            }
        </div>
    );

    const baseContent = (
        <img
            src="/header_static.jpg"
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
