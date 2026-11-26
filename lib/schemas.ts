import { z } from "zod";
import { EVENT_CATEGORIES, MAX_TICKETS_PER_ORDER } from "@/lib/constants";

const dateString = z
  .string()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Enter a valid date")
  .transform((value) => new Date(value));

export const objectIdSchema = z
  .string()
  .refine((value) => /^[a-f\d]{24}$/i.test(value), "Invalid id");

const ticketTypeInput = z.object({
  name: z.string().trim().min(1, "Ticket name is required").max(80),
  price: z.number().min(0, "Price cannot be negative").max(10000),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000),
});

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(140),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters")
      .max(5000),
    category: z.enum(EVENT_CATEGORIES),
    venue: z.string().trim().min(2, "Venue is required").max(140),
    location: z.string().trim().min(2, "Location is required").max(120),
    start: dateString,
    end: dateString,
    capacity: z.number().int().min(1, "Capacity must be at least 1").max(100000),
    ticketTypes: z.array(ticketTypeInput).min(1, "Add at least one ticket type").max(10),
  })
  .refine((data) => data.end > data.start, {
    message: "End must be after start",
    path: ["end"],
  })
  .refine(
    (data) =>
      data.ticketTypes.reduce((sum, type) => sum + type.quantity, 0) <=
      data.capacity,
    { message: "Total ticket quantity exceeds capacity", path: ["ticketTypes"] },
  );

const ticketTypePatchInput = ticketTypeInput.extend({
  id: objectIdSchema.optional(),
});

export const eventPatchSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  category: z.enum(EVENT_CATEGORIES).optional(),
  venue: z.string().trim().min(2).max(140).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  start: dateString.optional(),
  end: dateString.optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
  ticketTypes: z
    .array(ticketTypePatchInput)
    .min(1, "Add at least one ticket type")
    .max(10)
    .optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
  comment: z.string().trim().max(1000, "Review is too long").optional(),
});

export const reviewModerationSchema = z
  .object({
    action: z.enum(["flag", "unflag", "remove", "restore"]),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((data) => data.action !== "flag" || Boolean(data.reason), {
    message: "A reason is required when flagging a review",
    path: ["reason"],
  });

export const purchaseSchema = z
  .object({
    items: z
      .array(
        z.object({
          ticketTypeId: objectIdSchema,
          quantity: z
            .number()
            .int()
            .min(1, "Quantity must be at least 1")
            .max(MAX_TICKETS_PER_ORDER, "Too many tickets in one order"),
        }),
      )
      .min(1, "Select at least one ticket type")
      .max(5, "Too many ticket types in one order"),
  })
  .refine(
    (data) =>
      data.items.reduce((sum, item) => sum + item.quantity, 0) <=
      MAX_TICKETS_PER_ORDER,
    { message: `You can buy at most ${MAX_TICKETS_PER_ORDER} tickets per order` },
  )
  .refine(
    (data) =>
      new Set(data.items.map((item) => item.ticketTypeId)).size ===
      data.items.length,
    { message: "Duplicate ticket types are not allowed" },
  );
