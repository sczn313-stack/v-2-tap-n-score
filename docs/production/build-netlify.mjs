import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist", "netlify");

const publicFiles = [
  "_redirects",
  "favicon.ico",
  "index.html",
  "survey.html",
  "matrix.html",
  "shoot.html",
  "sec.html",
  "records.html",
  "t/gssf/ac1/index.html",
  "t/baker/sl-st1/index.html",
  "t/baker/sl-st1/target-page.css",
  "t/baker/sl-st1/target-page.js",
  "app_state.js",
  "smart_target_identity.js",
  "m4_sec_config.js",
  "m4_runtime.js",
  "zeroing_platform.js",
  "sec_framework.js",
  "presentation_labels.js",
  "analytics.js",
  "navigation.js",
  "ops.js",
  "sec_v1.js",
  "universal_practice_sec.js",
  "m4_smart_target_sec.js",
  "founder_review_session_003.js",
  "vendor/html2canvas-1.4.1.min.js",
  "shell.js",
  "styles.css",
  "universal-ui.css",
  "landing.css",
  "target_experiences.js",
  "shell.css",
  "ballistic-vault.css",
  "workspace_correction_context.css",
  "m4-sec.css",
  "sec-universal.css",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_RECONSTRUCTION_CANDIDATE.svg",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg",
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const relativePath of publicFiles) {
  const destination = path.join(output, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, relativePath), destination);
}

await cp(path.join(root, "assets"), path.join(output, "assets"), { recursive: true });
await rm(path.join(output, "assets", "M4_TARGET_AUTHORITY_v1_ORIGINAL_PLACEHOLDER.txt"), { force: true });

console.log(`Built ${publicFiles.length} public files plus assets for Netlify.`);
