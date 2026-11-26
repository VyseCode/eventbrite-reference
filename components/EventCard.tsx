import Link from "next/link";
import { CalendarIcon, LocationIcon, TicketIcon } from "@/components/Icons";
import type { EventDTO } from "@/lib/types";

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCard({ event }: { event: EventDTO }) {
  const prices = event.ticketTypes.map((type) => type.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const remaining = event.ticketTypes.reduce(
    (sum, type) => sum + type.remaining,
    0,
  );
  const priceLabel =
    min === max
      ? min === 0
        ? "Free"
        : `$${min.toFixed(2)}`
      : `$${min.toFixed(2)} – $${max.toFixed(2)}`;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-24 items-center justify-between bg-gradient-to-r from-[#d1410c] to-[#f7a17b] px-5 text-white">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          {event.category}
        </span>
        {event.savedByMe && <span className="text-lg">♥</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[#d1410c]">
          <CalendarIcon className="h-4 w-4" /> {shortDate(event.start)}
        </p>
        <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-[#d1410c]">
          {event.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <LocationIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {event.venue}, {event.location}
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
            <TicketIcon className="h-4 w-4 text-slate-400" />
            {priceLabel}
          </span>
          <span className="text-xs text-slate-500">
            {remaining > 0 ? `${remaining} tickets left` : "Sold out"}
          </span>
        </div>
        {event.reviewsCount > 0 && (
          <p className="text-xs text-slate-500">
            ★ {event.ratingAverage.toFixed(1)} ({event.reviewsCount})
          </p>
        )}
      </div>
    </Link>
  );
}
