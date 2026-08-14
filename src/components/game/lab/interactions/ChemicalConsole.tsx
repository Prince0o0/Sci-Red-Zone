"use client";

import InteractionTrigger from "../../interactions/InteractionTrigger";

import {
  CHEMICAL_CONSOLE_TRIGGER_POSITION,
  CHEMICAL_CONSOLE_TRIGGER_SIZE,
} from "../labConfig";

type ChemicalConsoleProps = {
  completed: boolean;

  enabled: boolean;

  onOpen: () => void;
};

export default function ChemicalConsole({
  completed,
  enabled,
  onOpen,
}: ChemicalConsoleProps) {
  return (
    <InteractionTrigger
      position={
        CHEMICAL_CONSOLE_TRIGGER_POSITION
      }
      halfExtents={
        CHEMICAL_CONSOLE_TRIGGER_SIZE
      }
      enabled={
        enabled && !completed
      }
      label="วิเคราะห์สารทดลอง"
      onInteract={onOpen}
    />
  );
}