import { randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectIdSchema, purchaseSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";
import { Order } from "@/models/Order";
import { Ticket } from "@/models/Ticket";

type Reserved = { id: string; quantity: number; price: number };

type LeanEventTicketType = {
  _id: Types.ObjectId;
  name: string;
  price: number;
  remaining: number;
};

async function rollback(eventId: string, reserved: Reserved[]) {
  for (const item of reserved) {
    await Event.updateOne(
      { _id: eventId, "ticketTypes._id": item.id },
      {
        $inc: {
          "ticketTypes.$.remaining": item.quantity,
          ticketsSold: -item.quantity,
          revenue: -item.price * item.quantity,
        },
      },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[id]/purchase">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const eventId = objectIdSchema.parse((await context.params).id);
    const body = purchaseSchema.parse(await readJson(request));
    await connectDB();

    const event = (await Event.findById(eventId)
      .select("title end ticketTypes")
      .lean()) as unknown as {
      end: Date;
      ticketTypes: LeanEventTicketType[];
    } | null;
    if (!event) return fail("Event not found", 404);
    if (event.end.getTime() <= Date.now()) {
      return fail("This event has ended. Ticket sales are closed.", 409);
    }

    const types: Array<{
      item: (typeof body.items)[number];
      type: LeanEventTicketType;
    }> = [];
    for (const item of body.items) {
      const type = event.ticketTypes.find(
        (candidate) => candidate._id.toString() === item.ticketTypeId,
      );
      if (!type) return fail("Unknown ticket type for this event", 400);
      types.push({ item, type });
    }

    for (const { item, type } of types) {
      if (type.remaining < item.quantity) {
        return fail(
          type.remaining === 0
            ? `${type.name} is sold out`
            : `Only ${type.remaining} ${type.name} ticket(s) remain`,
          409,
        );
      }
    }

    const reserved: Reserved[] = [];
    for (const { item, type } of types) {
      const result = await Event.updateOne(
        {
          _id: eventId,
          "ticketTypes._id": new Types.ObjectId(item.ticketTypeId),
          "ticketTypes.remaining": { $gte: item.quantity },
        },
        {
          $inc: {
            "ticketTypes.$.remaining": -item.quantity,
            ticketsSold: item.quantity,
            revenue: type.price * item.quantity,
          },
        },
      );
      if (result.modifiedCount !== 1) {
        await rollback(eventId, reserved);
        return fail(`${type.name} just sold out. Please try again.`, 409);
      }
      reserved.push({
        id: item.ticketTypeId,
        quantity: item.quantity,
        price: type.price,
      });
    }

    const total = types.reduce(
      (sum, { item, type }) => sum + item.quantity * type.price,
      0,
    );
    const order = await Order.create({
      user: session.userId,
      event: eventId,
      items: types.map(({ item, type }) => ({
        ticketType: new Types.ObjectId(item.ticketTypeId),
        name: type.name,
        quantity: item.quantity,
        unitPrice: type.price,
      })),
      total,
    });

    const ticketDocs = types.flatMap(({ item, type }) =>
      Array.from({ length: item.quantity }, () => ({
        code: `EV-${randomBytes(6).toString("hex").toUpperCase()}`,
        event: new Types.ObjectId(eventId),
        ticketType: new Types.ObjectId(item.ticketTypeId),
        order: order._id,
        owner: new Types.ObjectId(session.userId),
        pricePaid: type.price,
      })),
    );
    const tickets = await Ticket.insertMany(ticketDocs);

    return ok(
      {
        order: {
          id: order._id.toString(),
          total,
          ticketCount: tickets.length,
        },
        tickets: tickets.map((ticket) => ({
          id: ticket._id.toString(),
          code: ticket.code,
          status: ticket.status,
        })),
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}
