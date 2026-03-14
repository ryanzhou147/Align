"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const WORLD_W = 1572;
const WORLD_H = 998;

// ── Zoom preview defaults (edit to match DentistOffice.tsx values) ───────────
const ZOOM_ORIGIN_X = 55.7;  // %
const ZOOM_ORIGIN_Y = 19.3;  // %
const ZOOM_SCALE    = 3.7;
const ZOOM_DURATION = 3;     // seconds

type Pin = { x: number; y: number; label: string; color: string };

const IMAGES = [
  { key: "zoom_out",   label: "Zoom_out_1",     src: "/Zoom_out_1.png" },
  { key: "analyze",    label: "Analyze_teeth",  src: "/Analyze_teeth.png" },
  { key: "zoom_sarah", label: "Zoom_out_sarah", src: "/Zoom_out_sarah.png" },
  { key: "zoom_max",   label: "Zoom_out_max",   src: "/Zoom_out_max.png" },
  { key: "zoom_anna",  label: "Zoom_out_anna",  src: "/Zoom_out_anna.png" },
];

function pctFromClient(clientX: number, clientY: number, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  // Account for objectFit:contain letterboxing
  const imgScale = Math.min(rect.width / WORLD_W, rect.height / WORLD_H);
  const imgW     = WORLD_W * imgScale;
  const imgH     = WORLD_H * imgScale;
  const imgLeft  = (rect.width  - imgW) / 2;
  const imgTop   = (rect.height - imgH) / 2;
  // Coords relative to the actual image content (clamped)
  const rx = Math.max(0, Math.min(1, (clientX - rect.left - imgLeft) / imgW));
  const ry = Math.max(0, Math.min(1, (clientY - rect.top  - imgTop)  / imgH));
  // Also expose container fractions (for transformOrigin use)
  const cx = (clientX - rect.left) / rect.width;
  const cy = (clientY - rect.top)  / rect.height;
  return { rx, ry, cx, cy };
}

function CompareKeyHandler({ onToggle }: { onToggle: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); onToggle(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onToggle]);
  return null;
}

export default function CalibratePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [baseImage,    setBaseImage]    = useState(IMAGES[0]);
  const [overlayImage, setOverlayImage] = useState(IMAGES[1]);
  const [overlayOn,    setOverlayOn]    = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.45);

  // Overlay transform (in % of container)
  const [overlayX,    setOverlayX]    = useState(0);   // % left offset
  const [overlayY,    setOverlayY]    = useState(0);   // % top offset
  const [overlayScale, setOverlayScale] = useState(100); // % of container size

  const [hover, setHover] = useState<{ wx: number; wy: number; px: number; py: number; cpx: number; cpy: number } | null>(null);
  const [pins,  setPins]  = useState<Pin[]>([]);
  const [copied, setCopied]       = useState<string | null>(null);
  const [previewing, setPreviewing]   = useState(false);
  const [previewKey, setPreviewKey]   = useState(0);
  const [comparing, setComparing]     = useState(false);
  const [compareImg, setCompareImg]   = useState<"analyze" | "zoom">("analyze");

  // What's being dragged: "pin-N" | "overlay" | null
  const dragging      = useRef<string | null>(null);
  const dragStart     = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });

  // ── Mouse handlers ───────────────────────────────────────────────────────
  const getCoords = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const { rx, ry, cx, cy } = pctFromClient(clientX, clientY, el);
    return {
      wx:  Math.round(rx * WORLD_W),   // true image world px
      wy:  Math.round(ry * WORLD_H),
      px:  +(rx * 100).toFixed(2),     // % within image (for SPAWN)
      py:  +(ry * 100).toFixed(2),
      cpx: +(cx * 100).toFixed(2),     // % of container (for transformOrigin)
      cpy: +(cy * 100).toFixed(2),
    };
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;

    if (dragging.current === "overlay") {
      const rect = el.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.current.mx) / rect.width)  * 100;
      const dy = ((e.clientY - dragStart.current.my) / rect.height) * 100;
      setOverlayX(dragStart.current.ox + dx);
      setOverlayY(dragStart.current.oy + dy);
      return;
    }

    if (dragging.current?.startsWith("pin-")) {
      const idx = parseInt(dragging.current.split("-")[1]);
      const c = getCoords(e.clientX, e.clientY);
      if (!c) return;
      setPins(prev => prev.map((p, i) => i === idx ? { ...p, x: c.wx, y: c.wy } : p));
      return;
    }

    const c = getCoords(e.clientX, e.clientY);
    setHover(c);
  }, [getCoords]);

  const onMouseUp = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragging.current !== null) return;
    const c = getCoords(e.clientX, e.clientY);
    if (!c) return;
    const label = prompt("Label for this pin?", `Pin ${pins.length + 1}`);
    if (label === null) return;
    const colors = ["#f87171","#34d399","#60a5fa","#fbbf24","#c084fc","#fb923c"];
    setPins(prev => [...prev, { x: c.wx, y: c.wy, label, color: colors[prev.length % colors.length] }]);
  }, [getCoords, pins.length]);

  const startDragPin = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    dragging.current = `pin-${idx}`;
  };

  const startDragOverlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragging.current = "overlay";
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: overlayX, oy: overlayY };
  };

  const copyPin = (p: Pin) => {
    const text = `world:(${p.x},${p.y}) pct:(${((p.x/WORLD_W)*100).toFixed(1)}%,${((p.y/WORLD_H)*100).toFixed(1)}%) SPAWN_X=${p.x}-CHAR_W/2 SPAWN_Y=${p.y} transformOrigin="${((p.x/WORLD_W)*100).toFixed(1)}% ${((p.y/WORLD_H)*100).toFixed(1)}%"`;
    navigator.clipboard.writeText(text);
    setCopied(p.label);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyOverlayValues = () => {
    const text = `overlay offset: left=${overlayX.toFixed(1)}% top=${overlayY.toFixed(1)}% scale=${overlayScale}%`;
    navigator.clipboard.writeText(text);
    setCopied("overlay");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ height: "100vh", background: "#0f0f13", color: "#fff", fontFamily: "monospace", display: "flex", flexDirection: "column" }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "10px 16px", background: "#1a1a24", borderBottom: "1px solid #333", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#a78bfa" }}>🎯 Calibration</span>

        <button
          onClick={() => { setPreviewKey(k => k + 1); setPreviewing(true); }}
          style={{ fontSize: 12, padding: "4px 14px", background: "#7c3aed", border: "1px solid #a78bfa", borderRadius: 6, color: "#fff", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>
          ▶ Preview zoom
        </button>

        <button
          onClick={() => { setCompareImg("analyze"); setComparing(true); }}
          style={{ fontSize: 12, padding: "4px 14px", background: "#0f4c2a", border: "1px solid #34d399", borderRadius: 6, color: "#34d399", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>
          ⇄ Compare views
        </button>

        <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ opacity: 0.6 }}>Base:</span>
          <select value={baseImage.key} onChange={e => setBaseImage(IMAGES.find(i => i.key === e.target.value)!)}
            style={{ background: "#2a2a38", border: "1px solid #444", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 11 }}>
            {IMAGES.map(img => <option key={img.key} value={img.key}>{img.label}</option>)}
          </select>
        </label>

        <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
          <input type="checkbox" checked={overlayOn} onChange={e => setOverlayOn(e.target.checked)} />
          <span style={{ opacity: 0.8 }}>Overlay:</span>
          <select value={overlayImage.key} onChange={e => setOverlayImage(IMAGES.find(i => i.key === e.target.value)!)}
            style={{ background: "#2a2a38", border: "1px solid #444", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 11 }}>
            {IMAGES.map(img => <option key={img.key} value={img.key}>{img.label}</option>)}
          </select>
        </label>

        {overlayOn && <>
          <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ opacity: 0.6 }}>Opacity</span>
            <input type="range" min={0} max={1} step={0.01} value={overlayOpacity}
              onChange={e => setOverlayOpacity(+e.target.value)} style={{ width: 70 }} />
            <span style={{ opacity: 0.6, width: 28 }}>{Math.round(overlayOpacity * 100)}%</span>
          </label>

          <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ opacity: 0.6 }}>Size</span>
            <input type="range" min={10} max={200} step={1} value={overlayScale}
              onChange={e => setOverlayScale(+e.target.value)} style={{ width: 80 }} />
            <span style={{ opacity: 0.6, width: 36 }}>{overlayScale}%</span>
          </label>

          <button onClick={() => { setOverlayX(0); setOverlayY(0); setOverlayScale(100); }}
            style={{ fontSize: 11, padding: "2px 8px", background: "#2a2a38", border: "1px solid #555", borderRadius: 5, color: "#ccc", cursor: "pointer" }}>
            Reset
          </button>

          <button onClick={copyOverlayValues}
            style={{ fontSize: 11, padding: "2px 8px", background: copied === "overlay" ? "#34d39933" : "#2a2a38", border: "1px solid #555", borderRadius: 5, color: "#ccc", cursor: "pointer" }}>
            {copied === "overlay" ? "✓ Copied" : "Copy offset"}
          </button>
        </>}

        <span style={{ fontSize: 10, opacity: 0.4, marginLeft: "auto" }}>
          Click → pin · Drag overlay handle → reposition · World {WORLD_W}×{WORLD_H}
        </span>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Canvas */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#111" }}>

          {/* Crosshairs */}
          {hover && !dragging.current && <>
            <div style={{ position: "absolute", top: `${hover.py}%`, left: 0, right: 0, height: 1, background: "rgba(168,139,250,0.45)", pointerEvents: "none", zIndex: 20 }} />
            <div style={{ position: "absolute", left: `${hover.px}%`, top: 0, bottom: 0, width: 1, background: "rgba(168,139,250,0.45)", pointerEvents: "none", zIndex: 20 }} />
          </>}

          {/* Image container */}
          <div
            ref={containerRef}
            onClick={onContainerClick}
            onMouseEnter={() => {}}
            onMouseLeave={() => setHover(null)}
            style={{ position: "absolute", inset: 0, cursor: "crosshair", userSelect: "none" }}
          >
            {/* Base */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={baseImage.src} alt="base" draggable={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />

            {/* Overlay — freely positioned & sized */}
            {overlayOn && (
              <div
                onMouseDown={startDragOverlay}
                style={{
                  position: "absolute",
                  left:        `${overlayX}%`,
                  top:         `${overlayY}%`,
                  width:       `${overlayScale}%`,
                  aspectRatio: `${WORLD_W} / ${WORLD_H}`,
                  cursor:      "move",
                  zIndex:      10,
                  outline:     "1.5px dashed rgba(251,191,36,0.6)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={overlayImage.src} alt="overlay" draggable={false}
                  style={{ width: "100%", height: "100%", objectFit: "contain", opacity: overlayOpacity, display: "block", pointerEvents: "none" }} />

                {/* Drag handle label */}
                <div style={{
                  position: "absolute", top: 0, left: 0,
                  background: "rgba(251,191,36,0.85)", color: "#000",
                  fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: "0 0 4px 0",
                  cursor: "move", userSelect: "none",
                }}>
                  ⠿ {overlayImage.label} · {overlayScale}% · ({overlayX.toFixed(1)}%, {overlayY.toFixed(1)}%)
                </div>
              </div>
            )}

            {/* Pins */}
            {pins.map((p, i) => (
              <div key={i}
                onMouseDown={e => startDragPin(e, i)}
                onClick={e => e.stopPropagation()}
                style={{
                  position: "absolute",
                  left: `${(p.x / WORLD_W) * 100}%`,
                  top:  `${(p.y / WORLD_H) * 100}%`,
                  transform: "translate(-50%, -100%)",
                  cursor: "grab", zIndex: 30,
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}
              >
                <div style={{ background: p.color, color: "#000", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, whiteSpace: "nowrap" }}>
                  {p.label}
                </div>
                <div style={{ width: 1.5, height: 8, background: p.color }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
              </div>
            ))}
          </div>

          {/* Coordinate HUD */}
          {hover && (
            <div style={{
              position: "absolute", bottom: 12, left: 12, zIndex: 40,
              background: "rgba(0,0,0,0.88)", border: "1px solid #333",
              borderRadius: 8, padding: "8px 12px", fontSize: 11, lineHeight: 1.8,
              pointerEvents: "none",
            }}>
              <div><span style={{ color: "#a78bfa" }}>world px  </span> x: <b>{hover.wx}</b>  y: <b>{hover.wy}</b></div>
              <div><span style={{ color: "#34d399" }}>img %     </span> x: <b>{hover.px}%</b>  y: <b>{hover.py}%</b>  ← use for SPAWN</div>
              <div style={{ opacity: 0.7 }}><span style={{ color: "#fbbf24" }}>container%</span> x: <b>{hover.cpx}%</b>  y: <b>{hover.cpy}%</b>  ← use for transformOrigin</div>
              <div style={{ opacity: 0.55, marginTop: 2 }}>SPAWN_X = {hover.wx} - CHAR_W/2,  SPAWN_Y = {hover.wy}</div>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div style={{ width: 270, background: "#13131c", borderLeft: "1px solid #222", overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Pins</div>

          {pins.length === 0 && <div style={{ fontSize: 11, opacity: 0.35 }}>Click the image to drop a pin</div>}

          {pins.map((p, i) => (
            <div key={i} style={{ background: "#1e1e2e", border: `1px solid ${p.color}33`, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                <button onClick={() => setPins(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>×</button>
              </div>
              <div style={{ fontSize: 10, opacity: 0.75, lineHeight: 1.9 }}>
                <div>world: ({p.x}, {p.y})</div>
                <div>pct:   ({((p.x/WORLD_W)*100).toFixed(1)}%, {((p.y/WORLD_H)*100).toFixed(1)}%)</div>
                <div style={{ opacity: 0.6 }}>SPAWN_X = center {p.x - Math.round(WORLD_W/2) >= 0 ? "+" : ""}{p.x - Math.round(WORLD_W/2)}</div>
                <div style={{ opacity: 0.6 }}>SPAWN_Y = {p.y}</div>
                <div style={{ opacity: 0.6 }}>origin: &quot;{((p.x/WORLD_W)*100).toFixed(1)}% {((p.y/WORLD_H)*100).toFixed(1)}%&quot;</div>
              </div>
              <button onClick={() => copyPin(p)}
                style={{ marginTop: 7, width: "100%", padding: "3px 0", fontSize: 10,
                  background: copied === p.label ? "#34d39933" : "#252535",
                  border: `1px solid ${copied === p.label ? "#34d399" : "#444"}`,
                  borderRadius: 5, color: "#fff", cursor: "pointer" }}>
                {copied === p.label ? "✓ Copied!" : "Copy values"}
              </button>
            </div>
          ))}

          {pins.length > 0 && (
            <button onClick={() => setPins([])}
              style={{ padding: "5px", fontSize: 10, background: "none", border: "1px solid #444", borderRadius: 5, color: "#f87171", cursor: "pointer" }}>
              Clear all pins
            </button>
          )}

          {/* Overlay readout */}
          {overlayOn && (
            <div style={{ marginTop: 8, padding: "10px 12px", background: "#1e1e2e", border: "1px solid #fbbf2433", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>Overlay position</div>
              <div style={{ fontSize: 10, lineHeight: 1.9, opacity: 0.75 }}>
                <div>left:  {overlayX.toFixed(1)}%</div>
                <div>top:   {overlayY.toFixed(1)}%</div>
                <div>size:  {overlayScale}%</div>
                <div style={{ opacity: 0.6 }}>px left: {Math.round(overlayX / 100 * WORLD_W)}</div>
                <div style={{ opacity: 0.6 }}>px top:  {Math.round(overlayY / 100 * WORLD_H)}</div>
              </div>
            </div>
          )}

          {/* Quick ref */}
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid #222", fontSize: 10, opacity: 0.45, lineHeight: 1.9 }}>
            <div style={{ fontWeight: 700, opacity: 0.7, marginBottom: 2 }}>Quick ref</div>
            <div>WORLD: {WORLD_W}×{WORLD_H}</div>
            <div>center X = {WORLD_W / 2}</div>
            <div>15% Y = {Math.round(WORLD_H * 0.15)}</div>
            <div>22% Y = {Math.round(WORLD_H * 0.22)}</div>
            <div>spawn = (842, 324)</div>
          </div>
        </div>
      </div>

      {/* ── Compare modal ─────────────────────────────────────────────────── */}
      {comparing && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100, background: "#000",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compareImg === "analyze" ? "/Analyze_teeth.png" : "/Zoom_out_1.png"}
            alt="compare"
            draggable={false}
            style={{
              flex: 1, width: "100%", objectFit: "contain",
              ...(compareImg === "zoom" ? {
                transformOrigin: `${ZOOM_ORIGIN_X}% ${ZOOM_ORIGIN_Y}%`,
                transform: `scale(${ZOOM_SCALE})`,
              } : {}),
            }}
          />

          {/* Controls bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
            padding: "12px 24px", background: "rgba(0,0,0,0.9)", borderTop: "1px solid #222",
            flexShrink: 0,
          }}>
            <button
              onClick={() => setCompareImg("analyze")}
              style={{
                padding: "6px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer",
                background: compareImg === "analyze" ? "#34d399" : "#1e1e2e",
                color: compareImg === "analyze" ? "#000" : "#666",
                border: `2px solid ${compareImg === "analyze" ? "#34d399" : "#333"}`,
              }}>
              Analyze_teeth
            </button>

            <span style={{ color: "#444", fontSize: 18 }}>⇄</span>

            <button
              onClick={() => setCompareImg("zoom")}
              style={{
                padding: "6px 20px", fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: "pointer",
                background: compareImg === "zoom" ? "#60a5fa" : "#1e1e2e",
                color: compareImg === "zoom" ? "#000" : "#666",
                border: `2px solid ${compareImg === "zoom" ? "#60a5fa" : "#333"}`,
              }}>
              Zoom_out_1 (first frame)
            </button>

            <span style={{ color: "#555", fontSize: 11, marginLeft: 16 }}>
              press <kbd style={{ background: "#222", padding: "1px 5px", borderRadius: 3 }}>Space</kbd> to toggle
            </span>

            <button
              onClick={() => setComparing(false)}
              style={{ marginLeft: 16, padding: "6px 16px", fontSize: 12, borderRadius: 8, cursor: "pointer", background: "#2a2a38", border: "1px solid #444", color: "#ccc" }}>
              Close
            </button>
          </div>

          {/* Space key toggles */}
          <CompareKeyHandler onToggle={() => setCompareImg(i => i === "analyze" ? "zoom" : "analyze")} />
        </div>
      )}

      {/* ── Zoom preview modal ─────────────────────────────────────────────── */}
      {previewing && (
        <div
          onClick={() => setPreviewing(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "#000",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <style>{`
            @keyframes previewZoomOut {
              0%   { transform: scale(${ZOOM_SCALE}); }
              100% { transform: scale(1); }
            }
          `}</style>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={previewKey}
            src="/Zoom_out_1.png"
            alt="zoom preview"
            draggable={false}
            style={{
              width: "100%", height: "100%", objectFit: "contain",
              transformOrigin: `${ZOOM_ORIGIN_X}% ${ZOOM_ORIGIN_Y}%`,
              animation: `previewZoomOut ${ZOOM_DURATION}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            }}
          />

          <div style={{
            position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 12,
            padding: "6px 14px", borderRadius: 20, pointerEvents: "none",
          }}>
            origin: {ZOOM_ORIGIN_X}% {ZOOM_ORIGIN_Y}% · scale: {ZOOM_SCALE}× · {ZOOM_DURATION}s — click to close
          </div>
        </div>
      )}
    </div>
  );
}
