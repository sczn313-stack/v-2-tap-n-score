import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
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
  ["/zeroing_target_profiles.js", "zeroing_target_profiles.js"],
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
  ["/target-experience.html", "target-experience.html"],
  ["/target-experience.css", "target-experience.css"],
  ["/founder-nine-target-review.html", "founder-nine-target-review.html"],
  ["/founder-nine-target-review.css", "founder-nine-target-review.css"],
  ["/founder-nine-target-review-loader.js", "founder-nine-target-review-loader.js"],
  ["/founder-scale-batch-1-review.html", "founder-scale-batch-1-review.html"],
  ["/founder-scale-batch-1-review.css", "founder-scale-batch-1-review.css"],
  ["/founder-scale-batch-1-review-loader.js", "founder-scale-batch-1-review-loader.js"],
  ["/founder-scale-batch-1-zeroing-loader.js", "founder-scale-batch-1-zeroing-loader.js"],
  ["/t/baker/sl-st2/", "t/baker/sl-st2/index.html"],
  ["/t/baker/sl-st2/index.html", "t/baker/sl-st2/index.html"],
  ["/t/baker/sl-st2/target-page.css", "t/baker/sl-st2/target-page.css"],
  ["/t/baker/sl-st2/target-page.js", "t/baker/sl-st2/target-page.js"],
  ["/t/baker/fun/", "t/baker/fun/index.html"],
  ["/t/baker/fun/index.html", "t/baker/fun/index.html"],
  ["/t/baker/fun/target-page.css", "t/baker/fun/target-page.css"],
  ["/t/baker/fun/target-page.js", "t/baker/fun/target-page.js"],
  ["/t/gunfun/vital-dude/", "t/gunfun/vital-dude/index.html"],
  ["/t/gunfun/vital-dude/index.html", "t/gunfun/vital-dude/index.html"],
  ["/t/gunfun/vital-dude/target-page.css", "t/gunfun/vital-dude/target-page.css"],
  ["/t/gunfun/vital-dude/target-page.js", "t/gunfun/vital-dude/target-page.js"],
  ["/baker-sl-st1-sec.css", "baker-sl-st1-sec.css"],
  ["/baker-sl-st2-idpa-sec.css", "baker-sl-st2-idpa-sec.css"],
  ["/baker-fun-sec.css", "baker-fun-sec.css"],
  ["/gunfun-vital-dude-sec.css", "gunfun-vital-dude-sec.css"],
  ["/baker_sl_st2_idpa_sec.js", "baker_sl_st2_idpa_sec.js"],
  ["/baker_fun_sec.js", "baker_fun_sec.js"],
  ["/gunfun_vital_dude_sec.js", "gunfun_vital_dude_sec.js"],
  ["/review-assets/target-01.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/13120.jpg"],
  ["/review-assets/target-02.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22200.jpg"],
  ["/review-assets/target-03.jpeg", "authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg"],
  ["/review-assets/target-04.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22470.jpg"],
  ["/review-assets/target-05.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22040.jpg"],
  ["/review-assets/target-06.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/12070.jpg"],
  ["/review-assets/target-07.webp", "authority-evidence/catalog-targets/BAKER_BE_R9B_PUBLISHER_IMAGE_V1.webp"],
  ["/review-assets/target-08.jpg", "authority-evidence/catalog-targets/BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg"],
  ["/review-assets/target-09.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22740.jpg"],
  ["/scale-batch-assets/target-01.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22200.jpg"],
  ["/scale-batch-assets/target-02.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/12070.jpg"],
  ["/scale-batch-assets/target-03.png", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/us-target-386.png"],
  ["/scale-batch-assets/target-04.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/13120.jpg"],
  ["/scale-batch-assets/target-05.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22470.jpg"],
  ["/scale-batch-assets/target-06.jpg", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/american-target-58-Q100.jpg"],
  ["/scale-batch-assets/target-07.jpeg", "authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg"],
  ["/scale-batch-assets/target-08.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22040.jpg"],
  ["/scale-batch-assets/target-09.jpg", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/national-idpa-p.jpg"],
  ["/scale-batch-assets/target-10.webp", "authority-evidence/catalog-targets/BAKER_BE_R9B_PUBLISHER_IMAGE_V1.webp"],
  ["/scale-batch-assets/target-11.jpg", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/splatterburst-74.jpg"],
  ["/scale-batch-assets/target-12.webp", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/thompson-r-1602.webp"],
  ["/scale-batch-assets/target-13.jpg", "authority-evidence/catalog-targets/BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg"],
  ["/scale-batch-assets/target-14.png", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/birchwood-bc-3dtgtprt.png"],
  ["/scale-batch-assets/target-15.jpg", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/ez-aim-15787.jpg"],
  ["/scale-batch-assets/target-16.jpg", "authority-evidence/gunfun/episode56/full-catalog-stress-test/publisher-representations/22740.jpg"],
  ["/scale-batch-assets/target-17.jpg", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/highwild-cj-host-m108.jpg"],
  ["/scale-batch-assets/target-18.png", "authority-evidence/platform/scale-batch-1-2026-09-08/representations/champion-44924c.png"],
  ["/scale-batch-assets/target-19.jpg", "assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg"],
  ["/scale-batch-assets/target-20.jpg", "assets/GUNFUN_32120_M16A2_GREEN_FACE_AUTHORITY_v1.jpg"],
  ["/scale-batch-assets/target-21.jpg", "assets/SPEEDWELL_M16A2_PUBLISHER_FACE_AUTHORITY_v1.jpg"],
  ["/scale-batch-assets/target-22.png", "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_UNI25MMOA_PRODUCT_SCREENSHOT_2026-09-02.png"],
  ["/scale-batch-assets/target-22-runtime.png", "assets/M4_M16_25M_ZERO_AUTHORITY_v1.png"],
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
  ["/assets/audio/episode60/chapter4/01-confirmation-sequence.wav", "assets/audio/episode60/chapter4/01-confirmation-sequence.wav"],
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
  ".webp": "image/webp",
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
  const parsedUrl = new URL(request.url || "/", "http://review.local");
  const pathname = parsedUrl.pathname;
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
    if (pathname === "/target-experience.html" && parsedUrl.searchParams.get("founderReview") === "nine-target") {
      const source = await readFile(file, "utf8");
      const body = Buffer.from(source.replace("</body>", '  <script src="founder-nine-target-review-loader.js" defer></script>\n</body>'));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": types[".html"],
        "X-Content-Type-Options": "nosniff"
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
      return;
    }
    if (pathname === "/target-experience.html" && parsedUrl.searchParams.get("founderReview") === "scale-batch-1") {
      const source = await readFile(file, "utf8");
      const body = Buffer.from(source.replace("</body>", '  <script src="founder-scale-batch-1-review-loader.js" defer></script>\n</body>'));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": types[".html"],
        "X-Content-Type-Options": "nosniff"
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
      return;
    }
    if (["/t/baker/sl-st2/", "/t/baker/fun/", "/t/gunfun/vital-dude/"].includes(pathname) && parsedUrl.searchParams.get("founderReview") === "scale-batch-1") {
      const source = await readFile(file, "utf8");
      const body = Buffer.from(source.replace("</body>", '  <script src="../../../founder-scale-batch-1-review-loader.js" defer></script>\n</body>'));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": types[".html"],
        "X-Content-Type-Options": "nosniff"
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
      return;
    }
    if (pathname === "/shoot.html" && parsedUrl.searchParams.get("founderReview") === "scale-batch-1") {
      const source = await readFile(file, "utf8");
      const body = Buffer.from(source.replace("</body>", '  <script src="founder-scale-batch-1-zeroing-loader.js" defer></script>\n</body>'));
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Length": body.length,
        "Content-Type": types[".html"],
        "X-Content-Type-Options": "nosniff"
      });
      if (request.method === "HEAD") response.end();
      else response.end(body);
      return;
    }
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
