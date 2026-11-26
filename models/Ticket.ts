import { Schema, model, models, type Model, type Types } from "mongoose";

export type TicketStatus = "valid" | "used";

export interface ITicket {
  _id: Types.ObjectId;
  code: string;
  event: Types.ObjectId;
  ticketType: Types.ObjectId;
  order: Types.ObjectId;
  owner: Types.ObjectId;
  pricePaid: number;
  status: TicketStatus;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    ticketType: { type: Schema.Types.ObjectId, required: true },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pricePaid: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["valid", "used"],
      default: "valid",
      index: true,
    },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketSchema.index({ owner: 1, createdAt: -1 });
ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ event: 1, createdAt: -1 });

export const Ticket: Model<ITicket> =
  (models.Ticket as Model<ITicket>) || model<ITicket>("Ticket", ticketSchema);
