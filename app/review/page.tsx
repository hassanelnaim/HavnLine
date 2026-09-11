"use client";
import { useState } from "react";
import Link from "next/link";
import { Star, Check } from "lucide-react";
import { submitReviewAction } from "@/app/actions/reviews";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ReviewPage() {
  const [businessName, setBusinessName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitReviewAction({ businessName, reviewerName, rating, reviewText });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error || "Could not submit your review.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-[22px] font-semibold text-ink">Thank you</h1>
        <p className="mt-2 max-w-sm text-[13.5px] text-text-muted">
          Your review has been submitted and will appear on our homepage once it's been reviewed.
        </p>
        <Link href="/" className="mt-6 text-[13px] font-medium text-brand hover:underline">Back to HavnLine</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link href="/"><Logo /></Link>
        <h1 className="mt-6 font-display text-[24px] font-semibold text-ink">Leave a review</h1>
        <p className="mt-1 text-[13.5px] text-text-muted">Using HavnLine for your business? Tell other owners what it's actually like.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {error && <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}

          <div>
            <Label>Your rating</Label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} aria-label={`${star} stars`}>
                  <Star className={`h-8 w-8 ${star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="businessName">Your business name</Label>
            <Input id="businessName" className="mt-1.5" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="reviewerName">Your name</Label>
            <Input id="reviewerName" className="mt-1.5" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="reviewText">Your review</Label>
            <Textarea id="reviewText" rows={5} className="mt-1.5" value={reviewText} onChange={(e) => setReviewText(e.target.value)} required placeholder="What's it been like using HavnLine?" />
          </div>

          <Button type="submit" variant="brand" className="w-full" disabled={submitting}>{submitting ? "Submitting…" : "Submit review"}</Button>
          <p className="text-center text-[11.5px] text-text-faint">Reviews are checked before appearing publicly — yours may take a little while to show up.</p>
        </form>
      </div>
    </div>
  );
}
