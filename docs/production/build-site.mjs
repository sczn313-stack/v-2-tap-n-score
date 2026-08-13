import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateWeaponEquipmentRegistry } from "./generate_weapon_equipment_registry.mjs";

const root = process.cwd();
const serverDir = path.join(root, "dist", "server");

const publicFiles = [
  "favicon.ico",
  "index.html",
  "survey.html",
  "matrix.html",
  "shoot.html",
  "sec.html",
  "records.html",
  "t/baker/sl-st1/index.html",
  "t/baker/sl-st1/target-page.css",
  "t/baker/sl-st1/target-page.js",
  "app_state.js",
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
  "sec_v1.js",
  "universal_practice_sec.js",
  "m4_smart_target_sec.js",
  "baker_sl_st1_sec.js",
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
  "baker-sl-st1-sec.css",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_RECONSTRUCTION_CANDIDATE.svg",
  "authority-evidence/m4-target-reconstruction/M4_M16_25M_WORKSPACE_PRESENTATION.svg"
];

async function collectFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile()) {
      files.push(path.join("assets", relativePath));
    }
  }
  return files;
}

publicFiles.push(...await collectFiles(path.join(root, "assets")));

await rm(path.join(root, "dist"), { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await generateWeaponEquipmentRegistry();

const assets = {};
for (const relativePath of publicFiles) {
  const bytes = await readFile(path.join(root, relativePath));
  assets[`/${relativePath}`] = bytes.toString("base64");
}

await cp(
  path.join(root, "production", "authority_adapter.mjs"),
  path.join(serverDir, "authority_adapter.mjs")
);
await cp(
  path.join(root, "production", "generated_weapon_equipment_registry.mjs"),
  path.join(serverDir, "generated_weapon_equipment_registry.mjs")
);
await cp(
  path.join(root, "production", "worker.mjs"),
  path.join(serverDir, "index.js")
);
await writeFile(
  path.join(serverDir, "static_assets.mjs"),
  `export const STATIC_ASSETS = ${JSON.stringify(assets)};\n`
);

console.log(`Built ${publicFiles.length} public files and the M4 authority adapter.`);
