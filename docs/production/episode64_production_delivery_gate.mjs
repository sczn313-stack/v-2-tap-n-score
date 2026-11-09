import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "dist", "netlify");
const productionAuthority = "https://sczn3-authority.onrender.com";
const productionFrontend = "https://tap-n-score.com";
const stagingTokens = [
  "sczn3-authority-staging-ep64.onrender.com",
  "tap-n-score-tst12-staging-ep64.netlify.app",
  "sczn3-ep64-staging-routing-20261109-1",
  "sczn3-ep64-tst12-staging-20261109-1"
];

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
const textFiles = files.filter(file => /\.(?:css|html|js|json|mjs|svg|txt)$/i.test(file) || path.basename(file) === "_redirects");
let productionAuthorityReferences = 0;
for (const file of textFiles) {
  const text = await readFile(file, "utf8");
  for (const token of stagingTokens) {
    assert.equal(text.includes(token), false, `staging token ${token} leaked into ${path.relative(output, file)}`);
  }
  if (text.includes(productionAuthority)) productionAuthorityReferences += 1;
}

assert.ok(productionAuthorityReferences > 0, "production build contains governed production authority routing");
const identity = JSON.parse(await readFile(path.join(output, "deployment_identity.json"), "utf8"));
assert.equal(identity.environment, "production");
assert.equal(identity.authorityOrigin, productionAuthority);
assert.equal(identity.frontendOrigin, productionFrontend);
assert.equal(identity.configurationIdentity, "sczn3-ep64-production-routing-20261109-1");
assert.equal(identity.presentationIdentity, "sczn3-session-init-20261109-1");
assert.match(identity.candidateCommit, /^[a-f0-9]{40}$/);
assert.equal(identity.productionFallback, false);

console.log(JSON.stringify({
  ok: true,
  environment: identity.environment,
  configurationIdentity: identity.configurationIdentity,
  presentationIdentity: identity.presentationIdentity,
  filesInspected: textFiles.length,
  productionAuthorityReferences,
  stagingReferences: 0
}, null, 2));
