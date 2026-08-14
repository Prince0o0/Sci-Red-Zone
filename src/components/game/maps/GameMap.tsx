"use client";

import GameBackground from "./GameBackground";
import MapExitTrigger from "./MapExitTrigger";
import HoldExitTrigger from "./HoldExitTrigger";
import type {
    MapDefinition,
} from "./mapTypes";
import FacultyHallCollision from "./faculty-hall/FacultyHallCollision";
import StairwayCollision from "./stairway/StairwayCollision";
import LaboratoryCollision from "./laboratory/LaboratoryCollision";
import EscapeCollision from "./escape/EscapeCollision";

type GameMapProps = {
    map: MapDefinition;
    isLastMap: boolean;
    onExit: () => void;
    labExitEnabled?: boolean;
};

// ==============================
// Game Map
// ==============================
export default function GameMap({
    map,
    isLastMap,
    onExit,
    labExitEnabled = false,
}: GameMapProps) {
    return (
        <>
            <GameBackground
                background={
                    map.background
                }
            />

            {/* ======================
                Collision / Map
            ====================== */}
            {map.id === "faculty-hall" && (
                <FacultyHallCollision />
            )}

            {map.id === "stairway" && (
                <StairwayCollision />
            )}

            {map.id === "laboratory" && (
                <LaboratoryCollision />
            )}

            {map.id === "escape" && (
                <EscapeCollision />
            )}

            {/* ======================
                MAP 0
                Hall → Stairway

                เดินชนแล้วเข้า
                scripted transition เดิม
            ====================== */}

            {map.id ===
                "faculty-hall" && (
                    <MapExitTrigger
                        position={
                            map.exit.position
                        }
                        halfExtents={
                            map.exit.halfExtents
                        }
                        onEnter={onExit}
                    />
                )}

            {/* ======================
                MAP 1
                Stairway → Laboratory

                ต้องกด E ค้าง
            ====================== */}

            {map.id === "stairway" && (
                <HoldExitTrigger
                    position={
                        map.exit.position
                    }
                    halfExtents={
                        map.exit.halfExtents
                    }
                    holdDuration={1.2}
                    onComplete={onExit}
                />
            )}

            {map.id === "laboratory" && (
                <HoldExitTrigger
                    position={
                        map.exit.position
                    }
                    halfExtents={
                        map.exit.halfExtents
                    }
                    holdDuration={1.5}
                    enabled={
                        labExitEnabled
                    }
                    onComplete={
                        onExit
                    }
                />
            )}
        </>
    );
}