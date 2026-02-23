import DetectiveReveal from "@/components/LogoLens";
import EEExplore from "@/components/EEExplore";

/*
<DetectiveReveal
    className="w-full h-full"
    lensSize={200}
    baseContent={<img src="/AI.webp" className="w-full h-full object-contain opacity-20 grayscale" />}
    revealContent={<img src="/Graphic.webp" className="w-full h-full object-contain" />}
/>
*/

export default function Header() {
    return (
        <div className="grid grid-cols-1 md:grid-flow-col md:auto-cols-fr gap-4 p-2">

            <div>
                <EEExplore />
            </div>

            <div>
                <DetectiveReveal
                    className="w-full h-100"
                    duration="3s"
                    baseContent={<img src="/AI.webp" className="w-full h-full object-contain opacity-20 grayscale" />}
                    revealContent={
                        <div className="flex text-white flex-col items-center justify-center h-full">
                            <p>first reason</p>
                            <p>second reason</p>
                            <p>third reason</p>
                            <p>fourth reason</p>
                            <p>fifth reason</p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
