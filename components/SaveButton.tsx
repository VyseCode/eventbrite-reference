"use client";

import { useState } from "react";

export function SaveButton({
  eventId,
  initialSaved,
}: {
  eventId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/save`, {
        method: "POST",
      });
      const data = (await response.json()) as { saved?: boolean; error?: string };
      if (response.ok) {
        setSaved(data.saved ?? false);
      } else {
        setError(data.error ?? "Could not save event");
      }
    } catch {
      setError("Could not save event");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        disabled={busy}
        onClick={() => void toggle()}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          saved
            ? "border-[#d1410c] bg-[#fdf0e9] text-[#d1410c]"
            : "border-slate-300 text-slate-600 hover:bg-slate-50"
        }`}
      >
        {saved ? "♥ Saved" : "♡ Save event"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
