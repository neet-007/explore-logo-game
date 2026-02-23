export default function EEExploreStatic() {
    const imgStyle = { width: '14%', maxWidth: '80px', height: 'auto', display: 'inline-block', margin: '0 1%', opacity: 0.5 };
    const mainImgStyle = { width: '22%', maxWidth: '150px', height: 'auto', display: 'inline-block', margin: '0 1%', opacity: 1 };

    return (
        <div style={{ width: '100%', textAlign: 'center' }}>
            <img src="/EEEXPLORE-logo.png" style={{ width: '50%', maxWidth: '250px', marginBottom: '15px' }} />

            <div style={{ width: '100%', display: 'block' }}>
                <img src="/AI.png" style={imgStyle} />
                <img src="/Computer Vision.png" style={imgStyle} />
                <img src="/Cyber security.png" style={imgStyle} />
                <img src="/Freelancing.png" style={imgStyle} />
                <img src="/Game Development.png" style={imgStyle} />
                <img src="/Graphic.png" style={mainImgStyle} />
            </div>
        </div>
    );
}
