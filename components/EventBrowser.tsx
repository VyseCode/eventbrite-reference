"use client";

import Link from "next/link";
import { useState } from "react";
import { EventCard } from "@/components/EventCard";
import { SearchIcon } from "@/components/Icons";
import { EVENT_CATEGORIES } from "@/lib/constants";
import type { EventListResult } from "@/lib/types";

type Filters = {
  q: string;
  category: string;
  location: string;
  from: string;
  to: string;
  sort: "upcoming" | "newest";
};

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20";

const emptyFilters: Filters = {
  q: "",
  category: "",
  location: "",
  from: "",
  to: "",
  sort: "upcoming",
};

export function EventBrowser({ initial }: { initial: EventListResult }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [result, setResult] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function load(page: number) {
    setBusy(true);
    setError("");
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    params.set("limit", "12");
    try {
      const response = await fetch(`/api/events?${params.toString()}`);
      const data = (await response.json()) as EventListResult & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Search failed");
      setResult(data);
    } catch {
      setError("Could not load events. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void load(1);
        }}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Search events"
              placeholder="Search events"
              value={filters.q}
              onChange={(e) => update("q", e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          <input
            aria-label="Location"
            placeholder="Location (e.g. Austin)"
            value={filters.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
          />
          <select
            aria-label="Category"
            value={filters.category}
            onChange={(e) => update("category", e.target.value)}
            className={inputClass}
          >
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input
            aria-label="From date"
            type="date"
            value={filters.from}
            onChange={(e) => update("from", e.target.value)}
            className={inputClass}
          />
          <input
            aria-label="To date"
            type="date"
            value={filters.to}
            onChange={(e) => update("to", e.target.value)}
            className={inputClass}
          />
          <select
            aria-label="Sort by"
            value={filters.sort}
            onChange={(e) =>
              update("sort", e.target.value as "upcoming" | "newest")
            }
            className={inputClass}
          >
            <option value="upcoming">Soonest first</option>
            <option value="newest">Newest first</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-md bg-[#d1410c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b53609] disabled:opacity-60 md:flex-none"
            >
              {busy ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setFilters(emptyFilters);
                void load(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h2 className="text-sm text-slate-600">
          {result.total} {result.total === 1 ? "event" : "events"} found
        </h2>
        <Link
          href="/events/new"
          className="rounded-md border border-[#d1410c] px-3 py-1.5 text-sm font-semibold text-[#d1410c] hover:bg-[#fdf0e9]"
        >
          + Create event
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-700">No events found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={result.page <= 1 || busy}
            onClick={() => void load(result.page - 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-40"
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
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
