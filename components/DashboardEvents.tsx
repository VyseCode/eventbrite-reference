"use client";

import Link from "next/link";
import { useState } from "react";
import { isPast } from "@/lib/datetime";
import type { DashboardEvent } from "@/lib/types";

export function DashboardEvents({ events }: { events: DashboardEvent[] }) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<"all" | "upcoming" | "past">("all");

  const visible = events.filter((event) => {
    const matchesQuery = event.title
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const past = isPast(event.start);
    const matchesPeriod =
      period === "all" || (period === "past" ? past : !past);
    return matchesQuery && matchesPeriod;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          aria-label="Filter my events"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by title"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#d1410c]"
        />
        {(["all", "upcoming", "past"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              period === option
                ? "bg-[#d1410c] text-white"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No events match this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Checked in</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium text-slate-800 hover:text-[#d1410c]"
                    >
                      {event.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {new Date(event.start).toLocaleDateString()} · capacity{" "}
                      {event.capacity}
                    </p>
                  </td>
                  <td className="px-4 py-3">{event.ticketsSold}</td>
                  <td className="px-4 py-3">${event.revenue.toFixed(2)}</td>
                  <td className="px-4 py-3">{event.checkedIn}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}/edit`}
                      className="text-xs font-semibold text-[#d1410c] hover:underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
