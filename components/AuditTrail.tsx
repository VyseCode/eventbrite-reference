import type { AuditLogDTO } from "@/lib/types";

export function AuditTrail({ entries }: { entries: AuditLogDTO[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Change history</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No changes recorded yet. Edits to this event and review moderation
          actions appear here.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-slate-100">
          {entries.map((entry) => {
            const fields = entry.details.fields;
            const reason = entry.details.reason;
            return (
              <li key={entry.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {entry.summary}
                  </p>
                  <time
                    dateTime={entry.createdAt}
                    className="text-xs text-slate-400"
                  >
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {Array.isArray(fields) && fields.length > 0
                    ? `Changed: ${fields.join(", ")}`
                    : "Moderation action"}
                  {typeof reason === "string" && reason
                    ? ` · Reason: ${reason}`
                    : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
