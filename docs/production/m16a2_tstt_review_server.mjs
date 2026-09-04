import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || 8094);
const host = process.argv[3] || "127.0.0.1";
const publicFiles = new Map([
  ["/", "m16a2-tstt.html"],
  ["/m16a2-tstt.html", "m16a2-tstt.html"],
  ["/m16a2-tstt.css", "m16a2-tstt.css"],
  ["/m16a2-tstt.js", "m16a2-tstt.js"],
  ["/tstt_narration.js", "tstt_narration.js"],
  ["/tstt-voice-audition.html", "tstt-voice-audition.html"],
  ["/tstt-voice-audition.css", "tstt-voice-audition.css"],
  ["/tstt-voice-audition.js", "tstt-voice-audition.js"],
  ["/tstt-samantha-ab.html", "tstt-samantha-ab.html"],
  ["/tstt-samantha-ab.js", "tstt-samantha-ab.js"],
  ["/tstt-word-audition.html", "tstt-word-audition.html"],
  ["/tstt-word-audition.js", "tstt-word-audition.js"],
  ["/matrix.html", "matrix.html"],
  ["/styles.css", "styles.css"],
  ["/platform-ui.css", "platform-ui.css"],
  ["/navigation.js", "navigation.js"],
  ["/presentation_labels.js", "presentation_labels.js"],
  ["/platform_contracts.js", "platform_contracts.js"],
  ["/smart_target_identity.js", "smart_target_identity.js"],
  ["/app_state.js", "app_state.js"],
  ["/ops.js", "ops.js"],
  ["/equipment_knowledge_registry.js", "equipment_knowledge_registry.js"],
  ["/assets/crosshair-cross-emblem.png", "assets/crosshair-cross-emblem.png"],
  ["/authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png", "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png"],
  ["/authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE_2026-09-04.jpeg", "authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_FRONT_SIGHT_POST_REFERENCE_2026-09-04.jpeg"],
  ["/authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE_2026-09-04.jpeg", "authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_REAR_WINDAGE_KNOB_REFERENCE_2026-09-04.jpeg"],
  ["/authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE_2026-09-04.jpeg", "authority-evidence/mfam/founder-supplied-chapter2-visual-reference/FOUNDER_M16A2_REAR_ELEVATION_DRUM_8-3_REFERENCE_2026-09-04.jpeg"]
]);
const types = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
});

function resolveRequest(requestUrl = "/") {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://review.local").pathname);
  const relative = publicFiles.get(pathname);
  return relative ? path.resolve(docsRoot, relative) : null;
}

const server = createServer(async (request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method || "")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  const file = resolveRequest(request.url);
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not_file");
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": info.size,
      "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`M16A2 TSTT review: http://127.0.0.1:${port}/m16a2-tstt.html`);
  console.log(`TSTT voice audition: http://127.0.0.1:${port}/tstt-voice-audition.html`);
  console.log(`TSTT Samantha A/B: http://127.0.0.1:${port}/tstt-samantha-ab.html`);
  console.log(`TSTT word audition: http://127.0.0.1:${port}/tstt-word-audition.html`);
  if (host === "0.0.0.0") {
    for (const records of Object.values(networkInterfaces())) {
      for (const record of records || []) {
        if (record.family === "IPv4" && !record.internal) {
          console.log(`M16A2 TSTT Wi-Fi: http://${record.address}:${port}/m16a2-tstt.html`);
          console.log(`TSTT voice audition Wi-Fi: http://${record.address}:${port}/tstt-voice-audition.html`);
          console.log(`TSTT Samantha A/B Wi-Fi: http://${record.address}:${port}/tstt-samantha-ab.html`);
          console.log(`TSTT word audition Wi-Fi: http://${record.address}:${port}/tstt-word-audition.html`);
        }
      }
    }
  }
});
