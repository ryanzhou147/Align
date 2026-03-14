"use client";
import { useSession, signIn } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWizard } from "@/hooks/useWizard";

// ── Style Guide Constants ──────────────────────────────────────────────────
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
  boxShadow: `5px 5px 0 ${C.border}`,
  overflow: "hidden",
};

const hdr = (bg = C.bgDark): React.CSSProperties => ({
  background: bg,
  borderBottom: `4px solid ${C.border}`,
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
});

const btn = (active = true): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: "10px",
  background: active ? C.bg : C.bgDeep,
  border: `3px solid ${C.border}`,
  boxShadow: active ? `4px 4px 0 ${C.border}` : "none",
  padding: "12px 20px",
  color: active ? C.text : C.muted,
  cursor: active ? "pointer" : "not-allowed",
  opacity: active ? 1 : 0.4,
  lineHeight: 1,
});

// ── Helper Functions ────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function groupByDay(slots: { start: string; end: string }[] = []) {
  const groups: Record<string, { start: string; end: string }[]> = {};
  for (const slot of slots) {
    const day = formatDate(slot.start);
    if (!groups[day]) groups[day] = [];
    groups[day].push(slot);
  }
  return groups;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const { location, loading: locLoading } = useGeolocation();
  const googleToken = (session as { access_token?: string } | null)?.access_token ?? "";
  const refreshToken = (session as { refresh_token?: string } | null)?.refresh_token;
  const tokenError = (session as { error?: string } | null)?.error;

  const {
    step, clinics, selectedClinic, slots, bookedEvent,
    loading, error,
    findClinics, getSlots, book, reset,
  } = useWizard(location, googleToken, refreshToken);

  if (status === "loading") return null;

  // ── Session Expired ───────────────────────────────────────────────────────
  if (tokenError === "RefreshAccessTokenError") {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🔑</div>
        <h2 style={{ fontFamily: FONT, fontSize: "12px", color: C.text, marginBottom: "20px" }}>
          [ SESSION EXPIRED ]
        </h2>
        <p style={{ fontFamily: FONT, fontSize: "9px", color: C.muted, lineHeight: "2.2", marginBottom: "30px" }}>
          Please sign in again to continue your session.
        </p>
        <button
          onClick={() => signIn("google")}
          style={{ ...btn(true), background: C.gold, color: C.page }}
          className="px-btn"
        >
          ▶ SIGN IN AGAIN
        </button>
      </div>
    );
  }

  // ── Sign In ───────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🦷</div>
        <h2 style={{ fontFamily: FONT, fontSize: "12px", color: C.text, marginBottom: "20px" }}>
          [ FIND A CLINIC ]
        </h2>
        <p style={{ fontFamily: FONT, fontSize: "9px", color: C.muted, lineHeight: "2.2", marginBottom: "30px" }}>
          Sign in with Google to check <br /> your calendar and book <br /> an appointment.
        </p>
        <button
          onClick={() => signIn("google")}
          style={{ ...btn(true), background: C.gold, color: C.page }}
          className="px-btn"
        >
          ▶ SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  // ── Main Content ──────────────────────────────────────────────────────────
  return (
    <div style={{ color: C.text, background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .blink { animation: blink 1s step-end infinite; }
        .px-btn { transition: transform 60ms, box-shadow 60ms; }
        .px-btn:hover:not(:disabled) { transform: translate(4px,4px); box-shadow: none !important; }
        .px-btn:active:not(:disabled) { transform: translate(2px,2px); }
      `}</style>

      <main style={{ padding: "20px" }}>

        {/* Step 1 — Find clinics */}
        {step === "find_clinics" && (
          <div style={{ ...panel, background: C.bgDark, padding: "24px", textAlign: "center" }}>
            <p style={{ fontFamily: FONT, fontSize: "9px", color: C.text, lineHeight: "2.4", marginBottom: "24px" }}>
              Searching for dental clinics <br /> near your coordinates...
            </p>
            <div style={{ fontSize: "9px", color: C.muted, marginBottom: "24px", fontFamily: FONT }}>
              {locLoading ? "LOCATING..." : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "COORD UNAVAILABLE"}
            </div>
            <button
              onClick={findClinics}
              disabled={loading || !location}
              style={{ ...btn(!loading && !!location), background: C.gold, color: C.page }}
              className="px-btn"
            >
              {loading ? "SEARCHING..." : "▶ SCAN AREA"}
            </button>
          </div>
        )}

        {/* Step 2 — Pick a clinic */}
        {step === "select_clinic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...hdr(), marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontFamily: FONT }}>[ NEARBY CLINICS ]</span>
            </div>

            {clinics.map((clinic) => (
              <button
                key={clinic.place_id}
                onClick={() => getSlots(clinic)}
                disabled={loading}
                className="px-btn"
                style={{
                  ...panel,
                  width: "100%",
                  textAlign: "left",
                  background: C.bgDark,
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: FONT, fontSize: "10px", marginBottom: "8px", lineHeight: "1.4" }}>{clinic.name.toUpperCase()}</p>
                  <p style={{ fontSize: "8px", opacity: 0.6, fontFamily: "monospace" }}>{clinic.address}</p>
                </div>
                <div style={{ textAlign: "right", marginLeft: "12px" }}>
                  {clinic.rating && (
                    <p style={{ fontSize: "12px", color: C.gold, fontWeight: "bold", marginBottom: "4px" }}>
                      ★{clinic.rating}
                    </p>
                  )}
                  {clinic.open_now != null && (
                    <p style={{ fontSize: "8px", fontWeight: "bold", color: clinic.open_now ? C.green : C.red, fontFamily: FONT }}>
                      {clinic.open_now ? "OPEN" : "CLOSED"}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {loading && <p style={{ fontFamily: FONT, fontSize: "8px", textAlign: "center", marginTop: "16px" }} className="blink">CONNECTING TO MAPS...</p>}
          </div>
        )}

        {/* Step 3 — Pick a slot */}
        {step === "get_slots" && selectedClinic && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ ...hdr() }}>
              <span style={{ fontSize: "10px", fontFamily: FONT }}>[ SELECT SLOT ]</span>
              <span style={{ marginLeft: "auto", fontSize: "8px", fontFamily: FONT, opacity: 0.6 }}>{selectedClinic.name.toUpperCase()}</span>
            </div>

            {Object.entries(groupByDay(slots)).map(([day, daySlots]) => (
              <div key={day} style={{ ...panel, background: C.bgDark, padding: "12px" }}>
                <p style={{ fontFamily: FONT, fontSize: "8px", color: C.muted, marginBottom: "12px" }}>{day.toUpperCase()}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {daySlots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => book(slot)}
                      disabled={loading}
                      style={{
                        ...btn(true),
                        padding: "8px 12px",
                        fontSize: "9px",
                        background: C.bg,
                      }}
                      className="px-btn"
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {slots.length === 0 && (
              <div style={{ ...panel, background: C.red + "18", border: `2px solid ${C.red}`, padding: "20px", textAlign: "center" }}>
                <p style={{ fontFamily: FONT, fontSize: "8px", color: C.red }}>NO FREE SLOTS FOUND</p>
              </div>
            )}

            <button onClick={reset} style={{ background: "none", border: "none", color: C.muted, fontFamily: FONT, fontSize: "8px", cursor: "pointer", textAlign: "left" }}>
              ← CHANGE CLINIC
            </button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && bookedEvent && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "50px", marginBottom: "20px" }}>✅</div>
            <h2 style={{ fontFamily: FONT, fontSize: "12px", color: C.green, marginBottom: "20px" }}>[ APPOINTMENT SET ]</h2>

            <div style={{ ...panel, background: C.bgDark, padding: "24px", marginBottom: "24px" }}>
              <p style={{ fontFamily: FONT, fontSize: "10px", color: C.gold, marginBottom: "12px" }}>{bookedEvent.summary.toUpperCase()}</p>
              <p style={{ fontFamily: FONT, fontSize: "10px", fontWeight: "bold", color: C.text, marginBottom: "8px" }}>
                {formatDate(bookedEvent.start).toUpperCase()}
              </p>
              <p style={{ fontFamily: FONT, fontSize: "10px", color: C.text }}>
                {formatTime(bookedEvent.start)} – {formatTime(bookedEvent.end)}
              </p>
            </div>

            <a
              href={bookedEvent.html_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btn(true), display: "inline-block", textDecoration: "none", marginBottom: "24px" }}
              className="px-btn"
            >
              ▶ VIEW IN CALENDAR
            </a>

            <div>
              <button onClick={reset} style={{ background: "none", border: "none", color: C.muted, fontFamily: FONT, fontSize: "8px", cursor: "pointer" }}>
                BOOK ANOTHER
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ ...panel, background: C.red + "18", border: `3px solid ${C.red}`, padding: "16px", marginTop: "20px" }}>
            <p style={{ fontFamily: FONT, fontSize: "8px", color: C.red, lineHeight: "1.8" }}>
              [ ERROR ]: {error.toUpperCase()}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
