export const SITE_NAME = "SH Apparels";
export const SITE_DESCRIPTION = "Premium Ladies Beauty Products - Bags, Jewelry, Cosmetics, Accessories & Clothing";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
export const CURRENCY = "PKR";
export const CURRENCY_SYMBOL = "Rs.";
export const DEFAULT_COUNTRY = "Pakistan";
export const SHIPPING_COST = 200; // PKR flat rate
export const FREE_SHIPPING_THRESHOLD = 5000; // PKR

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Special Offers", href: "/special-offers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
