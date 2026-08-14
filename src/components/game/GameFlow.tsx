"use client";

import {
    useState,
} from "react";

import GameScene from "./GameScene";

import MainMenu from "./ui/MainMenu";
import IntroVideo from "./ui/IntroVideo";

type GamePhase =
    | "menu"
    | "intro"
    | "game";

export default function GameFlow() {
    const [
        phase,
        setPhase,
    ] = useState<GamePhase>(
        "menu",
    );

    // ==============================
    // Main Menu
    // ==============================

    if (phase === "menu") {
        return (
            <MainMenu
                onStart={() => {
                    setPhase("intro");
                }}
            />
        );
    }

    // ==============================
    // Intro Story
    // ==============================

    if (phase === "intro") {
        return (
            <IntroVideo
                onComplete={() => {
                    setPhase("game");
                }}
            />
        );
    }

    // ==============================
    // Gameplay
    // ==============================

    return <GameScene />;
}