"use client";

import Link from "next/link";
import { useState } from "react";
import { TicketIcon } from "@/components/Icons";
import type { TicketListResult } from "@/lib/types";

export function MyTickets({ initial }: { initial: TicketListResult }) {
  const [filter, setFilter] = useState<"all" | "valid" | "used">("all");
  const [result, setResult] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(page: number, nextFilter = filter) {
    setBusy(true);
    setError("");
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (nextFilter !== "all") params.set("status", nextFilter);
    try {
      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = (await response.json()) as TicketListResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Could not load tickets");
      setResult(data);
    } catch {
      setError("Could not load your tickets. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["all", "valid", "used"] as const).map((option) => (
          <button
            key={option}
            type="button"
            disabled={busy}
            onClick={() => {
              setFilter(option);
              void load(1, option);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === option
                ? "bg-[#d1410c] text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result.tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <TicketIcon className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">No tickets here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Browse events and grab a ticket to see it here.
          </p>
          <Link
            href="/events"
            className="mt-4 inline-block rounded-md bg-[#d1410c] px-4 py-2 text-sm font-semibold text-white"
          >
            Discover events
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.tickets.map((ticket) => (
            <article
              key={ticket.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/events/${ticket.eventId}`}
                    className="font-semibold text-slate-900 hover:text-[#d1410c]"
                  >
                    {ticket.eventTitle}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.venue}, {ticket.location}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    ticket.status === "used"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {ticket.status === "used" ? "Checked in" : "Valid"}
                </span>
              </div>
              <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-500">Ticket code</p>
                  <p className="font-mono text-sm font-semibold text-slate-800">
                    {ticket.code}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.ticketTypeName} · $
                    {ticket.pricePaid.toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(ticket.eventStart).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={result.page <= 1 || busy}
            onClick={() => void load(result.page - 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {result.page} of {result.totalPages}
          </span>
          <button
            type="button"
            disabled={result.page >= result.totalPages || busy}
            onClick={() => void load(result.page + 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
