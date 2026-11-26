import { Schema, model, models, type Model, type Types } from "mongoose";

export const AUDIT_ACTIONS = [
  "event_updated",
  "review_flagged",
  "review_unflagged",
  "review_removed",
  "review_restored",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface IAuditLog {
  _id: Types.ObjectId;
  event: Types.ObjectId;
  actor: Types.ObjectId;
  action: AuditAction;
  summary: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    summary: { type: String, required: true, trim: true, maxlength: 200 },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ event: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) ||
  model<IAuditLog>("AuditLog", auditLogSchema);
