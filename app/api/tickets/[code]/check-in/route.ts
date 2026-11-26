import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";

const codeSchema = z.string().trim().min(1).max(40);

export async function POST(
  _request: Request,
  context: RouteContext<"/api/tickets/[code]/check-in">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const code = codeSchema.parse((await context.params).code);
    await connectDB();

    const ticket = await Ticket.findOne({ code })
      .populate({ path: "event", model: Event, select: "organizer title" })
      .lean();
    if (!ticket) return fail("Ticket not found", 404);

    const event = ticket.event as unknown as {
      _id: { toString(): string };
      organizer: { toString(): string };
      title: string;
    } | null;
    if (!event) return fail("Event for this ticket no longer exists", 404);
    if (event.organizer.toString() !== session.userId) {
      return fail("Only the organizer can check in tickets", 403);
    }
    if (ticket.status === "used") {
      return fail("Ticket has already been checked in", 409);
    }

    const updated = await Ticket.findOneAndUpdate(
      { _id: ticket._id, status: "valid" },
      { $set: { status: "used", checkedInAt: new Date() } },
      { new: true },
    ).lean();
    if (!updated) return fail("Ticket has already been checked in", 409);

    return ok({
      code: ticket.code,
      status: "used",
      eventTitle: event.title,
      checkedInAt: updated.checkedInAt?.toISOString() ?? null,
    });
  } catch (error) {
    return handleError(error);
  }
}
