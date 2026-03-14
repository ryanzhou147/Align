"use client";

import ChatPage from "@/components/ChatPage";
import { SessionProvider } from "@/components/SessionProvider";

export default function ClinicLocatorPage() {
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A2B5A] p-4 text-white">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-[#8DA5D1] blur-3xl rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-[#4A69B1] blur-3xl rounded-full" />
        </div>

        <div
          className="relative z-10 w-full max-w-2xl"
          style={{
            backgroundColor: "#B8C6E6",
            border: "4px solid #2D3E75",
            boxShadow: "8px 8px 0 #0D1B3D",
            borderRadius: "8px",
            overflow: "hidden"
          }}
        >
          {/* Header / Banner */}
          <div
            className="p-6 text-center border-b-4 border-[#2D3E75]"
            style={{ backgroundColor: "#8DA5D1" }}
          >
            <div className="mb-2 flex justify-center text-3xl">
              📍
            </div>
            <h1 className="mb-2 font-['Press_Start_2P'] text-xl text-[#1A2B5A]">CLINIC BOOTH</h1>
            <p className="font-['Press_Start_2P'] text-[8px] leading-relaxed text-[#1A2B5A] opacity-70">
              Find the perfect dental clinic <br /> for your treatment.
            </p>
          </div>

          {/* Content Area */}
          <div
            className="p-2 max-h-[70vh] overflow-y-auto pixel-scrollbar"
            style={{ backgroundColor: "#E1E8F5" }}
          >
            <ChatPage />
          </div>
        </div>

        <div className="mt-6 font-['Press_Start_2P'] text-[8px] opacity-60">
          LIVE GOOGLE MAPS + CALENDAR • RPG STYLE
        </div>

        <style jsx global>{`
        .pixel-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .pixel-scrollbar::-webkit-scrollbar-track {
          background: #B8C6E6;
        }
        .pixel-scrollbar::-webkit-scrollbar-thumb {
          background: #4A69B1;
          border: 2px solid #2D3E75;
        }
      `}</style>
      </div>
    </SessionProvider>
  );
}
