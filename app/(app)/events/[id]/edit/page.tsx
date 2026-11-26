import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/EventForm";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getEventById } from "@/lib/queries";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const event = await getEventById(id, session.userId);
  if (!event) notFound();
  if (event.organizer.id !== session.userId) redirect(`/events/${id}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Edit event</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the details below. Attendees will see the new information.
        </p>
      </div>
      <EventForm initial={event} />
    </div>
  );
}
