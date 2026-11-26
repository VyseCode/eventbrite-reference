"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_TICKETS_PER_ORDER } from "@/lib/constants";
import { hasEnded } from "@/lib/datetime";
import type { EventDTO } from "@/lib/types";

export function TicketPurchase({ event }: { event: EventDTO }) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const ended = hasEnded(event.end);

  function setQuantity(id: string, value: string) {
    setQuantities((current) => ({ ...current, [id]: value }));
  }

  async function purchase(eventForm: React.FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    setError("");
    setBusy(true);
    const items = event.ticketTypes
      .map((type) => ({
        ticketTypeId: type.id,
        quantity: Number(quantities[type.id] ?? 0),
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError("Choose at least one ticket.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch(`/api/events/${event.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await response.json()) as {
        tickets?: Array<{ code: string }>;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not complete your purchase");
        return;
      }
      setCodes(data.tickets?.map((ticket) => ticket.code) ?? []);
      setQuantities({});
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (codes.length > 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="font-semibold text-green-800">You&apos;re going!</h3>
        <p className="mt-1 text-sm text-green-700">
          Your ticket codes are ready. Keep them handy at the door.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {codes.map((code) => (
            <li
              key={code}
              className="rounded-md border border-green-300 bg-white px-2 py-1 font-mono text-xs text-green-800"
            >
              {code}
            </li>
          ))}
        </ul>
        <Link
          href="/tickets"
          className="mt-3 inline-block text-sm font-semibold text-green-800 underline"
        >
          View my tickets →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={purchase} className="space-y-3">
      <p className="text-sm text-slate-500">
        Choose your tickets. Maximum {MAX_TICKETS_PER_ORDER} tickets per order.
      </p>
      {event.ticketTypes.map((type) => (
        <div
          key={type.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
        >
          <div>
            <p className="text-sm font-medium text-slate-800">{type.name}</p>
            <p className="text-xs text-slate-500">
              {type.price === 0 ? "Free" : `$${type.price.toFixed(2)}`} ·{" "}
              {type.remaining} left
            </p>
          </div>
          <input
            aria-label={`Quantity for ${type.name}`}
            type="number"
            min={0}
            max={Math.min(type.remaining, MAX_TICKETS_PER_ORDER)}
            value={quantities[type.id] ?? "0"}
            disabled={ended || type.remaining === 0}
            onChange={(e) => setQuantity(type.id, e.target.value)}
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-[#d1410c]"
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || ended}
        className="w-full rounded-md bg-[#d1410c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b53609] disabled:opacity-50"
      >
        {ended
          ? "Sales closed"
          : busy
            ? "Processing..."
            : "Get tickets"}
      </button>
    </form>
  );
}
