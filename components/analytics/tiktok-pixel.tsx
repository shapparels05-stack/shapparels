import { getSiteSettings } from "@/lib/db/queries/settings";
import { TIKTOK_PIXEL_ID } from "@/lib/constants";

// TikTok Pixel IDs are short uppercase alphanumeric codes. The ID is pasted by
// an admin and injected into an inline script, so anything else is rejected.
const PIXEL_ID_RE = /^[A-Z0-9]{8,40}$/;

// TikTok Pixel base code, admin-configurable (Settings → TikTok Pixel ID).
// Rendered as a plain inline script so the ttq queue exists before hydration;
// page views are sent by PixelPageView (not here) so excluded routes and
// client-side navigations behave the same as for the Meta Pixel.
export async function TikTokPixel() {
  let pixelId = TIKTOK_PIXEL_ID;
  try {
    const saved = (await getSiteSettings()).tiktok_pixel_id;
    if (saved !== undefined) pixelId = saved.trim().toUpperCase();
  } catch {
    /* ignore */
  }
  if (!PIXEL_ID_RE.test(pixelId)) return null;

  return (
    <script
      id="tiktok-pixel"
      dangerouslySetInnerHTML={{
        __html: `!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${pixelId}');
}(window, document, 'ttq');`,
      }}
    />
  );
}
