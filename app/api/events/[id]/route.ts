import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getEventById } from "@/lib/queries";
import { eventPatchSchema, objectIdSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import { SavedEvent } from "@/models/SavedEvent";
import { Ticket } from "@/models/Ticket";

type Context = RouteContext<"/api/events/[id]">;

export async function GET(_request: Request, context: Context) {
  try {
    const id = objectIdSchema.parse((await context.params).id);
    const session = await getSession();
    await connectDB();
    const event = await getEventById(id, session?.userId ?? "");
    if (!event) return fail("Event not found", 404);
    return ok(event);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const id = objectIdSchema.parse((await context.params).id);
    const body = eventPatchSchema.parse(await readJson(request));
    await connectDB();

    const event = await Event.findById(id);
    if (!event) return fail("Event not found", 404);
    if (event.organizer.toString() !== session.userId) {
      return fail("Only the organizer can edit this event", 403);
    }

    const start = body.start ?? event.start;
    const end = body.end ?? event.end;
    if (end <= start) return fail("End must be after start", 400);

    const totalQuantity = event.ticketTypes.reduce(
      (sum, type) => sum + type.quantity,
      0,
    );
    if (body.capacity !== undefined && body.capacity < totalQuantity) {
      return fail("Capacity cannot be below total ticket quantity", 400);
    }

    event.set(body);
    await event.save();
    return ok(await getEventById(id, session.userId));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const id = objectIdSchema.parse((await context.params).id);
    await connectDB();

    const event = await Event.findById(id).select("organizer").lean();
    if (!event) return fail("Event not found", 404);
    if (event.organizer.toString() !== session.userId) {
      return fail("Only the organizer can delete this event", 403);
    }

    await Promise.all([
      Ticket.deleteMany({ event: id }),
      Order.deleteMany({ event: id }),
      Review.deleteMany({ event: id }),
      SavedEvent.deleteMany({ event: id }),
      Event.deleteOne({ _id: id }),
    ]);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
