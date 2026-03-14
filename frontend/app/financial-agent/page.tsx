"use client";

import { SunlifePrompt, useSunlifePrompt } from "./SunlifePrompt";

export default function FinancialAgentPage() {
  const {
    isOpen,
    isLoading,
    analysisResult,
    sourceUrl,
    openSunlife,
    closeSunlife,
    startAnalysis,
  } = useSunlifePrompt();

  const handleStartAnalysis = async (question: string) => {
    console.log("Starting financial analysis for:", question);

    startAnalysis(async () => {
      const response = await fetch("http://localhost:8000/agents/financial/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data; // returns { recommendation, source, ... }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#4A3520] p-4 text-white">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#D4B896] blur-3xl rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#B8975A] blur-3xl rounded-full" />
      </div>

      <div
        className="relative z-10 mb-8 p-10 text-center"
        style={{
          backgroundColor: "#D4B896",
          border: "4px solid #6B4E2A",
          boxShadow: "8px 8px 0 #2A1D0F",
          borderRadius: "8px"
        }}
      >
        <div className="mb-4 flex justify-center">
          <img src="/sunlife-logo.png" alt="Sun Life" className="w-16 h-auto" />
        </div>
        <h1 className="mb-6 font-['Press_Start_2P'] text-2xl text-[#4A3520]">FINANCIAL BOOTH</h1>
        <p className="mb-8 font-['Press_Start_2P'] text-[10px] leading-relaxed text-[#5A3D1A]">
          Simulate a real-time consultation <br /> regarding your insurance coverage.
        </p>

        <button
          onClick={openSunlife}
          className="px-8 py-4 font-['Press_Start_2P'] text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            backgroundColor: "#EBD9BE",
            border: "4px solid #6B4E2A",
            color: "#4A3520",
            boxShadow: "4px 4px 0 #2A1D0F"
          }}
        >
          START DEBATE
        </button>
      </div>

      <SunlifePrompt
        isOpen={isOpen}
        onClose={closeSunlife}
        onAnalyze={handleStartAnalysis}
        analysisResult={analysisResult}
        sourceUrl={sourceUrl}
        isLoading={isLoading}
      />

      <div className="mt-4 font-['Press_Start_2P'] text-[8px] opacity-60">
        LIVE SCRAPE + GEMINI 2.5 FLASH • RPG STYLE
      </div>
    </div>
  );
}
