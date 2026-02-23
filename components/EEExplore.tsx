export default function EEExplore() {
    const imgStyle = "w-[12vw] min-w-[50px] max-w-[120px] aspect-square object-contain opacity-50 animate-float";
    const imgMainStyle = "w-[20vw] min-w-[100px] max-w-[200px] aspect-square object-contain animate-float";

    return (
        <div className="w-full flex flex-col">
            <img src="/EEEXPLORE-logo.webp" className="w-[30vw] max-w-[300px] h-auto" />

            <div className="flex justify-center items-center w-full">
                <img src="/AI.webp"
                    className={imgStyle} />

                <img src="/Computer Vision.webp"
                    className={imgStyle} />

                <img src="/Cyber security.webp"
                    className={imgStyle} />

                <img src="/Freelancing.webp"
                    className={imgStyle} />

                <img src="/Game Development.webp"
                    className={imgStyle} />

                <img src="/Graphic.webp"
                    className={imgMainStyle} />
            </div>
        </div>
    );
}
