import { Types } from "mongoose";
import { AuditLog, type AuditAction } from "@/models/AuditLog";

export async function logAudit(entry: {
  event: string;
  actor: string;
  action: AuditAction;
  summary: string;
  details?: Record<string, unknown>;
}) {
  await AuditLog.create({
    event: new Types.ObjectId(entry.event),
    actor: new Types.ObjectId(entry.actor),
    action: entry.action,
    summary: entry.summary,
    details: entry.details ?? {},
  });
}
