"use client";

import { useEffect, useCallback, useState } from "react";

/* ─── Style constants ─── */
const FONT = "'Press Start 2P', monospace";

const C = {
    bg:     "#C8DCC0",
    bgDark: "#A8C0A0",
    border: "#4A6B4A",
    text:   "#2A3D2A",
    muted:  "#5A7A5A",
    active: "#3D5A3D",
};

/* ─── Types ─── */
type CoachStep = "greeting" | "medication" | "analyzing" | "results";

const MEDICATIONS = [
    "Acetaminophen (e.g., Tylenol)",
    "Topical Oral Anesthetics (e.g., Orajel, Anbesol)",
    "Orthodontic Relief Wax",
    "High-Concentration Fluoride (e.g., Prevident)",
    "Chlorhexidine Gluconate (e.g., Peridex)",
    "Triamcinolone Acetonide (e.g., Kenalog in Orabase)",
];

interface HabitCoachPromptProps {
    isOpen: boolean;
    onClose: (medications: string[]) => void;
    onAnalyze?: (medications: string[]) => void;
    analysisResult?: string | null;
    isLoading?: boolean;
}

/* ─── Bouncing Dots ─── */
function PixelDots() {
    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="inline-block"
                    style={{
                        width: "10px", height: "10px",
                        backgroundColor: C.muted,
                        animation: `pixelBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Shared button style ─── */
function PanelButton({ onClick, children, fullWidth = true }: {
    onClick: () => void;
    children: React.ReactNode;
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
                boxShadow: `0 3px 0 ${C.active}, inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
        >
            {children}
        </button>
    );
}

/* ─── Main Component ─── */
export function HabitCoachPrompt({
    isOpen,
    onClose,
    onAnalyze,
    analysisResult,
    isLoading = false,
}: HabitCoachPromptProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState<CoachStep>("greeting");
    const [selectedMedications, setSelectedMedications] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setStep("greeting");
            setSelectedMedications([]);
            const id = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setIsVisible(false);
    }, [isOpen]);

    useEffect(() => {
        if (analysisResult && (step === "analyzing" || step === "medication")) setStep("results");
    }, [analysisResult, step]);

    useEffect(() => {
        if (isLoading && (step === "greeting" || step === "medication")) setStep("analyzing");
    }, [isLoading, step]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => { if (e.key === "Escape") onClose(selectedMedications); },
        [onClose, selectedMedications],
    );
    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const toggleMedication = (med: string) =>
        setSelectedMedications((prev) =>
            prev.includes(med) ? prev.filter((m) => m !== med) : [...prev, med],
        );

    if (!isOpen) return null;

    return (
        <>
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes pixelBounce   { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-12px)} }
        @keyframes pixelPulse    { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes blink         { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes progressSlide { 0%{transform:translateX(-100%)} 70%{transform:translateX(260%)} 100%{transform:translateX(260%)} }
        .habit-blink { animation: blink 1s step-end infinite; }
        .habit-scroll::-webkit-scrollbar { width: 10px; }
        .habit-scroll::-webkit-scrollbar-track { background: ${C.bgDark}; border-left: 3px solid ${C.border}; }
        .habit-scroll::-webkit-scrollbar-thumb { background: ${C.muted}; border: 2px solid ${C.border}; }
      `}</style>

            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
                style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
                onClick={() => onClose(selectedMedications)}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"}`}
                >
                    {/* Panel */}
                    <div style={{
                        width: "480px",
                        maxWidth: "94vw",
                        background: C.bg,
                        border: `4px solid ${C.border}`,
                        boxShadow: `8px 8px 0 ${C.border}`,
                        overflow: "hidden",
                    }}>
                        {/* Header bar */}
                        <div style={{
                            background: C.bgDark,
                            borderBottom: `4px solid ${C.border}`,
                            padding: "14px 20px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                        }}>
                            <span style={{ fontSize: 24 }}>🪥</span>
                            <span style={{ fontFamily: FONT, fontSize: "12px", color: C.text, letterSpacing: "2px" }}>
                                [ HABIT COACH ]
                            </span>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => onClose(selectedMedications)}
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
                        <div className="habit-scroll" style={{
                            padding: "20px",
                            background: C.bgDark,
                            maxHeight: "70vh",
                            overflowY: "auto",
                            borderBottom: `2px solid ${C.border}`,
                        }}>
                            <div style={{
                                background: C.bg,
                                border: `3px solid ${C.border}`,
                                padding: "20px 18px",
                            }}>

                                {/* ── Greeting ── */}
                                {step === "greeting" && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.text, marginBottom: "12px" }}>
                                            Hey there! I&apos;m your Habit Coach! 🦷
                                        </p>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.muted, marginBottom: "20px" }}>
                                            Let&apos;s see what we can do to improve your smile based on your dental scan!
                                        </p>
                                        <div className="flex gap-4">
                                            <PanelButton onClick={() => setStep("medication")} fullWidth={false}>LET&apos;S GO!</PanelButton>
                                            <PanelButton onClick={() => onClose(selectedMedications)} fullWidth={false}>NOT NOW</PanelButton>
                                        </div>
                                    </>
                                )}

                                {/* ── Medication checklist ── */}
                                {step === "medication" && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "9px", lineHeight: "20px", color: C.text, textAlign: "center", marginBottom: "16px" }}>
                                            Do you take any of these medications?
                                        </p>
                                        <div className="habit-scroll space-y-3" style={{
                                            maxHeight: "260px", overflowY: "auto", marginBottom: "16px",
                                        }}>
                                            {MEDICATIONS.map((med) => (
                                                <label
                                                    key={med}
                                                    className="flex cursor-pointer items-start gap-4 transition-colors hover:bg-white/10"
                                                    onClick={() => toggleMedication(med)}
                                                >
                                                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center" style={{
                                                        backgroundColor: selectedMedications.includes(med) ? C.muted : "#E8F0E8",
                                                        border: `2px solid ${C.border}`,
                                                    }}>
                                                        {selectedMedications.includes(med) && (
                                                            <span style={{ color: "white", fontSize: "10px", fontWeight: "bold" }}>✓</span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontFamily: FONT, fontSize: "8px", lineHeight: "16px", color: C.text, userSelect: "none" }}>
                                                        {med}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <PanelButton onClick={() => { setStep("analyzing"); onAnalyze?.(selectedMedications); }}>
                                            DONE
                                        </PanelButton>
                                    </>
                                )}

                                {/* ── Analyzing ── */}
                                {step === "analyzing" && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "22px", color: C.text, textAlign: "center" }}>
                                            Analyzing your smile...
                                        </p>
                                        <PixelDots />
                                        <p style={{ fontFamily: FONT, fontSize: "8px", lineHeight: "18px", color: C.muted, textAlign: "center", animation: "pixelPulse 2s ease-in-out infinite" }}>
                                            Checking dental habits...
                                        </p>
                                        <div className="mx-auto mt-4" style={{ width: "80%", height: "10px", backgroundColor: C.bgDark, border: `2px solid ${C.border}`, overflow: "hidden" }}>
                                            <div style={{ height: "100%", backgroundColor: C.active, animation: "progressSlide 2.4s linear infinite", width: "40%" }} />
                                        </div>
                                    </>
                                )}

                                {/* ── Results ── */}
                                {step === "results" && analysisResult && (
                                    <>
                                        <p style={{ fontFamily: FONT, fontSize: "10px", lineHeight: "20px", color: C.text, marginBottom: "12px" }}>
                                            Here&apos;s what I found:
                                        </p>
                                        <div className="habit-scroll" style={{ fontFamily: FONT, fontSize: "9px", lineHeight: "20px", color: C.muted, whiteSpace: "pre-wrap", maxHeight: "240px", overflowY: "auto", marginBottom: "16px" }}>
                                            {analysisResult}
                                        </div>
                                        <PanelButton onClick={() => onClose(selectedMedications)}>GOT IT!</PanelButton>
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
                            <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted }}>V1.0.0-BETA</span>
                            <span className="habit-blink" style={{ fontFamily: FONT, fontSize: "7px", color: C.active }}>SYSTEM ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─── Hook ─── */
export function useHabitCoachPrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const openHabitCoach  = useCallback(() => { setAnalysisResult(null); setIsLoading(false); setIsOpen(true); }, []);
    const closeHabitCoach = useCallback(() => setIsOpen(false), []);

    const startAnalysis = useCallback(async (analysisFn: () => Promise<string>) => {
        setIsLoading(true);
        try {
            setAnalysisResult(await analysisFn());
        } catch {
            setAnalysisResult("⚠ Analysis failed. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isOpen, isLoading, analysisResult, openHabitCoach, closeHabitCoach, startAnalysis, setAnalysisResult };
}
