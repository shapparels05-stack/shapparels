import { CURRENCY } from "@/lib/constants";

// Meta (Facebook) Pixel standard event helper.
// Always sends `currency` alongside `value` so Meta doesn't flag
// "currency missing" / "value missing" warnings on conversion events.

type Fbq = (
  command: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

interface PixelContent {
  id: string;
  quantity: number;
  price: number;
}

interface PixelEventParams {
  value?: number;
  contents?: PixelContent[];
  contentName?: string;
  contentType?: string;
  numItems?: number;
}

function track(eventName: string, params: PixelEventParams = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  const payload: Record<string, unknown> = {};

  // Meta requires currency whenever a monetary value is present.
  if (params.value !== undefined) {
    payload.value = Number(params.value.toFixed(2));
    payload.currency = CURRENCY; // "PKR"
  }
  if (params.contents) {
    payload.contents = params.contents.map((c) => ({
      id: c.id,
      quantity: c.quantity,
      item_price: Number(c.price.toFixed(2)),
    }));
    payload.content_ids = params.contents.map((c) => c.id);
  }
  if (params.contentName) payload.content_name = params.contentName;
  payload.content_type = params.contentType ?? "product";
  if (params.numItems !== undefined) payload.num_items = params.numItems;

  window.fbq("track", eventName, payload);
}

export function trackViewContent(p: {
  id: string;
  name: string;
  value: number;
}) {
  track("ViewContent", {
    value: p.value,
    contentName: p.name,
    contents: [{ id: p.id, quantity: 1, price: p.value }],
  });
}

export function trackAddToCart(p: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  track("AddToCart", {
    value: p.price * p.quantity,
    contentName: p.name,
    contents: [{ id: p.id, quantity: p.quantity, price: p.price }],
  });
}

export function trackInitiateCheckout(p: {
  value: number;
  contents: PixelContent[];
}) {
  track("InitiateCheckout", {
    value: p.value,
    contents: p.contents,
    numItems: p.contents.reduce((sum, c) => sum + c.quantity, 0),
  });
}

export function trackPurchase(p: {
  value: number;
  contents: PixelContent[];
}) {
  track("Purchase", {
    value: p.value,
    contents: p.contents,
    numItems: p.contents.reduce((sum, c) => sum + c.quantity, 0),
  });
}
