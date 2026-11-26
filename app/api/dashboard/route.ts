import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { getDashboard } from "@/lib/queries";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);
    await connectDB();
    return ok(await getDashboard(session.userId));
  } catch (error) {
    return handleError(error);
  }
}
