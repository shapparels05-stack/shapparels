import { CURRENCY } from "@/lib/constants";

// TikTok Pixel browser events. Called from the shared helpers in fb-pixel.ts so
// every Meta event is mirrored to TikTok. No-op when the TikTok base code isn't
// on the page (no Pixel ID saved in Settings, or an admin page).

interface Ttq {
  page: () => void;
  track: (
    event: string,
    params?: Record<string, unknown>,
    options?: { event_id?: string }
  ) => void;
}

declare global {
  interface Window {
    ttq?: Ttq;
  }
}

export interface TikTokContent {
  id: string;
  quantity: number;
  price: number;
}

function ttq(): Ttq | null {
  if (typeof window === "undefined" || !window.ttq || typeof window.ttq.track !== "function") {
    return null;
  }
  return window.ttq;
}

export function ttPageView() {
  try {
    ttq()?.page();
  } catch {
    /* ignore */
  }
}

export function ttTrack(
  event: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  params: { value?: number; contents?: TikTokContent[]; contentName?: string },
  eventId: string
) {
  const t = ttq();
  if (!t) return;

  const payload: Record<string, unknown> = { content_type: "product" };
  if (params.value !== undefined) {
    payload.value = Number(params.value.toFixed(2));
    payload.currency = CURRENCY;
  }
  if (params.contents) {
    payload.contents = params.contents.map((c) => ({
      content_id: c.id,
      content_type: "product",
      ...(params.contentName ? { content_name: params.contentName } : {}),
      quantity: c.quantity,
      price: Number(c.price.toFixed(2)),
    }));
  }

  try {
    t.track(event, payload, { event_id: eventId });
  } catch {
    /* ignore */
  }
}
