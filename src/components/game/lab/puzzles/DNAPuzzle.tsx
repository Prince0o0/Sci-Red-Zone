"use client";

import React, { useState } from "react";

type DNAPuzzleProps = {
  onClose: () => void;
  onComplete: () => void;
};

// ==========================================
// 1. SVG Component สำหรับวาดเกลียว DNA
// ==========================================
const DNALoop = ({
  topStrand,
  botStrand,
  topRung,
  botRung,
}: {
  topStrand: string;
  botStrand: string;
  topRung: string;
  botRung: string;
}) => {
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    red: "#ef4444",
  };

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <line x1="25" y1="35" x2="25" y2="50" stroke={colorMap[topRung]} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="25" x2="50" y2="50" stroke={colorMap[topRung]} strokeWidth="4" strokeLinecap="round" />
      <line x1="75" y1="35" x2="75" y2="50" stroke={colorMap[topRung]} strokeWidth="4" strokeLinecap="round" />

      <line x1="25" y1="50" x2="25" y2="65" stroke={colorMap[botRung]} strokeWidth="4" strokeLinecap="round" />
      <line x1="50" y1="50" x2="50" y2="75" stroke={colorMap[botRung]} strokeWidth="4" strokeLinecap="round" />
      <line x1="75" y1="50" x2="75" y2="65" stroke={colorMap[botRung]} strokeWidth="4" strokeLinecap="round" />

      <path d="M 0 50 Q 50 0 100 50" stroke={colorMap[topStrand]} fill="transparent" strokeWidth="4" strokeLinecap="round" />
      <path d="M 0 50 Q 50 100 100 50" stroke={colorMap[botStrand]} fill="transparent" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
};

// ==========================================
// 2. Main Game Component (Randomized Choices)
// ==========================================
export default function DNAPuzzle({ onClose, onComplete }: DNAPuzzleProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<"playing" | "success" | "error">("playing");
  const [isClosing, setIsClosing] = useState(false);

  // 1. ใช้ Lazy Initialization ใน useState เพื่อ "สุ่มช้อยส์" ตั้งแต่เฟรมแรกที่เปิดเกม
  const [options] = useState(() => {
    // กำหนดรูปแบบเบสต่างๆ พร้อมระบุว่าอันไหนคือตัวที่ถูก (isCorrect: true)
    const baseChoices = [
      { topS: "blue", botS: "red", topR: "blue", botR: "red", isCorrect: true }, // คำตอบที่ถูกต้อง
      { topS: "blue", botS: "red", topR: "red", botR: "blue", isCorrect: false }, // สลับสีเบส
      { topS: "red", botS: "red", topR: "red", botR: "red", isCorrect: false },   // แดงหมด
    ];

    // สุ่มสลับตำแหน่งใน Array ด้วย Math.random()
    const shuffled = [...baseChoices].sort(() => Math.random() - 0.5);

    // กำหนดชื่อ A, B, C ให้ช้อยส์หลังจากสุ่มเสร็จแล้ว
    return shuffled.map((choice, index) => ({
      ...choice,
      id: ["A", "B", "C"][index]
    }));
  });

  const handleSelect = (id: string) => {
    if (gameStatus === "success" || isClosing) return;
    setSelectedOption(id);
    setGameStatus("playing");
  };

  const handleVerify = () => {
    if (!selectedOption) return;
    
    // 2. เปลี่ยนจากการเช็คว่าเลือก "A" ไหม ไปเช็คตัวที่มี isCorrect: true แทน
    const chosenOption = options.find(o => o.id === selectedOption);
    
    if (chosenOption?.isCorrect) {
      setGameStatus("success");
      
      setTimeout(() => {
        setIsClosing(true);
        
        setTimeout(() => {
          onComplete(); 
          onClose();    
        }, 500); 
      }, 1500);
      
    } else {
      setGameStatus("error");
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 
        ${isClosing ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div 
        className={`relative flex flex-col items-center justify-center w-full max-w-2xl p-6 bg-slate-950 border border-slate-700/50 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] font-sans transform transition-transform duration-500 
          ${isClosing ? "translate-y-[100vh]" : "translate-y-0"}`}
      >
        
        <button
          type="button"
          onClick={onClose}
          disabled={gameStatus === "success"}
          className="absolute right-5 top-4 text-2xl text-white/60 hover:text-white disabled:opacity-0 transition-opacity"
        >
          ×
        </button>

        <div className="mb-4 text-center mt-2">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-400/70 mb-1">
            System Override
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            DNA ANALYSIS
          </h1>
          <p className="mt-1 text-sm text-slate-400">เลือกชุดคู่เบสที่หายไปเพื่อซ่อมแซมสาย DNA ให้สมบูรณ์</p>
        </div>

        <div className="flex items-center justify-center w-full p-4 mb-6 border border-slate-800 rounded-xl bg-slate-900/50 shadow-inner">
          <div className="flex w-full h-20">
            <div className="flex-1"><DNALoop topStrand="blue" botStrand="red" topRung="blue" botRung="red" /></div>
            <div className="flex-1 -ml-1"><DNALoop topStrand="red" botStrand="blue" topRung="red" botRung="blue" /></div>
            
            <div className="flex-1 mx-2">
              <div className={`w-full h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-colors duration-300
                ${gameStatus === "success" ? "border-green-400 bg-green-400/10 shadow-[0_0_15px_rgba(74,222,128,0.3)]" : 
                  gameStatus === "error" ? "border-red-400 bg-red-400/10" : 
                  selectedOption ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600 bg-slate-900/50"}`}
              >
                {selectedOption ? (
                  <div className="w-full h-full scale-90">
                    <DNALoop 
                      {...options.find(o => o.id === selectedOption)!} 
                      topStrand={options.find(o => o.id === selectedOption)!.topS}
                      botStrand={options.find(o => o.id === selectedOption)!.botS}
                      topRung={options.find(o => o.id === selectedOption)!.topR}
                      botRung={options.find(o => o.id === selectedOption)!.botR}
                    />
                  </div>
                ) : (
                  <span className="text-lg font-bold text-slate-500">?</span>
                )}
              </div>
            </div>

            <div className="flex-1 -ml-1"><DNALoop topStrand="red" botStrand="blue" topRung="red" botRung="blue" /></div>
          </div>
        </div>

        <div className="flex gap-6 mb-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={gameStatus === "success"}
              className={`flex flex-col items-center p-2 border rounded-xl w-28 h-24 transition-all duration-200
                ${selectedOption === option.id 
                  ? "border-cyan-400 bg-slate-800 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.4)]" 
                  : "border-slate-700/50 bg-slate-900 hover:border-slate-500 hover:bg-slate-800"}
                ${gameStatus === "success" ? "cursor-default" : "cursor-pointer"}
              `}
            >
              <div className="w-full h-12 mb-1">
                <DNALoop topStrand={option.topS} botStrand={option.botS} topRung={option.topR} botRung={option.botR} />
              </div>
              <span className={`text-sm font-bold ${selectedOption === option.id ? "text-cyan-400" : "text-slate-500"}`}>
                {option.id}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center h-16 w-full px-8">
          {gameStatus === "playing" && (
            <button
              onClick={handleVerify}
              disabled={!selectedOption}
              className={`w-full py-3 text-sm font-bold rounded-xl tracking-widest transition-all
                ${selectedOption 
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer" 
                  : "bg-slate-800 text-slate-500 cursor-not-allowed"}
              `}
            >
              VERIFY SEQUENCE
            </button>
          )}

          {gameStatus === "success" && (
            <div className="w-full flex items-center justify-center py-3 text-sm font-bold text-green-400 bg-green-900/30 border border-green-400/50 rounded-xl shadow-[0_0_15px_rgba(74,222,128,0.3)]">
              MATCH CONFIRMED: ภารกิจสำเร็จ!
            </div>
          )}

          {gameStatus === "error" && (
            <div className="w-full flex flex-col items-center py-2 text-sm font-bold text-red-400 bg-red-900/30 border border-red-400/50 rounded-xl shadow-[0_0_15px_rgba(248,113,113,0.3)]">
              <span>SEQUENCE ERROR: ลำดับพันธุกรรมไม่เข้ากัน</span>
              <button onClick={() => {setGameStatus("playing"); setSelectedOption(null);}} className="mt-1 text-xs text-red-300 underline hover:text-red-200">
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}