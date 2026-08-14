"use client";

type MainMenuProps = {
    onStart: () => void;
};

export default function MainMenu({
    onStart,
}: MainMenuProps) {
    return (
        <div
            className="
                absolute
                inset-0
                z-[10000]
                flex
                items-center
                justify-center
                overflow-hidden
                bg-black
                text-white
            "
        >
            {/* Background */}

            <div
                className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-slate-950
                    via-black
                    to-black
                "
            />

            {/* Atmosphere */}

            <div
                className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[500px]
                    w-[700px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    bg-emerald-900/10
                    blur-[120px]
                "
            />

            {/* Content */}

            <div
                className="
                    relative
                    z-10
                    flex
                    flex-col
                    items-center
                    text-center
                "
            >
                <div
                    className="
                        mb-3
                        text-xs
                        font-medium
                        tracking-[0.6em]
                        text-emerald-400/80
                    "
                >
                    SCIENCE FACILITY
                </div>

                <h1
                    className="
                        text-6xl
                        font-black
                        tracking-[0.08em]
                        text-white
                    "
                >
                    SCI RED ZONE
                </h1>

                <div
                    className="
                        mt-3
                        text-sm
                        tracking-[0.25em]
                        text-white/40
                    "
                >
                    SOMETHING WENT WRONG
                </div>

                <button
                    type="button"
                    onClick={onStart}
                    className="
                        mt-14
                        min-w-56
                        border
                        border-white/25
                        bg-white/5
                        px-10
                        py-4
                        text-sm
                        font-bold
                        tracking-[0.3em]
                        text-white
                        transition
                        duration-300
                        hover:border-emerald-400/70
                        hover:bg-emerald-400/10
                        hover:text-emerald-300
                    "
                >
                    START GAME
                </button>

                <div
                    className="
                        mt-6
                        text-xs
                        tracking-[0.2em]
                        text-white/25
                    "
                >
                    PRESS START TO BEGIN
                </div>
            </div>

            {/* bottom */}

            <div
                className="
                    absolute
                    bottom-6
                    left-1/2
                    -translate-x-1/2
                    text-[10px]
                    tracking-[0.3em]
                    text-white/20
                "
            >
                SCI WEEK PROJECT
            </div>
        </div>
    );
}