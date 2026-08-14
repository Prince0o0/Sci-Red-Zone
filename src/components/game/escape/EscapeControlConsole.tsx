"use client";

import InteractionTrigger from "../interactions/InteractionTrigger";

import {
  ESCAPE_CONTROL_POSITION,
  ESCAPE_CONTROL_TRIGGER_SIZE,
} from "./escapeConfig";

type EscapeControlConsoleProps = {
  enabled: boolean;

  onActivate: () => void;
};

export default function EscapeControlConsole({
  enabled,
  onActivate,
}: EscapeControlConsoleProps) {
  return (
    <InteractionTrigger
      position={
        ESCAPE_CONTROL_POSITION
      }

      halfExtents={
        ESCAPE_CONTROL_TRIGGER_SIZE
      }

      enabled={enabled}

      label="เปิดระบบควบคุม"

      onInteract={onActivate}
    />
  );
}