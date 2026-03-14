"use client";

import { useEffect, useCallback, useState } from "react";

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
        @keyframes pixelPulseBlue {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        /* Custom scrollbar for pixel feel */
        .pixel-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .pixel-scrollbar::-webkit-scrollbar-track {
          background: #B8C6E6;
        }
        .pixel-scrollbar::-webkit-scrollbar-thumb {
          background: #4A69B1;
          border: 2px solid #2D3E75;
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
                            backgroundColor: "#2D3E75",
                            borderRadius: "6px",
                        }}
                    />

                    {/* Main panel */}
                    <div
                        className="relative"
                        style={{
                            width: "520px",
                            maxWidth: "92vw",
                            backgroundColor: "#B8C6E6",
                            border: "4px solid #2D3E75",
                            borderRadius: "6px",
                            boxShadow: "inset 0 0 0 2px #E1E8F5, inset 0 0 0 4px #8DA5D1",
                        }}
                    >
                        {/* ── Close button (X) ── */}
                        <button
                            onClick={onClose}
                            className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center transition-transform hover:scale-110 active:scale-95"
                            style={{
                                backgroundColor: "#8DA5D1",
                                border: "3px solid #2D3E75",
                                borderRadius: "4px",
                                boxShadow: "1px 2px 0 #2D3E75",
                                color: "#1A2B5A",
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
                            {/* Icon / Title */}
                            <div className="mb-4 flex flex-col items-center">
                                <span style={{ fontSize: "32px", filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.1))" }}>📍</span>
                                <h2
                                    className="mt-2 text-center"
                                    style={{
                                        fontFamily: "'Press Start 2P', 'Courier New', monospace",
                                        fontSize: "12px",
                                        letterSpacing: "1px",
                                        color: "#1A2B5A",
                                        textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
                                    }}
                                >
                                    CLINIC LOCATOR
                                </h2>
                            </div>

                            {/* Main Content (ChatPage) */}
                            <div
                                className="pixel-scrollbar"
                                style={{
                                    backgroundColor: "#E1E8F5",
                                    border: "3px solid #6D87C1",
                                    borderRadius: "4px",
                                    padding: "4px",
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                                    maxHeight: "70vh",
                                    overflowY: "auto",
                                }}
                            >
                                {children}
                            </div>
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
