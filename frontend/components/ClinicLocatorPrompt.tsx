"use client";

import { useEffect, useCallback, useState } from "react";

/* ─── Style Guide Constants ─── */
const FONT = "'Press Start 2P', monospace";

const C = {
    bg: "#F3E5F5",  // light lavender — main panel background
    bgDark: "#E1BEE7",  // lavender — headers, inset areas
    bgDeep: "#CE93D8",  // medium purple — disabled states
    border: "#4A148C",  // deep violet — all borders and pixel shadows
    text: "#210035",  // dark purple — primary text
    muted: "#7B1FA2",  // orchid — labels, hints
    gold: "#9C27B0",  // bright purple — active highlights, progress bars
    goldBrt: "#E1BEE7",  // light highlights
    red: "#7B1F1F",  // dark red — errors
    green: "#2E5A1C",  // dark green — success
    page: "#1A0033",  // deep dark purple — page background
};

const panel: React.CSSProperties = {
    background: C.bg,
    border: `4px solid ${C.border}`,
    boxShadow: `8px 8px 0 ${C.border}`,
    overflow: "hidden",
};

/* ─── Types ─── */
interface ClinicLocatorPromptProps {
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

/* ─── Component ─── */
export function ClinicLocatorPrompt({
    isOpen,
    onClose,
    children
}: ClinicLocatorPromptProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const id = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(id);
        }
        setIsVisible(false);
    }, [isOpen]);

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
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .blink { animation: blink 1s step-end infinite; }
        
        .pixel-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .pixel-scrollbar::-webkit-scrollbar-track {
          background: ${C.bgDark};
          border-left: 3px solid ${C.border};
        }
        .pixel-scrollbar::-webkit-scrollbar-thumb {
          background: ${C.muted};
          border: 2px solid ${C.border};
        }
      `}</style>

            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                    }`}
                style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
                onClick={onClose}
            >
                {/* ── Outer pixel border ── */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`relative transform transition-all duration-300 ease-out ${isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-3"
                        }`}
                >
                    {/* Main panel */}
                    <div
                        style={{
                            width: "560px",
                            maxWidth: "94vw",
                            ...panel,
                        }}
                    >
                        {/* ── Header ── */}
                        <div style={{
                            background: C.bgDark,
                            borderBottom: `4px solid ${C.border}`,
                            padding: "14px 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 24 }}>📍</span>
                            <span style={{
                                fontFamily: FONT,
                                fontSize: "12px",
                                color: C.text,
                                letterSpacing: "2px"
                            }}>
                                [ CLINIC LOCATOR ]
                            </span>
                        </div>

                        {/* ── Close button (X) ── */}
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

                        {/* ── Inner content area ── */}
                        <div
                            className="pixel-scrollbar"
                            style={{
                                padding: "8px",
                                background: C.bgDark,
                                maxHeight: "80vh",
                                overflowY: "auto",
                                borderBottom: `2px solid ${C.border}`,
                            }}
                        >
                            <div style={{
                                background: C.bg,
                                border: `3px solid ${C.border}`,
                                boxShadow: `inset 0 0 0 2px ${C.bgDark}`,
                            }}>
                                {children}
                            </div>
                        </div>

                        {/* ── Footer / Info ── */}
                        <div style={{
                            padding: "10px 16px",
                            background: C.bgDark,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}>
                            <span style={{ fontFamily: FONT, fontSize: "7px", color: C.muted }}>V1.0.4-BETA</span>
                            <span className="blink" style={{ fontFamily: FONT, fontSize: "7px", color: C.gold }}>SYSTEM ACTIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export function useClinicLocatorPrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const openClinicLocator = useCallback(() => setIsOpen(true), []);
    const closeClinicLocator = useCallback(() => setIsOpen(false), []);
    return { isOpen, openClinicLocator, closeClinicLocator };
}
