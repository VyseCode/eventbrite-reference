import { EventBrowser } from "@/components/EventBrowser";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { listEvents } from "@/lib/queries";

export const metadata = { title: "Discover events" };

type Search = {
  q?: string;
  category?: string;
  location?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
  limit?: string;
};

function validDate(value?: string) {
  return value && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const session = await getSession();
  await connectDB();

  const initial = await listEvents({
    q: params.q,
    category: EVENT_CATEGORIES.find((item) => item === params.category),
    location: params.location,
    from: validDate(params.from),
    to: validDate(params.to),
    sort: params.sort === "newest" ? "newest" : "upcoming",
    page: Number(params.page) || 1,
    limit: Number(params.limit) || 12,
    viewerId: session?.userId ?? "",
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Discover events</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find something you love, then grab your tickets in seconds.
        </p>
      </div>
      <EventBrowser initial={initial} />
    </div>
  );
}
