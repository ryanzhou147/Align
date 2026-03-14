"use client";

import { useEffect, useCallback, useState } from "react";

/* ─── Style constants ─── */
const FONT = "'Press Start 2P', monospace";

const C = {
    bg:     "#EBD9BE",
    bgDark: "#D4B896",
    border: "#6B4E2A",
    text:   "#4A3520",
    muted:  "#8B6914",
    active: "#6B4E2A",
};

/* ─── Types ─── */
type SunlifeStep = "greeting" | "analyzing" | "results" | "cost_viz";

interface CostScenario {
    label: string;
    months: number;
    treatment_cost: number;
    premium_total: number;
    insurance_payment: number;
    user_payment: number;
}

interface SunlifePromptProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (question: string) => void;
    analysisResult?: string | null;
    sourceUrl?: string | null;
    isLoading?: boolean;
    treatmentMonths?: number;
    severity?: string;
}

/* ─── Plan data (mirrored from backend) ─── */
const SUNLIFE_PLANS: Record<string, { ortho_pct: number; ortho_max: number; monthly_premium: number }> = {
    "PHI Basic":    { ortho_pct: 0,  ortho_max: 0,    monthly_premium: 45  },
    "PHI Standard": { ortho_pct: 0,  ortho_max: 0,    monthly_premium: 73  },
    "PHI Enhanced": { ortho_pct: 60, ortho_max: 1500, monthly_premium: 119 },
};
const PLAN_NAMES = ["PHI Basic", "PHI Standard", "PHI Enhanced"] as const;
const MONTHLY_RATES: Record<string, number> = { mild: 280, moderate: 350, severe: 420 };
const DELAY_SCENARIOS = [
    { extra: 0,  label: "Start Now"   },
    { extra: 6,  label: "2 Yr Delay"  },
    { extra: 12, label: "5 Yr Delay"  },
];

function computeScenarios(treatmentMonths: number, severity: string, planName: string): CostScenario[] {
    const plan = SUNLIFE_PLANS[planName] ?? SUNLIFE_PLANS["PHI Enhanced"];
    const rate = MONTHLY_RATES[severity.toLowerCase()] ?? 350;
    return DELAY_SCENARIOS.map(({ extra, label }) => {
        const months            = treatmentMonths + extra;
        const treatment_cost    = Math.round(months * rate);
        const insurance_payment = Math.round(Math.min((plan.ortho_pct / 100) * treatment_cost, plan.ortho_max));
        const premium_total     = plan.monthly_premium * months;
        return { label, months, treatment_cost, premium_total, insurance_payment, user_payment: treatment_cost - insurance_payment + premium_total };
    });
}

/* ─── Shared button ─── */
function PanelButton({ onClick, children, style, fullWidth = true }: {
    onClick: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
    fullWidth?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`${fullWidth ? "w-full" : "flex-1"} transition-all duration-150 hover:brightness-95 active:translate-y-[1px]`}
            style={{
                backgroundColor: C.bg,
                border: `3px solid ${C.border}`,
                padding: "12px 0",
                fontFamily: FONT,
                fontSize: "11px",
                color: C.text,
                cursor: "pointer",
                boxShadow: `0 3px 0 ${C.active}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                ...style,
            }}
        >
            {children}
        </button>
    );
}

/* ─── Bouncing dots ─── */
function PixelDots() {
    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {[0, 1, 2].map((i) => (
                <span key={i} className="inline-block" style={{
                    width: "10px", height: "10px",
                    backgroundColor: C.muted,
                    animation: `pixelBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
            ))}
        </div>
    );
}

/* ─── Stacked bar chart ─── */
function StackedBars({ scenarios, treatmentMonths, severity }: {
    scenarios: CostScenario[];
    treatmentMonths: number;
    severity: string;
}) {
    const maxTotal    = Math.max(...scenarios.map((s) => s.user_payment + s.insurance_payment));
    const BAR_H       = 190;
    const BAR_W       = 130;
    const [downloading, setDownloading] = useState(false);

    const handleExcel = async () => {
        setDownloading(true);
        try {
            const params = new URLSearchParams({ treatment_months: String(treatmentMonths), severity });
            const res  = await fetch(`http://localhost:8000/agents/financial/cost-scenarios/excel?${params}`);
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url;
            a.download = `sunlife_costs_${treatmentMonths}mo_${severity}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div>
            {/* Legend */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginBottom: "14px" }}>
                {[
                    { color: "#7BAE7F", border: "#4A7A4A", label: "Insurance" },
                    { color: "#C4834A", border: "#8B5E3C", label: "Your Cost" },
                ].map(({ color, border, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "12px", height: "12px", backgroundColor: color, border: `2px solid ${border}` }} />
                        <span style={{ fontFamily: FONT, fontSize: "7px", color: C.text }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Bars */}
            <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", height: `${BAR_H}px`, justifyContent: "center" }}>
                {scenarios.map((s) => {
                    const grandTotal = s.user_payment + s.insurance_payment;
                    const totalPx    = maxTotal > 0 ? (grandTotal / maxTotal) * BAR_H : 0;
                    const insPx      = grandTotal > 0 ? (s.insurance_payment / grandTotal) * totalPx : 0;
                    const userPx     = totalPx - insPx;
                    return (
                        <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", width: `${BAR_W}px` }}>
                            <div style={{ height: `${userPx}px`, backgroundColor: "#C4834A", border: "2px solid #8B5E3C", borderBottom: insPx > 0 ? "none" : "2px solid #8B5E3C", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {userPx >= 22 && <span style={{ fontFamily: FONT, fontSize: "8px", color: "#fff", textAlign: "center", lineHeight: "12px" }}>${s.user_payment.toLocaleString()}</span>}
                            </div>
                            <div style={{ height: `${insPx}px`, backgroundColor: "#7BAE7F", border: insPx > 0 ? "2px solid #4A7A4A" : "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {insPx >= 18 && <span style={{ fontFamily: FONT, fontSize: "8px", color: "#fff", textAlign: "center", lineHeight: "12px" }}>${s.insurance_payment.toLocaleString()}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* X-axis labels */}
            <div style={{ display: "flex", gap: "24px", marginTop: "8px", justifyContent: "center" }}>
                {scenarios.map((s) => (
                    <div key={s.label} style={{ width: `${BAR_W}px`, textAlign: "center" }}>
                        <span style={{ fontFamily: FONT, fontSize: "7px", color: C.text, lineHeight: "14px" }}>{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Total labels */}
            <div style={{ display: "flex", gap: "24px", marginTop: "4px", justifyContent: "center" }}>
                {scenarios.map((s) => (
                    <div key={s.label} style={{ width: `${BAR_W}px`, textAlign: "center" }}>
                        <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted }}>${s.user_payment.toLocaleString()}</span>
                    </div>
                ))}
            </div>

            <p style={{ fontFamily: FONT, fontSize: "6px", color: C.muted, textAlign: "center", marginTop: "8px", lineHeight: "12px" }}>
                Includes plan premiums
            </p>

            {/* Excel export */}
            <button
                onClick={handleExcel}
                disabled={downloading}
                className="transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                style={{
                    marginTop: "12px", width: "100%", padding: "11px 0",
                    backgroundColor: downloading ? "#A8C0A0" : "#7BAE7F",
                    border: "3px solid #4A7A4A",
                    fontFamily: FONT, fontSize: "9px", color: "#1A3A1A",
                    cursor: downloading ? "wait" : "pointer",
                    boxShadow: "0 3px 0 #4A7A4A, inset 0 1px 0 rgba(255,255,255,0.3)",
                    letterSpacing: "0.5px",
                }}
            >
                {downloading ? "GENERATING..." : "EXPORT TO EXCEL"}
            </button>
        </div>
    );
}

/* ─── Source link ─── */
function SourceLink({ url }: { url: string }) {
    return (
        <div style={{ borderTop: `2px solid ${C.border}`, paddingTop: "10px", marginTop: "12px" }}>
            <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted, marginRight: "6px" }}>SOURCE:</span>
            <span
                onClick={() => window.open(url, "SunLifeSource", `width=800,height=600,left=${(screen.width - 800) / 2},top=${(screen.height - 600) / 2},menubar=no,toolbar=no`)}
                style={{ fontFamily: FONT, fontSize: "7px", color: C.muted, textDecoration: "underline", cursor: "pointer", wordBreak: "break-all", lineHeight: "14px" }}
            >
                {url}
            </span>
        </div>
    );
}

/* ─── Component ─── */
export function SunlifePrompt({
    isOpen,
    onClose,
    onAnalyze,
    analysisResult,
    sourceUrl,
    isLoading = false,
    treatmentMonths = 18,
    severity = "moderate",
}: SunlifePromptProps) {
    const [isVisible,    setIsVisible]    = useState(false);
    const [step,         setStep]         = useState<SunlifeStep>("greeting");
    const [selectedPlan, setSelectedPlan] = useState("PHI Enhanced");

    const scenarios = computeScenarios(treatmentMonths, severity, selectedPlan);

    useEffect(() => {
        if (isOpen) {
            setStep("greeting");
            setSelectedPlan("PHI Enhanced");
            const id = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setIsVisible(false);
    }, [isOpen]);

    useEffect(() => {
        if (isLoading && step === "greeting") setStep("analyzing");
    }, [isLoading, step]);

    useEffect(() => {
        if (analysisResult && (step === "analyzing" || step === "greeting")) setStep("results");
    }, [analysisResult, step]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
        [onClose],
    );
    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const headerTitle = step === "cost_viz" ? "[ COST BREAKDOWN ]" : "[ FINANCIAL AGENT ]";
    const panelWidth  = step === "cost_viz" ? "580px" : "500px";

    return (
        <>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes pixelBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-12px)} }
        @keyframes pixelPulse  { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        .sunlife-blink  { animation: blink 1s step-end infinite; }
        .sunlife-scroll::-webkit-scrollbar { width: 10px; }
        .sunlife-scroll::-webkit-scrollbar-track { background: ${C.bgDark}; border-left: 3px solid ${C.border}; }
        .sunlife-scroll::-webkit-scrollbar-thumb { background: ${C.muted}; border: 2px solid ${C.border}; }
      `}</style>

            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
                style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
                onClick={onClose}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"}`}
                >
                    {/* Panel */}
                    <div style={{
                        width: panelWidth,
                        maxWidth: "94vw",
                        background: C.bg,
                        border: `4px solid ${C.border}`,
                        boxShadow: `8px 8px 0 ${C.border}`,
                        overflow: "hidden",
                        transition: "width 0.3s ease",
                    }}>
                        {/* Header bar */}
                        <div style={{
                            background: C.bgDark,
                            borderBottom: `4px solid ${C.border}`,
                            padding: "14px 20px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                        }}>
                            <img src="/sunlife-logo.png" alt="Sun Life" style={{ width: "28px", height: "auto" }} />
                            <span style={{ fontFamily: FONT, fontSize: "12px", color: C.text, letterSpacing: "2px" }}>
                                {headerTitle}
                            </span>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center transition-transform hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: C.bg,
                                border: `4px solid ${C.border}`,
                                boxShadow: `3px 3px 0 ${C.border}`,
                                color: C.text,
                                fontWeight: 900,
                                fontSize: "18px",
                                fontFamily: "monospace",
                                lineHeight: 1,
                                cursor: "pointer",
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        {/* Scrollable content */}
                        <div className="sunlife-scroll" style={{
                            padding: "16px",
                            background: C.bgDark,
                            maxHeight: "75vh",
                            overflowY: "auto",
                            borderBottom: `2px solid ${C.border}`,
                        }}>
                            <div style={{ background: C.bg, border: `3px solid ${C.border}`, padding: "20px 18px" }}>

                                {/* ── Greeting ── */}
                                {step === "greeting" && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.text, marginBottom: "12px" }}>
                                            Hi there! I can help you find the best Sun Life insurance plan for your treatment.
                                        </p>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.muted, marginBottom: "20px" }}>
                                            Would you like me to analyze live coverage data for you?
                                        </p>
                                        <div className="flex gap-4">
                                            <PanelButton onClick={() => onAnalyze("Does Sun Life cover braces?")} fullWidth={false}>ANALYZE</PanelButton>
                                            <PanelButton onClick={onClose} fullWidth={false}>NOT NOW</PanelButton>
                                        </div>
                                    </>
                                )}

                                {/* ── Analyzing ── */}
                                {step === "analyzing" && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.text, textAlign: "center" }}>
                                            Scraping Sun Life data...
                                        </p>
                                        <PixelDots />
                                        <p style={{ fontFamily: FONT, fontSize: "8px", lineHeight: "18px", color: C.muted, textAlign: "center", animation: "pixelPulse 2s ease-in-out infinite" }}>
                                            Consulting with Gemini Agent...
                                        </p>
                                    </>
                                )}

                                {/* ── Results ── */}
                                {step === "results" && analysisResult && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "20px", color: C.text, marginBottom: "12px" }}>
                                            Recommendation:
                                        </p>
                                        <div className="sunlife-scroll" style={{ fontFamily: FONT, fontSize: "9px", lineHeight: "20px", color: C.muted, whiteSpace: "pre-wrap", maxHeight: "240px", overflowY: "auto", marginBottom: "16px" }}>
                                            {analysisResult}
                                        </div>
                                        {sourceUrl && <SourceLink url={sourceUrl} />}
                                        <div className="flex gap-3 mt-4">
                                            <PanelButton
                                                onClick={() => setStep("cost_viz")}
                                                fullWidth={false}
                                                style={{ backgroundColor: "#C4834A", borderColor: "#8B5E3C", boxShadow: "0 3px 0 #6B3E22, inset 0 1px 0 rgba(255,255,255,0.3)" }}
                                            >
                                                COST CHART
                                            </PanelButton>
                                            <PanelButton onClick={onClose} fullWidth={false}>GOT IT!</PanelButton>
                                        </div>
                                    </>
                                )}

                                {/* ── Cost visualization ── */}
                                {step === "cost_viz" && (
                                    <>
                                        {/* Plan selector */}
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                                            {PLAN_NAMES.map((name) => (
                                                <button
                                                    key={name}
                                                    onClick={() => setSelectedPlan(name)}
                                                    style={{
                                                        padding: "7px 10px",
                                                        fontFamily: FONT, fontSize: "7px",
                                                        color: selectedPlan === name ? "#fff" : C.text,
                                                        backgroundColor: selectedPlan === name ? C.border : C.bg,
                                                        border: `2px solid ${selectedPlan === name ? C.active : C.border}`,
                                                        cursor: "pointer",
                                                        transition: "all 0.15s",
                                                    }}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Treatment info badge */}
                                        <p style={{ fontFamily: FONT, fontSize: "7px", color: C.muted, textAlign: "center", marginBottom: "14px" }}>
                                            {treatmentMonths}mo · {severity} severity
                                        </p>

                                        <StackedBars scenarios={scenarios} treatmentMonths={treatmentMonths} severity={severity} />

                                        {sourceUrl && <SourceLink url={sourceUrl} />}

                                        <div style={{ marginTop: "14px" }}>
                                            <PanelButton onClick={() => setStep("results")}>← BACK</PanelButton>
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>

                        {/* Footer bar */}
                        <div style={{
                            padding: "10px 16px",
                            background: C.bgDark,
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted }}>V1.0.4-BETA</span>
                            <span className="sunlife-blink" style={{ fontFamily: FONT, fontSize: "7px", color: C.active }}>SYSTEM ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─── Hook ─── */
export function useSunlifePrompt(config?: { treatmentMonths?: number; severity?: string }) {
    const treatmentMonths = config?.treatmentMonths ?? 18;
    const severity        = config?.severity ?? "moderate";

    const [isOpen,         setIsOpen]         = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [sourceUrl,      setSourceUrl]      = useState<string | null>(null);
    const [isLoading,      setIsLoading]      = useState(false);

    const openSunlife  = useCallback(() => { setAnalysisResult(null); setSourceUrl(null); setIsLoading(false); setIsOpen(true); }, []);
    const closeSunlife = useCallback(() => setIsOpen(false), []);

    const startAnalysis = useCallback(async (analysisFn: () => Promise<{ recommendation: string; source: string }>) => {
        setIsLoading(true);
        try {
            const { recommendation, source } = await analysisFn();
            setAnalysisResult(recommendation);
            setSourceUrl(source);
        } catch {
            setAnalysisResult("⚠ Coverage analysis failed. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isOpen, isLoading, analysisResult, sourceUrl, openSunlife, closeSunlife, startAnalysis, treatmentMonths, severity };
}
