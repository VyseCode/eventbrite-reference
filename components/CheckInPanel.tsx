"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventTicketDTO } from "@/lib/queries";

type TicketList = {
  tickets: EventTicketDTO[];
  total: number;
};

export function CheckInPanel({ eventId }: { eventId: string }) {
  const [tickets, setTickets] = useState<EventTicketDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/tickets?limit=20`);
      const data = (await response.json()) as TicketList & { error?: string };
      if (response.ok) {
        setTickets(data.tickets);
        setTotal(data.total);
      } else {
        setError(data.error ?? "Could not load tickets");
      }
    } catch {
      setError("Could not load tickets");
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function checkIn(ticketCode: string) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `/api/tickets/${encodeURIComponent(ticketCode)}/check-in`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        eventTitle?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Check-in failed");
      } else {
        setMessage(`${ticketCode} checked in successfully.`);
        setCode("");
        await load();
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (code.trim()) void checkIn(code.trim());
        }}
        className="flex gap-2"
      >
        <input
          aria-label="Ticket code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter ticket code (EV-...)"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-[#d1410c]"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Check in
        </button>
      </form>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <p className="mb-2 text-xs text-slate-500">
          {total} ticket{total === 1 ? "" : "s"} sold for this event
        </p>
        {tickets.length === 0 ? (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">
            No tickets sold yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-mono text-xs text-slate-700">{ticket.code}</p>
                  <p className="text-xs text-slate-500">
                    {ticket.attendee} · {ticket.ticketTypeName}
                  </p>
                </div>
                {ticket.status === "used" ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    Used
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void checkIn(ticket.code)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Check in
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
