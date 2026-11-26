import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listEventTickets } from "@/lib/queries";
import { objectIdSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(["valid", "used"]).optional(),
});

export async function GET(
  request: Request,
  context: RouteContext<"/api/events/[id]/tickets">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const eventId = objectIdSchema.parse((await context.params).id);
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value.trim()) raw[key] = value;
    }
    const query = querySchema.parse(raw);
    await connectDB();

    const event = await Event.findById(eventId).select("organizer").lean();
    if (!event) return fail("Event not found", 404);
    if (event.organizer.toString() !== session.userId) {
      return fail("Only the organizer can view attendee tickets", 403);
    }

    return ok(await listEventTickets(eventId, query));
  } catch (error) {
    return handleError(error);
  }
}
