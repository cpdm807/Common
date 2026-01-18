"use client";

import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [sentiment, setSentiment] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sentiment) {
      alert("Please select thumbs up or down");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: "global",
          sentiment,
          comment: comment || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Thanks for your feedback!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your input helps make Common better.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 inline-block"
        >
          ← Back to home
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold mb-2">Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Help us improve Common
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sentiment */}
          <div>
            <label className="block text-sm font-medium mb-3">
              How was your experience?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSentiment("up")}
                className={`flex-1 p-6 border-2 rounded-lg transition-all ${
                  sentiment === "up"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-2">👍</div>
                <div className="font-medium">Positive</div>
              </button>
              <button
                type="button"
                onClick={() => setSentiment("down")}
                className={`flex-1 p-6 border-2 rounded-lg transition-all ${
                  sentiment === "down"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-2">👎</div>
                <div className="font-medium">Negative</div>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Additional comments (optional)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="Tell us more..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {comment.length}/280 characters
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || !sentiment}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Submit feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
