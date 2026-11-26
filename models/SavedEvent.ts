import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ISavedEvent {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  createdAt: Date;
}

const savedEventSchema = new Schema<ISavedEvent>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

savedEventSchema.index({ user: 1, event: 1 }, { unique: true });
savedEventSchema.index({ user: 1, createdAt: -1 });

export const SavedEvent: Model<ISavedEvent> =
  (models.SavedEvent as Model<ISavedEvent>) ||
  model<ISavedEvent>("SavedEvent", savedEventSchema);
