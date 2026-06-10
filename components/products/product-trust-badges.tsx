import { Truck, RotateCcw, BadgeCheck } from "lucide-react";
import { CURRENCY_SYMBOL, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: `On orders above ${CURRENCY_SYMBOL} ${FREE_SHIPPING_THRESHOLD.toLocaleString()}`,
  },
  {
    icon: RotateCcw,
    title: "7-Day Returns",
    subtitle: "Easy returns & exchanges",
  },
  {
    icon: BadgeCheck,
    title: "Cash on Delivery",
    subtitle: "Pay when you receive",
  },
];

export function ProductTrustBadges() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-card/50 p-4 sm:grid-cols-3">
      {badges.map(({ icon: Icon, title, subtitle }) => (
        <div key={title} className="flex items-center gap-3">
          <Icon className="h-6 w-6 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
