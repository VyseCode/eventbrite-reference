import { z } from "zod";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getEventById, listEvents } from "@/lib/queries";
import { eventCreateSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";

const isoString = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date");

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  location: z.string().trim().max(120).optional(),
  from: isoString.optional(),
  to: isoString.optional(),
  sort: z.enum(["upcoming", "newest"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(24).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value.trim()) raw[key] = value;
    }
    const query = listSchema.parse(raw);
    const session = await getSession();
    await connectDB();

    return ok(
      await listEvents({
        ...query,
        viewerId: session?.userId ?? "",
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const body = eventCreateSchema.parse(await readJson(request));
    await connectDB();

    const event = await Event.create({
      organizer: session.userId,
      title: body.title,
      description: body.description,
      category: body.category,
      venue: body.venue,
      location: body.location,
      start: body.start,
      end: body.end,
      capacity: body.capacity,
      ticketTypes: body.ticketTypes.map((type) => ({
        ...type,
        remaining: type.quantity,
      })),
    });

    return ok(await getEventById(event._id.toString(), session.userId), 201);
  } catch (error) {
    return handleError(error);
  }
}
