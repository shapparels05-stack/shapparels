"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarRatingInput } from "./star-rating";
import { toast } from "sonner";

interface ReviewFormProps {
  productId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    if (rating < 1) {
      setErrors({ rating: "Please pick a rating" });
      return;
    }

    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      productId,
      rating,
      title: (formData.get("title") as string) || "",
      body: (formData.get("body") as string) || "",
      authorName: (formData.get("authorName") as string) || "",
      authorEmail: (formData.get("authorEmail") as string) || "",
      website: (formData.get("website") as string) || "", // honeypot
    };

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of result.errors) {
            if (err.path?.[0]) fieldErrors[err.path[0]] = err.message;
          }
          setErrors(fieldErrors);
        } else {
          toast.error(result.error || "Something went wrong");
        }
        return;
      }

      toast.success("Thanks! Your review will appear once approved.");
      form.reset();
      setRating(0);
      onSubmitted?.();
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-serif text-lg font-semibold">Write a Review</h3>

      <div className="space-y-2">
        <Label>Your Rating *</Label>
        <StarRatingInput value={rating} onChange={setRating} />
        {errors.rating && <p className="text-xs text-destructive">{errors.rating}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="authorName">Name *</Label>
          <Input id="authorName" name="authorName" required placeholder="Your name" />
          {errors.authorName && <p className="text-xs text-destructive">{errors.authorName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="authorEmail">Email (optional)</Label>
          <Input id="authorEmail" name="authorEmail" type="email" placeholder="your@email.com" />
          {errors.authorEmail && <p className="text-xs text-destructive">{errors.authorEmail}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input id="title" name="title" placeholder="Sum up your experience" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Review *</Label>
        <Textarea id="body" name="body" required rows={4} placeholder="What did you like or dislike?" />
        {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
      </div>

      {/* Honeypot — visually hidden, ignored by humans, filled by bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
