import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
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

    const changed = Object.keys(body).filter((key) => key !== "ticketTypes");
    let nextTypes: Array<{
      _id?: Types.ObjectId;
      name: string;
      price: number;
      quantity: number;
      remaining: number;
    }> | undefined;
    let ticketTypeChanges: { before: unknown; after: unknown } | undefined;

    if (body.ticketTypes) {
      const existing = new Map(
        event.ticketTypes.map((type) => [type._id.toString(), type]),
      );
      const ticketRows = await Ticket.aggregate<{
        _id: Types.ObjectId;
        count: number;
      }>([
        { $match: { event: new Types.ObjectId(id) } },
        { $group: { _id: "$ticketType", count: { $sum: 1 } } },
      ]);
      const soldByType = new Map(
        ticketRows.map((row) => [row._id.toString(), row.count]),
      );
      const soldFor = (typeId: string, reserved: number) =>
        Math.max(reserved, soldByType.get(typeId) ?? 0);
      const kept = new Set<string>();
      nextTypes = [];

      for (const input of body.ticketTypes) {
        if (input.id) {
          if (kept.has(input.id)) {
            return fail("Duplicate ticket type", 400);
          }
          kept.add(input.id);
          const current = existing.get(input.id);
          if (!current) {
            return fail("Unknown ticket type for this event", 400);
          }
          const sold = soldFor(
            current._id.toString(),
            Math.max(0, current.quantity - current.remaining),
          );
          if (input.quantity < sold) {
            return fail(
              `Cannot reduce ${current.name} quantity below ${sold} sold ticket(s)`,
              400,
            );
          }
          nextTypes.push({
            _id: current._id,
            name: input.name,
            price: input.price,
            quantity: input.quantity,
            remaining: input.quantity - sold,
          });
        } else {
          nextTypes.push({
            name: input.name,
            price: input.price,
            quantity: input.quantity,
            remaining: input.quantity,
          });
        }
      }

      for (const current of event.ticketTypes) {
        if (kept.has(current._id.toString())) continue;
        const sold = soldFor(
          current._id.toString(),
          Math.max(0, current.quantity - current.remaining),
        );
        if (sold > 0) {
          return fail(
            `Cannot remove ${current.name}: it has ${sold} sold ticket(s)`,
            400,
          );
        }
      }

      const capacity = body.capacity ?? event.capacity;
      const totalQuantity = nextTypes.reduce(
        (sum, type) => sum + type.quantity,
        0,
      );
      if (totalQuantity > capacity) {
        return fail("Total ticket quantity exceeds capacity", 400);
      }

      ticketTypeChanges = {
        before: event.ticketTypes.map((type) => ({
          id: type._id.toString(),
          name: type.name,
          price: type.price,
          quantity: type.quantity,
          remaining: type.remaining,
        })),
        after: body.ticketTypes.map((type) => ({
          id: type.id ?? null,
          name: type.name,
          price: type.price,
          quantity: type.quantity,
        })),
      };
      changed.push("ticketTypes");
    } else if (body.capacity !== undefined) {
      const totalQuantity = event.ticketTypes.reduce(
        (sum, type) => sum + type.quantity,
        0,
      );
      if (body.capacity < totalQuantity) {
        return fail("Capacity cannot be below total ticket quantity", 400);
      }
    }

    const fields: Partial<typeof body> = { ...body };
    delete fields.ticketTypes;
    event.set(fields);
    if (nextTypes) event.set("ticketTypes", nextTypes);
    await event.save();

    if (changed.length > 0) {
      await logAudit({
        event: id,
        actor: session.userId,
        action: "event_updated",
        summary: `Updated ${changed.join(", ")}`,
        details: {
          fields: changed,
          ...(ticketTypeChanges ? { ticketTypes: ticketTypeChanges } : {}),
        },
      });
    }
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
