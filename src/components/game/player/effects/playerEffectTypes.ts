import type { RefObject } from "react";

export type PlayerEffectSnapshot = {
    x: number;
    footY: number;
    z: number;
    velocityX: number;
    grounded: boolean;
    enabled: boolean;
    locomotionActive: boolean;
};

export type PlayerEffectStateRef =
    RefObject<PlayerEffectSnapshot>;
