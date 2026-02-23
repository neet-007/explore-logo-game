export default function DetectiveRevealStatic({ baseContent, revealContent, className, finalSize = 250 }: any) {
    const maskRadius = (finalSize / 2) * 0.7;
    const offset = (finalSize * 90) / 200;

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border-4 border-slate-700 bg-slate-900 ${className}`}
            style={{
                position: 'relative',
                height: '400px',
                width: '100%',
                boxSizing: 'border-box'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0, left: 0, width: '100%', height: '100%',
                zIndex: 0, overflow: 'hidden'
            }}>
                {baseContent}
            </div>

            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    zIndex: 10,
                    WebkitMaskImage: `radial-gradient(circle ${maskRadius}px at 50% 50%, black 100%, transparent 0%)`,
                    maskImage: `radial-gradient(circle ${maskRadius}px at 50% 50%, black 100%, transparent 0%)`,
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                }}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%'
                }}>
                    <div style={{
                        maxWidth: `${maskRadius * 1.5}px`,
                        maxHeight: `${maskRadius * 1.5}px`,
                        textAlign: 'center',
                        overflow: 'hidden',
                        fontSize: 'clamp(10px, 4vw, 16px)',
                        color: 'white'
                    }}>
                        {revealContent}
                    </div>
                </div>
            </div>

            <div
                style={{
                    pointerEvents: 'none',
                    position: 'absolute',
                    zIndex: 20,
                    left: '50%',
                    top: '50%',
                    width: `${finalSize}px`,
                    height: `${finalSize}px`,
                    WebkitTransform: `translate(-${offset}px, -${offset}px) rotate(-15deg)`,
                    transform: `translate(-${offset}px, -${offset}px) rotate(-15deg)`,
                }}
            >
                <img
                    src="/lens.svg"
                    alt="Lens"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />
            </div>
        </div>
    );
}
