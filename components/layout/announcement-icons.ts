import {
  Truck,
  RotateCcw,
  BadgeCheck,
  Sparkles,
  Gift,
  Percent,
  Tag,
  Clock,
  ShieldCheck,
  Star,
  Heart,
  Megaphone,
  Flame,
  type LucideIcon,
} from "lucide-react";

// Curated icon set for announcements. Keys are stored in the DB.
export const ANNOUNCEMENT_ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  "rotate-ccw": RotateCcw,
  "badge-check": BadgeCheck,
  sparkles: Sparkles,
  gift: Gift,
  percent: Percent,
  tag: Tag,
  clock: Clock,
  "shield-check": ShieldCheck,
  star: Star,
  heart: Heart,
  megaphone: Megaphone,
  flame: Flame,
};

export const ANNOUNCEMENT_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "truck", label: "Truck (shipping)" },
  { key: "rotate-ccw", label: "Returns" },
  { key: "badge-check", label: "Verified / COD" },
  { key: "shield-check", label: "Shield" },
  { key: "percent", label: "Discount" },
  { key: "tag", label: "Tag / Sale" },
  { key: "gift", label: "Gift" },
  { key: "sparkles", label: "Sparkles / New" },
  { key: "flame", label: "Hot / Trending" },
  { key: "clock", label: "Limited time" },
  { key: "star", label: "Star" },
  { key: "heart", label: "Heart" },
  { key: "megaphone", label: "Megaphone" },
];
