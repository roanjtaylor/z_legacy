"use client";

import { useState } from "react";

export default function FeedbackWidget() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          timestamp: new Date().toISOString(),
        }),
      });
      setSubmitted(true);
    } catch {
      // Best-effort — don't block the user
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
        <p className="text-lg font-medium text-foreground">
          Thanks for your feedback!
        </p>
        <p className="text-sm text-muted mt-1">
          This helps us improve VCGPT for all founders.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Was this useful?
      </h3>
      <p className="text-sm text-muted mb-4">Rate your VCGPT experience</p>

      {/* Star rating */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="cursor-pointer transition-colors"
          >
            <svg
              className={`w-8 h-8 ${
                (hover || rating) >= star
                  ? "text-verdict-amber"
                  : "text-border"
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any thoughts or suggestions? (optional)"
        className="w-full p-3 border border-border rounded-lg text-sm text-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
        rows={3}
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="mt-3 px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {submitting ? "Sending..." : "Send Feedback"}
      </button>
    </div>
  );
}
