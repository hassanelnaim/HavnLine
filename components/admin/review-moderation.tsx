"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, X } from "lucide-react";
import type { DbReview } from "@/lib/database/types";
import { moderateReviewAction } from "@/app/actions/platform-admin";
import { Button } from "@/components/ui/button";

export function ReviewModeration({ pendingReviews }: { pendingReviews: DbReview[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleModerate(id: string, status: "approved" | "rejected") {
    startTransition(async () => {
      await moderateReviewAction(id, status);
      router.refresh();
    });
  }

  if (pendingReviews.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-display text-[15px] font-semibold text-ink">Pending reviews ({pendingReviews.length})</h2>
      <div className="mt-3 space-y-3">
        {pendingReviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-border bg-paper p-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
              ))}
            </div>
            <p className="mt-2 text-[13.5px] text-text">{review.review_text}</p>
            <div className="mt-2 text-[12px] text-text-muted">{review.reviewer_name} · {review.business_name}</div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="brand" onClick={() => handleModerate(review.id, "approved")}><Check className="h-3.5 w-3.5" /> Approve</Button>
              <Button size="sm" variant="outline" onClick={() => handleModerate(review.id, "rejected")}><X className="h-3.5 w-3.5" /> Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
