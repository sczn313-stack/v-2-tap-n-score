import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { collectExecutionContractAssets } from "./collect_execution_contract_assets.mjs";

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
  "target-experience.html",
  "target-experience.css",
  "target_execution_runtime.js",
  "t/gssf/ac1/index.html",
  "t/baker/sl-st1/index.html",
  "t/baker/sl-st1/target-page.css",
  "t/baker/sl-st1/target-page.js",
  "t/gunfun/vital-dude/index.html",
  "t/gunfun/vital-dude/target-page.css",
  "t/gunfun/vital-dude/target-page.js",
  "t/baker/sl-st2/index.html",
  "t/baker/sl-st2/target-page.css",
  "t/baker/sl-st2/target-page.js",
  "t/baker/fun/index.html",
  "t/baker/fun/target-page.css",
  "t/baker/fun/target-page.js",
  "app_state.js",
  "platform_contracts.js",
  "sec_adapter_model.js",
  "sec_dispatch.js",
  "smart_target_identity.js",
  "m4_sec_config.js",
  "m4_runtime.js",
  "zeroing_platform.js",
  "sec_framework.js",
  "presentation_labels.js",
  "analytics.js",
  "navigation.js",
  "ops.js",
  "self_teaching_player.js",
  "baker_talking_demo_session.js",
  "sec_reopen_lifecycle.js",
  "experience_frame_processing.js",
  "platform_actions.js",
  "smart_target_workspace.js",
  "sec_v1.js",
  "sec_session_timeline.js",
  "universal_practice_sec.js",
  "m4_smart_target_sec.js",
  "m4_zeroing_sec.js",
  "baker_sl_st1_sec.js",
  "gunfun_vital_dude_sec.js",
  "baker_sl_st2_idpa_sec.js",
  "baker_fun_sec.js",
  "founder_review_session_003.js",
  "vendor/html2canvas-1.4.1.min.js",
  "shell.js",
  "styles.css",
  "platform-ui.css",
  "experience_frame_processing.css",
  "platform_actions.css",
  "smart_target_workspace.css",
  "landing.css",
  "target_experiences.js",
  "shell.css",
  "ballistic-vault.css",
  "workspace_correction_context.css",
  "m4-sec.css",
  "sec-framework.css",
  "baker-sl-st1-sec.css",
  "gunfun-vital-dude-sec.css",
  "baker-sl-st2-idpa-sec.css",
  "baker-fun-sec.css",
  "authority-evidence/baker-sl-st1/BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE.webp",
  "authority-evidence/gunfun/episode56/publisher-representations/E56-T08_SKU-22740.jpg",
  "authority-evidence/baker-sl-st2/BAKER_SL_ST2_23X35_GATE3_REPRESENTATION_EVIDENCE_V1.jpeg",
  "authority-evidence/baker-sl-st2/UGO_BAKER_SL_ST2_23X35_TARGET_PLANE_V1_OVERLAY.svg",
  "authority-evidence/baker-fun/BAKER_GF_DB_PUBLISHER_PRODUCT_IMAGE_V1.jpg",
  "authority-evidence/baker-fun/BAKER_GF_BP_PUBLISHER_PRODUCT_IMAGE_V1.jpg",
  "authority-evidence/catalog-targets/EZ2C_STYLE_17_DOT_TORTURE_PUBLISHER_IMAGE_V1.jpg",
  "authority-evidence/catalog-targets/BAKER_GF_BB_C_PUBLISHER_IMAGE_V1.jpg",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_RECONSTRUCTION_CANDIDATE.svg",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg",
];

publicFiles.push(...await collectExecutionContractAssets(root));

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
