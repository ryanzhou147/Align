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

function groupByDay(slots: { start: string; end: string }[]) {
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

  const {
    step, clinics, selectedClinic, slots, bookedEvent,
    loading, error,
    findClinics, getSlots, book, reset,
  } = useWizard(location, googleToken);

  if (status === "loading") return null;

  if (!session) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-4">🦷</div>
          <h2 className="text-2xl font-semibold text-ink mb-2">Find a dental clinic</h2>
          <p className="text-ink/60 text-sm mb-6">Sign in with Google to check your calendar and book an appointment.</p>
          <button
            onClick={() => signIn("google")}
            className="bg-ink text-white font-medium px-6 py-3 rounded-xl hover:bg-ink/80 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/10 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Clinic Locator</h1>
          <p className="text-xs text-ink/50">
            {locLoading ? "Detecting location…" : location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)} (${location.source})` : "Location unavailable"}
          </p>
        </div>
        <span className="text-sm text-ink/60">{session.user?.name}</span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Step 1 — Find clinics */}
        {step === "find_clinics" && (
          <div className="bg-white rounded-2xl border border-ink/10 p-6 shadow-soft text-center">
            <p className="text-ink/60 text-sm mb-4">We&apos;ll search for dental clinics near your current location.</p>
            <button
              onClick={findClinics}
              disabled={loading || !location}
              className="bg-ink text-white px-6 py-3 rounded-xl font-medium hover:bg-ink/80 disabled:opacity-40 transition-colors"
            >
              {loading ? "Searching…" : "Find nearby clinics"}
            </button>
          </div>
        )}

        {/* Step 2 — Pick a clinic */}
        {step === "select_clinic" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Nearby clinics</h2>
            {clinics.map((clinic) => (
              <button
                key={clinic.place_id}
                onClick={() => getSlots(clinic)}
                disabled={loading}
                className="w-full text-left bg-white border border-ink/10 rounded-2xl p-4 shadow-soft hover:border-ink/30 transition-colors disabled:opacity-40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{clinic.name}</p>
                    <p className="text-sm text-ink/50 mt-0.5">{clinic.address}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {clinic.rating && <p className="text-sm font-medium text-amber-600">★ {clinic.rating}</p>}
                    {clinic.open_now != null && (
                      <p className={`text-xs mt-0.5 ${clinic.open_now ? "text-green-600" : "text-red-500"}`}>
                        {clinic.open_now ? "Open" : "Closed"}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {loading && <p className="text-center text-sm text-ink/50">Checking your calendar…</p>}
          </div>
        )}

        {/* Step 3 — Pick a slot */}
        {step === "get_slots" && selectedClinic && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Available slots at {selectedClinic.name}</h2>
            {Object.entries(groupByDay(slots)).map(([day, daySlots]) => (
              <div key={day} className="bg-white border border-ink/10 rounded-2xl p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/40 mb-3">{day}</p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => book(slot)}
                      disabled={loading}
                      className="text-sm px-3 py-1.5 rounded-lg border border-ink/20 hover:border-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-40"
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {slots.length === 0 && <p className="text-sm text-ink/50 text-center">No free slots found in the next 7 days.</p>}
            {loading && <p className="text-center text-sm text-ink/50">Booking…</p>}
            <button onClick={reset} className="text-sm text-ink/40 hover:text-ink">← Back</button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && bookedEvent && (
          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-soft text-center space-y-3">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-semibold">Appointment booked!</h2>
            <p className="text-ink/60 text-sm">{bookedEvent.summary}</p>
            <p className="text-ink/60 text-sm">{formatDate(bookedEvent.start)} · {formatTime(bookedEvent.start)} – {formatTime(bookedEvent.end)}</p>
            <a href={bookedEvent.html_link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-blue-600 hover:underline">
              View in Google Calendar →
            </a>
            <div>
              <button onClick={reset} className="mt-4 text-sm text-ink/40 hover:text-ink">Book another</button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}
      </main>
    </div>
  );
}
