import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { collectExecutionContractAssets } from "./collect_execution_contract_assets.mjs";

const root = process.cwd();
const output = path.join(root, "dist", "netlify");
const environments = Object.freeze({
  staging: Object.freeze({
    authorityOrigin: "https://sczn3-authority-staging-ep64.onrender.com",
    frontendOrigin: "https://tap-n-score-tst12-staging-ep64.netlify.app",
    configurationIdentity: "sczn3-ep64-staging-routing-20261109-1",
    candidateIdentity: "sczn3-ep64-tst12-staging-20261109-1"
  }),
  production: Object.freeze({
    authorityOrigin: "https://sczn3-authority.onrender.com",
    frontendOrigin: "https://tap-n-score.com",
    configurationIdentity: "sczn3-ep64-production-routing-20261109-1",
    candidateIdentity: "sczn3-ep64-tst12-production-candidate-20261109-1"
  })
});
const environment = process.env.SCZN3_DEPLOYMENT_ENV || "staging";
const deployment = environments[environment];
if (!deployment) {
  throw new Error(`Unsupported SCZN3_DEPLOYMENT_ENV: ${environment}`);
}
const sourceIdentity = JSON.parse(await readFile(path.join(root, "staging_deployment_identity.json"), "utf8"));
const staging = environments.staging;

const publicFiles = [
  "favicon.ico",
  "index.html",
  "survey.html",
  "matrix.html",
  "shoot.html",
  "m16a2-tstt.html",
  "m16a2-tstt.css",
  "m16a2-tstt.js",
  "tstt_narration.js",
  "tstt_viewport_guard.js",
  "tstt-voice-audition.html",
  "tstt-voice-audition.css",
  "tstt-voice-audition.js",
  "sec.html",
  "records.html",
  "ops.html",
  "target-experience.html",
  "target-experience.css",
  "target_execution_runtime.js",
  "tst12_universal_experience.js",
  "tst12_station_results.js",
  "usm_proof_registry.js",
  "tst12-universal-experience.css",
  "tst12-station-results.css",
  "tst12_presentation_identity.json",
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
  "zeroing_target_profiles.js",
  "sec_framework.js",
  "presentation_labels.js",
  "analytics.js",
  "navigation.js",
  "rate_us.js",
  "ops.js",
  "equipment_knowledge_registry.js",
  "sec_reopen_capability.js",
  "self_teaching_player.js",
  "baker_talking_demo_session.js",
  "m16a2_talking_demo_session.js",
  "m4_talking_lesson.js",
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
  "assets/BAKER_ST_M16A2_STANDARD_FACE_AUTHORITY_v1.jpg",
  "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_ST_M16A2R_PRODUCT_SCREENSHOT_2026-09-02.png",
  "authority-evidence/mfam/founder-supplied-baker-product-evidence/FOUNDER_BAKER_M16A2_25M_ZEROING_TARGET_2026-09-04.png",
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

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(candidate));
    if (entry.isFile()) files.push(candidate);
  }
  return files;
}

const textExtensions = new Set([".css", ".html", ".js", ".json", ".mjs", ".svg", ".txt"]);
for (const file of await filesBelow(output)) {
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const source = await readFile(file, "utf8");
  const configured = source
    .replaceAll(staging.authorityOrigin, deployment.authorityOrigin)
    .replaceAll(staging.frontendOrigin, deployment.frontendOrigin)
    .replaceAll(staging.configurationIdentity, deployment.configurationIdentity)
    .replaceAll(staging.candidateIdentity, deployment.candidateIdentity);
  if (configured !== source) await writeFile(file, configured);
}

const redirectSource = await readFile(path.join(root, "_redirects"), "utf8");
await writeFile(
  path.join(output, "_redirects"),
  redirectSource.replaceAll(staging.authorityOrigin, deployment.authorityOrigin)
);

const deploymentIdentity = {
  ...sourceIdentity,
  schemaVersion: "sczn3.deployment-identity.v1",
  configurationIdentity: deployment.configurationIdentity,
  candidateIdentity: deployment.candidateIdentity,
  candidateCommit: process.env.SCZN3_CANDIDATE_COMMIT || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  authorityOrigin: deployment.authorityOrigin,
  frontendOrigin: deployment.frontendOrigin,
  environment,
  productionFallback: false
};
await writeFile(
  path.join(output, "deployment_identity.json"),
  `${JSON.stringify(deploymentIdentity, null, 2)}\n`
);

console.log(`Built ${publicFiles.length} public files plus assets for Netlify (${environment}).`);
