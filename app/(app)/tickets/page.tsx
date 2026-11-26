import { MyTickets } from "@/components/MyTickets";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { listTickets } from "@/lib/queries";

export const metadata = { title: "My tickets" };

export default async function TicketsPage() {
  const session = await getSession();
  await connectDB();
  const initial = await listTickets(session?.userId ?? "", {
    page: 1,
    limit: 12,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">My tickets</h1>
        <p className="mt-1 text-sm text-slate-500">
          All your ticket codes and check-in status in one place.
        </p>
      </div>
      <MyTickets initial={initial} />
    </div>
  );
}
