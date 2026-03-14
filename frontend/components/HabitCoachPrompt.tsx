"use client";

import { useEffect, useCallback, useState } from "react";

/* ─── Types ─── */
type CoachStep = "greeting" | "analyzing" | "results";

interface HabitCoachPromptProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when user clicks "Let's Go!" — pass in your image data or URL */
    onAnalyze?: () => void;
    /** Pass Gemini analysis results here when ready */
    analysisResult?: string | null;
    /** Set true while waiting for Gemini response */
    isLoading?: boolean;
}

/* ─── Bouncing Dots Animation ─── */
function PixelDots() {
    return (
        <div className="flex items-center justify-center gap-2 py-4">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="inline-block rounded-sm"
                    style={{
                        width: "10px",
                        height: "10px",
                        backgroundColor: "#5A7A5A",
                        animation: `pixelBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Tooth Icon (pixel style) ─── */
function ToothIcon() {
    return (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
                d="M10 8C10 4 14 2 18 2C22 2 26 4 26 8C26 14 28 18 26 24C24 30 22 34 20 34C18 34 18 28 18 28C18 28 18 34 16 34C14 34 12 30 10 24C8 18 10 14 10 8Z"
                fill="#E8F0E8"
                stroke="#5A7A5A"
                strokeWidth="2"
            />
            <path
                d="M14 10C14 10 18 12 22 10"
                stroke="#5A7A5A"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
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

    // Animate in
    useEffect(() => {
        if (isOpen) {
            setStep("greeting");
            const id = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setIsVisible(false);
    }, [isOpen]);

    // Move to results when analysis arrives
    useEffect(() => {
        if (analysisResult && step === "analyzing") {
            setStep("results");
        }
    }, [analysisResult, step]);

    // Sync external loading state
    useEffect(() => {
        if (isLoading && step === "greeting") {
            setStep("analyzing");
        }
    }, [isLoading, step]);

    // ESC to close
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose],
    );

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const handleAnalyze = () => {
        setStep("analyzing");
        onAnalyze?.();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Keyframes for bouncing dots */}
            <style jsx global>{`
        @keyframes pixelBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
        }
        @keyframes pixelPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
                onClick={onClose}
            >
                {/* ── Outer wrapper ── */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"
                        }`}
                >
                    {/* Pixel shadow */}
                    <div
                        className="absolute inset-0 translate-x-1 translate-y-1"
                        style={{ backgroundColor: "#3D5A3D", borderRadius: "6px" }}
                    />

                    {/* Main panel */}
                    <div
                        className="relative"
                        style={{
                            width: "440px",
                            maxWidth: "92vw",
                            backgroundColor: "#A8C0A0",
                            border: "4px solid #4A6B4A",
                            borderRadius: "6px",
                            boxShadow: "inset 0 0 0 2px #B8D0B0, inset 0 0 0 4px #98B090",
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center transition-transform hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: "#7A9A72",
                                border: "3px solid #4A6B4A",
                                borderRadius: "4px",
                                boxShadow: "1px 2px 0 #3D5A3D",
                                color: "#2A3D2A",
                                fontWeight: 900,
                                fontSize: "16px",
                                fontFamily: "monospace",
                                lineHeight: 1,
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        {/* Inner content */}
                        <div className="px-7 pb-7 pt-6">
                            {/* Tooth icon */}
                            <div className="mb-1 flex justify-center">
                                <ToothIcon />
                            </div>

                            {/* Title */}
                            <h2
                                className="mb-5 text-center"
                                style={{
                                    fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                    fontSize: "12px",
                                    letterSpacing: "2px",
                                    color: "#2A3D2A",
                                    textShadow: "1px 1px 0 rgba(255,255,255,0.15)",
                                }}
                            >
                                HABIT COACH
                            </h2>

                            {/* ── Step: Greeting ── */}
                            {step === "greeting" && (
                                <>
                                    <div
                                        className="mb-6"
                                        style={{
                                            backgroundColor: "#C8DCC0",
                                            border: "3px solid #6B8B6B",
                                            borderRadius: "4px",
                                            padding: "16px 18px",
                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "10px",
                                                lineHeight: "22px",
                                                color: "#2A3D2A",
                                            }}
                                        >
                                            Hey there! I&apos;m your Habit Coach! 🦷
                                        </p>
                                        <p
                                            className="mt-3"
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "10px",
                                                lineHeight: "22px",
                                                color: "#3D5A3D",
                                            }}
                                        >
                                            Let&apos;s see what we can do to improve your smile based
                                            on your dental scan!
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleAnalyze}
                                            className="flex-1 transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                            style={{
                                                backgroundColor: "#C8DCC0",
                                                border: "3px solid #6B8B6B",
                                                borderRadius: "4px",
                                                padding: "12px 0",
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "11px",
                                                color: "#2A3D2A",
                                                cursor: "pointer",
                                                boxShadow:
                                                    "0 3px 0 #3D5A3D, inset 0 1px 0 rgba(255,255,255,0.25)",
                                            }}
                                        >
                                            LET&apos;S GO!
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="flex-1 transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                            style={{
                                                backgroundColor: "#C8DCC0",
                                                border: "3px solid #6B8B6B",
                                                borderRadius: "4px",
                                                padding: "12px 0",
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "11px",
                                                color: "#2A3D2A",
                                                cursor: "pointer",
                                                boxShadow:
                                                    "0 3px 0 #3D5A3D, inset 0 1px 0 rgba(255,255,255,0.25)",
                                            }}
                                        >
                                            NOT NOW
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── Step: Analyzing ── */}
                            {step === "analyzing" && (
                                <div
                                    style={{
                                        backgroundColor: "#C8DCC0",
                                        border: "3px solid #6B8B6B",
                                        borderRadius: "4px",
                                        padding: "24px 18px",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                                    }}
                                >
                                    <p
                                        className="text-center"
                                        style={{
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "10px",
                                            lineHeight: "22px",
                                            color: "#2A3D2A",
                                        }}
                                    >
                                        Analyzing your smile...
                                    </p>

                                    <PixelDots />

                                    <p
                                        className="text-center"
                                        style={{
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "8px",
                                            lineHeight: "18px",
                                            color: "#5A7A5A",
                                            animation: "pixelPulse 2s ease-in-out infinite",
                                        }}
                                    >
                                        Checking dental habits...
                                    </p>

                                    {/* Progress bar */}
                                    <div
                                        className="mx-auto mt-4"
                                        style={{
                                            width: "80%",
                                            height: "10px",
                                            backgroundColor: "#98B090",
                                            border: "2px solid #6B8B6B",
                                            borderRadius: "2px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                backgroundColor: "#4A6B4A",
                                                animation: "progressSlide 3s ease-in-out infinite",
                                                width: "60%",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Step: Results ── */}
                            {step === "results" && analysisResult && (
                                <>
                                    <div
                                        className="mb-6"
                                        style={{
                                            backgroundColor: "#C8DCC0",
                                            border: "3px solid #6B8B6B",
                                            borderRadius: "4px",
                                            padding: "16px 18px",
                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                                            maxHeight: "280px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        <p
                                            className="mb-3"
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "10px",
                                                lineHeight: "20px",
                                                color: "#2A3D2A",
                                            }}
                                        >
                                            Here&apos;s what I found:
                                        </p>
                                        <div
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "9px",
                                                lineHeight: "20px",
                                                color: "#3D5A3D",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {analysisResult}
                                        </div>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="w-full transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                        style={{
                                            backgroundColor: "#C8DCC0",
                                            border: "3px solid #6B8B6B",
                                            borderRadius: "4px",
                                            padding: "12px 0",
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "11px",
                                            color: "#2A3D2A",
                                            cursor: "pointer",
                                            boxShadow:
                                                "0 3px 0 #3D5A3D, inset 0 1px 0 rgba(255,255,255,0.25)",
                                        }}
                                    >
                                        GOT IT!
                                    </button>
                                </>
                            )}
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

    const openHabitCoach = useCallback(() => {
        setAnalysisResult(null);
        setIsLoading(false);
        setIsOpen(true);
    }, []);

    const closeHabitCoach = useCallback(() => setIsOpen(false), []);

    /**
     * Call this to trigger Gemini analysis.
     * Pass your async analysis function — the hook manages loading state.
     *
     * Example:
     * ```ts
     * startAnalysis(async () => {
     *   const res = await fetch("/api/analyze", { method: "POST", body: imageData });
     *   return (await res.json()).result;
     * });
     * ```
     */
    const startAnalysis = useCallback(async (analysisFn: () => Promise<string>) => {
        setIsLoading(true);
        try {
            const result = await analysisFn();
            setAnalysisResult(result);
        } catch (err) {
            setAnalysisResult("⚠ Analysis failed. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isOpen,
        isLoading,
        analysisResult,
        openHabitCoach,
        closeHabitCoach,
        startAnalysis,
        setAnalysisResult,
    };
}
