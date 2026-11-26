import { z } from "zod";
import { getSession } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { listTickets } from "@/lib/queries";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(["valid", "used"]).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("You must be signed in", 401);

    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (value.trim()) raw[key] = value;
    }
    const query = querySchema.parse(raw);
    await connectDB();

    return ok(await listTickets(session.userId, query));
  } catch (error) {
    return handleError(error);
  }
}
