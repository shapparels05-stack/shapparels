"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
}

function buildTree(categories: Category[]): (Category & { children: Category[] })[] {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function getIndentedName(cat: Category, allCategories: Category[]): string {
  const parts: string[] = [];
  let current: Category | undefined = cat;
  while (current) {
    parts.unshift(current.name);
    current = allCategories.find((c) => c.id === current!.parentId);
  }
  return parts.join(" > ");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newParentId, setNewParentId] = useState<string>("");
  const [editParentId, setEditParentId] = useState<string>("");
  const [newImage, setNewImage] = useState<string>("");
  const [editImage, setEditImage] = useState<string>("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Categories that can be parents (level 0 or 1, so children are at most level 2)
  const possibleParents = categories.filter((c) => c.level < 2);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      parentId: newParentId && newParentId !== "none" ? newParentId : null,
      image: newImage || null,
    };

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const newCat = await res.json();
      setCategories([...categories, newCat]);
      setShowNew(false);
      setNewParentId("");
      setNewImage("");
      toast.success("Category created");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create category");
    }
  };

  const handleUpdate = async (id: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      parentId: editParentId && editParentId !== "none" ? editParentId : null,
      image: editImage || null,
    };

    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      setCategories(categories.map((c) => (c.id === id ? updated : c)));
      setEditing(null);
      setEditParentId("");
      setEditImage("");
      toast.success("Category updated");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category and all its subcategories?")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

    if (res.ok) {
      // Remove this category and all children
      const idsToRemove = new Set<string>();
      const collectIds = (parentId: string) => {
        idsToRemove.add(parentId);
        categories.filter((c) => c.parentId === parentId).forEach((c) => collectIds(c.id));
      };
      collectIds(id);
      setCategories(categories.filter((c) => !idsToRemove.has(c.id)));
      toast.success("Category deleted");
    } else {
      toast.error("Failed to delete category");
    }
  };

  const renderCategoryRow = (cat: Category, depth: number = 0) => {
    if (editing === cat.id) {
      return (
        <Card key={cat.id}>
          <CardContent className="pt-6">
            <form onSubmit={(e) => handleUpdate(cat.id, e)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={cat.name} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input name="slug" defaultValue={cat.slug} required />
                </div>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select
                    value={editParentId}
                    onValueChange={setEditParentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (root)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (root)</SelectItem>
                      {possibleParents
                        .filter((p) => p.id !== cat.id)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {getIndentedName(p, categories)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input name="sortOrder" type="number" defaultValue={cat.sortOrder} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={cat.description || ""} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <ImageUpload
                  images={editImage ? [editImage] : []}
                  onChange={(imgs) => setEditImage(imgs[imgs.length - 1] || "")}
                />
                <p className="text-xs text-muted-foreground">
                  Shown on the category tiles. If left empty, a product image from this category is used as a fallback.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(null); setEditParentId(""); setEditImage(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      );
    }

    return (
      <div
        key={cat.id}
        className="flex items-center justify-between rounded-lg border border-border/50 p-4"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-center gap-2">
          {depth > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <div>
            <p className="font-medium">{cat.name}</p>
            <p className="text-xs text-muted-foreground">
              /{cat.slug} · Level: {cat.level} · Sort: {cat.sortOrder}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(cat.id); setEditParentId(cat.parentId || "none"); setEditImage(cat.image || ""); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  const renderTree = (nodes: (Category & { children: Category[] })[], depth: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    for (const node of nodes) {
      result.push(renderCategoryRow(node, depth));
      if (node.children.length > 0) {
        result.push(...renderTree(node.children as any, depth + 1));
      }
    }
    return result;
  };

  const tree = buildTree(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Name *</Label>
                  <Input id="new-name" name="name" required onChange={(e) => {
                    const slugInput = document.getElementById("new-slug") as HTMLInputElement;
                    if (slugInput) slugInput.value = generateSlug(e.target.value);
                  }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-slug">Slug *</Label>
                  <Input id="new-slug" name="slug" required />
                </div>
                <div className="space-y-2">
                  <Label>Parent Category</Label>
                  <Select value={newParentId} onValueChange={setNewParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="None (root)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (root)</SelectItem>
                      {possibleParents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {getIndentedName(p, categories)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-sort">Sort Order</Label>
                  <Input id="new-sort" name="sortOrder" type="number" defaultValue="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-desc">Description</Label>
                <Textarea id="new-desc" name="description" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Category Image</Label>
                <ImageUpload
                  images={newImage ? [newImage] : []}
                  onChange={(imgs) => setNewImage(imgs[imgs.length - 1] || "")}
                />
                <p className="text-xs text-muted-foreground">
                  Shown on the category tiles. If left empty, a product image from this category is used as a fallback.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowNew(false); setNewParentId(""); setNewImage(""); }}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No categories yet. Create your first category.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {renderTree(tree)}
        </div>
      )}
    </div>
  );
}
