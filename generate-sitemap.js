const fs = require("fs");
const path = require("path");

const BASE_URL = "https://shunya.so";
const WEB_DIR = __dirname;
const TODAY = new Date().toISOString().split("T")[0];

// Pages excluded from the sitemap
const EXCLUDE = new Set([
  "start-registration",
  "how-it-works",
  "about",
  "thank-you",
  "thank-you-ca",
  "thank-you-startup-india",
  "thank-you-company-closure",
  "thank-you-ccfs-2026",
  "thank-you-gst-filing",
  "thank-you-itr-filing",
  "thank-you-gst-refund-filing",
  "thank-you-gstr-9-gstr-9c-filing",
  "thank-you-callback",
  "thank-you-payment",
  "15ca-15cb/15ca-15cb-google-ads-meta-ads-india",
  "15ca-15cb/index",
]);

// Priority rules by slug pattern
function getPriority(slug) {
  if (slug === "/") return 1.0;
  if (slug === "/15ca-15cb" || slug === "/startup-india" || slug === "/company-closure" || slug === "/ccfs-2026-company-closure" || slug === "/gst-registration" || slug === "/gst-return-filing" || slug === "/itr-filing" || slug === "/gst-refund-filing" || slug === "/gstr-9-gstr-9c-filing" || slug === "/company-registration" || slug === "/tools") return 0.9;
  if (slug === "/consultation" || slug === "/how-it-works") return 0.8;
  if (slug === "/blogs" || slug === "/about") return 0.7;
  if (
    slug === "/privacy-policy" ||
    slug === "/terms-conditions" ||
    slug === "/cancellation-refund"
  )
    return 0.3;
  if (slug.startsWith("/blogs/")) return 0.6;
  if (slug.startsWith("/15ca-15cb/")) return 0.7;
  if (slug.startsWith("/company-closure/")) return 0.7;
  if (slug.startsWith("/gst-registration/")) return 0.7;
  if (slug.startsWith("/itr-filing/")) return 0.7;
  if (slug.startsWith("/startup-india/")) return 0.7;
  if (slug.startsWith("/gst-refund-filing/")) return 0.7;
  if (slug.startsWith("/gstr-9-gstr-9c-filing/")) return 0.7;
  if (slug.startsWith("/company-registration/")) return 0.7;
  if (slug.startsWith("/tools/")) return 0.7;
  return 0.5;
}

function getChangefreq(slug) {
  if (slug === "/" || slug === "/blogs") return "weekly";
  if (slug === "/privacy-policy" || slug === "/terms-conditions" || slug === "/cancellation-refund")
    return "yearly";
  return "monthly";
}

function collectHtmlFiles(dir, rootDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const urls = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "blogs" || entry.name === "15ca-15cb" || entry.name === "company-closure" || entry.name === "gst-registration" || entry.name === "itr-filing" || entry.name === "startup-india" || entry.name === "gst-refund-filing" || entry.name === "gstr-9-gstr-9c-filing" || entry.name === "company-registration" || entry.name === "tools") {
        urls.push(...collectHtmlFiles(fullPath, rootDir));
      }
      continue;
    }

    if (!entry.name.endsWith(".html")) continue;

    const relative = path.relative(rootDir, fullPath);
    const slug = relative === "index.html"
      ? "/"
      : "/" + relative.replace(/\.html$/, "").replace(/\\/g, "/");

    const base = slug.replace(/^\//, "");
    if (EXCLUDE.has(base)) continue;

    urls.push(slug);
  }

  return urls;
}

const slugs = collectHtmlFiles(WEB_DIR, WEB_DIR).sort((a, b) => {
  // Homepage first, then by path
  if (a === "/") return -1;
  if (b === "/") return 1;
  return a.localeCompare(b);
});

const entries = slugs.map((slug) => `  <url>
    <loc>${BASE_URL}${slug === "/" ? "/" : slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${getChangefreq(slug)}</changefreq>
    <priority>${getPriority(slug).toFixed(1)}</priority>
  </url>`).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

fs.writeFileSync(path.join(WEB_DIR, "sitemap.xml"), xml);
console.log(`sitemap.xml generated with ${slugs.length} URLs`);
