"use client";

import ChatPage from "@/components/ChatPage";
import { SessionProvider } from "@/components/SessionProvider";

const FONT = "'Press Start 2P', monospace";

const C = {
  bg: "#F3E5F5",
  bgDark: "#E1BEE7",
  border: "#4A148C",
  text: "#210035",
  muted: "#7B1FA2",
  gold: "#9C27B0",
  page: "#1A0033",
};

export default function ClinicLocatorPage() {
  return (
    <SessionProvider>
      <div
        className="flex min-h-screen flex-col items-center justify-center p-4"
        style={{ backgroundColor: C.page, backgroundImage: "url('/Zoom_out_1.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          .blink { animation: blink 1s step-end infinite; }
        `}</style>

        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-black/60 pointer-events-none" />

        {/* RPG Booth Container */}
        <div
          className="relative z-10 w-full max-w-[600px]"
          style={{
            background: C.bg,
            border: `6px solid ${C.border}`,
            boxShadow: `12px 12px 0 ${C.border}`,
          }}
        >
          {/* Booth Header */}
          <div style={{
            background: C.bgDark,
            borderBottom: `6px solid ${C.border}`,
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}>
            <span style={{ fontSize: "32px" }}>🏠</span>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontFamily: FONT, fontSize: "16px", color: C.text, margin: 0, letterSpacing: "2px" }}>
                [ CLINIC BOOTH ]
              </h1>
              <p style={{ fontFamily: FONT, fontSize: "8px", color: C.muted, marginTop: "8px", letterSpacing: "1px" }}>
                GDS-1024 LOCATOR SYSTEM
              </p>
            </div>
            <span style={{ fontSize: "32px" }}>📍</span>
          </div>

          {/* Main Content Area */}
          <div style={{
            padding: "8px",
            background: C.bgDark,
          }}>
            <div style={{
              background: C.bg,
              border: `4px solid ${C.border}`,
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}>
              <ChatPage />
            </div>
          </div>

          {/* Booth Footer */}
          <div style={{
            background: C.bgDark,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "12px", height: "12px", background: C.gold, border: `2px solid ${C.border}` }} />
              <div style={{ width: "12px", height: "12px", background: C.muted, border: `2px solid ${C.border}` }} />
            </div>
            <span className="blink" style={{ fontFamily: FONT, fontSize: "8px", color: C.gold }}>
              CONNECTION SECURE
            </span>
          </div>
        </div>

        {/* Navigation hint */}
        <p className="mt-8 relative z-10" style={{ fontFamily: FONT, fontSize: "8px", color: "white", opacity: 0.6 }}>
          PRESS ESC TO RETURN TO GAME WORLD
        </p>
      </div>
    </SessionProvider>
  );
}
