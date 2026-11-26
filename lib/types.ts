export type TicketTypeDTO = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  remaining: number;
};

export type EventDTO = {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  location: string;
  start: string;
  end: string;
  capacity: number;
  ticketsSold: number;
  ticketTypes: TicketTypeDTO[];
  organizer: { id: string; name: string };
  savedByMe: boolean;
  ratingAverage: number;
  reviewsCount: number;
};

export type EventListResult = {
  events: EventDTO[];
  page: number;
  totalPages: number;
  total: number;
};

export type TicketDTO = {
  id: string;
  code: string;
  orderId: string;
  eventId: string;
  eventTitle: string;
  eventStart: string;
  venue: string;
  location: string;
  ticketTypeName: string;
  pricePaid: number;
  status: "valid" | "used";
  checkedInAt: string | null;
  purchasedAt: string;
};

export type TicketListResult = {
  tickets: TicketDTO[];
  page: number;
  totalPages: number;
  total: number;
};

export type ReviewDTO = {
  id: string;
  user: { id: string; name: string };
  rating: number;
  comment: string;
  flagged: boolean;
  flagReason: string;
  removed: boolean;
  createdAt: string;
};

export type ReviewListResult = {
  reviews: ReviewDTO[];
  page: number;
  totalPages: number;
  total: number;
};

export type DashboardSummary = {
  events: number;
  ticketsSold: number;
  revenue: number;
  checkedIn: number;
  checkInRate: number;
};

export type DashboardEvent = {
  id: string;
  title: string;
  start: string;
  capacity: number;
  ticketsSold: number;
  revenue: number;
  checkedIn: number;
};

export type DashboardDTO = {
  summary: DashboardSummary;
  events: DashboardEvent[];
};

export type AuditLogDTO = {
  id: string;
  action: string;
  summary: string;
  actor: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogListResult = {
  entries: AuditLogDTO[];
  page: number;
  totalPages: number;
  total: number;
};
