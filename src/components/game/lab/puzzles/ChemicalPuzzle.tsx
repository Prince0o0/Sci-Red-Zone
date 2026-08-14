"use client";

import { useState } from "react";

type ChemicalId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F";

type ChemicalPuzzleProps = {
  onComplete: () => void;

  onClose: () => void;
};

const CHEMICALS: {
  id: ChemicalId;
  name: string;
  symbol: string;
}[] = [
  {
    id: "A",
    name: "Compound A",
    symbol: "A",
  },
  {
    id: "B",
    name: "Compound B",
    symbol: "B",
  },
  {
    id: "C",
    name: "Compound C",
    symbol: "C",
  },
  {
    id: "D",
    name: "Compound D",
    symbol: "D",
  },
  {
    id: "E",
    name: "Compound E",
    symbol: "E",
  },
  {
    id: "F",
    name: "Compound F",
    symbol: "F",
  },
];

const CORRECT_COMBINATION:
  ChemicalId[] = [
    "A",
    "D",
  ];

export default function ChemicalPuzzle({
  onComplete,
  onClose,
}: ChemicalPuzzleProps) {
  const [
    selectedChemicals,
    setSelectedChemicals,
  ] = useState<ChemicalId[]>([]);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    analyzing,
    setAnalyzing,
  ] = useState(false);

  function toggleChemical(
    chemical: ChemicalId,
  ) {
    if (analyzing) {
      return;
    }

    setMessage("");

    /*
     * ถ้าเลือกอยู่แล้ว
     * → กดอีกครั้งเพื่อเอาออก
     */
    if (
      selectedChemicals.includes(
        chemical,
      )
    ) {
      setSelectedChemicals(
        (current) =>
          current.filter(
            (item) =>
              item !== chemical,
          ),
      );

      return;
    }

    /*
     * เลือกได้สูงสุด 2 สาร
     */
    if (
      selectedChemicals.length >= 2
    ) {
      setMessage(
        "เลือกสารได้สูงสุด 2 ชนิด",
      );

      return;
    }

    setSelectedChemicals(
      (current) => [
        ...current,
        chemical,
      ],
    );
  }

  function handleTestCombination() {
    if (
      selectedChemicals.length !== 2
    ) {
      setMessage(
        "กรุณาเลือกสาร 2 ชนิด",
      );

      return;
    }

    setAnalyzing(true);

    setMessage(
      "กำลังวิเคราะห์ปฏิกิริยา...",
    );

    /*
     * ให้รู้สึกเหมือนเครื่องกำลังตรวจ
     */
    window.setTimeout(() => {
      const normalizedSelected =
        [...selectedChemicals]
          .sort()
          .join("-");

      const normalizedCorrect =
        [...CORRECT_COMBINATION]
          .sort()
          .join("-");

      if (
        normalizedSelected !==
        normalizedCorrect
      ) {
        setMessage(
          "REACTION FAILED — สูตรสารไม่สามารถยับยั้ง Cell ได้",
        );

        setSelectedChemicals([]);

        setAnalyzing(false);

        return;
      }

      setMessage(
        "MATCH FOUND — INHIBITOR FORMULA CONFIRMED",
      );

      window.setTimeout(() => {
        onComplete();
      }, 900);
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
          max-w-4xl
          rounded-2xl
          border
          border-emerald-400/30
          bg-slate-950
          p-8
          text-white
          shadow-2xl
        "
      >
        {/* ==================
            Close
        ================== */}

        <button
          type="button"
          onClick={onClose}
          disabled={analyzing}
          className="
            absolute
            right-5
            top-4
            text-2xl
            text-white/60
            hover:text-white
            disabled:opacity-30
          "
        >
          ×
        </button>

        {/* ==================
            Header
        ================== */}

        <div
          className="
            text-xs
            uppercase
            tracking-[0.35em]
            text-emerald-400
          "
        >
          Chemical Analysis System
        </div>

        <h2
          className="
            mt-2
            text-3xl
            font-bold
          "
        >
          INHIBITOR FORMULATION
        </h2>

        <p
          className="
            mt-2
            text-white/60
          "
        >
          เลือกสารทดลอง 2 ชนิด
          เพื่อสร้างสูตรที่สามารถ
          ยับยั้ง Cell ผิดปกติ
        </p>

        {/* ==================
            Target
        ================== */}

        <div
          className="
            mt-6
            rounded-xl
            border
            border-red-400/20
            bg-red-950/20
            p-4
          "
        >
          <div
            className="
              text-xs
              uppercase
              tracking-widest
              text-red-300
            "
          >
            Target
          </div>

          <div
            className="
              mt-1
              font-mono
              text-lg
            "
          >
            ABNORMAL CELL — SAMPLE 03
          </div>
        </div>

        {/* ==================
            Chemicals
        ================== */}

        <div
          className="
            mt-8
            grid
            grid-cols-3
            gap-4
            md:grid-cols-6
          "
        >
          {CHEMICALS.map(
            (chemical) => {
              const selected =
                selectedChemicals.includes(
                  chemical.id,
                );

              return (
                <button
                  key={chemical.id}
                  type="button"
                  disabled={analyzing}
                  onClick={() => {
                    toggleChemical(
                      chemical.id,
                    );
                  }}
                  className={`
                    rounded-xl
                    border
                    p-4
                    transition
                    ${
                      selected
                        ? "border-emerald-300 bg-emerald-400/20"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  `}
                >
                  {/* ขวดสาร */}

                  <div
                    className="
                      mx-auto
                      flex
                      h-24
                      w-14
                      items-center
                      justify-center
                      rounded-b-2xl
                      rounded-t-lg
                      border-2
                      border-white/30
                      bg-emerald-400/10
                    "
                  >
                    <span
                      className="
                        text-2xl
                        font-bold
                        text-emerald-300
                      "
                    >
                      {chemical.symbol}
                    </span>
                  </div>

                  <div
                    className="
                      mt-3
                      text-sm
                      font-semibold
                    "
                  >
                    {chemical.name}
                  </div>
                </button>
              );
            },
          )}
        </div>

        {/* ==================
            Selected Formula
        ================== */}

        <div
          className="
            mt-7
            flex
            items-center
            justify-center
            gap-3
            font-mono
            text-xl
          "
        >
          <span
            className="
              rounded-lg
              bg-white/5
              px-5
              py-3
            "
          >
            {
              selectedChemicals[0] ??
              "?"
            }
          </span>

          <span>
            +
          </span>

          <span
            className="
              rounded-lg
              bg-white/5
              px-5
              py-3
            "
          >
            {
              selectedChemicals[1] ??
              "?"
            }
          </span>
        </div>

        {/* ==================
            Message
        ================== */}

        <div
          className="
            mt-5
            min-h-6
            text-center
            text-sm
            text-emerald-300
          "
        >
          {message}
        </div>

        {/* ==================
            Test
        ================== */}

        <button
          type="button"
          disabled={analyzing}
          onClick={
            handleTestCombination
          }
          className="
            mt-4
            w-full
            rounded-xl
            bg-emerald-400
            px-6
            py-4
            font-bold
            text-slate-950
            transition
            hover:bg-emerald-300
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {analyzing
            ? "ANALYZING..."
            : "TEST COMBINATION"}
        </button>
      </div>
    </div>
  );
}