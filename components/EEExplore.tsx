export default function EEExplore() {
    const imgStyle = "w-[12vw] min-w-[50px] max-w-[120px] aspect-square object-contain opacity-50 animate-float";
    const imgMainStyle = "w-[20vw] min-w-[100px] max-w-[200px] aspect-square object-contain animate-float";

    return (
        <div className="w-full flex flex-col">
            <img src="/EEEXPLORE-logo.png" className="w-[30vw] max-w-[300px] h-auto" />

            <div className="flex justify-center items-center w-full">
                <img src="/AI.png"
                    className={imgStyle} />

                <img src="/Computer Vision.png"
                    className={imgStyle} />

                <img src="/Cyber security.png"
                    className={imgStyle} />

                <img src="/Freelancing.png"
                    className={imgStyle} />

                <img src="/Game Development.png"
                    className={imgStyle} />

                <img src="/Graphic.png"
                    className={imgMainStyle} />
            </div>
        </div>
    );
}
