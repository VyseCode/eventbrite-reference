import { EventForm } from "@/components/EventForm";

export const metadata = { title: "Create event" };

export default function NewEventPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Create an event</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set the details and ticket types. You can edit most fields later.
        </p>
      </div>
      <EventForm />
    </div>
  );
}
