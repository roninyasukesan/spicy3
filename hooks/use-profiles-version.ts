"use client";

import { useEffect, useState } from "react";

/**
 * Returns a counter that increments whenever a model profile is saved
 * (same tab via the "spicy-profile-change" event, or another tab via "storage").
 * Include the returned value in a useEffect dependency array to re-run data
 * loading and keep the UI in sync with the latest saved profiles.
 */
export function useProfilesVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "spicy-model-profile") bump();
    };

    window.addEventListener("spicy-profile-change", bump);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("spicy-profile-change", bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return version;
}
