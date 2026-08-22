import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const executableRoles = new Set(["scorable_canonical_asset", "evidence_capture_asset"]);

export async function collectExecutionContractAssets(root, contractDirectory = path.join(root, "backend", "target_execution_contracts", "contracts")) {
  let names;
  try {
    names = (await readdir(contractDirectory)).filter(name => name.endsWith(".json")).sort();
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
  const assets = [];
  for (const name of names) {
    const contract = JSON.parse(await readFile(path.join(contractDirectory, name), "utf8"));
    if (contract.lifecycleStatus !== "supported" || contract.supportStatus !== "supported" || contract.approval?.status !== "approved") continue;
    const registration = contract.components?.registration;
    const role = registration?.definition?.role;
    const assetPath = String(registration?.definition?.assetPath || "").trim();
    const expectedHash = String(registration?.definition?.assetSha256 || "").trim().toLowerCase();
    if (!executableRoles.has(role) || !assetPath || !/^[a-f0-9]{64}$/.test(expectedHash)) throw new Error(`invalid approved registration package in ${name}`);
    const normalized = path.normalize(assetPath);
    if (path.isAbsolute(normalized) || normalized.startsWith("..") || normalized.includes(`${path.sep}..${path.sep}`)) throw new Error(`registration asset escapes build root in ${name}`);
    const bytes = await readFile(path.join(root, normalized));
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    if (actualHash !== expectedHash) throw new Error(`registration asset hash mismatch in ${name}`);
    if (!assets.includes(normalized)) assets.push(normalized);
  }
  return assets;
}
