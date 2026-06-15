import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getCategories } from "@/lib/db/queries/categories";
import { AdminProductsList } from "@/components/admin/admin-products-list";

export default async function AdminProductsPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Search, filter by category, and manage products.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <AdminProductsList
        categories={categories.map((c) => ({ id: c.id, name: c.name, level: c.level }))}
      />
    </div>
  );
}
