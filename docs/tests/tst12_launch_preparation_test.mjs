import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");
const adapter = read("tst12_universal_experience.js");
const runtime = read("target_execution_runtime.js");
const records = read("records.html");

const instruction = "Record as many shots as you want at each station, but ONLY YOUR FIVE HIGHEST-SCORING SHOTS PER STATION COUNT TOWARD YOUR POINTS. Switch stations or return whenever you want.";
assert.ok(adapter.includes(instruction), "Founder-approved instruction 2 is exact");
assert.match(adapter, /const actualRoundDevelopmentControl = mode === "actual"[\s\S]*ACTUAL ROUND/, "Actual Round is available only on its directly requested development surface");
assert.doesNotMatch(adapter, /mode === "simulation"[\s\S]{0,160}>ACTUAL ROUND</, "Simulator ordinary navigation does not expose Actual Round");

assert.match(runtime, /function freshSimulatorEncounterHref\(/, "fresh encounter routing has a universal owner");
assert.match(runtime, /\["session", "view", "progression", "reopen", "reopenCapability", "capability"\]\.forEach/, "fresh routing removes prior record capabilities");
assert.match(runtime, /href\.searchParams\.set\("target", clean\(targetProfileId\)\)/, "fresh routing retains the same target");
assert.match(runtime, /href\.searchParams\.set\("experienceMode", "simulation"\)/, "fresh routing remains Simulator");
assert.match(runtime, /installSimulatorReentry\(root, \{ targetProfileId: targetId, missionFamily, experienceMode \}\)/, "every rendered registered-target Result receives universal Simulator re-entry");
assert.match(runtime, /secActions\(\{ mode, preserved, vaultHref, reopenHref, includeVaultAction: true \}\)/, "preserved registered-target Results retain the existing Ballistic Vault route");
assert.doesNotMatch(runtime, /data-allow-mission-exit[^\n]*sczn3-simulator-reentry|sczn3-simulator-reentry[^\n]*data-allow-mission-exit/, "fresh-run control does not bypass the existing unsaved-session guard");
assert.match(runtime, /const hasSelectedEquipment = \[[\s\S]*"ammoLoad"[\s\S]*\]\.some/, "session startup recognizes an actual firearm or ammunition selection");
assert.doesNotMatch(runtime.match(/const hasSelectedEquipment = \[[\s\S]*?\]\.some/)[0], /"opticType"|"opticBrand"|"opticModel"/, "an unrelated optic-only Matrix default cannot replace the target's governed standard setup");
assert.match(runtime, /new CustomEvent\("sczn3:target-observation-recorded"[\s\S]*observationCount: state\.observations\.length/, "the shared tap owner announces only an admitted observation");
assert.match(adapter, /event\.detail\?\.targetId !== targetId \|\| Number\(event\.detail\?\.observationCount\) !== 1/, "TST-12 closes READ only when its first valid observation is recorded");
assert.match(adapter, /panel\.hidden = true;[\s\S]*read\.setAttribute\("aria-expanded", "false"\)/, "automatic READ closure keeps disclosure state truthful");

assert.match(records, /function shootingSessionDisplayLabel\(session, fallback = ""\)/, "Vault owns the universal shooting-session heading transformation");
assert.match(records, /`Shooting Session #\$\{match\[1\]\}`/, "Vault preserves the record number while adding shooter-facing terminology");
assert.match(records, /const sessionLabel = shootingSessionDisplayLabel\(session, `Session \$\{vaultSessionNumber\(session\)\}`\)/, "preserved and draft compact Vault records use the shared heading");
assert.match(records, /summary\.innerHTML = `<span>1 · TARGET<\/span><strong>\$\{escapeHtml\(shootingSessionDisplayLabel/, "historical Vault detail uses the same heading owner");
assert.match(records, /PREPARED_DEMO_MODE \|\| RECORDS_PRIVATE_LAN \|\| RECORDS_LOCAL \? window\.location\.origin/, "a local Vault without an explicit split authority uses its same-origin durable Backend Authority");
assert.doesNotMatch(records, /RECORDS_LOCAL \? "http:\/\/127\.0\.0\.1:8098"/, "Vault does not silently route a same-origin Founder record to an unrelated stopped test port");

console.log("PASS TST-12 launch preparation contract");
