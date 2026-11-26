import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckInPanel } from "@/components/CheckInPanel";
import { ReviewsPanel } from "@/components/ReviewsPanel";
import { SaveButton } from "@/components/SaveButton";
import { TicketPurchase } from "@/components/TicketPurchase";
import {
  CalendarIcon,
  ClockIcon,
  LocationIcon,
  TicketIcon,
} from "@/components/Icons";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getEventById, listReviews } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const event = await getEventById(id, "");
  return { title: event?.title ?? "Event" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  await connectDB();
  const [event, reviews] = await Promise.all([
    getEventById(id, session?.userId ?? ""),
    listReviews(id, { page: 1, limit: 10 }),
  ]);
  if (!event) notFound();

  const isOrganizer = event.organizer.id === session?.userId;
  const ended = new Date(event.end).getTime() <= Date.now();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-36 bg-gradient-to-r from-[#d1410c] to-[#f6a17a]" />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-[#fdf0e9] px-3 py-1 text-xs font-semibold text-[#d1410c]">
                {event.category}
              </span>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                {event.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Organized by {event.organizer.name}
                {event.reviewsCount > 0 &&
                  ` · ${event.ratingAverage.toFixed(1)} ★ (${event.reviewsCount} reviews)`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {isOrganizer && (
                <Link
                  href={`/events/${event.id}/edit`}
                  className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Edit event
                </Link>
              )}
              <SaveButton eventId={event.id} initialSaved={event.savedByMe} />
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <p className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#d1410c]" />
              {formatDate(event.start)}
            </p>
            <p className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-[#d1410c]" />
              Until {formatDate(event.end)}
            </p>
            <p className="flex items-center gap-2">
              <LocationIcon className="h-4 w-4 text-[#d1410c]" />
              {event.venue}, {event.location}
            </p>
          </div>

          {ended && (
            <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              This event has ended. Ticket sales are closed.
            </p>
          )}
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">About this event</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {event.description}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <TicketIcon className="h-5 w-5 text-[#d1410c]" /> Tickets
        </h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {event.ticketTypes.map((type) => (
            <li
              key={type.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-800">{type.name}</p>
                <p className="text-xs text-slate-500">
                  {type.remaining} of {type.quantity} remaining
                </p>
              </div>
              <p className="font-semibold text-slate-800">
                {type.price === 0 ? "Free" : `$${type.price.toFixed(2)}`}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!isOrganizer && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Buy tickets</h2>
          <TicketPurchase event={event} />
        </section>
      )}

      {isOrganizer && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Check-in desk</h2>
          <CheckInPanel eventId={event.id} />
        </section>
      )}

      <ReviewsPanel eventId={event.id} initial={reviews} />
    </div>
  );
}
