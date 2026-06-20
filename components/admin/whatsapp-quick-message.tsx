"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toWaMePk } from "@/lib/whatsapp/phone";
import { statusBody, orderPlacedBody } from "@/lib/whatsapp/messages";
import type { EmailOrder } from "@/lib/email/templates";

// Manual fallback: opens WhatsApp (web/app) with a pre-written message to the
// customer that the admin sends from their own number. Works with no Twilio
// setup. When Twilio IS configured these same messages also go out
// automatically — these buttons remain handy for ad-hoc / re-sends.
export function WhatsAppQuickMessage({ order }: { order: EmailOrder }) {
  const number = toWaMePk(order.customerPhone);

  if (!number) {
    return (
      <p className="text-xs text-muted-foreground">
        {order.customerPhone} isn&apos;t a recognizable Pakistani WhatsApp number.
      </p>
    );
  }

  const link = (text: string) =>
    `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

  const actions: { label: string; text: string }[] = [
    { label: "Receipt", text: orderPlacedBody(order) },
    { label: "Confirmed", text: statusBody(order, "confirmed") },
    { label: "Shipped", text: statusBody(order, "shipped") },
    { label: "Cancelled", text: statusBody(order, "cancelled") },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Open WhatsApp with a pre-written message to {order.customerName.split(" ")[0]}:
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            asChild
            size="sm"
            variant="outline"
            className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
          >
            <a href={link(a.text)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              {a.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
