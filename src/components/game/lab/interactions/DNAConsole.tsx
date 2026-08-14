"use client";

import InteractionTrigger from "../../interactions/InteractionTrigger";

import {
    DNA_CONSOLE_TRIGGER_POSITION,
    DNA_CONSOLE_TRIGGER_SIZE,
} from "../labConfig";

type DNAConsoleProps = {
    completed: boolean;

    onOpen: () => void;
};

export default function DNAConsole({
    completed,
    onOpen,
}: DNAConsoleProps) {
    return (
        <InteractionTrigger
            position={
                DNA_CONSOLE_TRIGGER_POSITION
            }
            halfExtents={
                DNA_CONSOLE_TRIGGER_SIZE
            }
            enabled={!completed}
            label="ตรวจสอบ DNA"
            onInteract={onOpen}
        />
    );
}