import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectIdSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";
import { SavedEvent } from "@/models/SavedEvent";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/events/[id]/save">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const eventId = objectIdSchema.parse((await context.params).id);
    await connectDB();

    if (!(await Event.exists({ _id: eventId }))) {
      return fail("Event not found", 404);
    }

    const existing = await SavedEvent.findOne({
      user: session.userId,
      event: eventId,
    }).lean();
    if (existing) {
      await SavedEvent.deleteOne({ _id: existing._id });
      return ok({ saved: false });
    }

    await SavedEvent.create({ user: session.userId, event: eventId });
    return ok({ saved: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return ok({ saved: true });
    }
    return handleError(error);
  }
}
