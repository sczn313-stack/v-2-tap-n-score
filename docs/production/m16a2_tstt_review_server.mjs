import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, request as requestHttp } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || 8094);
const host = process.argv[3] || "127.0.0.1";
const authorityPort = Number(process.env.SCZN3_REVIEW_AUTHORITY_PORT || 8100);
const publicFiles = new Map([
  ["/", "m16a2-tstt.html"],
  ["/m16a2-tstt.html", "m16a2-tstt.html"],
  ["/m16a2-tstt.css", "m16a2-tstt.css"],
  ["/m16a2-tstt.js", "m16a2-tstt.js"],
  ["/tstt_narration.js", "tstt_narration.js"],
  ["/tstt_viewport_guard.js", "tstt_viewport_guard.js"],
  ["/tstt-voice-audition.html", "tstt-voice-audition.html"],
  ["/tstt-voice-audition.css", "tstt-voice-audition.css"],
  ["/tstt-voice-audition.js", "tstt-voice-audition.js"],
  ["/tstt-samantha-ab.html", "tstt-samantha-ab.html"],
  ["/tstt-samantha-ab.js", "tstt-samantha-ab.js"],
  ["/tstt-samantha-test.html", "tstt-samantha-test.html"],
  ["/tstt-samantha-test.js", "tstt-samantha-test.js"],
  ["/tstt-word-audition.html", "tstt-word-audition.html"],
  ["/tstt-word-audition.js", "tstt-word-audition.js"],
  ["/matrix.html", "matrix.html"],
  ["/shoot.html", "shoot.html"],
  ["/sec.html", "sec.html"],
  ["/records.html", "records.html"],
  ["/styles.css", "styles.css"],
  ["/platform-ui.css", "platform-ui.css"],
  ["/platform_actions.css", "platform_actions.css"],
  ["/platform_actions.js", "platform_actions.js"],
  ["/navigation.js", "navigation.js"],
  ["/presentation_labels.js", "presentation_labels.js"],
  ["/platform_contracts.js", "platform_contracts.js"],
  ["/smart_target_identity.js", "smart_target_identity.js"],
  ["/app_state.js", "app_state.js"],
  ["/ops.js", "ops.js"],
  ["/equipment_knowledge_registry.js", "equipment_knowledge_registry.js"],
  ["/experience_frame_processing.css", "experience_frame_processing.css"],
  ["/experience_frame_processing.js", "experience_frame_processing.js"],
  ["/workspace_correction_context.css", "workspace_correction_context.css"],
  ["/smart_target_workspace.css", "smart_target_workspace.css"],
  ["/smart_target_workspace.js", "smart_target_workspace.js"],
  ["/zeroing_platform.js", "zeroing_platform.js"],
  ["/m4_runtime.js", "m4_runtime.js"],
  ["/m4_sec_config.js", "m4_sec_config.js"],
  ["/m4_talking_lesson.js", "m4_talking_lesson.js"],
  ["/m4_zeroing_sec.js", "m4_zeroing_sec.js"],
  ["/founder_review_session_003.js", "founder_review_session_003.js"],
  ["/baker_talking_demo_session.js", "baker_talking_demo_session.js"],
  ["/m16a2_talking_demo_session.js", "m16a2_talking_demo_session.js"],
  ["/sec_dispatch.js", "sec_dispatch.js"],
  ["/self_teaching_player.js", "self_teaching_player.js"],
  ["/ballistic-vault.css", "ballistic-vault.css"],
  ["/m4-sec.css", "m4-sec.css"],
  ["/sec-framework.css", "sec-framework.css"],
  ["/m4_smart_target_sec.js", "m4_smart_target_sec.js"],
  ["/sec_adapter_model.js", "sec_adapter_model.js"],
  ["/sec_framework.js", "sec_framework.js"],
  ["/sec_reopen_capability.js", "sec_reopen_capability.js"],
  ["/sec_reopen_lifecycle.js", "sec_reopen_lifecycle.js"],
  ["/sec_session_timeline.js", "sec_session_timeline.js"],
  ["/sec_v1.js", "sec_v1.js"],
  ["/target_execution_runtime.js", "target_execution_runtime.js"],
  ["/universal_practice_sec.js", "universal_practice_sec.js"],
  ["/vendor/html2canvas-1.4.1.min.js", "vendor/html2canvas-1.4.1.min.js"],
  ["/assets/crosshair-cross-emblem.png", "assets/crosshair-cross-emblem.png"],
  ["/assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png", "assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"],
  ["/assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg", "assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg"],
  ["/assets/audio/episode60/chapter1/01.wav", "assets/audio/episode60/chapter1/01.wav"],
  ["/assets/audio/episode60/chapter1/02.wav", "assets/audio/episode60/chapter1/02.wav"],
  ["/assets/audio/episode60/chapter1/03.wav", "assets/audio/episode60/chapter1/03.wav"],
  ["/assets/audio/episode60/chapter1/04.wav", "assets/audio/episode60/chapter1/04.wav"],
  ["/assets/audio/episode60/chapter1/05.wav", "assets/audio/episode60/chapter1/05.wav"],
  ["/assets/audio/episode60/chapter1/06.wav", "assets/audio/episode60/chapter1/06.wav"],
  ["/assets/audio/episode60/chapter1/07.wav", "assets/audio/episode60/chapter1/07.wav"],
  ["/assets/audio/episode60/chapter1/08.wav", "assets/audio/episode60/chapter1/08.wav"],
  ["/assets/audio/episode60/chapter1/09.wav", "assets/audio/episode60/chapter1/09.wav"],
  ["/assets/audio/episode60/chapter2/01.wav", "assets/audio/episode60/chapter2/01.wav"],
  ["/assets/audio/episode60/chapter2/02.wav", "assets/audio/episode60/chapter2/02.wav"],
  ["/assets/audio/episode60/chapter2/03.wav", "assets/audio/episode60/chapter2/03.wav"],
  ["/assets/audio/episode60/chapter2/04.wav", "assets/audio/episode60/chapter2/04.wav"],
  ["/assets/audio/episode60/chapter2/05.wav", "assets/audio/episode60/chapter2/05.wav"],
  ["/assets/audio/episode60/chapter3/01-intro.wav", "assets/audio/episode60/chapter3/01-intro.wav"],
  ["/assets/audio/episode60/chapter3/02-aim.wav", "assets/audio/episode60/chapter3/02-aim.wav"],
  ["/assets/audio/episode60/chapter3/03-shot-observations.wav", "assets/audio/episode60/chapter3/03-shot-observations.wav"],
  ["/assets/audio/episode60/chapter3/04-authority.wav", "assets/audio/episode60/chapter3/04-authority.wav"],
  ["/assets/audio/episode60/chapter3/05-pattern-center.wav", "assets/audio/episode60/chapter3/05-pattern-center.wav"],
  ["/assets/audio/episode60/chapter3/06-measurement.wav", "assets/audio/episode60/chapter3/06-measurement.wav"],
  ["/assets/audio/episode60/chapter3/07-adjustment.wav", "assets/audio/episode60/chapter3/07-adjustment.wav"],
  ["/assets/audio/episode60/chapter3/08-begin-confirmation.wav", "assets/audio/episode60/chapter3/08-begin-confirmation.wav"],
  ["/assets/audio/episode60/chapter3/09-confirmation-shots.wav", "assets/audio/episode60/chapter3/09-confirmation-shots.wav"],
  ["/assets/audio/episode60/chapter3/10-confirmed-zero.wav", "assets/audio/episode60/chapter3/10-confirmed-zero.wav"],
  ["/assets/audio/episode60/chapter3/11-finalize-drum.wav", "assets/audio/episode60/chapter3/11-finalize-drum.wav"],
  ["/assets/audio/episode60/chapter3/12-sec.wav", "assets/audio/episode60/chapter3/12-sec.wav"],
  ["/assets/audio/episode60/chapter3/13-vault.wav", "assets/audio/episode60/chapter3/13-vault.wav"],
  ["/assets/audio/episode60/chapter3/14-complete.wav", "assets/audio/episode60/chapter3/14-complete.wav"],
  ["/authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png", "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png"],
  ["/authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_M16A2_25M_ZEROING_TARGET_2026-09-04.png", "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_M16A2_25M_ZEROING_TARGET_2026-09-04.png"],
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
  ".svg": "image/svg+xml",
  ".wav": "audio/wav"
});

function resolveRequest(requestUrl = "/") {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://review.local").pathname);
  const relative = publicFiles.get(pathname);
  return relative ? path.resolve(docsRoot, relative) : null;
}

function proxyAuthority(request, response) {
  const upstream = requestHttp({
    hostname: "127.0.0.1",
    port: authorityPort,
    path: request.url,
    method: request.method,
    headers: request.headers
  }, upstreamResponse => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on("error", () => {
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false, reason: "review_authority_unavailable" }));
  });
  request.pipe(upstream);
}

const server = createServer(async (request, response) => {
  const pathname = request.url ? new URL(request.url, "http://review.local").pathname : "";
  if (pathname.startsWith("/api/")) {
    proxyAuthority(request, response);
    return;
  }
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
  console.log(`TSTT Samantha test: http://127.0.0.1:${port}/tstt-samantha-test.html`);
  console.log(`TSTT word audition: http://127.0.0.1:${port}/tstt-word-audition.html`);
  if (host === "0.0.0.0") {
    for (const records of Object.values(networkInterfaces())) {
      for (const record of records || []) {
        if (record.family === "IPv4" && !record.internal) {
          console.log(`M16A2 TSTT Wi-Fi: http://${record.address}:${port}/m16a2-tstt.html`);
          console.log(`TSTT voice audition Wi-Fi: http://${record.address}:${port}/tstt-voice-audition.html`);
          console.log(`TSTT Samantha A/B Wi-Fi: http://${record.address}:${port}/tstt-samantha-ab.html`);
          console.log(`TSTT Samantha test Wi-Fi: http://${record.address}:${port}/tstt-samantha-test.html`);
          console.log(`TSTT word audition Wi-Fi: http://${record.address}:${port}/tstt-word-audition.html`);
        }
      }
    }
  }
});
