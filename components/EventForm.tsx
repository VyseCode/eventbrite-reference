"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT_CATEGORIES, type EventCategory } from "@/lib/constants";
import type { EventDTO } from "@/lib/types";

type TicketRow = { name: string; price: string; quantity: string };

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#d1410c] focus:ring-2 focus:ring-[#d1410c]/20";

function localValue(iso: string) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

export function EventForm({ initial }: { initial?: EventDTO }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<EventCategory>(
    (initial?.category as EventCategory) ?? "Tech",
  );
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [start, setStart] = useState(localValue(initial?.start ?? ""));
  const [end, setEnd] = useState(localValue(initial?.end ?? ""));
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 100));
  const [rows, setRows] = useState<TicketRow[]>(
    initial?.ticketTypes.map((type) => ({
      name: type.name,
      price: String(type.price),
      quantity: String(type.quantity),
    })) ?? [{ name: "General Admission", price: "0", quantity: "50" }],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateRow(index: number, patch: Partial<TicketRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const payload = {
      title,
      description,
      category,
      venue,
      location,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      capacity: Number(capacity),
      ...(editing
        ? {}
        : {
            ticketTypes: rows.map((row) => ({
              name: row.name,
              price: Number(row.price),
              quantity: Number(row.quantity),
            })),
          }),
    };

    try {
      const response = await fetch(
        editing ? `/api/events/${initial?.id}` : "/api/events",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as {
        id?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not save the event");
        return;
      }
      router.push(`/events/${data.id}`);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Event title
        </label>
        <input
          id="title"
          required
          minLength={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          required
          minLength={10}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            className={inputClass}
          >
            {EVENT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="capacity" className="mb-1 block text-sm font-medium">
            Capacity
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="venue" className="mb-1 block text-sm font-medium">
            Venue
          </label>
          <input
            id="venue"
            required
            minLength={2}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">
            City / location
          </label>
          <input
            id="location"
            required
            minLength={2}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start" className="mb-1 block text-sm font-medium">
            Starts
          </label>
          <input
            id="start"
            type="datetime-local"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="end" className="mb-1 block text-sm font-medium">
            Ends
          </label>
          <input
            id="end"
            type="datetime-local"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold">Ticket types</legend>
        {editing ? (
          <p className="text-xs text-slate-500">
            Ticket types and inventory are fixed after creation to protect sold
            tickets. Create a new event to offer different tickets.
          </p>
        ) : (
          rows.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_100px_100px]">
              <input
                aria-label={`Ticket type ${index + 1} name`}
                placeholder="Ticket name"
                required
                value={row.name}
                onChange={(e) => updateRow(index, { name: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Ticket type ${index + 1} price`}
                type="number"
                min={0}
                required
                value={row.price}
                onChange={(e) => updateRow(index, { price: e.target.value })}
                className={inputClass}
              />
              <input
                aria-label={`Ticket type ${index + 1} quantity`}
                type="number"
                min={1}
                required
                value={row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value })}
                className={inputClass}
              />
            </div>
          ))
        )}
        {!editing && rows.length < 10 && (
          <button
            type="button"
            onClick={() =>
              setRows((current) => [
                ...current,
                { name: "", price: "0", quantity: "25" },
              ])
            }
            className="text-sm font-semibold text-[#d1410c] hover:underline"
          >
            + Add ticket type
          </button>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[#d1410c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b53609] disabled:opacity-60"
      >
        {busy ? "Saving..." : editing ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
