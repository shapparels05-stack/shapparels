"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/admin/image-upload";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  textColor: string;
  headline: string | null;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  sortOrder: number;
  isActive: boolean;
}

type Draft = Omit<Banner, "id">;

const emptyDraft: Draft = {
  imageUrl: "",
  mobileImageUrl: "",
  textColor: "light",
  headline: "",
  subheadline: "",
  ctaLabel: "",
  ctaHref: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.json())
      .then(setBanners)
      .finally(() => setLoading(false));
  }, []);

  const startNew = () => {
    setDraft({ ...emptyDraft, sortOrder: banners.length });
    setEditingId(null);
    setShowNew(true);
  };

  const startEdit = (b: Banner) => {
    setDraft({
      imageUrl: b.imageUrl,
      mobileImageUrl: b.mobileImageUrl || "",
      textColor: b.textColor || "light",
      headline: b.headline || "",
      subheadline: b.subheadline || "",
      ctaLabel: b.ctaLabel || "",
      ctaHref: b.ctaHref || "",
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setEditingId(b.id);
    setShowNew(false);
  };

  const cancel = () => {
    setShowNew(false);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.imageUrl) {
      toast.error("Please upload a slide image");
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/banners/${editingId}` : "/api/banners", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setBanners((prev) =>
        isEdit ? prev.map((b) => (b.id === saved.id ? saved : b)) : [...prev, saved]
      );
      toast.success(isEdit ? "Slide updated" : "Slide added");
      cancel();
    } catch {
      toast.error("Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      toast.success("Slide deleted");
    } else {
      toast.error("Failed to delete slide");
    }
  };

  const editor = (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">
          {editingId ? "Edit Slide" : "New Slide"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Desktop Image *</Label>
            <ImageUpload
              images={draft.imageUrl ? [draft.imageUrl] : []}
              onChange={(imgs) => setDraft((d) => ({ ...d, imageUrl: imgs[imgs.length - 1] || "" }))}
            />
            <p className="text-xs text-muted-foreground">
              Wide / landscape (e.g. 1600×900). Keep key content centered.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Mobile Image (optional)</Label>
            <ImageUpload
              images={draft.mobileImageUrl ? [draft.mobileImageUrl] : []}
              onChange={(imgs) =>
                setDraft((d) => ({ ...d, mobileImageUrl: imgs[imgs.length - 1] || "" }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Taller / portrait (e.g. 900×1200) so phones don&apos;t crop it. Falls back to the desktop image if empty.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={draft.headline || ""}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              placeholder="e.g. Eid Collection"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtext</Label>
            <Input
              value={draft.subheadline || ""}
              onChange={(e) => setDraft((d) => ({ ...d, subheadline: e.target.value }))}
              placeholder="Short supporting line"
            />
          </div>
          <div className="space-y-2">
            <Label>Button Label</Label>
            <Input
              value={draft.ctaLabel || ""}
              onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
              placeholder="e.g. Shop Now"
            />
          </div>
          <div className="space-y-2">
            <Label>Button Link</Label>
            <Input
              value={draft.ctaHref || ""}
              onChange={(e) => setDraft((d) => ({ ...d, ctaHref: e.target.value }))}
              placeholder="/products or /category/jewelry"
            />
          </div>
          <div className="space-y-2">
            <Label>Text Color</Label>
            <Select
              value={draft.textColor}
              onValueChange={(v) => setDraft((d) => ({ ...d, textColor: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light (for dark images)</SelectItem>
                <SelectItem value="dark">Dark (for light images)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={draft.sortOrder}
              onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-7">
            <Checkbox
              id="banner-active"
              checked={draft.isActive}
              onCheckedChange={(c) => setDraft((d) => ({ ...d, isActive: Boolean(c) }))}
            />
            <Label htmlFor="banner-active">Active (visible on site)</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" size="sm" onClick={cancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Homepage Carousel</h1>
          <p className="text-muted-foreground">{banners.length} slide(s)</p>
        </div>
        {!showNew && !editingId && (
          <Button onClick={startNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Slide
          </Button>
        )}
      </div>

      {showNew && editor}

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading...</p>
      ) : banners.length === 0 && !showNew ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No slides yet. Add your first slide.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((b) =>
            editingId === b.id ? (
              <div key={b.id}>{editor}</div>
            ) : (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
              >
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                  {b.imageUrl && (
                    <Image
                      src={b.imageUrl}
                      alt={b.headline || ""}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="112px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.headline || "(no headline)"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Sort: {b.sortOrder}
                    {b.ctaHref ? ` · → ${b.ctaHref}` : ""}
                    {b.isActive ? "" : " · Hidden"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(b)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
