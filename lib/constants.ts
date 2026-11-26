export const EVENT_CATEGORIES = [
  "Conference",
  "Workshop",
  "Music",
  "Sports",
  "Food & Drink",
  "Arts & Culture",
  "Tech",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const MAX_TICKETS_PER_ORDER = 6;
