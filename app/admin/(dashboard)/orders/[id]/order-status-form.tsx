"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
  currentTracking?: string | null;
  currentCourier?: string | null;
}

export function OrderStatusForm({
  orderId,
  currentStatus,
  currentTracking,
  currentCourier,
}: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking ?? "");
  const [courier, setCourier] = useState(currentCourier ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (
    nextStatus: string,
    extra: Record<string, string> = {}
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, ...extra }),
      });

      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }

      toast.success(`Order updated to ${nextStatus}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const onSelect = (next: string) => {
    setStatus(next);
    // "shipped" reveals optional tracking fields first — don't auto-submit;
    // the admin confirms with the button below. All other statuses save now.
    if (next === "shipped") return;
    submit(next);
  };

  return (
    <div className="flex flex-col items-end gap-3">
      <Select value={status} onValueChange={onSelect} disabled={saving}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {status === "shipped" && (
        <div className="w-[280px] space-y-3 rounded-lg border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">
            Optional tracking details — included in the customer&apos;s shipping email.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="courier" className="text-xs">Courier</Label>
            <Input
              id="courier"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="TCS, Leopards, M&P…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tracking" className="text-xs">Tracking number</Label>
            <Input
              id="tracking"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. 1234567890"
            />
          </div>
          <Button
            className="w-full"
            disabled={saving}
            onClick={() => submit("shipped", { trackingNumber: tracking, courier })}
          >
            {currentStatus === "shipped" ? "Update & re-notify" : "Mark shipped & notify"}
          </Button>
        </div>
      )}
    </div>
  );
}
