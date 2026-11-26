import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/constants";

export interface ITicketType {
  _id: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  remaining: number;
}

export interface IEvent {
  _id: Types.ObjectId;
  organizer: Types.ObjectId;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  location: string;
  start: Date;
  end: Date;
  capacity: number;
  ticketTypes: ITicketType[];
  ticketsSold: number;
  revenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema<ITicketType>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 10000 },
    remaining: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const eventSchema = new Schema<IEvent>(
  {
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      required: true,
      index: true,
    },
    venue: { type: String, required: true, trim: true, maxlength: 140 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1, max: 100000 },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
    ticketsSold: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

eventSchema.pre("validate", async function () {
  if (this.end <= this.start) {
    this.invalidate("end", "End must be after start");
  }
  if (this.ticketTypes.length === 0) {
    this.invalidate("ticketTypes", "Add at least one ticket type");
  }
  const total = this.ticketTypes.reduce((sum, type) => sum + type.quantity, 0);
  if (total > this.capacity) {
    this.invalidate("ticketTypes", "Total ticket quantity exceeds event capacity");
  }
  for (const type of this.ticketTypes) {
    if (type.remaining > type.quantity) {
      this.invalidate("ticketTypes", "Remaining cannot exceed quantity");
    }
  }
});

eventSchema.index({ organizer: 1, start: 1 });
eventSchema.index({ category: 1, start: 1 });
eventSchema.index({ location: 1, start: 1 });
eventSchema.index({ createdAt: -1 });
eventSchema.index({ title: "text", description: "text", venue: "text", location: "text" });

export const Event: Model<IEvent> =
  (models.Event as Model<IEvent>) || model<IEvent>("Event", eventSchema);
