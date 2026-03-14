"use client";

import { useEffect, useCallback, useState } from "react";

/* ─── Types ─── */
type SunlifeStep = "greeting" | "analyzing" | "results";

interface SunlifePromptProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalyze: (question: string) => void;
    analysisResult?: string | null;
    sourceUrl?: string | null;
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
                        backgroundColor: "#8B6914",
                        animation: `pixelBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                />
            ))}
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
    isLoading = false
}: SunlifePromptProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState<SunlifeStep>("greeting");

    useEffect(() => {
        if (isOpen) {
            setStep("greeting");
            const id = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setIsVisible(false);
    }, [isOpen]);

    // Sync external loading state
    useEffect(() => {
        if (isLoading && step === "greeting") {
            setStep("analyzing");
        }
    }, [isLoading, step]);

    // Show results when they arrive
    useEffect(() => {
        if (analysisResult && (step === "analyzing" || step === "greeting")) {
            setStep("results");
        }
    }, [analysisResult, step]);

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

    if (!isOpen) return null;

    return (
        <>
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
                {/* ── Outer pixel border ── */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"
                        }`}
                >
                    {/* Pixel shadow layer */}
                    <div
                        className="absolute inset-0 translate-x-1 translate-y-1"
                        style={{
                            backgroundColor: "#8B6914",
                            borderRadius: "6px",
                        }}
                    />

                    {/* Main panel */}
                    <div
                        className="relative"
                        style={{
                            width: "480px",
                            maxWidth: "92vw",
                            backgroundColor: "#D4B896",
                            border: "4px solid #6B4E2A",
                            borderRadius: "6px",
                            boxShadow: "inset 0 0 0 2px #E8D5B7, inset 0 0 0 4px #C4A882",
                        }}
                    >
                        {/* ── Close button (X) — top right, pixel style ── */}
                        <button
                            onClick={onClose}
                            className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center transition-transform hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: "#C4A06A",
                                border: "3px solid #6B4E2A",
                                borderRadius: "4px",
                                boxShadow: "1px 2px 0 #6B4E2A",
                                color: "#5A3D1A",
                                fontWeight: 900,
                                fontSize: "16px",
                                fontFamily: "monospace",
                                lineHeight: 1,
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>

                        {/* ── Inner content area ── */}
                        <div className="px-7 pb-7 pt-6">
                            {/* Sun Life Logo */}
                            <div className="mb-2 flex justify-center">
                                <img
                                    src="/sunlife-logo.png"
                                    alt="Sun Life"
                                    style={{ width: "64px", height: "auto" }}
                                />
                            </div>

                            {/* Title */}
                            <h2
                                className="mb-5 text-center"
                                style={{
                                    fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                    fontSize: "12px",
                                    letterSpacing: "1px",
                                    color: "#4A3520",
                                    textShadow: "1px 1px 0 rgba(0,0,0,0.1)",
                                }}
                            >
                                FINANCIAL AGENT
                            </h2>

                            {/* ── Step: Greeting ── */}
                            {step === "greeting" && (
                                <>
                                    <div
                                        className="mb-6"
                                        style={{
                                            backgroundColor: "#EBD9BE",
                                            border: "3px solid #B8975A",
                                            borderRadius: "4px",
                                            padding: "16px 18px",
                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                                        }}
                                    >
                                        <p
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "10px",
                                                lineHeight: "22px",
                                                color: "#4A3520",
                                            }}
                                        >
                                            Hi there! I can help you find the best Sun Life insurance plan for your treatment.
                                        </p>
                                        <p className="mt-4" style={{
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "10px",
                                            lineHeight: "22px",
                                            color: "#6B4E2A",
                                        }}>
                                            Would you like me to analyze live coverage data for you?
                                        </p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => onAnalyze("Does Sun Life cover braces?")}
                                            className="flex-1 transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                            style={{
                                                backgroundColor: "#EBD9BE",
                                                border: "3px solid #B8975A",
                                                borderRadius: "4px",
                                                padding: "12px 0",
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "11px",
                                                color: "#4A3520",
                                                cursor: "pointer",
                                                boxShadow: "0 3px 0 #8B6914, inset 0 1px 0 rgba(255,255,255,0.3)",
                                            }}
                                        >
                                            ANALYZE
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="flex-1 transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                            style={{
                                                backgroundColor: "#EBD9BE",
                                                border: "3px solid #B8975A",
                                                borderRadius: "4px",
                                                padding: "12px 0",
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "11px",
                                                color: "#4A3520",
                                                cursor: "pointer",
                                                boxShadow: "0 3px 0 #8B6914, inset 0 1px 0 rgba(255,255,255,0.3)",
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
                                        backgroundColor: "#EBD9BE",
                                        border: "3px solid #B8975A",
                                        borderRadius: "4px",
                                        padding: "24px 18px",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                                    }}
                                >
                                    <p
                                        className="text-center"
                                        style={{
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "10px",
                                            lineHeight: "22px",
                                            color: "#4A3520",
                                        }}
                                    >
                                        Scraping Sun Life data...
                                    </p>

                                    <PixelDots />

                                    <p
                                        className="text-center"
                                        style={{
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "8px",
                                            lineHeight: "18px",
                                            color: "#8B6914",
                                            animation: "pixelPulse 2s ease-in-out infinite",
                                        }}
                                    >
                                        Consulting with Gemini Agent...
                                    </p>
                                </div>
                            )}

                            {/* ── Step: Results ── */}
                            {step === "results" && analysisResult && (
                                <>
                                    <div
                                        className="mb-6"
                                        style={{
                                            backgroundColor: "#EBD9BE",
                                            border: "3px solid #B8975A",
                                            borderRadius: "4px",
                                            padding: "16px 18px",
                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                        }}
                                    >
                                        <p
                                            className="mb-3"
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "10px",
                                                lineHeight: "20px",
                                                color: "#4A3520",
                                            }}
                                        >
                                            Recommendation:
                                        </p>
                                        <div
                                            style={{
                                                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                fontSize: "9px",
                                                lineHeight: "20px",
                                                color: "#6B4E2A",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {analysisResult}
                                        </div>

                                        {sourceUrl && (
                                            <div className="mt-4 pt-3" style={{ borderTop: "2px solid #B8975A" }}>
                                                <p style={{
                                                    fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                    fontSize: "8px",
                                                    color: "#4A3520",
                                                    marginBottom: "8px"
                                                }}>
                                                    SOURCE:
                                                </p>
                                                <span
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const width = 800;
                                                        const height = 600;
                                                        const left = (window.screen.width - width) / 2;
                                                        const top = (window.screen.height - height) / 2;
                                                        window.open(
                                                            sourceUrl as string,
                                                            "SunLifeSource",
                                                            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
                                                        );
                                                    }}
                                                    style={{
                                                        fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                                        fontSize: "8px",
                                                        color: "#8B6914",
                                                        textDecoration: "underline",
                                                        wordBreak: "break-all",
                                                        lineHeight: "16px",
                                                        cursor: "pointer",
                                                        display: "inline-block"
                                                    }}
                                                >
                                                    {sourceUrl}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="w-full transition-all duration-150 hover:brightness-95 active:translate-y-[1px]"
                                        style={{
                                            backgroundColor: "#EBD9BE",
                                            border: "3px solid #B8975A",
                                            borderRadius: "4px",
                                            padding: "12px 0",
                                            fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                            fontSize: "11px",
                                            color: "#4A3520",
                                            cursor: "pointer",
                                            boxShadow: "0 3px 0 #8B6914, inset 0 1px 0 rgba(255,255,255,0.3)",
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
export function useSunlifePrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const openSunlife = useCallback(() => {
        setAnalysisResult(null);
        setSourceUrl(null);
        setIsLoading(false);
        setIsOpen(true);
    }, []);

    const closeSunlife = useCallback(() => setIsOpen(false), []);

    const startAnalysis = useCallback(async (analysisFn: () => Promise<{ recommendation: string; source: string }>) => {
        setIsLoading(true);
        try {
            const { recommendation, source } = await analysisFn();
            setAnalysisResult(recommendation);
            setSourceUrl(source);
        } catch (err) {
            setAnalysisResult("⚠ Coverage analysis failed. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isOpen,
        isLoading,
        analysisResult,
        sourceUrl,
        openSunlife,
        closeSunlife,
        startAnalysis,
    };
}
