"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

type IntroVideoProps = {
    onComplete: () => void;
};

export default function IntroVideo({
    onComplete,
}: IntroVideoProps) {
    const videoRef =
        useRef<HTMLVideoElement>(null);

    const [
        needsInteraction,
        setNeedsInteraction,
    ] = useState(false);

    // ==============================
    // Start Video
    // ==============================

    useEffect(() => {
        const video =
            videoRef.current;

        if (!video) {
            return;
        }

        video.muted = false;
        video.volume = 1;

        const playVideo = async () => {
            try {
                await video.play();

                setNeedsInteraction(
                    false,
                );
            } catch {
                /*
                 * Browser block autoplay
                 * ที่มีเสียง
                 */
                setNeedsInteraction(
                    true,
                );
            }
        };

        playVideo();
    }, []);

    // ==============================
    // Browser ขอ User Interaction
    // ==============================

    async function handlePlayIntro() {
        const video =
            videoRef.current;

        if (!video) {
            return;
        }

        video.muted = false;
        video.volume = 1;

        try {
            await video.play();

            setNeedsInteraction(
                false,
            );
        } catch (error) {
            console.error(
                "Intro video play failed:",
                error,
            );
        }
    }

    return (
        <div
            className="
                absolute
                inset-0
                z-[10000]
                flex
                items-center
                justify-center
                bg-black
            "
        >
            <video
                ref={videoRef}
                src="/videos/intro.mp4"
                playsInline
                preload="auto"
                muted={false}
                onEnded={
                    onComplete
                }
                className="
                    h-full
                    w-full
                    bg-black
                    object-contain
                "
            />

            {/* ======================
                Browser Block Sound
            ====================== */}

            {needsInteraction && (
                <button
                    type="button"
                    onClick={
                        handlePlayIntro
                    }
                    className="
                        absolute
                        left-1/2
                        top-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        border
                        border-white/30
                        bg-black/80
                        px-8
                        py-4
                        text-sm
                        font-bold
                        tracking-[0.2em]
                        text-white
                        backdrop-blur-sm
                    "
                >
                    PLAY INTRO
                </button>
            )}

            {/* ======================
                Skip
            ====================== */}

            <button
                type="button"
                onClick={
                    onComplete
                }
                className="
                    absolute
                    bottom-8
                    right-8
                    rounded-md
                    border
                    border-white/20
                    bg-black/40
                    px-5
                    py-2
                    text-xs
                    tracking-[0.25em]
                    text-white/60
                    backdrop-blur-sm
                    transition
                    hover:border-white/50
                    hover:text-white
                "
            >
                SKIP
            </button>
        </div>
    );
}