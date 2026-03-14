"use client";
import { useState } from "react";
import type { Location } from "./useGeolocation";

export type WizardStep = "find_clinics" | "select_clinic" | "get_slots" | "select_slot" | "book" | "done";

export interface Clinic {
  name: string;
  address: string;
  place_id: string;
  rating?: number;
  open_now?: boolean;
  lat: number;
  lng: number;
}

export interface Slot {
  start: string;
  end: string;
}

export interface BookedEvent {
  event_id: string;
  html_link: string;
  summary: string;
  start: string;
  end: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useWizard(location: Location | null, googleToken: string) {
  const [step, setStep] = useState<WizardStep>("find_clinics");
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookedEvent, setBookedEvent] = useState<BookedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findClinics() {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/agents/clinic-locator/wizard/find-clinics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: location.lat, lng: location.lng }),
      });
      const data = await res.json();
      setClinics(data.clinics);
      setStep("select_clinic");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to find clinics");
    } finally {
      setLoading(false);
    }
  }

  async function getSlots(clinic: Clinic) {
    setSelectedClinic(clinic);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/agents/clinic-locator/wizard/get-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ google_token: googleToken }),
      });
      const data = await res.json();
      setSlots(data.slots);
      setStep("get_slots");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get slots");
    } finally {
      setLoading(false);
    }
  }

  async function book(slot: Slot) {
    if (!selectedClinic) return;
    setSelectedSlot(slot);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/agents/clinic-locator/wizard/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_token: googleToken,
          clinic_name: selectedClinic.name,
          clinic_address: selectedClinic.address,
          start_datetime: slot.start,
          end_datetime: slot.end,
        }),
      });
      const data = await res.json();
      setBookedEvent(data.event);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("find_clinics");
    setClinics([]);
    setSelectedClinic(null);
    setSlots([]);
    setSelectedSlot(null);
    setBookedEvent(null);
    setError(null);
  }

  return {
    step, clinics, selectedClinic, slots, selectedSlot, bookedEvent,
    loading, error,
    findClinics, getSlots, book, reset,
  };
}
