// A bare test page with ONLY the Meta Pixel and no other scripts. Open it inside
// the Facebook/Instagram in-app browser to check whether the "Java object is
// gone" error still appears — if it does here (with nothing but the Pixel), the
// issue is the Pixel/in-app-browser itself, not our site's other code.
export const dynamic = "force-static";

const PIXEL_ID = process.env.META_PIXEL_ID || "1549926503362795";

export function GET() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Pixel Test — SH Apparels</title>
<!-- Meta Pixel Code (standard, unmodified) -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" alt=""/></noscript>
<!-- End Meta Pixel Code -->
</head>
<body style="font-family:system-ui;padding:2rem;line-height:1.6">
<h1>Pixel test page</h1>
<p>This page runs <strong>only the Meta Pixel</strong> — no other scripts.</p>
<p>Open it inside the Facebook / Instagram app to test whether the
"Java object is gone" error still occurs.</p>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
