import { Types } from "mongoose";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { objectIdSchema, reviewModerationSchema } from "@/lib/schemas";
import { Event } from "@/models/Event";
import { Review } from "@/models/Review";

const auditAction = {
  flag: "review_flagged",
  unflag: "review_unflagged",
  remove: "review_removed",
  restore: "review_restored",
} as const;

const summary = {
  flag: "Flagged a review",
  unflag: "Cleared a review flag",
  remove: "Removed a review",
  restore: "Restored a review",
} as const;

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/events/[id]/reviews/[reviewId]">,
) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const params = await context.params;
    const eventId = objectIdSchema.parse(params.id);
    const reviewId = objectIdSchema.parse(params.reviewId);
    const body = reviewModerationSchema.parse(await readJson(request));
    await connectDB();

    const event = await Event.findById(eventId).select("organizer").lean();
    if (!event) return fail("Event not found", 404);
    if (event.organizer.toString() !== session.userId) {
      return fail("Only the organizer can moderate reviews", 403);
    }

    const review = await Review.findOne({ _id: reviewId, event: eventId });
    if (!review) return fail("Review not found", 404);

    const reason = body.reason ?? "";
    if (body.action === "flag") {
      review.flagged = true;
      review.flagReason = reason;
      review.flaggedBy = new Types.ObjectId(session.userId);
      review.flaggedAt = new Date();
    } else if (body.action === "unflag") {
      review.flagged = false;
      review.flagReason = "";
      review.flaggedBy = null;
      review.flaggedAt = null;
    } else if (body.action === "remove") {
      review.removed = true;
      review.removedBy = new Types.ObjectId(session.userId);
      review.removedAt = new Date();
    } else {
      review.removed = false;
      review.removedBy = null;
      review.removedAt = null;
    }
    await review.save();

    await logAudit({
      event: eventId,
      actor: session.userId,
      action: auditAction[body.action],
      summary: summary[body.action],
      details: { reviewId, reason },
    });

    return ok({
      review: {
        id: reviewId,
        flagged: review.flagged,
        flagReason: review.flagReason,
        removed: review.removed,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
