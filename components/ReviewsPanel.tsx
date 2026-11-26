"use client";

import { useState } from "react";
import type { ReviewDTO, ReviewListResult } from "@/lib/types";

type ModerationAction = "flag" | "unflag" | "remove" | "restore";

export function ReviewsPanel({
  eventId,
  initial,
  canModerate = false,
}: {
  eventId: string;
  initial: ReviewListResult;
  canModerate?: boolean;
}) {
  const [result, setResult] = useState(initial);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function load(page: number) {
    setBusy(true);
    try {
      const response = await fetch(
        `/api/events/${eventId}/reviews?page=${page}&limit=10`,
      );
      const data = (await response.json()) as ReviewListResult & {
        error?: string;
      };
      if (response.ok) setResult(data);
      else setError(data.error ?? "Could not load reviews");
    } catch {
      setError("Could not load reviews");
    } finally {
      setBusy(false);
    }
  }

  async function submit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = (await response.json()) as {
        review?: { id: string; rating: number; comment: string; createdAt: string };
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not add your review");
        return;
      }
      const created = data.review;
      if (
        created?.id &&
        created.rating !== undefined &&
        created.comment !== undefined &&
        created.createdAt
      ) {
        const review: ReviewDTO = {
          id: created.id,
          rating: created.rating,
          comment: created.comment,
          createdAt: created.createdAt,
          flagged: false,
          flagReason: "",
          removed: false,
          user: { id: "me", name: "You" },
        };
        setResult((current) => ({
          ...current,
          total: current.total + 1,
          reviews: [review, ...current.reviews],
        }));
      }
      setComment("");
      setRating(5);
    } catch {
      setError("Could not add your review");
    } finally {
      setBusy(false);
    }
  }

  async function moderate(reviewId: string, action: ModerationAction) {
    setActionBusy(reviewId);
    setError("");
    try {
      const response = await fetch(
        `/api/events/${eventId}/reviews/${reviewId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason: reasons[reviewId] ?? "" }),
        },
      );
      const data = (await response.json()) as {
        review?: {
          flagged: boolean;
          flagReason: string;
          removed: boolean;
        };
        error?: string;
      };
      if (!response.ok || !data.review) {
        setError(data.error ?? "Could not update the review");
        return;
      }
      const updated = data.review;
      setResult((current) => ({
        ...current,
        reviews: current.reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                flagged: updated.flagged,
                flagReason: updated.flagReason,
                removed: updated.removed,
              }
            : review,
        ),
      }));
      setReasons((current) => ({ ...current, [reviewId]: "" }));
    } catch {
      setError("Could not update the review");
    } finally {
      setActionBusy("");
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">
        Reviews {result.total > 0 && `(${result.total})`}
      </h2>

      <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="rating" className="text-sm font-medium">
            Your rating
          </label>
          <select
            id="rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {"★".repeat(value)}
              </option>
            ))}
          </select>
        </div>
        <textarea
          aria-label="Your review"
          rows={2}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share what you thought about this event (optional)"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#d1410c]"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[#d1410c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b53609] disabled:opacity-50"
        >
          {busy ? "Posting..." : "Post review"}
        </button>
      </form>

      {result.reviews.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {result.reviews.map((review) => (
            <li key={review.id} className="py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  {review.user.name}
                </p>
                <span className="text-sm text-[#d1410c]">
                  {"★".repeat(review.rating)}
                </span>
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {canModerate && (review.flagged || review.removed) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {review.flagged && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Flagged: {review.flagReason || "No reason given"}
                    </span>
                  )}
                  {review.removed && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      Hidden from attendees
                    </span>
                  )}
                </div>
              )}
              {canModerate && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    aria-label={`Moderation reason for ${review.user.name}`}
                    placeholder="Moderation reason"
                    maxLength={200}
                    value={reasons[review.id] ?? ""}
                    onChange={(e) =>
                      setReasons((current) => ({
                        ...current,
                        [review.id]: e.target.value,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  />
                  {!review.removed ? (
                    <>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          actionBusy === review.id ||
                          !reasons[review.id]?.trim()
                        }
                        onClick={() => void moderate(review.id, "flag")}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                      >
                        {review.flagged ? "Update flag" : "Flag"}
                      </button>
                      {review.flagged && (
                        <button
                          type="button"
                          disabled={busy || actionBusy === review.id}
                          onClick={() => void moderate(review.id, "unflag")}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                        >
                          Clear flag
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy || actionBusy === review.id}
                        onClick={() => void moderate(review.id, "remove")}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || actionBusy === review.id}
                      onClick={() => void moderate(review.id, "restore")}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Restore
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {result.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={result.page <= 1 || busy}
            onClick={() => void load(result.page - 1)}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            {result.page} / {result.totalPages}
          </span>
          <button
            type="button"
            disabled={result.page >= result.totalPages || busy}
            onClick={() => void load(result.page + 1)}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
