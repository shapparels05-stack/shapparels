import { Gem, Sparkles, Leaf, Droplet, Ruler, Package, ShieldCheck, type LucideIcon } from "lucide-react";

export type ProductFeatureType = "jewelry" | "bags";

interface Feature {
  icon: LucideIcon;
  label: string;
}

// A row of 4 reassurance features shown on the product page. Jewelry shows
// quality/care badges (Resizeable first for adjustable rings); bags show
// bag-appropriate ones.
export function ProductFeatures({
  type,
  isResizeable,
}: {
  type: ProductFeatureType;
  isResizeable?: boolean;
}) {
  const features: Feature[] =
    type === "jewelry"
      ? [
          isResizeable
            ? { icon: Ruler, label: "Resizeable" }
            : { icon: Gem, label: "High Quality" },
          { icon: Sparkles, label: "Tarnish Resistant" },
          { icon: Leaf, label: "Skin Friendly" },
          { icon: Droplet, label: "Water Resistant" },
        ]
      : [
          { icon: Gem, label: "Premium Quality" },
          { icon: Droplet, label: "Water Resistant" },
          { icon: Package, label: "Spacious" },
          { icon: ShieldCheck, label: "Durable" },
        ];

  return (
    <div className="mt-6 grid grid-cols-4 divide-x divide-border/50 border-y border-border/60 py-4">
      {features.map((f, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-col items-center gap-1.5 px-0.5 text-center sm:px-1"
        >
          <f.icon className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" strokeWidth={1.5} />
          <span className="text-[10px] font-medium leading-tight text-foreground sm:text-xs">
            {f.label}
          </span>
        </div>
      ))}
    </div>
  );
}
