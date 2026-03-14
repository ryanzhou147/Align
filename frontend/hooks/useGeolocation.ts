"use client";
import { useState, useEffect } from "react";

export interface Location {
  lat: number;
  lng: number;
  source: "gps" | "ip";
}

async function fetchIPLocation(): Promise<Location> {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();
  return { lat: data.latitude, lng: data.longitude, source: "ip" };
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchIPLocation()
        .then(setLocation)
        .catch(() => setError("Could not determine location"))
        .finally(() => setLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "gps" });
        setLoading(false);
      },
      async () => {
        try {
          setLocation(await fetchIPLocation());
        } catch {
          setError("Could not determine location");
        } finally {
          setLoading(false);
        }
      },
      { timeout: 5000 }
    );
  }, []);

  return { location, error, loading };
}
