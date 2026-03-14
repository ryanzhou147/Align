"use client";
import { useSession, signIn } from "next-auth/react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWizard } from "@/hooks/useWizard";

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

  if (tokenError === "RefreshAccessTokenError") {
    return (
      <div className="p-8 text-center space-y-6">
        <div className="text-5xl animate-pulse">🔑</div>
        <h2 style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", fontSize: "14px", color: "#1A2B5A" }}>
          SESSION EXPIRED
        </h2>
        <p style={{ fontFamily: "monospace", fontSize: "12px", color: "#1A2B5A", opacity: 0.7 }}>
          Please sign in again to continue.
        </p>
        <button
          onClick={() => signIn("google")}
          style={{
            backgroundColor: "#8DA5D1",
            border: "4px solid #2D3E75",
            borderRadius: "4px",
            padding: "16px 24px",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "10px",
            color: "#1A2B5A",
            cursor: "pointer",
            boxShadow: "0 4px 0 #2D3E75, inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          className="transition-all hover:scale-105 active:translate-y-[2px] active:shadow-none"
        >
          SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="p-8 text-center space-y-6"
        style={{
          backgroundColor: "#B8C6E6",
          border: "4px solid #2D3E75",
          borderRadius: "4px",
          boxShadow: "inset 0 0 0 2px #E1E8F5, inset 0 0 0 4px #8DA5D1",
        }}
      >
        <div className="text-5xl animate-bounce">🦷</div>
        <h2 style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", fontSize: "12px", color: "#1A2B5A", textShadow: "1px 1px 0 rgba(255,255,255,0.5)" }}>
          FIND A CLINIC
        </h2>
        <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#1A2B5A", opacity: 0.8, lineHeight: "1.6", fontWeight: "bold" }}>
          Connect your Google account <br /> to check availability <br /> and book instantly.
        </p>
        <button
          onClick={() => signIn("google")}
          style={{
            backgroundColor: "#8DA5D1",
            border: "4px solid #2D3E75",
            borderRadius: "4px",
            padding: "16px 24px",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "10px",
            color: "#1A2B5A",
            cursor: "pointer",
            boxShadow: "0 4px 0 #2D3E75, inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
          className="transition-all hover:scale-105 active:translate-y-[2px] active:shadow-none"
        >
          SIGN IN WITH GOOGLE
        </button>
      </div>
    );
  }

  return (
    <div className="text-[#1A2B5A]">
      <main className="p-4 space-y-6">

        {/* Step 1 — Find clinics */}
        {step === "find_clinics" && (
          <div
            className="text-center p-6"
            style={{
              backgroundColor: "#E1E8F5",
              border: "3px solid #6D87C1",
              borderRadius: "4px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            <p className="font-['Press_Start_2P'] text-[8px] leading-relaxed mb-6 opacity-70">
              We'll search for dental clinics near your current location.
            </p>
            <button
              onClick={findClinics}
              disabled={loading || !location}
              style={{
                backgroundColor: "#8DA5D1",
                border: "3px solid #2D3E75",
                borderRadius: "4px",
                padding: "12px 20px",
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: "10px",
                color: "#1A2B5A",
                cursor: "pointer",
                boxShadow: "0 3px 0 #2D3E75, inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
              className="transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-40"
            >
              {loading ? "SEARCHING..." : "FIND NEARBY CLINICS"}
            </button>
          </div>
        )}

        {/* Step 2 — Pick a clinic */}
        {step === "select_clinic" && (
          <div className="space-y-3">
            <h2
              className="mb-4"
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: "10px",
                color: "#1A2B5A",
              }}
            >
              NEARBY CLINICS
            </h2>
            {clinics.map((clinic) => (
              <button
                key={clinic.place_id}
                onClick={() => getSlots(clinic)}
                disabled={loading}
                className="w-full text-left transition-all active:translate-y-[1px] disabled:opacity-40"
                style={{
                  backgroundColor: "#E1E8F5",
                  border: "3px solid #6D87C1",
                  borderRadius: "4px",
                  padding: "12px 14px",
                  boxShadow: "0 2px 0 #2D3E75, inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-2">
                    <p
                      className="font-bold mb-1"
                      style={{
                        fontFamily: "'Press Start 2P', 'Courier New', monospace",
                        fontSize: "8px",
                        lineHeight: "14px",
                      }}
                    >
                      {clinic.name}
                    </p>
                    <p
                      className="opacity-60"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        lineHeight: "14px",
                      }}
                    >
                      {clinic.address}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {clinic.rating && (
                      <p style={{ fontFamily: "monospace", fontSize: "10px", color: "#C07B00", fontWeight: "bold" }}>
                        ★{clinic.rating}
                      </p>
                    )}
                    {clinic.open_now != null && (
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "9px",
                          fontWeight: "bold",
                          color: clinic.open_now ? "#2E7D32" : "#C62828"
                        }}
                      >
                        {clinic.open_now ? "OPEN" : "CLOSED"}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {loading && <p className="text-center font-['Press_Start_2P'] text-[8px] animate-pulse py-4">Checking calendar...</p>}
          </div>
        )}

        {/* Step 3 — Pick a slot */}
        {step === "get_slots" && selectedClinic && (
          <div className="space-y-4">
            <h2 className="font-['Press_Start_2P'] text-[8px] leading-relaxed mb-2">Available slots at {selectedClinic.name}</h2>
            {Object.entries(groupByDay(slots)).map(([day, daySlots]) => (
              <div
                key={day}
                style={{
                  backgroundColor: "#E1E8F5",
                  border: "2px solid #6D87C1",
                  borderRadius: "4px",
                  padding: "10px",
                }}
              >
                <p
                  className="mb-3 font-bold opacity-50"
                  style={{
                    fontFamily: "'Press Start 2P', 'Courier New', monospace",
                    fontSize: "6px",
                    letterSpacing: "1px",
                  }}
                >
                  {day.toUpperCase()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => book(slot)}
                      disabled={loading}
                      style={{
                        backgroundColor: "#8DA5D1",
                        border: "2px solid #2D3E75",
                        borderRadius: "2px",
                        padding: "6px 8px",
                        fontFamily: "monospace",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#1A2B5A",
                        cursor: "pointer",
                      }}
                      className="transition-all active:translate-y-[1px] hover:brightness-95 disabled:opacity-40"
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {slots.length === 0 && <p className="text-center font-['Press_Start_2P'] text-[8px] py-4">No free slots found.</p>}
            {loading && <p className="text-center font-['Press_Start_2P'] text-[8px] animate-pulse py-4">Booking...</p>}
            <button
              onClick={reset}
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: "8px",
                color: "#1A2B5A",
                opacity: 0.5,
              }}
              className="hover:opacity-100"
            >
              ← BACK
            </button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && bookedEvent && (
          <div className="text-center space-y-4 p-6">
            <div className="text-4xl animate-bounce">✅</div>
            <h2 style={{ fontFamily: "'Press Start 2P', 'Courier New', monospace", fontSize: "12px" }}>BOOKED!</h2>
            <div
              className="p-4"
              style={{
                backgroundColor: "#EBD9BE", // Goldish background for success
                border: "3px solid #B8975A",
                borderRadius: "4px",
                color: "#4A3520",
              }}
            >
              <p className="font-bold mb-2 uppercase tracking-tight" style={{ fontSize: "14px" }}>{bookedEvent.summary}</p>
              <p style={{ fontFamily: "monospace", fontSize: "12px" }}>{formatDate(bookedEvent.start)}</p>
              <p style={{ fontFamily: "monospace", fontSize: "12px" }}>{formatTime(bookedEvent.start)} – {formatTime(bookedEvent.end)}</p>
            </div>

            <a
              href={bookedEvent.html_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Press Start 2P', 'Courier New', monospace",
                fontSize: "8px",
                color: "#3B82F6",
                textDecoration: "underline",
              }}
            >
              VIEW IN GOOGLE CALENDAR →
            </a>

            <div>
              <button
                onClick={reset}
                style={{
                  fontFamily: "'Press Start 2P', 'Courier New', monospace",
                  fontSize: "8px",
                  color: "#1A2B5A",
                  opacity: 0.6,
                }}
                className="mt-4 hover:opacity-100"
              >
                BOOK ANOTHER
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            className="p-3 text-red-700"
            style={{
              backgroundColor: "#FEE2E2",
              border: "2px solid #EF4444",
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: "bold",
            }}
          >
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
