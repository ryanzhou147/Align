"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const DentalViewer = dynamic(() => import("./SurgeryViewer"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1a2a3a",
      fontFamily: "'Press Start 2P', monospace",
      fontSize: "8px",
      color: "#4A7A9E",
    }}>
      LOADING 3D MODEL...
    </div>
  ),
});

const API_BASE = "http://localhost:8000";

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

const panelStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: C.bg,
  border: `4px solid ${C.border}`,
  boxShadow: `5px 5px 0 ${C.border}`,
  overflow: "hidden",
  ...extra,
});

const hdrStyle = (bg = C.bgDark): React.CSSProperties => ({
  background: bg,
  borderBottom: `4px solid ${C.border}`,
  padding: "8px 14px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
});

const btnStyle = (variant: "primary" | "secondary" | "danger" = "primary"): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: "8px",
  padding: "10px 16px",
  border: `3px solid ${C.border}`,
  boxShadow: `3px 3px 0 ${C.border}`,
  cursor: "pointer",
  lineHeight: 1,
  background: variant === "primary" ? C.gold : variant === "danger" ? C.red + "44" : C.bgDeep,
  color: variant === "primary" ? C.bg : variant === "danger" ? C.red : C.muted,
});

const inputStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: "8px",
  width: "100%",
  background: C.bgDark,
  border: `3px solid ${C.border}`,
  padding: "9px 10px",
  color: C.text,
  outline: "none",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type TimelineStage = {
  month: number;
  label: string;
  image_b64?: string;
  image_url?: string;
};

type PatientResult = {
  analysis: {
    severity: string;
    issues: string[];
    cavities_detected: boolean;
    cavity_notes: string;
    estimated_months: number;
    suitable_for_braces: boolean;
    notes: string;
  };
  timeline: TimelineStage[];
  summary: string;
};

type Patient = {
  id: string;
  name: string;
  age: number;
  chief_complaint: string;
  imageUrl: string;
  result: PatientResult | null;
  status: "idle" | "loading" | "done" | "error";
  summaryStatus: "idle" | "loading" | "done" | "error";
  error?: string;
};

// ─── Mock patient seed data ───────────────────────────────────────────────────

const MOCK_PATIENTS: Patient[] = [
  {
    id: "mock-anna",
    name: "Anna Chen",
    age: 24,
    chief_complaint: "crowding and teeth misalignment",
    imageUrl: "/Zoom_out_anna.png",
    status: "done",
    summaryStatus: "done",
    result: {
      analysis: {
        severity: "moderate",
        issues: ["crowding on lower arch", "visible cavity on upper central incisor", "moderate overbite", "slight spacing irregularity on upper laterals"],
        cavities_detected: true,
        cavity_notes: "Dark lesion visible on upper central incisor — restorative care recommended prior to orthodontic treatment.",
        estimated_months: 24,
        suitable_for_braces: true,
        notes: "Patient presents with moderate crowding and a single visible cavity. Cavity treatment should precede brace placement.",
      },
      timeline: [
        { month: 0,  label: "Current Teeth",     image_url: "/teeth_current.png" },
        { month: 3,  label: "Braces Applied",     image_url: "/demo_month3.png" },
        { month: 9,  label: "Early Movement",     image_url: "/demo_month9.png" },
        { month: 15, label: "Almost There",       image_url: "/demo_month15.png" },
        { month: 24, label: "Treatment Complete", image_url: "/demo_month24.png" },
      ],
      summary: "DOCTOR SUMMARY PAGE\n\nPatient Overview\nAnna Chen, 24F. Presents with chief complaint of crowding and general teeth misalignment. Patient is motivated for orthodontic treatment and has good baseline oral hygiene.\n\nFindings\n- Moderate crowding on lower arch with visible overlap of lateral incisors\n- Dark carious lesion on upper central incisor — restorative care required\n- Moderate overbite present, within treatable range\n- Slight spacing irregularity between upper lateral incisors\n\nTreatment Plan\n- Priority: composite filling or restoration on upper central incisor before brace placement\n- Traditional braces recommended given degree of crowding\n- Estimated active orthodontic treatment: 24 months\n- Retention phase with fixed lingual retainer following completion\n\nPrognosis\nGood. Patient is a strong candidate for orthodontic correction once the cavity is addressed. Alignment outcome expected to be excellent given age and bone density.",
    },
  },
  {
    id: "mock-max",
    name: "Max Rivera",
    age: 31,
    chief_complaint: "tooth pain and sensitivity from multiple cavities",
    imageUrl: "/Zoom_out_max.png",
    status: "done",
    summaryStatus: "done",
    result: {
      analysis: {
        severity: "severe",
        issues: ["deep cavity on upper left molar", "cavity on lower right premolar", "enamel erosion on upper centrals", "early-stage decay on lower left molar", "mild crowding on lower arch"],
        cavities_detected: true,
        cavity_notes: "Four active cavities identified: deep lesion on upper left molar requiring root evaluation, moderate decay on lower right premolar, enamel erosion across upper centrals, and early decay on lower left molar. Immediate restorative treatment across all sites required.",
        estimated_months: 18,
        suitable_for_braces: false,
        notes: "Primary concern is cavity management — patient presents with four active sites of decay. Orthodontic treatment is not suitable until all cavities are treated and oral hygiene is significantly improved.",
      },
      timeline: [
        { month: 0,  label: "Current State",      image_url: "/max_teeth.jpeg" },
        { month: 3,  label: "Fillings Placed",    image_url: "/demo_month3.png" },
        { month: 9,  label: "Healing Progress",   image_url: "/demo_month9.png" },
        { month: 15, label: "Decay Resolved",     image_url: "/demo_month15.png" },
        { month: 18, label: "Restorative Complete", image_url: "/demo_month24.png" },
      ],
      summary: "DOCTOR SUMMARY PAGE\n\nPatient Overview\nMax Rivera, 31M. Presents with significant tooth pain and sensitivity localized to upper left and lower right quadrants. Four active cavities identified on clinical imaging.\n\nFindings\n- Deep cavity on upper left molar — root integrity evaluation recommended\n- Moderate decay on lower right premolar requiring composite filling\n- Enamel erosion across upper central incisors consistent with acidic diet\n- Early-stage decay on lower left molar — preventive intervention indicated\n\nTreatment Plan\n- Immediate: root evaluation on upper left molar; schedule restorative appointments for all four sites\n- Dietary counseling to reduce acidic food/beverage intake\n- Orthodontic treatment deferred until all cavities are fully resolved and hygiene is stable\n- Estimated restorative timeline: 18 months\n\nPrognosis\nWith prompt restorative intervention and improved home care, prognosis is good. Ortho candidacy to be reassessed at 18-month follow-up.",
    },
  },
  {
    id: "mock-sarah",
    name: "Sarah Malik",
    age: 19,
    chief_complaint: "minor crowding and routine alignment check",
    imageUrl: "/Zoom_out_sarah.png",
    status: "done",
    summaryStatus: "done",
    result: {
      analysis: {
        severity: "mild",
        issues: ["slight crowding on lower arch", "minor spacing between upper laterals", "very mild overbite"],
        cavities_detected: false,
        cavity_notes: "No active cavities detected. Enamel health is good with no signs of erosion or decay.",
        estimated_months: 14,
        suitable_for_braces: true,
        notes: "Patient has generally healthy teeth with good enamel and no decay. Orthodontic treatment is straightforward — minor alignment correction expected to produce excellent results.",
      },
      timeline: [
        { month: 0,  label: "Current Teeth",     image_url: "/sarah_teeth.jpg" },
        { month: 3,  label: "Braces Applied",     image_url: "/demo_month3.png" },
        { month: 6,  label: "Early Movement",     image_url: "/demo_month9.png" },
        { month: 10, label: "Almost There",       image_url: "/demo_month15.png" },
        { month: 14, label: "Treatment Complete", image_url: "/demo_month24.png" },
      ],
      summary: "DOCTOR SUMMARY PAGE\n\nPatient Overview\nSarah Malik, 19F. Presents for routine alignment consultation. Patient reports mild cosmetic concern about lower tooth crowding. No pain, sensitivity, or decay reported.\n\nFindings\n- Slight crowding on lower arch — minimal rotation of lower left lateral incisor\n- Minor spacing between upper lateral incisors, cosmetically noticeable\n- Very mild overbite within acceptable range\n- No cavities detected; enamel health excellent\n- Gum tissue healthy with no signs of recession or inflammation\n\nTreatment Plan\n- Clear aligner or traditional braces both suitable options\n- Estimated active treatment: 14 months\n- No pre-treatment restorative work required\n- Standard retainer protocol following completion\n\nPrognosis\nExcellent. Patient has strong oral health baseline and is an ideal orthodontic candidate. Expected outcome is full alignment correction with minimal complications.",
    },
  },
];

const LS_KEY = "doctor_patients_v2";

function loadPatients(): Patient[] {
  if (typeof window === "undefined") return MOCK_PATIENTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return MOCK_PATIENTS;
    const stored: Patient[] = JSON.parse(raw);
    // Always use fresh mock data for mock IDs; keep non-mock (real) patients from storage
    const mockIds = MOCK_PATIENTS.map(p => p.id);
    const realPatients = stored.filter(p => !mockIds.includes(p.id));
    return [...MOCK_PATIENTS, ...realPatients];
  } catch {
    return MOCK_PATIENTS;
  }
}

function savePatients(patients: Patient[]) {
  if (typeof window === "undefined") return;
  // Don't persist blob URLs from the browser session (they won't survive reload)
  const toSave = patients.map(p => ({
    ...p,
    // Reset live-session blob URLs to empty so they don't break on reload
    imageUrl: p.id.startsWith("mock-") ? p.imageUrl : "",
    result: p.result ? {
      ...p.result,
      summary: p.result.summary, // keep summary
      timeline: p.result.timeline.map(s => ({
        ...s,
        image_b64: p.id.startsWith("mock-") ? undefined : s.image_b64, // drop base64 for user patients to save space
      })),
    } : null,
    summaryStatus: p.summaryStatus === "loading" ? "idle" as const : p.summaryStatus,
    status: p.status === "loading" ? "idle" as const : p.status,
  }));
  localStorage.setItem(LS_KEY, JSON.stringify(toSave));
}

// ─── Surgery Agent Tab ────────────────────────────────────────────────────────

// Cavity positions mapped from visual inspection of teeth_current.png (% of image dimensions)
const CAVITY_MARKERS = [
  { left: "29%", top: "14%", width: "8%",  height: "14%", label: "UL2" }, // upper-left lateral incisor
  { left: "54%", top: "12%", width: "9%",  height: "15%", label: "UR2" }, // upper-right lateral incisor
  { left: "27%", top: "54%", width: "13%", height: "16%", label: "LL4" }, // lower-left premolar
  { left: "60%", top: "52%", width: "9%",  height: "14%", label: "LR4" }, // lower-right premolar
];

function AnnotatedTeeth({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", display: "inline-block", lineHeight: 0, ...style }}>
      <img
        src="/teeth_current.png"
        alt="Frontal photo"
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
      {CAVITY_MARKERS.map((m) => (
        <div
          key={m.label}
          title={m.label}
          style={{
            position: "absolute",
            left: m.left, top: m.top,
            width: m.width, height: m.height,
            background: "rgba(220, 30, 30, 0.35)",
            border: "2px solid rgba(255, 60, 60, 0.5)",
            borderRadius: "40%",
            boxShadow: "0 0 4px 1px rgba(255,40,40,0.2)",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}

// Torque vs depth data points (electric handpiece, molar) — from dental materials research
// x = depth (mm), y = torque (Ncm)
const TORQUE_POINTS = [
  [0.0, 32], [0.3, 38], [0.8, 30], [1.5, 25],
  [1.8, 38], // DEJ spike
  [2.5, 18], [3.5, 10], [4.0, 6], [4.5, 3],
];

function TorqueChart() {
  const W = 300, H = 140, PL = 32, PR = 10, PT = 10, PB = 28;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const maxDepth = 5, maxTorque = 45;
  const tx = (d: number) => PL + (d / maxDepth) * plotW;
  const ty = (t: number) => PT + plotH - (t / maxTorque) * plotH;

  const pts = TORQUE_POINTS.map(([d, t]) => `${tx(d)},${ty(t)}`).join(" ");
  const fillPts = [
    `${tx(0)},${ty(0)}`,
    ...TORQUE_POINTS.map(([d, t]) => `${tx(d)},${ty(t)}`),
    `${tx(4.5)},${ty(0)}`,
  ].join(" ");

  // Alert zone: near-pulp region (depth > 4mm)
  const alertX = tx(4.0);
  const dejX1 = tx(1.5), dejX2 = tx(2.0);

  const yLabels = [0, 10, 20, 30, 40];
  const xLabels = [0, 1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Near-pulp alert zone */}
      <rect x={alertX} y={PT} width={tx(4.5) - alertX + PR} height={plotH} fill="rgba(180,30,30,0.12)" />
      {/* DEJ zone */}
      <rect x={dejX1} y={PT} width={dejX2 - dejX1} height={plotH} fill="rgba(100,160,220,0.15)" />

      {/* Fill under curve */}
      <polygon points={fillPts} fill={`${C.bgDeep}88`} />
      {/* Curve */}
      <polyline points={pts} fill="none" stroke={C.gold} strokeWidth="2" strokeLinejoin="round" />

      {/* Y axis */}
      <line x1={PL} y1={PT} x2={PL} y2={PT + plotH} stroke={C.border} strokeWidth="1.5" />
      {/* X axis */}
      <line x1={PL} y1={PT + plotH} x2={W - PR} y2={PT + plotH} stroke={C.border} strokeWidth="1.5" />

      {/* Y gridlines + labels */}
      {yLabels.map(v => (
        <g key={v}>
          <line x1={PL} y1={ty(v)} x2={W - PR} y2={ty(v)} stroke={C.border} strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={PL - 4} y={ty(v) + 3} textAnchor="end" fontSize="7" fill={C.muted} fontFamily="monospace">{v}</text>
        </g>
      ))}
      {/* X labels */}
      {xLabels.map(v => (
        <text key={v} x={tx(v)} y={PT + plotH + 14} textAnchor="middle" fontSize="7" fill={C.muted} fontFamily="monospace">{v}</text>
      ))}

      {/* Axis labels */}
      <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="6.5" fill={C.muted} fontFamily="monospace">DEPTH (mm)</text>
      <text x={8} y={PT + plotH / 2} textAnchor="middle" fontSize="6.5" fill={C.muted} fontFamily="monospace" transform={`rotate(-90, 8, ${PT + plotH / 2})`}>Ncm</text>

      {/* Zone labels */}
      <text x={tx(0.8)} y={PT + 9} textAnchor="middle" fontSize="5.5" fill={C.muted} fontFamily="monospace">ENAMEL</text>
      <text x={tx(1.75)} y={PT + 9} textAnchor="middle" fontSize="5.5" fill="#4AAEE0" fontFamily="monospace">DEJ</text>
      <text x={tx(3.0)} y={PT + 9} textAnchor="middle" fontSize="5.5" fill={C.muted} fontFamily="monospace">DENTIN</text>
      <text x={tx(4.3)} y={PT + 9} textAnchor="middle" fontSize="5" fill={C.red} fontFamily="monospace">⚠</text>
    </svg>
  );
}

function SeverityChart() {
  const cavities = [
    { tooth: "UL2", label: "UPPER LEFT 2", pct: 78, depth: "1.2mm", grade: "D3" },
    { tooth: "UR2", label: "UPPER RIGHT 2", pct: 52, depth: "0.9mm", grade: "D2" },
    { tooth: "LL4", label: "LOWER LEFT 4", pct: 85, depth: "1.5mm", grade: "D3" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {cavities.map(c => (
        <div key={c.tooth}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: "6px", color: C.text }}>{c.label}</span>
            <span style={{ fontFamily: FONT, fontSize: "6px", color: C.muted }}>{c.grade}  {c.depth}</span>
          </div>
          <div style={{ height: 14, background: C.bgDeep, border: `2px solid ${C.border}`, position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              width: `${c.pct}%`,
              background: c.pct > 80 ? C.red : c.pct > 60 ? C.gold : C.green,
            }} />
            <span style={{
              position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
              fontFamily: FONT, fontSize: "6px", color: C.bg,
            }}>{c.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SurgeryAgentTab() {
  const [viewMode, setViewMode] = useState<"3d" | "photo">("3d");
  const [scanState, setScanState] = useState<"idle" | "done">("idle");
  const [barScanState, setBarScanState] = useState<"idle" | "scanning" | "done">("idle");
  const [analyzeState, setAnalyzeState] = useState<"idle" | "analyzing" | "done">("idle");
  const [hasLoaded3D, setHasLoaded3D] = useState(false);
  const [planeScan, setPlaneScan] = useState(false);
  const [revealMarkings, setRevealMarkings] = useState(false);

  const runScan = () => {
    setPlaneScan(false);
    setTimeout(() => {
      setScanState("done");
      setPlaneScan(true);
    }, 0);
  };

  const runBarScan = () => {
    setBarScanState("scanning");
    setTimeout(() => {
      setBarScanState("done");
      setRevealMarkings(true);
    }, 2800);
  };

  const runAnalyze = () => {
    setAnalyzeState("analyzing");
    setTimeout(() => setAnalyzeState("done"), 2800);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", background: C.page }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Main viewer card */}
        <div style={panelStyle()}>
          <div style={{ ...hdrStyle(), gap: 0, padding: 0 }}>
            {(["3d", "photo"] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                fontFamily: FONT, fontSize: "7px", padding: "10px 18px",
                border: "none", borderRight: `4px solid ${C.border}`, cursor: "pointer",
                background: viewMode === mode ? C.bg : C.bgDark,
                color: viewMode === mode ? C.text : C.muted, letterSpacing: "1px",
              }}>
                {mode === "3d" ? "◈ 3D MODEL" : "⊡ PHOTO VIEW"}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {viewMode === "3d" && (
              <button
                className="px-btn"
                disabled={!hasLoaded3D}
                onClick={runScan}
                style={{ ...btnStyle("secondary"), margin: "6px 8px 6px 12px", fontSize: "7px", padding: "8px 12px", border: `3px solid ${C.border}` }}
              >
                {scanState === "done" ? "◈ RESCAN" : "◈ SCAN"}
              </button>
            )}
            {viewMode === "3d" && (
              <button
                className="px-btn"
                disabled={!hasLoaded3D || analyzeState === "analyzing"}
                onClick={runAnalyze}
                style={{ ...btnStyle("primary"), margin: "6px 12px 6px 0", fontSize: "7px", padding: "8px 14px" }}
              >
                {analyzeState === "analyzing" ? "◆ ANALYZING..." : "▶ ANALYZE"}
              </button>
            )}
          </div>

          <div style={{ height: 560, position: "relative", background: "#1a2a3a" }}>
            <div style={{ position: "absolute", inset: 0, display: viewMode === "3d" ? "flex" : "none", flexDirection: "column" }}>
              <DentalViewer onLoad={() => setHasLoaded3D(true)} revealLines={revealMarkings} planeScan={planeScan} />
            </div>

            {viewMode === "photo" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", background: C.bgDeep }}>
                <div style={{ flex: "0 0 50%", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, borderRight: `3px solid ${C.border}` }}>
                  <img src="/teeth_current.png" alt="Frontal photo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", border: `3px solid ${C.border}` }} />
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                  <img src="/teethcolour.svg" alt="2D dental diagram" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              </div>
            )}

            {viewMode === "3d" && (
              <div style={{ position: "absolute", bottom: 12, right: 12, width: 180, border: `3px solid ${C.border}`, boxShadow: `3px 3px 0 ${C.border}`, pointerEvents: "none" }}>
                <div style={{ background: C.bgDark, borderBottom: `2px solid ${C.border}`, padding: "3px 6px", fontFamily: FONT, fontSize: "5px", color: C.muted, letterSpacing: "1px" }}>PHOTO REF</div>
                <img src="/teeth_current.png" alt="teeth ref" style={{ width: "100%", display: "block" }} />
              </div>
            )}

            {viewMode === "3d" && barScanState === "scanning" && (
              <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(8,21,37,0.72)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, pointerEvents: "none" }}>
                <p style={{ fontFamily: FONT, fontSize: "7px", color: C.goldBrt, letterSpacing: "2px" }}>◆ SCANNING MODEL...</p>
                <div style={{ width: 320, height: 10, background: C.bgDark, border: `2px solid ${C.border}` }}>
                  <div style={{ height: "100%", background: C.goldBrt, animation: "scanBar 2.8s linear forwards" }} />
                </div>
              </div>
            )}

            {viewMode === "3d" && !hasLoaded3D && (
              <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", padding: "6px 12px", fontFamily: FONT, fontSize: "6px", color: "#4A7A9E", pointerEvents: "none" }}>
                LOADING MODEL...
              </div>
            )}
          </div>
        </div>

        {/* Scan results */}
        {analyzeState === "analyzing" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ ...panelStyle(), padding: "14px 16px" }}>
                  <div className="ghost" style={{ height: 6, width: "60%", marginBottom: 10 }} />
                  <div className="ghost" style={{ height: 18, width: "80%", marginBottom: 8 }} />
                  <div className="ghost" style={{ height: 6, width: "50%" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[0,1].map(i => (
                <div key={i} style={panelStyle()}>
                  <div style={{ ...hdrStyle(), gap: 0 }}>
                    <div className="ghost" style={{ height: 8, width: 160 }} />
                  </div>
                  <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="ghost" style={{ height: 80 }} />
                    <div className="ghost" style={{ height: 10, width: "70%" }} />
                    <div className="ghost" style={{ height: 10, width: "50%" }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {analyzeState === "done" && (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "CAVITIES", value: "3", sub: "DETECTED", color: C.red },
                { label: "ENAMEL", value: "1.8mm", sub: "AVG THICKNESS", color: C.text },
                { label: "MAX DEPTH", value: "1.5mm", sub: "LESION D3", color: C.gold },
                { label: "RDT MIN", value: "0.8mm", sub: "NEAR PULP", color: C.gold },
              ].map(s => (
                <div key={s.label} style={{ ...panelStyle(), padding: "14px 16px" }}>
                  <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 6, letterSpacing: "1px" }}>{s.label}</p>
                  <p style={{ fontFamily: FONT, fontSize: "14px", color: s.color, marginBottom: 4 }}>{s.value}</p>
                  <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* Torque chart */}
              <div style={panelStyle()}>
                <div style={hdrStyle()}>
                  <span style={{ fontSize: "8px", color: C.text }}>[ DRILL TORQUE PROFILE ]</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <TorqueChart />
                  <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      { color: C.muted, label: "ENAMEL" },
                      { color: "#4AAEE0", label: "DEJ" },
                      { color: C.muted, label: "DENTIN" },
                      { color: C.red, label: "⚠ NEAR PULP" },
                    ].map(l => (
                      <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 8, height: 8, background: l.color }} />
                        <span style={{ fontFamily: FONT, fontSize: "5px", color: C.muted }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, background: C.bgDeep, border: `2px solid ${C.border}`, padding: "8px 10px" }}>
                    <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 4 }}>RECOMMENDED DRILL SPEED</p>
                    <p style={{ fontFamily: FONT, fontSize: "8px", color: C.text }}>800 – 3,000 RPM</p>
                    <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginTop: 4 }}>SLOW-SPEED MICROMOTOR · WATER COOLING REQUIRED</p>
                  </div>
                </div>
              </div>

              {/* Cavity severity */}
              <div style={panelStyle()}>
                <div style={hdrStyle()}>
                  <span style={{ fontSize: "8px", color: C.text }}>[ CAVITY SEVERITY (ICDAS) ]</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <SeverityChart />
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ background: C.bgDeep, border: `2px solid ${C.border}`, padding: "8px 10px" }}>
                      <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 4 }}>DRILL DEPTH TARGET</p>
                      <p style={{ fontFamily: FONT, fontSize: "9px", color: C.gold }}>0.9 – 1.3 MM</p>
                    </div>
                    <div style={{ background: C.bgDeep, border: `2px solid ${C.border}`, padding: "8px 10px" }}>
                      <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 4 }}>PULP CLEARANCE</p>
                      <p style={{ fontFamily: FONT, fontSize: "9px", color: C.green }}>&gt; 0.8 MM ✔</p>
                    </div>
                    <div style={{ background: C.bgDeep, border: `2px solid ${C.border}`, padding: "8px 10px" }}>
                      <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 4 }}>TORQUE MAX</p>
                      <p style={{ fontFamily: FONT, fontSize: "9px", color: C.text }}>38 Ncm</p>
                    </div>
                    <div style={{ background: C.bgDeep, border: `2px solid ${C.border}`, padding: "8px 10px" }}>
                      <p style={{ fontFamily: FONT, fontSize: "5px", color: C.muted, marginBottom: 4 }}>RISK LEVEL</p>
                      <p style={{ fontFamily: FONT, fontSize: "9px", color: C.gold }}>MODERATE</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoctorPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "surgery">("dashboard");
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [sliderIdx, setSliderIdx]     = useState(0);

  // Add-patient form
  const [form, setForm]             = useState({ name: "", age: "", complaint: "" });
  const [formFile, setFormFile]     = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState("");
  const [formError, setFormError]   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setPatients(loadPatients());
  }, []);

  // Persist to localStorage whenever patients change
  useEffect(() => {
    if (patients.length > 0) savePatients(patients);
  }, [patients]);

  const selected = patients.find(p => p.id === selectedId) ?? null;

  // ── Auto-generate summary when a patient is selected ──────────────────────
  useEffect(() => {
    if (!selected) return;
    if (selected.status !== "done") return;
    if (!selected.result) return;
    if (selected.summaryStatus !== "idle") return;

    // Mark as loading
    setPatients(ps => ps.map(p => p.id === selected.id ? { ...p, summaryStatus: "loading" } : p));

    // Call doctor summary API
    const data = {
      patient_profile: {
        name: selected.name,
        age: selected.age,
        chief_complaint: selected.chief_complaint,
      },
      vision_intake: selected.result.analysis,
      treatment_simulation: {
        timeline: selected.result.timeline.map(s => ({ month: s.month, label: s.label })),
        estimated_months: selected.result.analysis.estimated_months,
      },
    };

    fetch(`${API_BASE}/agents/doctor-summary/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.ok ? r.json() : r.json().then(b => { throw new Error(b.detail ?? `HTTP ${r.status}`); }))
      .then(res => {
        setPatients(ps => ps.map(p =>
          p.id === selected.id
            ? { ...p, summaryStatus: "done", result: p.result ? { ...p.result, summary: res.summary ?? "" } : p.result }
            : p
        ));
      })
      .catch(() => {
        setPatients(ps => ps.map(p =>
          p.id === selected.id ? { ...p, summaryStatus: "error" } : p
        ));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ── Select patient ─────────────────────────────────────────────────────────
  const selectPatient = (id: string) => {
    setSelectedId(id);
    setSliderIdx(0);
  };

  // ── Add patient form ───────────────────────────────────────────────────────
  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFormFile(f);
    setFormPreview(URL.createObjectURL(f));
  };

  const submitPatient = async () => {
    if (!form.name.trim() || !form.age || !form.complaint.trim() || !formFile) {
      setFormError("All fields + photo required.");
      return;
    }
    const id = Date.now().toString();
    const newPatient: Patient = {
      id,
      name: form.name.trim(),
      age: parseInt(form.age),
      chief_complaint: form.complaint.trim(),
      imageUrl: formPreview,
      result: null,
      status: "loading",
      summaryStatus: "idle",
    };
    setPatients(ps => [...ps, newPatient]);
    selectPatient(id);
    setShowAdd(false);
    setForm({ name: "", age: "", complaint: "" });
    setFormFile(null);
    setFormPreview("");
    setFormError("");

    try {
      const fd = new FormData();
      fd.append("name", newPatient.name);
      fd.append("age", String(newPatient.age));
      fd.append("chief_complaint", newPatient.chief_complaint);
      fd.append("image", formFile);

      const res = await fetch(`${API_BASE}/orchestrator/patient-analyze`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(b.detail ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPatients(ps => ps.map(p =>
        p.id === id ? {
          ...p,
          status: "done",
          summaryStatus: "done",
          result: {
            analysis: data.analysis,
            timeline: data.timeline,
            summary: data.summary ?? "",
          },
        } : p
      ));
    } catch (err) {
      setPatients(ps => ps.map(p =>
        p.id === id
          ? { ...p, status: "error", error: err instanceof Error ? err.message : String(err) }
          : p
      ));
    }
  };

  // ── Summary renderer ───────────────────────────────────────────────────────
  const renderSummary = (text: string) =>
    text.split("\n").map((line, i) => {
      const t = line.trim();
      if (!t) return <div key={i} style={{ height: "10px" }} />;
      if (t === "DOCTOR SUMMARY PAGE") return (
        <p key={i} style={{ fontSize: "11px", color: C.text, marginBottom: "14px", letterSpacing: "2px", borderBottom: `3px solid ${C.border}`, paddingBottom: "8px" }}>{t}</p>
      );
      if (/^[A-Z][A-Za-z /]+$/.test(t) && t.length > 3 && !t.startsWith("-")) return (
        <p key={i} style={{ fontSize: "8px", color: C.gold, marginBottom: "6px", marginTop: "4px", letterSpacing: "2px" }}>{t}</p>
      );
      if (t.startsWith("-")) return (
        <p key={i} style={{ fontSize: "7px", color: C.text, lineHeight: "2.4", marginBottom: "3px", paddingLeft: "10px" }}>{t}</p>
      );
      return <p key={i} style={{ fontSize: "7px", color: C.text, lineHeight: "2.4", marginBottom: "3px" }}>{line}</p>;
    });

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: C.page, minHeight: "100vh", fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { box-sizing: border-box; }
        .px-btn { transition: transform 60ms, box-shadow 60ms; }
        .px-btn:hover:not(:disabled) { transform: translate(3px,3px); box-shadow: none !important; }
        .px-btn:disabled { opacity:.35; cursor:not-allowed !important; }
        input:focus, textarea:focus { border-color: ${C.goldBrt} !important; outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; animation: spin .8s linear infinite; }
        @keyframes ghostPulse { 0%,100%{opacity:.15} 50%{opacity:.38} }
        @keyframes scanBar { from { width: 0% } to { width: 100% } }
        .ghost { background: ${C.bgDeep}; animation: ghostPulse 1.2s ease-in-out infinite; border-radius: 2px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bgDark}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; }
        input[type=range] { -webkit-appearance:none; appearance:none; height:8px; background:${C.bgDeep}; border:3px solid ${C.border}; outline:none; cursor:pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; background:${C.gold}; border:3px solid ${C.border}; cursor:pointer; }
      `}</style>

      {/* Top bar */}
      <div style={{ background: C.bgDark, borderBottom: `4px solid ${C.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 22 }}>🩺</span>
        <span style={{ fontSize: "10px", color: C.text }}>DOCTOR DASHBOARD</span>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.bgDark, borderBottom: `4px solid ${C.border}`, display: "flex", flexShrink: 0 }}>
        {(["dashboard", "surgery"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: FONT,
              fontSize: "8px",
              padding: "10px 20px",
              border: "none",
              borderRight: `4px solid ${C.border}`,
              borderBottom: activeTab === tab ? `4px solid ${C.bg}` : "none",
              marginBottom: activeTab === tab ? "-4px" : 0,
              cursor: "pointer",
              background: activeTab === tab ? C.bg : "transparent",
              color: activeTab === tab ? C.text : C.muted,
              letterSpacing: "1px",
            }}
          >
            [ {tab === "dashboard" ? "DASHBOARD" : "SURGERY AGENT"} ]
          </button>
        ))}
      </div>

      {activeTab === "surgery" && <SurgeryAgentTab />}

      <div style={{ flex: 1, overflow: "hidden", minHeight: 0, display: activeTab === "dashboard" ? "flex" : "none" }}>

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <div style={{ width: "240px", flexShrink: 0, background: C.bgDeep, borderRight: `4px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: `3px solid ${C.border}`, flexShrink: 0 }}>
            <p style={{ fontSize: "8px", color: C.text, letterSpacing: "2px" }}>PATIENTS</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {patients.length === 0 && (
              <p style={{ fontSize: "7px", color: C.muted, textAlign: "center", marginTop: "20px", lineHeight: "2.4" }}>
                NO PATIENTS YET.
              </p>
            )}
            {patients.map(p => (
              <div
                key={p.id}
                onClick={() => selectPatient(p.id)}
                className="px-btn"
                style={{
                  background: selectedId === p.id ? C.bg : C.bgDark,
                  border: `3px solid ${selectedId === p.id ? C.gold : C.border}`,
                  boxShadow: selectedId === p.id ? `3px 3px 0 ${C.gold}` : "none",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  cursor: "pointer",
                }}
              >
                <p style={{ fontSize: "8px", color: C.text, marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </p>
                <p style={{ fontSize: "6px", color: C.muted, marginBottom: "4px" }}>AGE {p.age}</p>
                {p.status === "loading"    && <p style={{ fontSize: "6px", color: C.goldBrt }}>◆ ANALYZING...</p>}
                {p.status === "done" && p.summaryStatus === "loading" && <p style={{ fontSize: "6px", color: C.goldBrt }}>◆ GENERATING NOTE...</p>}
                {p.status === "done" && p.summaryStatus === "done"    && <p style={{ fontSize: "6px", color: C.green }}>✔ READY</p>}
                {p.status === "done" && p.summaryStatus === "idle"    && <p style={{ fontSize: "6px", color: C.muted }}>— PENDING</p>}
                {p.status === "error"      && <p style={{ fontSize: "6px", color: C.red }}>✖ ERROR</p>}
              </div>
            ))}
          </div>

          <div style={{ padding: "12px", borderTop: `3px solid ${C.border}`, flexShrink: 0 }}>
            <button
              className="px-btn"
              style={{ ...btnStyle("primary"), width: "100%", textAlign: "center" }}
              onClick={() => setShowAdd(true)}
            >
              + ADD PATIENT
            </button>
          </div>
        </div>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>

          {!selected && (
            <div style={{ ...panelStyle({ borderStyle: "dashed" }), maxWidth: 600, margin: "60px auto" }}>
              <div style={{ padding: "50px 30px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🩺</div>
                <p style={{ fontSize: "9px", color: C.muted, lineHeight: "2.8" }}>
                  SELECT A PATIENT FROM THE LEFT<br />OR ADD A NEW ONE TO BEGIN
                </p>
              </div>
            </div>
          )}

          {selected?.status === "loading" && (
            <div style={{ ...panelStyle(), maxWidth: 700, margin: "0 auto" }}>
              <div style={hdrStyle()}>
                <span className="spin" style={{ fontSize: "14px", color: C.goldBrt }}>⟳</span>
                <span style={{ fontSize: "9px", color: C.text }}>ANALYZING PATIENT...</span>
              </div>
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <p style={{ fontSize: "8px", color: C.muted, lineHeight: "2.8" }}>
                  RUNNING TREATMENT ANALYSIS...<br />
                  GENERATING HABIT COACHING...<br />
                  CHECKING INSURANCE COVERAGE...<br />
                  SYNTHESIZING CLINICAL SUMMARY...
                </p>
              </div>
            </div>
          )}

          {selected?.status === "error" && (
            <div style={{ ...panelStyle({ borderColor: C.red }), maxWidth: 700, margin: "0 auto" }}>
              <div style={{ ...hdrStyle(C.red + "33"), borderBottomColor: C.red }}>
                <span style={{ fontSize: "10px", color: C.red }}>✖ ANALYSIS FAILED</span>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: "8px", color: C.red, lineHeight: "2.4" }}>{selected.error}</p>
              </div>
            </div>
          )}

          {selected?.status === "done" && selected.result && (() => {
            const r = selected.result;
            const timeline = r.timeline;
            const stage = timeline[sliderIdx] ?? timeline[0];

            const imgSrc = stage.image_b64
              ? `data:image/jpeg;base64,${stage.image_b64}`
              : (stage.image_url ?? "");

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                {/* Patient header */}
                <div style={panelStyle()}>
                  <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: "12px", color: C.text, marginBottom: "6px" }}>{selected.name}</p>
                      <p style={{ fontSize: "7px", color: C.muted, lineHeight: "2.2" }}>
                        AGE {selected.age} &nbsp;◆&nbsp; {selected.chief_complaint.toUpperCase()}
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 22 }}>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "6px", color: C.muted, marginBottom: "4px" }}>SEVERITY</p>
                        <p style={{ fontSize: "9px", color: r.analysis.severity === "severe" ? C.red : r.analysis.severity === "mild" ? C.green : C.gold }}>
                          {r.analysis.severity.toUpperCase()}
                        </p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "6px", color: C.muted, marginBottom: "4px" }}>DURATION</p>
                        <p style={{ fontSize: "9px", color: C.text }}>{r.analysis.estimated_months} MO</p>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: "6px", color: C.muted, marginBottom: "4px" }}>BRACES</p>
                        <p style={{ fontSize: "9px", color: r.analysis.suitable_for_braces ? C.green : C.red }}>
                          {r.analysis.suitable_for_braces ? "YES" : "NO"}
                        </p>
                      </div>
                      {r.analysis.cavities_detected && (
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: "6px", color: C.muted, marginBottom: "4px" }}>CAVITIES</p>
                          <p style={{ fontSize: "9px", color: C.red }}>DETECTED</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Two-column: timeline + clinical note */}
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>

                  {/* Timeline */}
                  <div style={{ ...panelStyle(), flex: "0 0 380px", display: "flex", flexDirection: "column" }}>
                    <div style={hdrStyle()}>
                      <span style={{ fontSize: "9px", color: C.text }}>[ TREATMENT TIMELINE ]</span>
                    </div>
                    <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "8px", color: C.gold }}>{stage.label.toUpperCase()}</p>
                        <p style={{ fontSize: "7px", color: C.muted }}>{stage.month === 0 ? "TODAY" : `MONTH ${stage.month}`}</p>
                      </div>
                      {/* Image viewer */}
                      <div style={{ position: "relative", width: "100%", paddingBottom: "75%", background: C.bgDark, border: `3px solid ${C.border}` }}>
                        {timeline.map((s, i) => {
                          const src = s.image_b64
                            ? `data:image/jpeg;base64,${s.image_b64}`
                            : (s.image_url ?? "");
                          return (
                            <img
                              key={i}
                              src={src}
                              alt={s.label}
                              style={{
                                position: "absolute", inset: 0, width: "100%", height: "100%",
                                objectFit: "cover",
                                opacity: i === sliderIdx ? 1 : 0,
                                transition: "opacity 200ms",
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* Slider */}
                      <input
                        type="range"
                        min={0}
                        max={timeline.length - 1}
                        value={sliderIdx}
                        onChange={e => setSliderIdx(Number(e.target.value))}
                        style={{ width: "100%" }}
                      />
                      {/* Stage dots */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {timeline.map((s, i) => (
                          <div key={i} onClick={() => setSliderIdx(i)} style={{ cursor: "pointer", textAlign: "center" }}>
                            <div style={{
                              width: 10, height: 10, margin: "0 auto 4px",
                              background: i === sliderIdx ? C.gold : C.bgDeep,
                              border: `2px solid ${C.border}`,
                            }} />
                            <p style={{ fontSize: "5px", color: i === sliderIdx ? C.text : C.muted, whiteSpace: "nowrap" }}>
                              {s.month === 0 ? "NOW" : `M${s.month}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clinical note */}
                  <div style={{ ...panelStyle(), flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                    <div style={hdrStyle()}>
                      <span style={{ fontSize: "9px", color: C.text }}>[ CLINICAL NOTE ]</span>
                      {selected.summaryStatus === "loading" && (
                        <span className="spin" style={{ marginLeft: "auto", fontSize: "12px", color: C.goldBrt }}>⟳</span>
                      )}
                    </div>
                    <div style={{ padding: "16px 18px", overflowY: "auto", maxHeight: "520px" }}>
                      {selected.summaryStatus === "loading" && (
                        <p style={{ fontSize: "7px", color: C.muted, lineHeight: "2.6" }}>
                          GENERATING CLINICAL SUMMARY...
                        </p>
                      )}
                      {selected.summaryStatus === "error" && (
                        <p style={{ fontSize: "7px", color: C.red, lineHeight: "2.6" }}>
                          FAILED TO GENERATE SUMMARY.
                        </p>
                      )}
                      {(selected.summaryStatus === "done" || selected.summaryStatus === "idle") && r.summary && renderSummary(r.summary)}
                      {selected.summaryStatus === "idle" && !r.summary && (
                        <p style={{ fontSize: "7px", color: C.muted, lineHeight: "2.6" }}>SELECT PATIENT TO GENERATE NOTE.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Observations strip */}
                {r.analysis.issues.length > 0 && (
                  <div style={panelStyle()}>
                    <div style={hdrStyle()}>
                      <span style={{ fontSize: "9px", color: C.text }}>[ CLINICAL OBSERVATIONS ]</span>
                    </div>
                    <div style={{ padding: "12px 16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {r.analysis.issues.map((issue, i) => (
                        <span key={i} style={{ fontSize: "7px", background: C.bgDark, border: `2px solid ${C.border}`, padding: "5px 10px", color: C.text }}>
                          {issue}
                        </span>
                      ))}
                      {r.analysis.cavity_notes && (
                        <span style={{ fontSize: "7px", background: C.red + "22", border: `2px solid ${C.red}`, padding: "5px 10px", color: C.red }}>
                          ⚠ {r.analysis.cavity_notes}
                        </span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Add Patient Modal ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div style={panelStyle({ width: "min(92vw, 520px)" })}>
            <div style={hdrStyle()}>
              <span style={{ fontSize: "10px", color: C.text }}>[ ADD NEW PATIENT ]</span>
              <button className="px-btn" style={{ ...btnStyle("secondary"), marginLeft: "auto", padding: "6px 10px" }} onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <p style={{ fontSize: "7px", color: C.muted, marginBottom: "8px", letterSpacing: "2px" }}>TEETH PHOTO</p>
                <div
                  style={{ border: `3px dashed ${C.border}`, background: C.bgDark, padding: "16px", textAlign: "center", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 80 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {formPreview
                    ? <img src={formPreview} alt="preview" style={{ height: 64, border: `2px solid ${C.border}` }} />
                    : <p style={{ fontSize: "8px", color: C.muted, lineHeight: "2.2" }}>CLICK TO UPLOAD<br />TEETH PHOTO</p>
                  }
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickFile} />
              </div>
              <div>
                <p style={{ fontSize: "7px", color: C.muted, marginBottom: "6px", letterSpacing: "2px" }}>PATIENT NAME</p>
                <input style={inputStyle} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <p style={{ fontSize: "7px", color: C.muted, marginBottom: "6px", letterSpacing: "2px" }}>AGE</p>
                <input style={inputStyle} type="number" min={1} max={120} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="Age" />
              </div>
              <div>
                <p style={{ fontSize: "7px", color: C.muted, marginBottom: "6px", letterSpacing: "2px" }}>CHIEF COMPLAINT</p>
                <input style={inputStyle} type="text" value={form.complaint} onChange={e => setForm(f => ({ ...f, complaint: e.target.value }))} placeholder="e.g. crooked teeth, pain" />
              </div>
              {formError && <p style={{ fontSize: "7px", color: C.red }}>{formError}</p>}
              <button className="px-btn" style={{ ...btnStyle("primary"), width: "100%", textAlign: "center", padding: "14px" }} onClick={submitPatient}>
                ▶ ANALYZE PATIENT
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
