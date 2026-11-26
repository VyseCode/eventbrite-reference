import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IOrderItem {
  _id: Types.ObjectId;
  ticketType: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  items: IOrderItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    ticketType: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ event: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);
