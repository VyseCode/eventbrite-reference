import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  rating: number;
  comment: string;
  flagged: boolean;
  flagReason: string;
  flaggedBy: Types.ObjectId | null;
  flaggedAt: Date | null;
  removed: boolean;
  removedBy: Types.ObjectId | null;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", trim: true, maxlength: 1000 },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "", trim: true, maxlength: 200 },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    flaggedAt: { type: Date, default: null },
    removed: { type: Boolean, default: false },
    removedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    removedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, event: 1 }, { unique: true });
reviewSchema.index({ event: 1, createdAt: -1 });
reviewSchema.index({ event: 1, removed: 1, createdAt: -1 });

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);
