"use client";

import { useState } from "react";
import type { ReviewDTO, ReviewListResult } from "@/lib/types";

export function ReviewsPanel({
  eventId,
  initial,
}: {
  eventId: string;
  initial: ReviewListResult;
}) {
  const [result, setResult] = useState(initial);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
