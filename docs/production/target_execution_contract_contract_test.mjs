import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { collectExecutionContractAssets } from "./collect_execution_contract_assets.mjs";

const root = path.resolve(".");
const genericProductionSources = [
  "backend/target_execution_contract.py", "backend/execution_authority.py", "backend/execution_capability_registry.py",
  "backend/session_authority.py", "backend/preserved_sec_store.py", "backend/server.py",
  "target_execution_runtime.js", "target-experience.html", "target_experiences.js", "platform_contracts.js",
  "sec_adapter_model.js", "sec_dispatch.js", "m4_runtime.js", "records.html",
];
const fixtureIds = ["fixture_paper_alpha", "fixture_paper_bravo"];
for (const relative of genericProductionSources) {
  const source = (await readFile(path.join(root, relative), "utf8")).toLowerCase();
  fixtureIds.forEach(id => assert.equal(source.includes(id), false, `target-ID production wiring detected in ${relative}`));
}

const buildSite = await readFile(path.join(root, "production/build-site.mjs"), "utf8");
const buildNetlify = await readFile(path.join(root, "production/build-netlify.mjs"), "utf8");
for (const source of [buildSite, buildNetlify]) {
  assert.match(source, /collectExecutionContractAssets/);
  assert.match(source, /target-experience\.html/);
  assert.match(source, /target_execution_runtime\.js/);
}

const temporary = await mkdtemp(path.join(os.tmpdir(), "sczn3-tec-build-"));
try {
  const asset = "registered-assets/synthetic.svg";
  await mkdir(path.join(temporary, "backend/target_execution_contracts/contracts"), { recursive: true });
  await mkdir(path.join(temporary, "registered-assets"), { recursive: true });
  const bytes = Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"/>");
  await writeFile(path.join(temporary, asset), bytes);
  const contract = {
    lifecycleStatus: "supported", supportStatus: "supported", approval: { status: "approved" },
    components: { registration: { definition: { role: "evidence_capture_asset", assetPath: asset, assetSha256: createHash("sha256").update(bytes).digest("hex") } } },
  };
  const contractPath = path.join(temporary, "backend/target_execution_contracts/contracts/synthetic.json");
  await writeFile(contractPath, JSON.stringify(contract));
  assert.deepEqual(await collectExecutionContractAssets(temporary), [asset]);
  contract.components.registration.definition.assetSha256 = "0".repeat(64);
  await writeFile(contractPath, JSON.stringify(contract));
  await assert.rejects(() => collectExecutionContractAssets(temporary), /registration asset hash mismatch/);
  contract.components.registration.definition.role = "unapproved_role";
  await writeFile(contractPath, JSON.stringify(contract));
  await assert.rejects(() => collectExecutionContractAssets(temporary), /invalid approved registration package/);
} finally {
  await rm(temporary, { recursive: true, force: true });
}

console.log("PASS Target Execution Contract routing and build admission: generic production surfaces contain no fixture IDs; asset inclusion is registration-driven and hash/role fail-closed");
