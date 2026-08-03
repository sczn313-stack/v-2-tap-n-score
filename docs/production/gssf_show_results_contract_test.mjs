import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shoot = await readFile(new URL("../shoot.html", import.meta.url), "utf8");
const redirects = await readFile(new URL("../_redirects", import.meta.url), "utf8");
const netlify = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
const labels = await readFile(new URL("../presentation_labels.js", import.meta.url), "utf8");

assert.match(
  shoot,
  /<meta name="sczn3-authority-endpoint" content="\/api\/authority\/ugeo" \/>/,
  "public generic authority traffic must stay same-origin in the browser",
);
assert.match(labels, /gssf_ac_1: "GSSF AC-1"/, "GSSF must preserve its governed target identity");
assert.doesNotMatch(labels, /Competition Paper Target \(Demo\)/, "legacy demo identity must not reach the universal SEC");
assert.match(
  redirects,
  /^\/api\/authority\/ugeo https:\/\/sczn3-authority\.onrender\.com\/api\/authority\/ugeo 200!$/m,
  "Netlify redirects must proxy the governed generic authority route",
);
assert.match(
  netlify,
  /from = "\/api\/authority\/ugeo"[\s\S]*?to = "https:\/\/sczn3-authority\.onrender\.com\/api\/authority\/ugeo"[\s\S]*?status = 200[\s\S]*?force = true/,
  "Netlify configuration must preserve the GSSF authority proxy",
);
assert.match(shoot, /let authorityRequestInFlight = false;/, "submission must have an explicit in-flight state");
assert.match(
  shoot,
  /SCZN3SmartTargetIdentity\.isM4\(SCZN3SmartTargetIdentity\.resolve\(TARGET_QUERY\)\)/,
  "target identity resolution must be tested as M4 instead of treating every resolved target as M4",
);
assert.match(
  shoot,
  /const targetProfileId = activeTargetProfileId\(\);\s*if \(targetProfileId\) return targetProfileId === "m4_25m_zero";/,
  "an explicit non-M4 target profile must override the firearm profile and stale active matrix",
);
assert.match(
  shoot,
  /if \(queryMissionFamily\) return String\(queryMissionFamily\)\.toLowerCase\(\);/,
  "an explicit mission family must override stale session and matrix attribution",
);
assert.match(
  shoot,
  /if \(targetProfileId === "baker_st_100yd_smart_zero"\) \{[\s\S]*?targetName: "Baker 100 Yard Smart Target"[\s\S]*?targetDistanceValue: "100"/,
  "the 100 Yard launch must create its own governed target attribution",
);
assert.doesNotMatch(
  shoot,
  /\|\| SCZN3SmartTargetIdentity\.resolve\(TARGET_QUERY\)\s*\n/,
  "a non-M4 resolved target must not enter the M4 authority route",
);
assert.match(shoot, /completeButton\.textContent = "Scoring…";/, "the active control must acknowledge scoring");
assert.match(
  shoot,
  /if \(isGssfAuthoritySession\(\) && !isGssfAuthorityPackage\(backendAuthorityPackage\)\) \{[\s\S]*?grid\.innerHTML = targetIntelStackHtml\(\);[\s\S]*?return;/,
  "GSSF pending and failure states must render even before a valid result package exists",
);
assert.match(
  shoot,
  /document\.getElementById\("showResults"\)\.disabled = authorityRequestInFlight \|\|/,
  "repeat submissions must be locked while backend scoring is in flight",
);
assert.match(
  shoot,
  /authorityStatusMessage = "Scoring service unavailable\. Please try again\.";[\s\S]*?renderResults\(\);[\s\S]*?finally \{[\s\S]*?authorityRequestInFlight = false;[\s\S]*?renderResults\(\);/,
  "authority failure must be visible and must release the submission lock",
);

console.log("GSSF Show Results contract: PASS");
