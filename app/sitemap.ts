import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://pic-compressor.github.io";
  return [
    { url: base, lastModified: new Date() },
    { url: base + "/privacy", lastModified: new Date() },
    { url: base + "/terms", lastModified: new Date() },
    { url: base + "/policy", lastModified: new Date() },
  ];
}
