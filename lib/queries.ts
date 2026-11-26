import { Types } from "mongoose";
import { Event } from "@/models/Event";
import { Review } from "@/models/Review";
import { SavedEvent } from "@/models/SavedEvent";
import { Ticket } from "@/models/Ticket";
import { User } from "@/models/User";
import type {
  EventDTO,
  EventListResult,
  ReviewDTO,
  ReviewListResult,
  TicketDTO,
  TicketListResult,
} from "@/lib/types";

type LeanOrganizer = { _id: Types.ObjectId; name: string };

type LeanTicketType = {
  _id: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  remaining: number;
};

type LeanEvent = {
  _id: Types.ObjectId;
  organizer: LeanOrganizer | null;
  title: string;
  description: string;
  category: string;
  venue: string;
  location: string;
  start: Date;
  end: Date;
  capacity: number;
  ticketsSold: number;
  ticketTypes: LeanTicketType[];
  createdAt: Date;
};

type Rating = { average: number; count: number };

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function savedIdsFor(viewerId: string, ids: Types.ObjectId[]) {
  if (!viewerId || !Types.ObjectId.isValid(viewerId) || ids.length === 0) {
    return new Set<string>();
  }
  const docs = await SavedEvent.find({
    user: viewerId,
    event: { $in: ids },
  })
    .select("event")
    .lean();
  return new Set(docs.map((doc) => doc.event.toString()));
}

async function ratingsFor(ids: Types.ObjectId[]) {
  const result = new Map<string, Rating>();
  if (ids.length === 0) return result;
  const rows = await Review.aggregate<{
    _id: Types.ObjectId;
    average: number;
    count: number;
  }>([
    { $match: { event: { $in: ids } } },
    {
      $group: {
        _id: "$event",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);
  for (const row of rows) {
    result.set(row._id.toString(), {
      average: Math.round(row.average * 10) / 10,
      count: row.count,
    });
  }
  return result;
}

function toDTO(
  doc: LeanEvent,
  saved: Set<string>,
  ratings: Map<string, Rating>,
): EventDTO {
  const rating = ratings.get(doc._id.toString());
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    venue: doc.venue,
    location: doc.location,
    start: doc.start.toISOString(),
    end: doc.end.toISOString(),
    capacity: doc.capacity,
    ticketsSold: doc.ticketsSold ?? 0,
    ticketTypes: (doc.ticketTypes ?? []).map((type) => ({
      id: type._id.toString(),
      name: type.name,
      price: type.price,
      quantity: type.quantity,
      remaining: type.remaining,
    })),
    organizer: {
      id: doc.organizer?._id.toString() ?? "",
      name: doc.organizer?.name ?? "Unknown organizer",
    },
    savedByMe: saved.has(doc._id.toString()),
    ratingAverage: rating?.average ?? 0,
    reviewsCount: rating?.count ?? 0,
  };
}

export type ListEventsOptions = {
  q?: string;
  category?: string;
  location?: string;
  from?: string;
  to?: string;
  sort?: "upcoming" | "newest";
  page?: number;
  limit?: number;
  viewerId?: string;
  organizerId?: string;
};

export async function listEvents(
  options: ListEventsOptions,
): Promise<EventListResult> {
  const page = Math.min(Math.max(options.page ?? 1, 1), 1000);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 24);
  const filter: Record<string, unknown> = {};

  if (options.q) filter.$text = { $search: options.q };
  if (options.organizerId && Types.ObjectId.isValid(options.organizerId)) {
    filter.organizer = new Types.ObjectId(options.organizerId);
  }
  if (options.category) filter.category = options.category;
  if (options.location) {
    filter.location = new RegExp(escapeRegex(options.location), "i");
  }
  if (options.from || options.to) {
    const range: Record<string, Date> = {};
    if (options.from) range.$gte = new Date(options.from);
    if (options.to) range.$lte = new Date(options.to);
    filter.start = range;
  }

  const sort: Record<string, 1 | -1> =
    options.sort === "newest" ? { createdAt: -1 } : { start: 1 };
  const [docs, total] = await Promise.all([
    Event.find(filter)
      .populate({ path: "organizer", model: User, select: "name" })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<LeanEvent[]>,
    Event.countDocuments(filter),
  ]);

  const ids = docs.map((doc) => doc._id);
  const [saved, ratings] = await Promise.all([
    savedIdsFor(options.viewerId ?? "", ids),
    ratingsFor(ids),
  ]);

  return {
    events: docs.map((doc) => toDTO(doc, saved, ratings)),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

export async function getEventById(
  id: string,
  viewerId: string,
): Promise<EventDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = (await Event.findById(id)
    .populate({ path: "organizer", model: User, select: "name" })
    .lean()) as unknown as LeanEvent | null;
  if (!doc) return null;

  const ids = [doc._id];
  const [saved, ratings] = await Promise.all([
    savedIdsFor(viewerId, ids),
    ratingsFor(ids),
  ]);
  return toDTO(doc, saved, ratings);
}

type LeanTicketEvent = {
  _id: Types.ObjectId;
  title: string;
  start: Date;
  venue: string;
  location: string;
  ticketTypes: Array<{ _id: Types.ObjectId; name: string }>;
};

type LeanTicket = {
  _id: Types.ObjectId;
  code: string;
  event: LeanTicketEvent | null;
  ticketType: Types.ObjectId;
  order: Types.ObjectId;
  pricePaid: number;
  status: "valid" | "used";
  checkedInAt: Date | null;
  createdAt: Date;
};

export async function listTickets(
  userId: string,
  options: { page?: number; limit?: number; status?: "valid" | "used" },
): Promise<TicketListResult> {
  const page = Math.min(Math.max(options.page ?? 1, 1), 1000);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const filter: Record<string, unknown> = { owner: userId };
  if (options.status) filter.status = options.status;

  const [docs, total] = await Promise.all([
    Ticket.find(filter)
      .populate({
        path: "event",
        model: Event,
        select: "title start venue location ticketTypes",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<LeanTicket[]>,
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets: docs.map<TicketDTO>((doc) => {
      const type = doc.event?.ticketTypes.find(
        (item) => item._id.toString() === doc.ticketType.toString(),
      );
      return {
        id: doc._id.toString(),
        code: doc.code,
        orderId: doc.order.toString(),
        eventId: doc.event?._id.toString() ?? "",
        eventTitle: doc.event?.title ?? "Event removed",
        eventStart: doc.event?.start.toISOString() ?? "",
        venue: doc.event?.venue ?? "",
        location: doc.event?.location ?? "",
        ticketTypeName: type?.name ?? "Ticket",
        pricePaid: doc.pricePaid,
        status: doc.status,
        checkedInAt: doc.checkedInAt?.toISOString() ?? null,
        purchasedAt: doc.createdAt.toISOString(),
      };
    }),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

export async function listReviews(
  eventId: string,
  options: { page?: number; limit?: number },
): Promise<ReviewListResult> {
  const page = Math.min(Math.max(options.page ?? 1, 1), 1000);
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);

  const [docs, total] = await Promise.all([
    Review.find({ event: eventId })
      .populate({ path: "user", model: User, select: "name" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<
      Array<{
        _id: Types.ObjectId;
        user: { _id: Types.ObjectId; name: string } | null;
        rating: number;
        comment: string;
        createdAt: Date;
      }>
    >,
    Review.countDocuments({ event: eventId }),
  ]);

  return {
    reviews: docs.map<ReviewDTO>((doc) => ({
      id: doc._id.toString(),
      user: {
        id: doc.user?._id.toString() ?? "",
        name: doc.user?.name ?? "Former attendee",
      },
      rating: doc.rating,
      comment: doc.comment,
      createdAt: doc.createdAt.toISOString(),
    })),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

export type EventTicketDTO = {
  id: string;
  code: string;
  attendee: string;
  ticketTypeName: string;
  status: "valid" | "used";
  checkedInAt: string | null;
  purchasedAt: string;
};

export async function listEventTickets(
  eventId: string,
  options: { page?: number; limit?: number; status?: "valid" | "used" },
): Promise<{
  tickets: EventTicketDTO[];
  page: number;
  totalPages: number;
  total: number;
}> {
  const page = Math.min(Math.max(options.page ?? 1, 1), 1000);
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const filter: Record<string, unknown> = { event: eventId };
  if (options.status) filter.status = options.status;

  const [docs, total] = await Promise.all([
    Ticket.find(filter)
      .populate({ path: "owner", model: User, select: "name" })
      .populate({ path: "event", model: Event, select: "ticketTypes" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown as Promise<
      Array<
        LeanTicket & {
          owner: { _id: Types.ObjectId; name: string } | null;
        }
      >
    >,
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets: docs.map((doc) => {
      const type = doc.event?.ticketTypes.find(
        (item) => item._id.toString() === doc.ticketType.toString(),
      );
      return {
        id: doc._id.toString(),
        code: doc.code,
        attendee: doc.owner?.name ?? "Unknown",
        ticketTypeName: type?.name ?? "Ticket",
        status: doc.status,
        checkedInAt: doc.checkedInAt?.toISOString() ?? null,
        purchasedAt: doc.createdAt.toISOString(),
      };
    }),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}
