"use client";

type MapFadeOverlayProps = {
    visible: boolean;
};

export default function MapFadeOverlay({
    visible,
}: MapFadeOverlayProps) {
    return (
        <div
            className={`
                pointer-events-none
                fixed
                inset-0
                z-9999
                bg-black
                transition-opacity
                duration-500
                ${
                    visible
                        ? "opacity-100"
                        : "opacity-0"
                }
            `}
        />
    );
}