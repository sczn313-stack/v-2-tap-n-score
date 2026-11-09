import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist", "netlify");
const productionOrigin = "https://sczn3-authority.onrender.com";
const stagingOrigin = "https://sczn3-authority-staging-ep64.onrender.com";

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

const files = await filesBelow(output);
const textFiles = files.filter(file => /\.(?:html|js|json|toml|txt|css)$/i.test(file) || path.basename(file) === "_redirects");
let stagingReferences = 0;
for (const file of textFiles) {
  const text = await readFile(file, "utf8");
  assert.equal(text.includes(productionOrigin), false, `production authority leaked into ${path.relative(output, file)}`);
  if (text.includes(stagingOrigin)) stagingReferences += 1;
}

assert.ok(stagingReferences > 0, "built package contains the governed staging authority origin");
const identity = JSON.parse(await readFile(path.join(output, "deployment_identity.json"), "utf8"));
assert.equal(identity.authorityOrigin, stagingOrigin);
assert.equal(identity.productionFallback, false);
assert.equal(identity.environment, "staging");
const runtime = await readFile(path.join(output, "target_execution_runtime.js"), "utf8");
assert.match(runtime, /const equipmentSummary = byId\("contractEquipmentSummary"\);\s*if \(equipmentSummary\)/, "Actual Round exact reopen tolerates its intentionally absent setup summary");

console.log(JSON.stringify({
  ok: true,
  configurationIdentity: identity.configurationIdentity,
  filesInspected: textFiles.length,
  stagingReferences,
  productionReferences: 0
}, null, 2));
