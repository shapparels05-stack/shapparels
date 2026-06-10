"use client";

import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  ANNOUNCEMENT_ICONS,
  ANNOUNCEMENT_ICON_OPTIONS,
} from "@/components/layout/announcement-icons";

const NO_ICON = "none";

interface Announcement {
  id: string;
  text: string;
  icon: string | null;
  href: string | null;
  sortOrder: number;
  isActive: boolean;
}

type Draft = Omit<Announcement, "id">;

const emptyDraft: Draft = { text: "", icon: null, href: "", sortOrder: 0, isActive: true };

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const startNew = () => {
    setDraft({ ...emptyDraft, sortOrder: items.length });
    setEditingId(null);
    setShowNew(true);
  };

  const startEdit = (a: Announcement) => {
    setDraft({
      text: a.text,
      icon: a.icon,
      href: a.href || "",
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    });
    setEditingId(a.id);
    setShowNew(false);
  };

  const cancel = () => {
    setShowNew(false);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const save = async () => {
    if (!draft.text.trim()) {
      toast.error("Please enter the announcement text");
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/announcements/${editingId}` : "/api/announcements", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      setItems((prev) =>
        isEdit ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved]
      );
      toast.success(isEdit ? "Announcement updated" : "Announcement added");
      cancel();
    } catch {
      toast.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } else {
      toast.error("Failed to delete announcement");
    }
  };

  const editor = (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">
          {editingId ? "Edit Announcement" : "New Announcement"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Text *</Label>
          <Input
            value={draft.text}
            onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
            placeholder="e.g. 🚚 Free shipping on orders above Rs. 5,000"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <Select
              value={draft.icon || NO_ICON}
              onValueChange={(v) => setDraft((d) => ({ ...d, icon: v === NO_ICON ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="No icon" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ICON}>No icon</SelectItem>
                {ANNOUNCEMENT_ICON_OPTIONS.map((opt) => {
                  const Icon = ANNOUNCEMENT_ICONS[opt.key];
                  return (
                    <SelectItem key={opt.key} value={opt.key}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {opt.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <Input
              value={draft.href || ""}
              onChange={(e) => setDraft((d) => ({ ...d, href: e.target.value }))}
              placeholder="/products"
            />
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
              id="ann-active"
              checked={draft.isActive}
              onCheckedChange={(c) => setDraft((d) => ({ ...d, isActive: Boolean(c) }))}
            />
            <Label htmlFor="ann-active">Active (visible on site)</Label>
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
          <h1 className="font-serif text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            {items.length} message(s) · shown in the scrolling top bar
          </p>
        </div>
        {!showNew && !editingId && (
          <Button onClick={startNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Announcement
          </Button>
        )}
      </div>

      {showNew && editor}

      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading...</p>
      ) : items.length === 0 && !showNew ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No announcements yet. Add your first message.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) =>
            editingId === a.id ? (
              <div key={a.id}>{editor}</div>
            ) : (
              <div
                key={a.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {a.icon && ANNOUNCEMENT_ICONS[a.icon]
                      ? (() => {
                          const Icon = ANNOUNCEMENT_ICONS[a.icon];
                          return <Icon className="h-4 w-4 shrink-0 text-primary" />;
                        })()
                      : null}
                    {a.text}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Sort: {a.sortOrder}
                    {a.href ? ` · → ${a.href}` : ""}
                    {a.isActive ? "" : " · Hidden"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(a)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
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
