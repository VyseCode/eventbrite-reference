import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listEvents } from "@/lib/queries";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    await connectDB();

    return ok(
      await listEvents({
        organizerId: session.userId,
        viewerId: session.userId,
        sort: "upcoming",
        limit: 24,
      }),
    );
  } catch (error) {
    return handleError(error);
  }
}
