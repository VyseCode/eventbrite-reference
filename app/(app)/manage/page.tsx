import Link from "next/link";
import { DashboardEvents } from "@/components/DashboardEvents";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getDashboard } from "@/lib/queries";

export const metadata = { title: "Organizer dashboard" };

export default async function ManagePage() {
  const session = await getSession();
  await connectDB();
  const dashboard = await getDashboard(session?.userId ?? "");

  const cards = [
    { label: "Events", value: String(dashboard.summary.events) },
    { label: "Tickets sold", value: String(dashboard.summary.ticketsSold) },
    { label: "Revenue", value: `$${dashboard.summary.revenue.toFixed(2)}` },
    { label: "Checked in", value: String(dashboard.summary.checkedIn) },
    { label: "Check-in rate", value: `${dashboard.summary.checkInRate}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Organizer dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your events, sales, and check-in performance at a glance.
          </p>
        </div>
        <Link
          href="/events/new"
          className="rounded-md bg-[#d1410c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b53609]"
        >
          + Create event
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">My events</h2>
        <DashboardEvents events={dashboard.events} />
      </section>
    </div>
  );
}
