import { CURRENCY } from "@/lib/constants";

// Meta (Facebook) Pixel standard event helper.
// Always sends `currency` alongside `value` so Meta doesn't flag
// "currency missing" / "value missing" warnings on conversion events.

type Fbq = (
  command: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
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

// Generate a unique id shared between the browser event and its server copy.
function genEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Mirror a browser event to the Conversions API with the same event_id so Meta
// can deduplicate. Fire-and-forget; keepalive lets it survive navigation.
function mirrorToServer(
  eventName: string,
  eventId: string,
  payload: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/meta/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData: payload,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

interface TrackOptions {
  /** Reuse a specific event_id (e.g. deterministic Purchase id). */
  eventId?: string;
  /** Skip the server mirror when the server sends this event itself. */
  skipServer?: boolean;
}

function track(eventName: string, params: PixelEventParams = {}, options: TrackOptions = {}) {
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

  const eventId = options.eventId ?? genEventId();
  window.fbq("track", eventName, payload, { eventID: eventId });
  if (!options.skipServer) mirrorToServer(eventName, eventId, payload);
}

export function trackPageView() {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
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

// Deterministic Purchase event_id derived from the order number, so the
// browser event and the server event (sent at order creation) share an id and
// Meta deduplicates them. Keep this in sync with the server (orders route).
export function purchaseEventId(orderNumber: string) {
  return `purchase_${orderNumber}`;
}

export function trackPurchase(p: {
  orderNumber: string;
  value: number;
  contents: PixelContent[];
}) {
  track(
    "Purchase",
    {
      value: p.value,
      contents: p.contents,
      numItems: p.contents.reduce((sum, c) => sum + c.quantity, 0),
    },
    // The server sends the authoritative Purchase (with hashed customer data)
    // from the order-creation route; the browser just supplies the matching id.
    { eventId: purchaseEventId(p.orderNumber), skipServer: true }
  );
}
