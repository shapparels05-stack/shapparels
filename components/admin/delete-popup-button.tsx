"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeletePopupButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!window.confirm(`Delete popup "${label}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promo-popups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Popup deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete popup");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
      aria-label="Delete popup"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
