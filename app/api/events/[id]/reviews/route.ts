import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listReviews } from "@/lib/queries";
import { objectIdSchema, reviewSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";
import { Review } from "@/models/Review";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(
  request: Request,
  context: RouteContext<"/api/events/[id]/reviews">,
) {
  try {
    const eventId = objectIdSchema.parse((await context.params).id);
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value.trim()) raw[key] = value;
    }
    const query = querySchema.parse(raw);
    const session = await getSession();
    await connectDB();
    const event = await Event.findById(eventId).select("organizer").lean();
    if (!event) return fail("Event not found", 404);
    const isOrganizer = Boolean(
      session && event.organizer.toString() === session.userId,
    );
    return ok(await listReviews(eventId, { ...query, includeRemoved: isOrganizer }));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[id]/reviews">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const eventId = objectIdSchema.parse((await context.params).id);
    const body = reviewSchema.parse(await readJson(request));
    await connectDB();

    if (!(await Event.exists({ _id: eventId }))) {
      return fail("Event not found", 404);
    }
    if (await Review.exists({ user: session.userId, event: eventId })) {
      return fail("You have already reviewed this event", 409);
    }

    const review = await Review.create({
      user: session.userId,
      event: eventId,
      rating: body.rating,
      comment: body.comment ?? "",
    });
    return ok(
      {
        review: {
          id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return fail("You have already reviewed this event", 409);
    }
    return handleError(error);
  }
}
