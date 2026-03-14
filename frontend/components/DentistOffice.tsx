"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import ChatPage from "./ChatPage";
import { HabitCoachPrompt, useHabitCoachPrompt } from "./HabitCoachPrompt";
import { SunlifePrompt, useSunlifePrompt } from "./SunlifePrompt";
import TreatmentPage from "../app/treatment/page";

// ── World dimensions ─────────────────────────────────────────────────────────
const WORLD_W = 1572;
const WORLD_H = 998;

const CHAR_W = 50;  // +40% from original 35 (two rounds of +20%)
const CHAR_H = 94;  // +40% from original 65
const SPEED = 3;

// Spawns at calibrated position (840, 316)
const SPAWN_X = 840 - CHAR_W / 2;
const SPAWN_Y = 276;

const SPRITES: Record<string, string> = {
  front: "/char_front.png",
  back:  "/char_back.png",
  left:  "/char_left.png",
  right: "/char_right.png",
};

// Agent zones — calibrated world positions with activation radius
const AGENT_ZONES = [
  { id: "habit",     label: "Habit Coach",       emoji: "🪥", wx: 493, wy: 259, r: 80 },
  { id: "clinic",    label: "Clinic Locator",    emoji: "📍", wx: 737, wy: 416, r: 80 },
  { id: "financial", label: "Financial Planner", emoji: "💰", wx: 576, wy: 634, r: 80 },
];

// ── Flow stages ──────────────────────────────────────────────────────────────
// 0  Starting_page.png
// 1  Starting_page2.png
// 2  Starting_page3.png + upload box
// 3  Flash / transition (auto → 4)
// 4  Analyze_teeth.png            (character visible, char_back, frozen)
// 5  Treatment results overlay    (character visible, frozen)
// 6  Zoom_out_1.png               (character visible, frozen)
// 7  Zoom_out_sarah.png           (character visible, frozen)
// 8  Zoom_out_max.png             (character visible, frozen)
// 9  Zoom_out_anna.png            (character pulses → movement unlocked)

type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const STAGE_IMAGES: Partial<Record<Stage, string>> = {
  0: "/Starting_page.png",
  1: "/Starting_page2.png",
  2: "/Starting_page3.png",
  4: "/Analyze_teeth.png",
  6: "/Zoom_out_1.png",
  7: "/Zoom_out_sarah.png",
  8: "/Zoom_out_max.png",
  9: "/Zoom_out_anna.png",
};

const FLASH_DURATION = 2000; // ms — camera flash + fade

// ── Agent Modal ───────────────────────────────────────────────────────────────

function AgentModal({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const zone = AGENT_ZONES.find((z) => z.id === agentId)!;

  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClinic, setShowClinic] = useState(false);

  useEffect(() => {
    const endpointMap: Record<string, string> = {
      clinic:    "http://localhost:8000/agents/clinic-locator",
      financial: "http://localhost:8000/agents/financial/analyze",
    };
    const endpoint = endpointMap[agentId];
    if (!endpoint) { setLoading(false); return; }

    const isPost = agentId === "financial";
    fetch(endpoint, isPost ? {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What Sun Life dental plan best covers my treatment?" }),
    } : undefined)
      .then((r) => r.json())
      .then((data) => setResult(data.recommendation ?? JSON.stringify(data, null, 2)))
      .catch(() => setResult("Agent ready."))
      .finally(() => setLoading(false));
  }, [agentId]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "rgba(8,10,20,0.97)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          width: showClinic ? "min(90vw, 780px)" : "min(90vw, 560px)",
          maxHeight: showClinic ? "85vh" : undefined,
          overflow: showClinic ? "hidden" : undefined,
          boxShadow: "0 0 60px rgba(96,165,250,0.15), 0 8px 40px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{zone.emoji}</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{zone.label}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1 }}>
                AI Agent · {agentId === "clinic" ? "Active" : agentId === "habit" ? "Implemented" : "Scaffolded"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8,
              color: "rgba(255,255,255,0.6)", cursor: "pointer",
              width: 32, height: 32, fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        </div>

        {/* Clinic full UI */}
        {showClinic ? (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <ChatPage />
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "2px solid rgba(96,165,250,0.3)",
                  borderTopColor: "rgba(96,165,250,0.9)",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }} />
                Contacting agent…
              </div>
            )}

            {!loading && result && (
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "16px",
                animation: "fadeInUp 0.4s ease forwards",
              }}>
                {agentId === "clinic" ? (
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7 }}>
                    <div style={{ color: "rgba(74,222,128,0.9)", fontWeight: 700, marginBottom: 10, fontSize: 14 }}>
                      Agent Ready
                    </div>
                    <p style={{ marginBottom: 14 }}>
                      The Clinic Locator will find dental clinics near you and help schedule an appointment on your Google Calendar.
                    </p>
                    <button
                      onClick={() => setShowClinic(true)}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1.5px solid rgba(96,165,250,0.5)",
                        borderRadius: 10, padding: "10px 20px",
                        color: "rgba(147,197,253,1)", cursor: "pointer",
                        fontSize: 13, fontWeight: 600,
                      }}
                    >
                      Open Clinic Finder →
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                    {result}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DentistOffice() {
  const [stage, setStage]                     = useState<Stage>(0);
  const [flash, setFlash]         = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [charPulse, setCharPulse]             = useState(false);
  // "idle" | "fadein" | "zooming"
  const [zoomPhase, setZoomPhase]   = useState<"idle"|"fadein"|"zooming">("idle");
  const [zoomOpacity, setZoomOpacity] = useState(0);
  const [zoomScale,   setZoomScale]   = useState(3.7);

  // Agent interaction
  const [nearbyZone, setNearbyZone]   = useState<string | null>(null);
  const nearbyZoneRef                 = useRef<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  // Habit coach prompt
  const {
    isLoading:      habitLoading,
    analysisResult: habitResult,
    startAnalysis:  startHabitAnalysis,
    setAnalysisResult: setHabitResult,
  } = useHabitCoachPrompt();

  // Sun Life prompt
  const { isOpen: sunlifeOpen, openSunlifePrompt, closeSunlifePrompt } = useSunlifePrompt();

  // Viewport size — needed to account for objectFit:contain letterboxing
  const [vp, setVp] = useState({ w: 1920, h: 1080 });
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Character state
  const keysRef = useRef<Set<string>>(new Set());
  const posRef  = useRef({ x: SPAWN_X, y: SPAWN_Y });
  const rafRef  = useRef<number>(0);
  const [pos, setPos] = useState({ x: SPAWN_X, y: SPAWN_Y });
  const [dir, setDir] = useState<"front" | "back" | "left" | "right">("back");

  const stageRef          = useRef<Stage>(0);
  stageRef.current        = stage;
  const advancingRef      = useRef(false);
  const movementUnlocked  = useRef(false);

  // Pulse is triggered explicitly in handleAnyKey when looping back from stage 9

  // ── Any-key handler ──────────────────────────────────────────────────────
  const handleAnyKey = useCallback((e: KeyboardEvent) => {
    const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const s = stageRef.current;

    // Arrow keys only work after movement is unlocked
    if (movementUnlocked.current) return;
    // Space near an agent → open modal, don't advance stage
    if ((e.key === " " || e.code === "Space") && movementUnlocked.current && nearbyZoneRef.current) return;
    if (s === 2 || s === 3) return; // upload stage
    if (advancingRef.current) return;

    const advance = (next: Stage) => {
      advancingRef.current = true;
      setStage(next);
      setTimeout(() => { advancingRef.current = false; }, 300);
    };

    if (s === 0) return advance(1);
    if (s === 1) return advance(2);
    if (s === 4) return advance(5);
    if (s === 5) {
      advancingRef.current = true;
      setStage(6);
      // Phase 1: prerender Zoom_out_1 at scale(3.7) opacity 0 — no flash
      setZoomPhase("fadein");
      setZoomOpacity(0);
      setZoomScale(3.7);
      // Phase 2: after one paint, fade it in over Analyze_teeth
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setZoomOpacity(1);
      }));
      // Phase 3: once faded in, transition scale to 1
      setTimeout(() => {
        setZoomPhase("zooming");
        setZoomScale(1);
      }, 600);
      // Phase 4: done
      setTimeout(() => setZoomPhase("idle"), 3800);
      setTimeout(() => { advancingRef.current = false; }, 300);
      return;
    }
    if (s === 6) return advance(7);
    if (s === 7) return advance(8);
    if (s === 8) return advance(9);
    if (s === 9) {
      // Loop back to Zoom_out_1, unlock movement, pulse to signal it
      advancingRef.current = true;
      movementUnlocked.current = true;
      setStage(6);
      setCharPulse(true);
      setTimeout(() => setCharPulse(false), 1000);
      setTimeout(() => { advancingRef.current = false; }, 300);
      return;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleAnyKey);
    return () => window.removeEventListener("keydown", handleAnyKey);
  }, [handleAnyKey]);

  // ── Character game loop — active only after movement is unlocked ─────────
  useEffect(() => {
    if (!movementUnlocked.current) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const onDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    // Space to interact with nearby agent
    const onSpace = (e: KeyboardEvent) => {
      if ((e.key === " " || e.code === "Space") && nearbyZoneRef.current) {
        e.preventDefault();
        const zone = nearbyZoneRef.current;
        if (zone === "habit") {
          setHabitResult(null);
          setActiveAgent("habit");
        } else if (zone === "financial") {
          openSunlifePrompt();
        } else {
          setActiveAgent(zone);
        }
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    window.addEventListener("keydown", onSpace);

    const loop = () => {
      const keys = keysRef.current;
      let dx = 0, dy = 0;
      if (keys.has("ArrowLeft"))  dx -= SPEED;
      if (keys.has("ArrowRight")) dx += SPEED;
      if (keys.has("ArrowUp"))    dy -= SPEED;
      if (keys.has("ArrowDown"))  dy += SPEED;

      let nx = posRef.current.x;
      let ny = posRef.current.y;

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
        else                               setDir(dy > 0 ? "front" : "back");

        nx = Math.max(0, Math.min(WORLD_W - CHAR_W, posRef.current.x + dx));
        ny = Math.max(0, Math.min(WORLD_H - CHAR_H, posRef.current.y + dy));
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });
      }

      // Proximity detection — always check every frame
      const cx = nx + CHAR_W / 2, cy = ny + CHAR_H / 2;
      let nearest: string | null = null;
      for (const az of AGENT_ZONES) {
        if (Math.hypot(cx - az.wx, cy - az.wy) < az.r) {
          nearest = az.id;
          break;
        }
      }
      if (nearest !== nearbyZoneRef.current) {
        nearbyZoneRef.current = nearest;
        setNearbyZone(nearest);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      window.removeEventListener("keydown", onSpace);
      cancelAnimationFrame(rafRef.current);
    };
  }, [stage]);

  // ── Upload handler ───────────────────────────────────────────────────────
  const handleImageUpload = useCallback((file: File) => {
    setFlash(true);
    setUploadedFile(file);

    // Let flash animation play for FLASH_DURATION then reveal Analyze_teeth
    setTimeout(() => {
      setFlash(false);
      setStage(4);
    }, FLASH_DURATION);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  // ── Stages 0 & 1 — full-screen image ────────────────────────────────────
  if (stage === 0 || stage === 1) {
    const next: Stage = stage === 0 ? 1 : 2;
    return (
      <div
        className="w-screen h-screen overflow-hidden bg-black select-none relative cursor-pointer"
        onClick={() => {
          if (!advancingRef.current) {
            advancingRef.current = true;
            setStage(next);
            setTimeout(() => { advancingRef.current = false; }, 300);
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={STAGE_IMAGES[stage]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-sm animate-pulse">
          Press any key or click to continue
        </div>
      </div>
    );
  }

  // ── Stage 2 / 3 — upload + flash ────────────────────────────────────────
  if (stage === 2 || stage === 3) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-black select-none relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Starting_page3.png"
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />

        {/* Upload box */}
        {!flash && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10 }}>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: 340, height: 240,
                border: "2px dashed rgba(255,255,255,0.7)", borderRadius: 20,
                background: "rgba(0,0,0,0.55)", cursor: "pointer", color: "#fff", gap: 12,
                backdropFilter: "blur(6px)",
              }}
            >
              <span style={{ fontSize: 48 }}>📷</span>
              <span style={{ fontWeight: 700, fontSize: 18 }}>Upload your smile photo</span>
              <span style={{ fontSize: 13, opacity: 0.7 }}>Click or drag &amp; drop an image</span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileInput} />
            </label>
          </div>
        )}

        {/* Analyze_teeth revealed underneath flash */}
        {flash && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/Analyze_teeth.png"
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 40 }}
            draggable={false}
          />
        )}

        {/* Camera flash — bright spike then slow fade, revealing Analyze_teeth beneath */}
        {flash && (
          <div
            style={{
              position: "absolute", inset: 0, zIndex: 50,
              background: "white",
              animation: `cameraFlash ${FLASH_DURATION}ms ease-out forwards`,
            }}
          />
        )}

        <style>{`
          @keyframes cameraFlash {
            0%   { opacity: 1; }
            10%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes charPulse {
            0%   { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
            40%  { transform: scale(1.5); filter: drop-shadow(0 0 18px rgba(255,255,180,0.9)) drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
            100% { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
          }
        `}</style>
      </div>
    );
  }

  // ── Stages 4-9 — game world ──────────────────────────────────────────────
  const bgImage     = STAGE_IMAGES[stage] ?? "/Analyze_teeth.png";
  const showChar    = movementUnlocked.current;
  const isZoomedOut = stage >= 6;

  // Compute actual image rect accounting for objectFit:contain letterboxing
  const imgScale  = Math.min(vp.w / WORLD_W, vp.h / WORLD_H);
  const imgW      = WORLD_W * imgScale;
  const imgH      = WORLD_H * imgScale;
  const imgLeft   = (vp.w - imgW) / 2;
  const imgTop    = (vp.h - imgH) / 2;
  // Character position in absolute screen pixels
  const charPx    = imgLeft + pos.x * imgScale;
  const charPy    = imgTop  + pos.y * imgScale;
  const charPw    = CHAR_W  * imgScale;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black select-none relative">
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes charPulse {
          0%   { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
          40%  { transform: scale(1.5); filter: drop-shadow(0 0 18px rgba(255,255,180,0.9)) drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
          100% { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
        }
        @keyframes circleIdle {
          0%, 100% { opacity: 0.45; box-shadow: 0 0 10px 2px rgba(96,165,250,0.3); }
          50%       { opacity: 0.6;  box-shadow: 0 0 14px 4px rgba(96,165,250,0.4); }
        }
        @keyframes circleActive {
          0%, 100% { opacity: 0.9; box-shadow: 0 0 18px 6px rgba(74,222,128,0.5), 0 0 40px 10px rgba(74,222,128,0.2); }
          50%       { opacity: 1;   box-shadow: 0 0 28px 10px rgba(74,222,128,0.7), 0 0 60px 16px rgba(74,222,128,0.3); }
        }
      `}</style>

      {/* ── Background layer ──────────────────────────────────────────────── */}

      {/* Zoom_out_1 — prerendered at scale(3.7), fades in then transitions to scale(1).
          Rendered beneath everything during fadein/zooming phases. */}
      {zoomPhase !== "idle" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/Zoom_out_1.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            transformOrigin: "55.7% 19.3%",
            transform: `scale(${zoomScale})`,
            opacity: zoomOpacity,
            transition: zoomPhase === "fadein"
              ? "opacity 0.5s ease"
              : "transform 3.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.5s ease",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Normal background — hidden during zoom transition */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgImage}
        alt="Scene"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: isZoomedOut ? "contain" : "cover",
          opacity: zoomPhase !== "idle" ? 0 : 1,
        }}
        draggable={false}
      />

      {/* Analyze_teeth sits on top during fade-in phase, then disappears */}
      {zoomPhase === "fadein" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/Analyze_teeth.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: 1 - zoomOpacity,
            transition: "opacity 0.5s ease",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── Agent activation circles ─────────────────────────────────────── */}
      {showChar && AGENT_ZONES.map((az) => {
        const cx = imgLeft + az.wx * imgScale;
        const cy = imgTop  + az.wy * imgScale;
        const r  = az.r * imgScale;
        const isNear = nearbyZone === az.id;

        return (
          <div
            key={az.id}
            style={{
              position: "absolute",
              left: cx - r,
              top:  cy - r,
              width:  r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: isNear
                ? "2px solid rgba(74,222,128,0.9)"
                : "2px solid rgba(96,165,250,0.5)",
              background: isNear
                ? "rgba(74,222,128,0.08)"
                : "rgba(96,165,250,0.04)",
              animation: isNear ? "circleActive 1.2s ease-in-out infinite" : "circleIdle 2.5s ease-in-out infinite",
              zIndex: 8,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Emoji label */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              opacity: isNear ? 1 : 0.6,
              transition: "opacity 0.3s ease",
            }}>
              <span style={{ fontSize: r * 0.35, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.8))" }}>
                {az.emoji}
              </span>
              {isNear && (
                <span style={{
                  fontSize: Math.max(9, r * 0.13),
                  color: "rgba(74,222,128,0.95)",
                  fontWeight: 700,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}>
                  {az.label}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Character — stages 6-9 only */}
      {showChar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SPRITES[dir]}
          alt="Player"
          draggable={false}
          style={{
            position: "absolute",
            left: charPx,
            top:  charPy,
            width:  charPw,
            height: CHAR_H * imgScale,
            imageRendering: "auto",
            zIndex: 10,
            animation: charPulse ? "charPulse 1s ease-out forwards" : undefined,
            filter: charPulse ? undefined : "drop-shadow(0 3px 5px rgba(0,0,0,0.55))",
          }}
        />
      )}

      {/* Treatment window — stage 5 */}
      {stage === 5 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.75)",
        }}>
          <div style={{
            width: "min(90vw, 900px)", maxHeight: "90vh",
            overflowY: "auto",
            borderRadius: 20,
            border: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 60px rgba(96,165,250,0.1), 0 8px 40px rgba(0,0,0,0.7)",
          }}>
            <TreatmentPage initialFile={uploadedFile ?? undefined} />
          </div>
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 11, pointerEvents: "none" }}>
            Press any key to continue
          </div>
        </div>
      )}

      {/* Hint */}
      {stage >= 4 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 text-white/50 text-xs animate-pulse pointer-events-none">
          {nearbyZone
            ? "Press SPACE to interact"
            : movementUnlocked.current && !charPulse
              ? "Arrow keys to move"
              : "Press any key to continue"}
        </div>
      )}

      {/* Habit Coach prompt */}
      <HabitCoachPrompt
        isOpen={activeAgent === "habit"}
        onClose={() => {
          setActiveAgent(null);
          if (habitResult) {
            fetch("http://localhost:8000/agents/habit-coaching/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "Your habit coaching session is complete. Time to brush! 🦷" }),
            }).catch(() => {});
          }
        }}
        isLoading={habitLoading}
        analysisResult={habitResult}
        onAnalyze={(medications) =>
          startHabitAnalysis(async () => {
            const res = await fetch("http://localhost:8000/agents/habit-coaching/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ medications, observations: [] }),
            });
            const data = await res.json();
            return data.coaching_plan ?? "Analysis complete.";
          })
        }
      />

      {/* Sun Life prompt */}
      <SunlifePrompt
        isOpen={sunlifeOpen}
        onClose={closeSunlifePrompt}
        onConfirm={() => { closeSunlifePrompt(); setActiveAgent("financial"); }}
      />

      {/* Generic agent modal (clinic + financial details) */}
      {(activeAgent === "clinic" || activeAgent === "financial") && (
        <AgentModal agentId={activeAgent} onClose={() => setActiveAgent(null)} />
      )}
    </div>
  );
}
