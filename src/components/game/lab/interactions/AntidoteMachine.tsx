"use client";

import HoldInteractionTrigger from "../../interactions/HoldInteractionTrigger";
import {
  ANTIDOTE_MACHINE_POSITION,
  ANTIDOTE_MACHINE_TRIGGER_SIZE,
} from "../labConfig";

type AntidoteMachineProps = {
  unlocked: boolean;

  collected: boolean;

  onCollected: () => void;

  onHoldingChange: (
    holding: boolean,
  ) => void;
};

export default function AntidoteMachine({
  unlocked,
  collected,
  onCollected,
  onHoldingChange,
}: AntidoteMachineProps) {
  if (collected) {
    return null;
  }

  return (
    <HoldInteractionTrigger
      position={
        ANTIDOTE_MACHINE_POSITION
      }
      halfExtents={
        ANTIDOTE_MACHINE_TRIGGER_SIZE
      }

      enabled={unlocked}

      holdDuration={2}

      label="ค้างเพื่อสังเคราะห์สาร"

      onHoldingChange={
        onHoldingChange
      }

      onComplete={
        onCollected
      }
    />
  );
}