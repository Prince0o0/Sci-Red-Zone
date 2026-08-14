import type { MapDefinition } from "./mapTypes";

export const GAME_MAPS: MapDefinition[] = [
  // ==============================
  // MAP 0 โถงคณะ / Tutorial
  // ==============================
  {
    id: "faculty-hall",
    label: "Faculty Hall",
    spawnPosition: [-9, 1, 0],
    enterTransition: {
      steps: [
        {
          velocityX: 3,
          velocityZ: 0,
          duration: 1.2,
          rotationY: Math.PI / 2,
        },
      ],
    },
    background: {
      url: "/backgrounds/hall_background.jpg",
      position: [35, 8, -80],
      size: [120, 30],
      fallbackColor: "#20242a",
    },
    exit: {
      position: [82, 2, 0],
      halfExtents: [0.5, 3, 2],
    },
  },

  // ==============================
  // MAP 2 ทางเดินไฟดับ
  // ==============================

  {
    id: "stairway",
    label: "Stairway",
    spawnPosition: [-9, 1, 0],
    enterTransition: {
      steps: [
        {
          velocityX: 3,
          velocityZ: 0,
          duration: 1.2,
          rotationY: Math.PI / 2,
        },
      ],
    },
    background: {
      // url: "/backgrounds/hall_background.jpg",
      position: [35, 8, -80],
      size: [120, 30],
      fallbackColor: "#20242a",
    },
    exit: {
      position: [115, 2, 0],
      halfExtents: [0.5, 3, 2],
    },
  },

  // ==============================
  // MAP 2 laboratory
  // ==============================
  {
    id: "laboratory",
    label: "Laboratory",
    spawnPosition: [-9, 1, 0],
    enterTransition: {
      steps: [
        {
          velocityX: 3,
          velocityZ: 0,
          duration: 1.2,
          rotationY: Math.PI / 2,
        },
      ],
    },
    background: {
      // url: "/backgrounds/map02-skybridge.webp",

      position: [5, 7, -5],
      size: [34, 18],
      fallbackColor: "#263039",
    },

    exit: {
      position: [144.5, 2, 0],
      halfExtents: [0.5, 2, 1.5],
    },
  },

  // ==============================
  // MAP 3 Escape
  // ==============================
  {
    id: "escape",
    label: "Escape",
    spawnPosition: [-9, 2, 0],
    enterTransition: {
      steps: [
        {
          velocityX: 3,
          velocityZ: 0,
          duration: 1.2,
          rotationY: Math.PI / 2,
        },
      ],
    },
    background: {
      // url: "/backgrounds/map03-yard.webp",
      position: [5, 7, -5],
      size: [34, 18],
      fallbackColor: "#263229",
    },

    exit: {
      position: [138, 2, 0],

      halfExtents: [0.5, 3, 2],
    },
  },
];
