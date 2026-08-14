"use client";

import { useState } from "react";

type CellSample =
  | "01"
  | "02"
  | "03"
  | "04";

type CellPuzzleProps = {
  onComplete: () => void;
  onClose: () => void;
};

const CORRECT_SAMPLE:
  CellSample = "03";

export default function CellPuzzle({
  onComplete,
  onClose,
}: CellPuzzleProps) {
  const [
    selectedSample,
    setSelectedSample,
  ] =
    useState<CellSample | null>(
      null,
    );

  const [
    message,
    setMessage,
  ] = useState("");

  function handleAnalyze() {
    if (!selectedSample) {
      setMessage(
        "กรุณาเลือกตัวอย่าง Cell",
      );

      return;
    }

    if (
      selectedSample !==
      CORRECT_SAMPLE
    ) {
      setMessage(
        `Sample ${selectedSample} — ไม่พบความผิดปกติ`,
      );

      return;
    }

    setMessage(
      "ABNORMAL CELL DETECTED",
    );

    window.setTimeout(() => {
      onComplete();
    }, 700);
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9000]
        flex
        items-center
        justify-center
        bg-black/80
        p-6
        backdrop-blur-sm
      "
    >
      <div
        className="
          relative
          w-full
          max-w-3xl
          rounded-2xl
          border
          border-purple-400/30
          bg-slate-950
          p-8
          text-white
          shadow-2xl
        "
      >
        <button
          type="button"
          onClick={onClose}
          className="
            absolute
            right-5
            top-4
            text-2xl
            text-white/60
            hover:text-white
          "
        >
          ×
        </button>

        <div
          className="
            text-xs
            uppercase
            tracking-[0.35em]
            text-purple-400
          "
        >
          Cell Analysis System
        </div>

        <h2
          className="
            mt-2
            text-3xl
            font-bold
          "
        >
          CELL SCANNER
        </h2>

        <p
          className="
            mt-2
            text-white/60
          "
        >
          ตรวจสอบตัวอย่างและเลือก
          Cell ที่มีความผิดปกติ
        </p>

        <div
          className="
            mt-8
            grid
            grid-cols-4
            gap-4
          "
        >
          {(
            [
              "01",
              "02",
              "03",
              "04",
            ] as CellSample[]
          ).map((sample) => {
            const selected =
              selectedSample ===
              sample;

            const abnormal =
              sample === "03";

            return (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setSelectedSample(
                    sample,
                  );

                  setMessage("");
                }}
                className={`
                  rounded-xl
                  border
                  p-4
                  transition
                  ${
                    selected
                      ? "border-purple-300 bg-purple-400/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }
                `}
              >
                <div
                  className="
                    text-sm
                    text-white/50
                  "
                >
                  SAMPLE
                </div>

                <div
                  className="
                    mt-1
                    text-2xl
                    font-bold
                  "
                >
                  {sample}
                </div>

                <div
                  className="
                    mt-5
                    flex
                    h-28
                    items-center
                    justify-center
                    rounded-lg
                    bg-black/30
                  "
                >
                  <div
                    className={`
                      h-16
                      w-16
                      rounded-full
                      border-4
                      ${
                        abnormal
                          ? "border-red-400/70 bg-red-500/20"
                          : "border-cyan-400/70 bg-cyan-500/20"
                      }
                    `}
                  >
                    <div
                      className="
                        flex
                        h-full
                        items-center
                        justify-center
                        text-xl
                      "
                    >
                      {abnormal
                        ? "✦"
                        : "●"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="
            mt-5
            min-h-6
            text-center
            text-sm
            text-purple-300
          "
        >
          {message}
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          className="
            mt-4
            w-full
            rounded-xl
            bg-purple-400
            px-6
            py-4
            font-bold
            text-slate-950
            transition
            hover:bg-purple-300
          "
        >
          วิเคราะห์ตัวอย่าง
        </button>
      </div>
    </div>
  );
}