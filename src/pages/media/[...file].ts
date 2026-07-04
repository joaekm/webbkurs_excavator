import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { resolve, extname, normalize } from "node:path";

export const prerender = false;

const IMAGES_DIR = resolve(process.env.CONTENT_DIR ?? "./content", "images");

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export const GET: APIRoute = ({ params }) => {
  const rel = params.file ?? "";
  // Skydd mot path traversal: normalisera och kräv att sökvägen ligger kvar i mappen.
  const full = resolve(IMAGES_DIR, normalize(rel));
  if (!full.startsWith(IMAGES_DIR)) {
    return new Response("Otillåten sökväg", { status: 400 });
  }
  try {
    const data = readFileSync(full);
    const type = TYPES[extname(full).toLowerCase()] ?? "application/octet-stream";
    return new Response(data, {
      status: 200,
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    console.warn(`[media] hittar inte bild: ${rel}`);
    return new Response("Bild saknas", { status: 404 });
  }
};
