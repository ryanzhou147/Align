"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const API_BASE = "http://localhost:8000";

type TimelineEntry = { month: number; label: string; image_b64: string };
type Analysis = {
  severity: "mild" | "moderate" | "severe";
  issues: string[];
  estimated_months: number;
  cavities_detected?: boolean;
  cavity_notes?: string;
  notes?: string;
};
type Result = { analysis: Analysis; timeline: TimelineEntry[] };
type Stage = "idle" | "loading" | "done" | "error";

// Shorter durations — total ~5s animated progress
const LOADING_STEPS = [
  { label: "UPLOADING IMAGE...",          duration: 400  },
  { label: "SCANNING DENTAL STRUCTURE...",duration: 1000 },
  { label: "APPLYING BRACES...",          duration: 800  },
  { label: "SIMULATING MOVEMENT...",      duration: 700  },
  { label: "ADVANCING TREATMENT...",      duration: 700  },
  { label: "COMPLETING TREATMENT...",     duration: 600  },
  { label: "FINALIZING TIMELINE...",      duration: 400  },
];

const C = {
  bg:      "#C5DCF0",
  bgDark:  "#A2C4E0",
  bgDeep:  "#7AAFD4",
  border:  "#1A3A5E",
  text:    "#0D1E30",
  muted:   "#4A6E94",
  gold:    "#1B6FAD",
  goldBrt: "#4AAEE0",
  red:     "#7A2020",
  green:   "#2A5A1A",
  page:    "#081525",
};

const FONT = "'Press Start 2P', monospace";

const panel: React.CSSProperties = {
  background: C.bg,
  border: `4px solid ${C.border}`,
  boxShadow: `5px 5px 0 ${C.border}`,
  overflow: "hidden",
};

const hdr = (bg = C.bgDark): React.CSSProperties => ({
  background: bg,
  borderBottom: `4px solid ${C.border}`,
  padding: "8px 14px",
  display: "flex",
  alignItems: "center",
});

const btn = (on = true): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: "9px",
  background: on ? C.bg : C.bgDeep,
  border: `3px solid ${C.border}`,
  boxShadow: on ? `4px 4px 0 ${C.border}` : "none",
  padding: "9px 16px",
  color: on ? C.text : C.muted,
  cursor: on ? "pointer" : "not-allowed",
  opacity: on ? 1 : 0.4,
  lineHeight: 1,
});

function npcText(a: Analysis) {
  const intro =
    a.severity === "severe"   ? "Quite serious — needs attention." :
    a.severity === "moderate" ? "Some issues to address here." :
                                "Not bad, but let's improve it.";
  const cavity = a.cavities_detected ? " Cavities detected — treat first." : "";
  return `${intro}${cavity} ${a.estimated_months}-month plan recommended.`;
}

export default function TreatmentPage({ initialFile }: { initialFile?: File }) {
  const inputRef                    = useRef<HTMLInputElement>(null);
  const [file,         setFile]     = useState<File | null>(initialFile ?? null);
  const [preview,      setPreview]  = useState<string | null>(initialFile ? URL.createObjectURL(initialFile) : null);
  const [stage,        setStage]    = useState<Stage>("idle");
  const [result,       setResult]   = useState<Result | null>(null);
  const [error,        setError]    = useState<string | null>(null);
  const [dragging,     setDragging] = useState(false);
  const [activeIndex,  setActive]   = useState(0);
  const [loadingStep,  setLStep]    = useState(0);
  const [stepProgress, setSProg]    = useState(0);

  const handleFile = (f: File) => {
    setFile(f); setPreview(URL.createObjectURL(f));
    setResult(null); setError(null); setStage("idle"); setActive(0);
  };

  useEffect(() => {
    if (initialFile && stage === "idle") analyze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handleFile(f);
  }, []);

  const runProgressAnimation = async (done: { resolved: boolean }) => {
    setLStep(0); setSProg(0);
    // Run all steps except the last one at fixed speed
    for (let i = 0; i < LOADING_STEPS.length - 1; i++) {
      setLStep(i);
      const ticks = 20, tickMs = LOADING_STEPS[i].duration / ticks;
      for (let t = 0; t <= ticks; t++) {
        setSProg(t / ticks);
        await new Promise((r) => setTimeout(r, tickMs));
      }
    }
    // Last step: creep slowly until API resolves, then snap to 100%
    const lastIdx = LOADING_STEPS.length - 1;
    setLStep(lastIdx); setSProg(0);
    let p = 0;
    while (!done.resolved) {
      p = Math.min(0.92, p + 0.015);
      setSProg(p);
      await new Promise((r) => setTimeout(r, 80));
    }
    setSProg(1);
  };

  const analyze = async () => {
    if (!file) return;
    setError(null); setResult(null); setStage("loading");
    const form = new FormData();
    form.append("image", file);
    const done = { resolved: false };
    const apiCall = fetch(`${API_BASE}/agents/treatment-predictive/analyze`, { method: "POST", body: form })
      .then(r => { done.resolved = true; return r; });
    try {
      const [res] = await Promise.all([apiCall, runProgressAnimation(done)]);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      const data: Result = await res.json();
      setResult(data); setActive(0); setStage("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  };

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setError(null);
    setStage("idle"); setActive(0); setLStep(0); setSProg(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLoading   = stage === "loading";
  const activeEntry = result?.timeline[activeIndex];
  const totalPct    = Math.round(((loadingStep + stepProgress) / LOADING_STEPS.length) * 100);
  const maxIdx      = (result?.timeline.length ?? 1) - 1;

  return (
    <main style={{ background: C.page, fontFamily: FONT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; }
        .px-btn { transition: transform 60ms, box-shadow 60ms; }
        .px-btn:hover:not(:disabled) { transform: translate(4px,4px); box-shadow: none !important; }
        .px-btn:disabled { opacity:.35; cursor:not-allowed !important; }
        .px-thumb { transition: filter .1s; cursor: pointer; }
        .px-thumb:hover { filter: brightness(1.15) !important; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .blink { animation: blink 1s step-end infinite; }
        input[type=range] { -webkit-appearance:none; appearance:none; width:100%; height:10px; background:${C.bgDeep}; border:3px solid ${C.border}; cursor:pointer; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; background:${C.goldBrt}; border:3px solid ${C.border}; cursor:pointer; margin-top:-7px; box-shadow:2px 2px 0 ${C.border}; }
        input[type=range]::-moz-range-thumb { width:18px; height:18px; background:${C.goldBrt}; border:3px solid ${C.border}; cursor:pointer; box-shadow:2px 2px 0 ${C.border}; }
        input[type=range]::-webkit-slider-runnable-track { height:4px; background:linear-gradient(to right, ${C.gold} var(--pct,0%), ${C.bgDeep} var(--pct,0%)); border:0; }
      `}</style>

      <div style={{ padding: "12px" }}>

        {/* Upload (standalone mode only) */}
        {!result && !isLoading && !initialFile && (
          <div style={{ ...panel, marginBottom: "12px" }}>
            <div style={hdr()}>
              <span style={{ fontSize: "10px", color: C.text }}>[ UPLOAD PHOTO ]</span>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div
                style={{ border: `3px dashed ${dragging ? C.gold : C.border}`, background: dragging ? C.gold + "18" : C.bgDark + "55", padding: "24px", textAlign: "center", cursor: file ? "default" : "pointer", marginBottom: "12px" }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !file && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                {preview ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "18px", justifyContent: "center" }}>
                    <div style={{ border: `4px solid ${C.border}`, lineHeight: 0 }}>
                      <img src={preview} alt="preview" style={{ width: 80, height: 80, objectFit: "cover", display: "block" }} />
                    </div>
                    <button className="px-btn" style={btn()} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>↺ REPLACE</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>🦷</div>
                    <p style={{ fontSize: "8px", color: C.muted, lineHeight: "2.2" }}>DRAG & DROP OR CLICK TO SELECT</p>
                  </>
                )}
              </div>
              <button className="px-btn" onClick={analyze} disabled={!file} style={{ ...btn(!!file), background: file ? C.gold : C.bgDeep, fontSize: "10px", padding: "12px 20px", color: file ? C.page : C.muted }}>▶ GENERATE TIMELINE</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={{ ...panel, marginBottom: "12px" }}>
            <div style={hdr()}>
              <span style={{ fontSize: "10px", color: C.text }}>[ PROCESSING... ]</span>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: C.gold }}>{totalPct}%</span>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ height: "14px", background: C.bgDeep, border: `3px solid ${C.border}`, marginBottom: "12px" }}>
                <div style={{ height: "100%", background: C.gold, width: `${totalPct}%`, transition: "width .2s", boxShadow: `0 0 8px ${C.goldBrt}88` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {LOADING_STEPS.map((step, i) => {
                  const done = i < loadingStep, active = i === loadingStep;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: active ? C.gold + "25" : done ? C.green + "18" : "transparent", border: `2px solid ${active ? C.gold : done ? C.green : "transparent"}`, opacity: i > loadingStep ? 0.25 : 1 }}>
                      <span style={{ fontSize: "10px", width: 14, flexShrink: 0, color: done ? C.green : active ? C.gold : C.muted }}>{done ? "✓" : active ? "▶" : "·"}</span>
                      <span style={{ fontSize: "7px", color: active ? C.text : done ? C.green : C.muted }}>{step.label}</span>
                      {active && <div style={{ marginLeft: "auto", width: 50, height: 6, background: C.bgDeep, border: `2px solid ${C.border}`, flexShrink: 0 }}><div style={{ height: "100%", background: C.gold, width: `${stepProgress * 100}%` }} /></div>}
                      {done && <span style={{ marginLeft: "auto", fontSize: "6px", color: C.green }}>DONE</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {stage === "error" && error && (
          <div style={{ ...panel, borderColor: C.red, marginBottom: "12px" }}>
            <div style={hdr(C.red + "44")}><span style={{ fontSize: "10px", color: C.red }}>[ ✖ ERROR ]</span></div>
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: "8px", color: C.red, lineHeight: "2.2", marginBottom: "12px" }}>{error}</p>
              <button className="px-btn" style={btn()} onClick={reset}>↩ TRY AGAIN</button>
            </div>
          </div>
        )}

        {/* Results — side-by-side layout, fixed height so nothing reflows */}
        {result && activeEntry && (
          <div style={{ display: "flex", gap: "14px", alignItems: "stretch", height: "calc(88vh - 40px)" }}>

            {/* LEFT — Analysis summary */}
            <div style={{ ...panel, flex: "0 0 400px", display: "flex", flexDirection: "column" }}>
              <div style={hdr()}>
                <span style={{ fontSize: "13px", color: C.text }}>[ DIAGNOSIS ]</span>
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>

                {/* NPC speech */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px", background: C.bgDark, border: `3px solid ${C.border}` }}>
                  <div style={{ flexShrink: 0, width: 60, height: 60, border: `3px solid ${C.border}`, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>🦷</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "10px", color: C.gold, marginBottom: "10px", letterSpacing: "1px" }}>DR. DENTIN:</p>
                    <p style={{ fontSize: "10px", color: C.text, lineHeight: "2.6" }}>
                      &ldquo;{npcText(result.analysis)}&rdquo;
                      <span className="blink" style={{ marginLeft: 3 }}>▌</span>
                    </p>
                  </div>
                </div>

                {/* Stats — 2x2 grid with big symbols */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "12px", border: `2px solid ${C.border}`, background: C.bgDark }}>
                    <p style={{ fontSize: "8px", color: C.muted, marginBottom: "10px", letterSpacing: "1px" }}>SEVERITY</p>
                    <p style={{ fontSize: "14px", color: result.analysis.severity === "severe" ? C.red : result.analysis.severity === "moderate" ? "#8B6000" : C.green, lineHeight: 1.3 }}>
                      {result.analysis.severity.toUpperCase()}
                    </p>
                  </div>
                  <div style={{ padding: "12px", border: `2px solid ${C.border}`, background: C.bgDark }}>
                    <p style={{ fontSize: "8px", color: C.muted, marginBottom: "10px", letterSpacing: "1px" }}>DURATION</p>
                    <p style={{ fontSize: "14px", color: C.text, lineHeight: 1.3 }}>{result.analysis.estimated_months} MO.</p>
                  </div>
                  <div style={{ padding: "12px", border: `2px solid ${result.analysis.cavities_detected ? C.red : C.border}`, background: result.analysis.cavities_detected ? C.red + "22" : C.bgDark }}>
                    <p style={{ fontSize: "8px", color: C.muted, marginBottom: "10px", letterSpacing: "1px" }}>CAVITIES</p>
                    <p style={{ fontSize: "14px", color: result.analysis.cavities_detected ? C.red : C.green, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "20px" }}>{result.analysis.cavities_detected ? "⚠" : "✓"}</span>
                      <span>{result.analysis.cavities_detected ? "YES" : "NONE"}</span>
                    </p>
                  </div>
                  <div style={{ padding: "12px", border: `2px solid ${C.border}`, background: C.bgDark }}>
                    <p style={{ fontSize: "8px", color: C.muted, marginBottom: "10px", letterSpacing: "1px" }}>BRACES</p>
                    <p style={{ fontSize: "14px", color: C.green, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "20px" }}>✓</span>
                      <span>FIT</span>
                    </p>
                  </div>
                </div>

                {/* Issues */}
                {result.analysis.issues.length > 0 && (
                  <div style={{ padding: "14px", border: `2px solid ${C.border}`, background: C.bgDark }}>
                    <p style={{ fontSize: "8px", color: C.muted, marginBottom: "12px", letterSpacing: "2px" }}>OBSERVATIONS</p>
                    {result.analysis.issues.slice(0, 3).map((issue, i) => (
                      <p key={i} style={{ fontSize: "9px", color: C.text, lineHeight: "2.6", marginBottom: "4px" }}>▸ {issue}</p>
                    ))}
                    {result.analysis.issues.length > 3 && (
                      <p style={{ fontSize: "8px", color: C.muted, marginTop: "8px" }}>+{result.analysis.issues.length - 3} more findings</p>
                    )}
                  </div>
                )}

                {/* Cavity warning */}
                {result.analysis.cavities_detected && (
                  <div style={{ padding: "14px", border: `2px solid ${C.red}`, background: C.red + "18", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px", flexShrink: 0 }}>⚠</span>
                    <p style={{ fontSize: "9px", color: C.red, lineHeight: "2.4" }}>TREAT CAVITIES BEFORE STARTING BRACES</p>
                  </div>
                )}

                <button className="px-btn" style={{ ...btn(), marginTop: "auto", fontSize: "11px", padding: "14px 20px" }} onClick={reset}>↩ NEW PHOTO</button>
              </div>
            </div>

            {/* RIGHT — Timeline */}
            <div style={{ ...panel, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={hdr()}>
                <span style={{ fontSize: "13px", color: C.text }}>[ TREATMENT TIMELINE ]</span>
                <span style={{ marginLeft: "auto", fontSize: "10px", color: C.muted, whiteSpace: "nowrap" }}>{activeIndex + 1} / {result.timeline.length}</span>
              </div>
              <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1, overflow: "hidden" }}>

                {/* Main image — fills available height */}
                <div style={{ position: "relative", border: `4px solid ${C.border}`, background: C.page, lineHeight: 0, overflow: "hidden", flex: 1, minHeight: 0 }}>
                  {result.timeline.map((entry, i) => (
                    <img key={i}
                      src={i === 0 && preview ? preview : `data:image/jpeg;base64,${entry.image_b64}`}
                      alt={entry.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", position: "absolute", top: 0, left: 0, opacity: i === activeIndex ? 1 : 0, transition: "opacity .25s ease", pointerEvents: "none" }}
                    />
                  ))}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,#14090ACC)", padding: "24px 12px 10px", display: "flex", gap: 8 }}>
                    <span style={{ background: C.gold, border: `2px solid ${C.border}`, padding: "7px 12px", fontSize: "11px", color: C.page, fontFamily: FONT, whiteSpace: "nowrap" }}>MO.{activeEntry.month}</span>
                    <span style={{ background: C.bg, border: `2px solid ${C.border}`, padding: "7px 12px", fontSize: "11px", color: C.text, fontFamily: FONT, whiteSpace: "nowrap" }}>{activeEntry.label.toUpperCase()}</span>
                  </div>
                </div>

                {/* Slider */}
                <div>
                  <input type="range" min={0} max={maxIdx} step={1} value={activeIndex}
                    onChange={(e) => setActive(Number(e.target.value))}
                    style={{ "--pct": `${(activeIndex / maxIdx) * 100}%`, width: "100%" } as React.CSSProperties}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                    {result.timeline.map((entry, i) => (
                      <button key={entry.month} onClick={() => setActive(i)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT, padding: "3px 0" }}>
                        <span style={{ fontSize: "8px", color: i === activeIndex ? C.gold : C.muted }}>MO.{entry.month}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnails */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px" }}>
                  {result.timeline.map((entry, i) => (
                    <button key={entry.month} className="px-thumb" onClick={() => setActive(i)} style={{ padding: 0, lineHeight: 0, position: "relative", background: C.page, border: `3px solid ${i === activeIndex ? C.goldBrt : C.border}`, boxShadow: i === activeIndex ? `3px 3px 0 ${C.goldBrt}` : `2px 2px 0 ${C.border}`, filter: i === activeIndex ? "none" : "brightness(.7)" }}>
                      <img src={i === 0 && preview ? preview : `data:image/jpeg;base64,${entry.image_b64}`} alt={entry.label} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(20,9,4,.9)", padding: "5px 4px", textAlign: "center" }}>
                        <span style={{ fontSize: "7px", color: i === activeIndex ? C.goldBrt : C.bgDark, fontFamily: FONT }}>MO.{entry.month}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Prev/Next */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="px-btn" style={{ ...btn(activeIndex > 0), fontSize: "11px", padding: "14px 24px" }} disabled={activeIndex === 0} onClick={() => setActive((i) => Math.max(0, i - 1))}>◀ PREV</button>
                  <button className="px-btn" style={{ ...btn(activeIndex < maxIdx), fontSize: "11px", padding: "14px 24px" }} disabled={activeIndex === maxIdx} onClick={() => setActive((i) => Math.min(maxIdx, i + 1))}>NEXT ▶</button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
