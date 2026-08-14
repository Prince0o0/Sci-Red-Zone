"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import GameMap from "./maps/GameMap";
import {
  GAME_MAPS,
} from "./maps/mapConfig";
import Player from "./player/Player";
import ModelPrinter from "./objects/ModelPrinter";
import {
  DEFAULT_PUSH_INTERACTION_STATE,
  type PushInteractionState,
} from "./interactions/push/pushTypes";
import MapFadeOverlay from "./maps/MapFadeOverlay";
import DNAConsole from "./lab/interactions/DNAConsole";
import DNAPuzzle from "./lab/puzzles/DNAPuzzle";
import CellScanner from "./lab/interactions/CellScanner";
import CellPuzzle from "./lab/puzzles/CellPuzzle";
import ChemicalConsole from "./lab/interactions/ChemicalConsole";
import ChemicalPuzzle from "./lab/puzzles/ChemicalPuzzle";
import AntidoteMachine from "./lab/interactions/AntidoteMachine";
import EscapeControlConsole from "./escape/EscapeControlConsole";
import EscapeAlarmOverlay from "./escape/EscapeAlarmOverlay";
import {
  ESCAPE_ALARM_DURATION,
} from "./escape/escapeConfig";
import type {
  EscapePhase,
} from "./escape/escapeTypes";

const MODEL_PRINTER_POSITION: [
  number,
  number,
  number,
] = [46, 1.65, -1.2];

export default function GameScene() {
  const [
    mapEnterTransitionActive,
    setMapEnterTransitionActive,
  ] = useState(
    () =>
      (
        GAME_MAPS[0]
          ?.enterTransition
          ?.steps.length ??
        0
      ) > 0,
  );

  const [
    escapePhase,
    setEscapePhase,
  ] = useState<EscapePhase>(
    "control",
  );

  const [
    activeLabPuzzle,
    setActiveLabPuzzle,
  ] = useState<
    "dna" |
    "cell" |
    "chemical" |
    null
  >(null);

  const [
    dnaCompleted,
    setDnaCompleted,
  ] = useState(false);

  const [
    cellCompleted,
    setCellCompleted,
  ] = useState(false);

  const [
    chemicalCompleted,
    setChemicalCompleted,
  ] = useState(false);

  const [
    antidoteCollected,
    setAntidoteCollected,
  ] = useState(false);

  const [
    antidoteInteractionActive,
    setAntidoteInteractionActive,
  ] = useState(false);

  const [
    showAntidoteMessage,
    setShowAntidoteMessage,
  ] = useState(false);

  const [pushState, setPushState] = useState<PushInteractionState>(
    DEFAULT_PUSH_INTERACTION_STATE,
  );

  const [
    currentMapIndex,
    setCurrentMapIndex,
  ] = useState(0);

  const [
    mapExitTransitionActive,
    setMapExitTransitionActive,
  ] = useState(false);

  const [
    mapFadeVisible,
    setMapFadeVisible,
  ] = useState(true);

  const mapTransitionBusyRef = useRef(false);

  const currentMap = GAME_MAPS[currentMapIndex];

  const isLastMap = currentMapIndex === GAME_MAPS.length - 1;

  if (!currentMap) {
    return null;
  }

  function startMapExitTransition() {
    if (mapTransitionBusyRef.current) {
      return;
    }

    if (isLastMap) {
      return;
    }

    mapTransitionBusyRef.current = true;

    /*
     * ยังไม่เปลี่ยน Map
     *
     * แค่สั่ง Player
     * ให้หันและเดินเข้าไปก่อน
     */
    setMapExitTransitionActive(true);
  }

  function handleMapExitWalkComplete() {
    fadeToNextMap();
  }

  function fadeToNextMap() {
    setMapFadeVisible(true);

    const nextMapIndex =
      Math.min(
        currentMapIndex + 1,
        GAME_MAPS.length - 1,
      );

    const nextMap =
      GAME_MAPS[nextMapIndex];

    window.setTimeout(() => {
      setCurrentMapIndex(
        nextMapIndex,
      );

      setMapExitTransitionActive(
        false,
      );

      // ============================
      // Intro ของ Map ใหม่
      // ============================

      const hasEnterTransition =
        (
          nextMap
            ?.enterTransition
            ?.steps.length ??
          0
        ) > 0;

      setMapEnterTransitionActive(
        hasEnterTransition,
      );

      /*
       * ให้ Map ใหม่ mount ตอนจอดำก่อน
       */
      window.setTimeout(() => {
        setMapFadeVisible(false);

        mapTransitionBusyRef.current =
          false;
      }, 100);
    }, 500);
  }

  function handleMapExitRequested() {
    if (
      mapTransitionBusyRef.current
    ) {
      return;
    }

    if (isLastMap) {
      return;
    }

    // ============================
    // Hall → Stairway
    // ============================

    if (
      currentMap.id ===
      "faculty-hall"
    ) {
      startMapExitTransition();

      return;
    }

    // ============================
    // Stairway → Laboratory
    // ============================

    mapTransitionBusyRef.current =
      true;

    fadeToNextMap();
  }

  function startEscapeAlarm() {
    if (
      currentMap.id !== "escape"
    ) {
      return;
    }

    if (
      escapePhase !== "control"
    ) {
      return;
    }

    // ============================
    // เริ่ม Alarm
    // ============================

    setEscapePhase(
      "alarm",
    );

    window.setTimeout(() => {
      // ============================
      // Alarm จบ
      // เริ่ม Chase
      // ============================

      setEscapePhase(
        "chase",
      );
    }, ESCAPE_ALARM_DURATION);
  }

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setMapFadeVisible(false);
      }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{
          position: [0, 4, 12],
          fov: 55,
          near: 0.1,
          far: 200,
        }}
      >
        <color
          attach="background"
          args={["#151515"]}
        />

        <ambientLight intensity={0.8} />

        <directionalLight
          castShadow
          position={[-5, 10, 8]}
          intensity={2}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Physics
          gravity={[0, -18, 0]}
          debug={true}
        >
          <GameMap
            key={`map-${currentMap.id}`}
            map={currentMap}
            isLastMap={isLastMap}
            onExit={handleMapExitRequested}
            labExitEnabled={antidoteCollected}
          />

          {currentMap.id === "escape" && (
            <EscapeControlConsole
              enabled={
                escapePhase ===
                "control"
              }

              onActivate={
                startEscapeAlarm
              }
            />
          )}

          {/* Puzzles */}
          {currentMap.id === "laboratory" && (
            <>
              <DNAConsole
                completed={
                  dnaCompleted
                }
                onOpen={() => {
                  setActiveLabPuzzle(
                    "dna",
                  );
                }}
              />

              <CellScanner
                completed={
                  cellCompleted
                }
                enabled={
                  dnaCompleted
                }
                onOpen={() => {
                  setActiveLabPuzzle(
                    "cell",
                  );
                }}
              />

              <ChemicalConsole
                completed={
                  chemicalCompleted
                }
                enabled={
                  cellCompleted
                }
                onOpen={() => {
                  setActiveLabPuzzle(
                    "chemical",
                  );
                }}
              />

              <AntidoteMachine
                unlocked={
                  chemicalCompleted
                }

                collected={
                  antidoteCollected
                }

                onHoldingChange={
                  setAntidoteInteractionActive
                }

                onCollected={() => {
                  setAntidoteCollected(
                    true,
                  );

                  setAntidoteInteractionActive(
                    false,
                  );

                  setShowAntidoteMessage(
                    true,
                  );

                  window.setTimeout(() => {
                    setShowAntidoteMessage(
                      false,
                    );
                  }, 2500);
                }}
              />
            </>
          )}

          {/* Printer ตอนนี้อยู่ MAP 0 ก่อน */}

          {currentMap.id ===
            "faculty-hall" && (
              <ModelPrinter
                position={
                  MODEL_PRINTER_POSITION
                }

                /*
                 * props Push เดิมของคุณ
                 * ใส่เหมือนเดิมตรงนี้
                 */
                onPushStateChange={
                  setPushState
                }
              />
            )}

          <Player
            key={`player-${currentMap.id}`}

            pushState={pushState}

            spawnPosition={
              currentMap.spawnPosition
            }

            controlsLocked={
              activeLabPuzzle !== null ||
              antidoteInteractionActive ||
              mapEnterTransitionActive ||
              (
                currentMap.id ===
                "escape" &&
                escapePhase ===
                "alarm"
              )
            }

            mapEnterTransition={{
              active:
                mapEnterTransitionActive,

              steps:
                currentMap
                  .enterTransition
                  ?.steps ??
                [],
            }}

            onMapEnterWalkComplete={() => {
              setMapEnterTransitionActive(
                false,
              );
            }}

            mapExitTransition={{
              active:
                mapExitTransitionActive,

              steps: [
                // ======================
                // ช่วง 1
                // เดินเข้าไปด้านลึก
                // ======================

                {
                  velocityX: 0,
                  velocityZ: -5,

                  duration: 2.8,

                  rotationY: Math.PI,
                },

                // ======================
                // ช่วง 2
                // ถึงมุมแล้วเลี้ยวขวา
                // ======================

                {
                  velocityX: 4,
                  velocityZ: 0,

                  duration: 1,

                  rotationY:
                    Math.PI / 2,
                },
              ],
            }}

            onMapExitWalkComplete={
              handleMapExitWalkComplete
            }
          />
        </Physics>
      </Canvas>

      {/* UI Puzzle */}
      {activeLabPuzzle === "dna" && (
        <DNAPuzzle
          onClose={() => {
            setActiveLabPuzzle(
              null,
            );
          }}

          onComplete={() => {
            setDnaCompleted(
              true,
            );

            setActiveLabPuzzle(
              null,
            );
          }}
        />
      )}

      {activeLabPuzzle === "cell" && (
        <CellPuzzle
          onClose={() => {
            setActiveLabPuzzle(
              null,
            );
          }}

          onComplete={() => {
            setCellCompleted(
              true,
            );

            setActiveLabPuzzle(
              null,
            );
          }}
        />
      )}

      {activeLabPuzzle ===
        "chemical" && (
          <ChemicalPuzzle
            onClose={() => {
              setActiveLabPuzzle(
                null,
              );
            }}

            onComplete={() => {
              setChemicalCompleted(
                true,
              );

              setActiveLabPuzzle(
                null,
              );
            }}
          />
        )}

      {showAntidoteMessage && (
        <div
          className="
      pointer-events-none
      absolute
      left-1/2
      top-20
      z-8000
      -translate-x-1/2
      rounded-xl
      border
      border-emerald-400/30
      bg-black/85
      px-8
      py-4
      text-center
      text-white
      shadow-2xl
      backdrop-blur-sm
    "
        >
          <div className="text-xs tracking-[0.3em] text-emerald-400" >
            SYNTHESIS COMPLETE
          </div>

          <div
            className="
        mt-1
        text-xl
        font-bold
      "
          >
            ANTIDOTE ACQUIRED
          </div>
        </div>
      )}

      <EscapeAlarmOverlay
        visible={
          currentMap.id ===
          "escape" &&
          escapePhase ===
          "alarm"
        }
      />

      <MapFadeOverlay
        visible={mapFadeVisible}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/70 px-4 py-3 text-sm leading-6 text-white">
        A / D = เดิน
        <br />
        Shift + A / D = วิ่ง
        <br />
        Space = กระโดด
        <br />
        C / Ctrl = กดเพื่อย่อ
        <br />
        E = ดัน Printer
      </div>
    </div>
  );
}
