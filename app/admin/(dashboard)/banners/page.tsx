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
import { HeroCarousel } from "@/components/home/hero-carousel";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  textColor: string;
  textPosition: string;
  textVAlign: string;
  scrim: boolean;
  mobileTextColor: string | null;
  mobileTextPosition: string | null;
  mobileTextVAlign: string | null;
  mobileScrim: boolean | null;
  hideTextOnMobile: boolean;
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
  textPosition: "center",
  textVAlign: "center",
  scrim: false,
  mobileTextColor: null,
  mobileTextPosition: null,
  mobileTextVAlign: null,
  mobileScrim: null,
  hideTextOnMobile: false,
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
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

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
      textPosition: b.textPosition || "center",
      textVAlign: b.textVAlign || "center",
      scrim: Boolean(b.scrim),
      mobileTextColor: b.mobileTextColor ?? null,
      mobileTextPosition: b.mobileTextPosition ?? null,
      mobileTextVAlign: b.mobileTextVAlign ?? null,
      mobileScrim: b.mobileScrim ?? null,
      hideTextOnMobile: Boolean(b.hideTextOnMobile),
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
        {/* Live preview with device toggle */}
        {draft.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Live preview</Label>
              <div className="flex gap-1 rounded-md border border-border p-0.5">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPreviewDevice(d)}
                    className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
                      previewDevice === d ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {/* Desktop ≈ 70vh wide hero; mobile ≈ a phone frame */}
            <div
              className={
                previewDevice === "mobile"
                  ? "mx-auto w-[320px] overflow-hidden rounded-lg border border-border"
                  : "overflow-hidden rounded-lg border border-border"
              }
            >
              <HeroCarousel
                slides={[
                  {
                    id: "preview",
                    imageUrl: draft.imageUrl,
                    mobileImageUrl: draft.mobileImageUrl || null,
                    textColor: draft.textColor,
                    textPosition: draft.textPosition,
                    textVAlign: draft.textVAlign,
                    scrim: draft.scrim,
                    mobileTextColor: draft.mobileTextColor,
                    mobileTextPosition: draft.mobileTextPosition,
                    mobileTextVAlign: draft.mobileTextVAlign,
                    mobileScrim: draft.mobileScrim,
                    hideTextOnMobile: draft.hideTextOnMobile,
                    headline: draft.headline,
                    subheadline: draft.subheadline,
                    ctaLabel: draft.ctaLabel,
                    ctaHref: draft.ctaHref,
                  },
                ]}
                forceVariant={previewDevice}
                unoptimized
                heightClass={previewDevice === "mobile" ? "h-[480px]" : "h-72 sm:h-80"}
              />
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Approximate preview — text sizes scale to the real device on the live site.
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Desktop Image *</Label>
            <ImageUpload
              images={draft.imageUrl ? [draft.imageUrl] : []}
              onChange={(imgs) => setDraft((d) => ({ ...d, imageUrl: imgs[imgs.length - 1] || "" }))}
            />
            <p className="text-xs text-muted-foreground">
              Wide / landscape, about 21:9 — e.g. <strong>2000×780</strong> — to fill the 70vh hero with minimal cropping.
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
              Portrait, about 3:4 — e.g. <strong>1000×1300</strong> — so phones don&apos;t crop it. Falls back to the desktop image if empty.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Headline</Label>
            <Input
              value={draft.headline || ""}
              onChange={(e) => setDraft((d) => ({ ...d, headline: e.target.value }))}
              placeholder="e.g. Elegance *Redefined*"
            />
            <p className="text-xs text-muted-foreground">
              Wrap any words in <strong>*asterisks*</strong> to show them in gold — e.g.{" "}
              <code>Elegance *Redefined*</code> or <code>Eid *Sale* Now</code>.
            </p>
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
            <Label>Text Position</Label>
            <Select
              value={draft.textPosition}
              onValueChange={(v) => setDraft((d) => ({ ...d, textPosition: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left (image subject on right)</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right (image subject on left)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vertical Position</Label>
            <Select
              value={draft.textVAlign}
              onValueChange={(v) => setDraft((d) => ({ ...d, textVAlign: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="center">Middle</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
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
              id="banner-scrim"
              checked={draft.scrim}
              onCheckedChange={(c) => setDraft((d) => ({ ...d, scrim: Boolean(c) }))}
            />
            <Label htmlFor="banner-scrim">Soft fade behind text (readability)</Label>
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

        {/* Mobile overrides — leave on "Same as desktop" to inherit */}
        <div className="rounded-lg border border-border/60 p-4">
          <p className="mb-3 text-sm font-medium">Mobile overrides (optional)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Mobile Text Color</Label>
              <Select
                value={draft.mobileTextColor ?? "inherit"}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, mobileTextColor: v === "inherit" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Same as desktop</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Position</Label>
              <Select
                value={draft.mobileTextPosition ?? "inherit"}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, mobileTextPosition: v === "inherit" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Same as desktop</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Vertical</Label>
              <Select
                value={draft.mobileTextVAlign ?? "inherit"}
                onValueChange={(v) =>
                  setDraft((d) => ({ ...d, mobileTextVAlign: v === "inherit" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Same as desktop</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Middle</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Fade</Label>
              <Select
                value={draft.mobileScrim === null ? "inherit" : draft.mobileScrim ? "on" : "off"}
                onValueChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    mobileScrim: v === "inherit" ? null : v === "on",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Same as desktop</SelectItem>
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <Checkbox
                id="hide-text-mobile"
                checked={draft.hideTextOnMobile}
                onCheckedChange={(c) => setDraft((d) => ({ ...d, hideTextOnMobile: Boolean(c) }))}
              />
              <Label htmlFor="hide-text-mobile">
                Hide all text on mobile (for images with text baked in)
              </Label>
            </div>
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
