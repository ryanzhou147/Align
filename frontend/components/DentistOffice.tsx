"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// ── World dimensions ─────────────────────────────────────────────────────────
const WORLD_W = 1572;
const WORLD_H = 998;

const CHAR_W = 42;  // +20% from original 35
const CHAR_H = 78;  // +20% from original 65
const SPEED = 3;

// Spawns at calibrated position (842, 324)
const SPAWN_X = 842 - CHAR_W / 2;
const SPAWN_Y = 324;

const SPRITES: Record<string, string> = {
  front: "/char_front.png",
  back:  "/char_back.png",
  left:  "/char_left.png",
  right: "/char_right.png",
};

// Agent zones — kept but never rendered
const AGENT_ZONES = [
  { id: "treatment",  wx: 212,  wy: 135, r: 68 },
  { id: "dental",     wx: 428,  wy: 112, r: 68 },
  { id: "habit",      wx: 398,  wy: 290, r: 68 },
  { id: "financial",  wx: 1205, wy: 700, r: 68 },
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

export default function DentistOffice() {
  const [stage, setStage]                     = useState<Stage>(0);
  const [flash, setFlash]                     = useState(false);
  const [treatmentResult, setTreatmentResult] = useState<string | null>(null);
  const [charPulse, setCharPulse]             = useState(false);
  // "idle" | "fadein" | "zooming"
  const [zoomPhase, setZoomPhase]   = useState<"idle"|"fadein"|"zooming">("idle");
  const [zoomOpacity, setZoomOpacity] = useState(0);
  const [zoomScale,   setZoomScale]   = useState(3.7);

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
    if (movementUnlocked.current && arrowKeys.includes(e.key)) return;
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
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);

    const loop = () => {
      const keys = keysRef.current;
      let dx = 0, dy = 0;
      if (keys.has("ArrowLeft"))  dx -= SPEED;
      if (keys.has("ArrowRight")) dx += SPEED;
      if (keys.has("ArrowUp"))    dy -= SPEED;
      if (keys.has("ArrowDown"))  dy += SPEED;

      if (dx !== 0 || dy !== 0) {
        if (Math.abs(dx) >= Math.abs(dy)) setDir(dx > 0 ? "right" : "left");
        else                               setDir(dy > 0 ? "front" : "back");

        const nx = Math.max(0, Math.min(WORLD_W - CHAR_W, posRef.current.x + dx));
        const ny = Math.max(0, Math.min(WORLD_H - CHAR_H, posRef.current.y + dy));
        posRef.current = { x: nx, y: ny };
        setPos({ x: nx, y: ny });

        // Proximity detection (unused visually)
        const cx = nx + CHAR_W / 2, cy = ny + CHAR_H / 2;
        for (const az of AGENT_ZONES) Math.hypot(cx - az.wx, cy - az.wy) < az.r;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [stage]);

  // ── Upload handler ───────────────────────────────────────────────────────
  const handleImageUpload = useCallback(async (_file: File) => {
    setFlash(true);

    // Call treatment agent (fire-and-forget alongside the flash)
    fetch("http://localhost:8000/agents/treatment-predictive")
      .then((r) => r.json())
      .then((d) => setTreatmentResult(JSON.stringify(d, null, 2)))
      .catch(() => setTreatmentResult("Analysis complete."));

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

  return (
    <div className="w-screen h-screen overflow-hidden bg-black select-none relative">
      <style>{`
        @keyframes charPulse {
          0%   { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
          40%  { transform: scale(1.5); filter: drop-shadow(0 0 18px rgba(255,255,180,0.9)) drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
          100% { transform: scale(1);   filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55)); }
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
            transformOrigin: "55.8% 19.3%",
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

      {/* Character — stages 6-9 only */}
      {showChar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={SPRITES[dir]}
          alt="Player"
          draggable={false}
          style={{
            position: "absolute",
            left: `${(pos.x / WORLD_W) * 100}%`,
            top:  `${(pos.y / WORLD_H) * 100}%`,
            width:  `${(CHAR_W / WORLD_W) * 100}%`,
            height: "auto",
            imageRendering: "auto",
            zIndex: 10,
            animation: charPulse ? "charPulse 1s ease-out forwards" : undefined,
            filter: charPulse ? undefined : "drop-shadow(0 3px 5px rgba(0,0,0,0.55))",
          }}
        />
      )}

      {/* Treatment results overlay — stage 5 */}
      {stage === 5 && treatmentResult && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              background: "rgba(10,10,20,0.95)", border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "32px 40px", maxWidth: 560,
              color: "#fff", backdropFilter: "blur(12px)",
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Treatment Analysis</h2>
            <pre style={{ fontSize: 13, opacity: 0.85, whiteSpace: "pre-wrap" }}>{treatmentResult}</pre>
            <p style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>Press any key to continue</p>
          </div>
        </div>
      )}

      {/* Hint */}
      {stage >= 4 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 text-white/50 text-xs animate-pulse pointer-events-none">
          {movementUnlocked.current && !charPulse ? "Arrow keys to move" : "Press any key to continue"}
        </div>
      )}
    </div>
  );
}
