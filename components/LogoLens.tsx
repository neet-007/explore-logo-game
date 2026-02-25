'use client';
import React, { ReactNode, useState, useLayoutEffect, useRef } from 'react';

interface DetectiveRevealProps {
    baseContent: ReactNode;
    revealContent: ReactNode;
    lensSize?: number;
    duration?: string;
    className?: string;
    revealBg?: string;
}

export default function DetectiveReveal({
    baseContent,
    revealContent,
    lensSize,
    duration = '6s',
    className = "w-96 h-96",
    revealBg = "transparent"
}: DetectiveRevealProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [autoSize, setAutoSize] = useState(150);

    useLayoutEffect(() => {
        if (lensSize === undefined && contentRef.current) {
            const { width, height } = contentRef.current.getBoundingClientRect();
            const contentDiagonal = Math.sqrt(width ** 2 + height ** 2);
            const calculatedSize = (contentDiagonal / 0.7) + 40;
            setAutoSize(calculatedSize);
        }
    }, [revealContent, lensSize]);

    const finalSize = lensSize !== undefined ? lensSize : autoSize;
    const maskRadius = (finalSize / 2) * 0.7;
    const offset = (finalSize * 90) / 200;

    return (
        <div className='flex items-end flex-col'>
            <div className={`relative overflow-hidden rounded-2xl border-4 border-slate-700 bg-slate-900 ${className}`}>

                <div className="absolute inset-0 z-0">{baseContent}</div>

                <div
                    className="absolute inset-0 z-10 animate-reveal"
                    style={{
                        animationDuration: duration,
                        backgroundColor: revealBg,
                        WebkitMaskImage: `radial-gradient(circle ${maskRadius}px at var(--mask-x) var(--mask-y), black 100%, transparent 0%)`,
                        maskImage: `radial-gradient(circle ${maskRadius}px at var(--mask-x) var(--mask-y), black 100%, transparent 0%)`,
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                    } as React.CSSProperties}
                >
                    <div className="flex items-center justify-center h-full">
                        <div ref={contentRef} className="inline-block p-2">
                            {revealContent}
                        </div>
                    </div>
                </div>

                <div
                    className="pointer-events-none absolute z-20 animate-reveal"
                    style={{
                        animationDuration: duration,
                        left: 'var(--mask-x)',
                        top: 'var(--mask-y)',
                        width: `${finalSize}px`,
                        height: `${finalSize}px`,
                        transform: `translate(-${offset}px, -${offset}px) rotate(-15deg)`,
                    } as React.CSSProperties}
                >
                    <img src="/lens.svg" alt="Lens" className="w-full h-full drop-shadow-2xl" />
                </div>
            </div>
        </div>
    );
}
