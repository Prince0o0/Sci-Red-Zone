export type MapId = "faculty-hall" | "stairway" | "laboratory" | "escape";

export type Vector3Tuple = [number, number, number];

export type MapTransitionStep = {
  velocityX: number;
  velocityZ: number;
  duration: number;
  rotationY: number;
};

export type MapDefinition = {
  id: MapId;

  label: string;

  spawnPosition: Vector3Tuple;

  background: {
    url?: string;

    position: Vector3Tuple;

    size: [number, number];

    fallbackColor: string;
  };

  enterTransition?: {
    steps: MapTransitionStep[];
  };

  exit: {
    position: Vector3Tuple;

    halfExtents: Vector3Tuple;
  };
};
