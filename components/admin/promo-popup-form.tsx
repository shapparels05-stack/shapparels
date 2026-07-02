"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

interface PromoPopupFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export function PromoPopupForm({ initialData }: PromoPopupFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>(initialData?.imageUrl ? [initialData.imageUrl] : []);
  const [frequency, setFrequency] = useState<string>(initialData?.frequency || "daily");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) {
      toast.error("Upload a poster image");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      title: (formData.get("title") as string) || null,
      imageUrl: images[0],
      linkUrl: (formData.get("linkUrl") as string) || null,
      frequency,
      isActive: formData.get("isActive") === "on",
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
    };

    try {
      const url = initialData
        ? `/api/admin/promo-popups/${initialData.id}`
        : "/api/admin/promo-popups";
      const res = await fetch(url, {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Failed to save popup");
        return;
      }
      toast.success(initialData ? "Popup updated" : "Popup created");
      router.push("/admin/promo-popups");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Poster Image *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ImageUpload images={images} onChange={(imgs) => setImages(imgs.slice(-1))} />
          <p className="text-xs text-muted-foreground">
            One poster image. Portrait works best for a popup. Uploading a new one replaces it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title / label (internal)</Label>
            <Input id="title" name="title" defaultValue={initialData?.title} placeholder="e.g. Eid Sale" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkUrl">Link when clicked</Label>
            <Input
              id="linkUrl"
              name="linkUrl"
              defaultValue={initialData?.linkUrl}
              placeholder="e.g. https://www.shapparels.pk/special-offers/combo001"
            />
            <p className="text-xs text-muted-foreground">Leave blank to make the poster non-clickable.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Show frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Once per day</SelectItem>
                  <SelectItem value="session">Once per session</SelectItem>
                  <SelectItem value="always">Every visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Priority (lower = shown first)</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={initialData?.sortOrder ?? 0} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="isActive" name="isActive" defaultChecked={initialData?.isActive ?? true} />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : initialData ? "Update Popup" : "Create Popup"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
