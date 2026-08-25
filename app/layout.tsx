import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { PixelPageView } from "@/components/analytics/pixel-page-view";
import { DebugConsole } from "@/components/debug-console";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SH Apparels - Premium Ladies Beauty Products",
    template: "%s | SH Apparels",
  },
  description:
    "Shop premium ladies beauty products including bags, jewelry, cosmetics, accessories & clothing. Cash on Delivery across Pakistan.",
  keywords: [
    "ladies beauty products",
    "bags",
    "jewelry",
    "cosmetics",
    "accessories",
    "clothing",
    "Pakistan",
    "online shopping",
    "SH Apparels",
  ],
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: "SH Apparels",
    url: SITE_URL,
    images: ["/hero-image.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Facebook App ID (set NEXT_PUBLIC_FB_APP_ID) — links the site to the FB app.
  ...(process.env.NEXT_PUBLIC_FB_APP_ID
    ? { other: { "fb:app_id": process.env.NEXT_PUBLIC_FB_APP_ID } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Capture the RAW fbclid from the landing URL and write _fbc in the exact
            fb.1.<ts>.<fbclid> format (unmodified) BEFORE the pixel library loads,
            so the Conversions API sends the click id exactly as it arrived. Only
            sets it when absent (same domain scope) so it never fights the Pixel. */}
        <Script id="fbclid-capture" strategy="beforeInteractive">
          {`
            try {
              var fbclid = new URLSearchParams(location.search).get('fbclid');
              if (fbclid && !/(^|;\\s*)_fbc=/.test(document.cookie)) {
                var parts = location.hostname.split('.');
                var domain = parts.length > 1 ? ';domain=.' + parts.slice(-2).join('.') : '';
                document.cookie = '_fbc=fb.1.' + Date.now() + '.' + fbclid + ';path=/;max-age=7776000;samesite=lax' + domain;
              }
            } catch (e) {}
          `}
        </Script>
        {/* Meta Pixel base code — loaded first (beforeInteractive) per Meta
            guidance. Defines window.fbq + init with no network cost; the heavy
            fbevents.js library loads lazily below and drains the queued events. */}
        <Script id="meta-pixel" strategy="beforeInteractive">
          {`
            !function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[]}(window,document,'script');
            fbq('init', '1549926503362795');
          `}
        </Script>
        <Script
          id="meta-pixel-lib"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        {/* Surface real details of cross-origin "Script error." events: log them
            and tag the Clarity session so the actual message/file/line is
            visible instead of the generic masked error. */}
        <Script id="js-error-reporter" strategy="afterInteractive">
          {`
            window.addEventListener('error', function(e){
              try {
                var msg = e.message || '';
                // Ignore benign in-app-browser / third-party noise we can't control:
                // FB/IG WebView native-bridge teardown, masked cross-origin errors,
                // and the harmless ResizeObserver loop notice.
                if (/Java object is gone|postMessage|ResizeObserver loop/i.test(msg)) return;
                if (msg === 'Script error.' && !e.filename) return;
                var detail = msg + ' @ ' + (e.filename || '?') + ':' + (e.lineno || 0) + ':' + (e.colno || 0);
                console.error('[JS error]', detail, e.error && e.error.stack);
                if (window.clarity) window.clarity('set', 'jsError', detail);
              } catch(_) {}
            });
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1549926503362795&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <Script id="ms-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.crossOrigin="anonymous";t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "x4bvypwoqb");
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </NuqsAdapter>
        <PixelPageView />
        <DebugConsole />
      </body>
    </html>
  );
}
