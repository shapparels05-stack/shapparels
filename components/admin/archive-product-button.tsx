"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArchiveProductButtonProps {
  productId: string;
  isActive: boolean;
  onChanged?: () => void;
}

/**
 * Toggle a product's storefront visibility.
 * - When active → "Archive": hides from the public site, kept in admin.
 * - When archived → "Restore": brings it back to the storefront.
 */
export function ArchiveProductButton({ productId, isActive, onChanged }: ArchiveProductButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(isActive ? "Product archived" : "Product restored");
      if (onChanged) onChanged();
      else router.refresh();
    } catch {
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={loading}
      title={isActive ? "Archive (hide from store)" : "Restore (show on store)"}
      className={isActive ? "" : "text-primary"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <Archive className="h-4 w-4" />
      ) : (
        <ArchiveRestore className="h-4 w-4" />
      )}
    </Button>
  );
}
