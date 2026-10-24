// Only Netlify's trusted request context decides country. Never trust a query,
// browser locale, timezone, or a caller-supplied country header.
export default async (request, context) => {
  const country = context.geo?.country?.code;
  const gpc = request.headers.get("Sec-GPC") === "1";
  const optedOut = /(?:^|;\s*)delta_measurement=off(?:;|$)/.test(request.headers.get("Cookie") || "");
  return Response.json({
    version: 1,
    eligible: country === "US" && !gpc && !optedOut,
    region: country === "US" ? "US" : country ? "other" : "unknown",
    source: "netlify-edge",
  }, { headers: {
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Netlify-CDN-Cache-Control": "no-store",
    "Vary": "Cookie, Sec-GPC",
    "X-Content-Type-Options": "nosniff",
  }});
};

export const config = { path: "/measurement-policy", method: "GET" };
