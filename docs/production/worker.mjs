import { buildAuthorityPackage } from "./authority_adapter.mjs";
import { STATIC_ASSETS } from "./static_assets.mjs";

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const apiHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json; charset=utf-8"
};

function extension(pathname) {
  const match = pathname.match(/\.[^.\/]+$/);
  return match ? match[0].toLowerCase() : "";
}

function decodeAsset(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function authorityResponse(request) {
  if (request.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: apiHeaders });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: apiHeaders });
  }
  try {
    const payload = await request.json();
    const authority = await buildAuthorityPackage(payload);
    return new Response(JSON.stringify(authority, null, 2), { status: 200, headers: apiHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error && error.message || error) }), {
      status: 400,
      headers: apiHeaders
    });
  }
}

function assetResponse(pathname, method) {
  const normalized = pathname === "/" ? "/index.html" : pathname.replace(/\/+$/, "");
  const encoded = STATIC_ASSETS[normalized];
  if (!encoded) {
    return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  const headers = {
    "Content-Type": CONTENT_TYPES[extension(normalized)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff"
  };
  if (normalized.startsWith("/assets/")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else {
    headers["Cache-Control"] = "no-cache";
  }
  return new Response(method === "HEAD" ? null : decodeAsset(encoded), { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/authority/m4") {
      return authorityResponse(request);
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }
    return assetResponse(decodeURIComponent(url.pathname), request.method);
  }
};
