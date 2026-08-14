"use client";

import InteractionTrigger from "../../interactions/InteractionTrigger";

import {
  CELL_SCANNER_TRIGGER_POSITION,
  CELL_SCANNER_TRIGGER_SIZE,
} from "../labConfig";

type CellScannerProps = {
  completed: boolean;
  enabled: boolean;
  onOpen: () => void;
};

export default function CellScanner({
  completed,
  enabled,
  onOpen,
}: CellScannerProps) {
  return (
    <InteractionTrigger
      position={
        CELL_SCANNER_TRIGGER_POSITION
      }
      halfExtents={
        CELL_SCANNER_TRIGGER_SIZE
      }
      enabled={
        enabled && !completed
      }
      label="ตรวจสอบ Cell"
      onInteract={onOpen}
    />
  );
}