import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(docs, relative), "utf8");
const runtime = read("target_execution_runtime.js");
const vault = read("records.html");
const css = read("ballistic-vault.css");

assert.match(runtime, /const classificationByIdentity = tst12ClassificationByObservationIdentity\(result\)/, "Vault indexes Backend classifications by stable observation identity");
assert.match(runtime, /classificationByIdentity\.has\(observation\.identity\)/, "preserved markers resolve outcome by observation identity before any legacy fallback");
assert.match(runtime, /: missedNumbers\.has\(index \+ 1\)/, "legacy records without observation identities retain their positional fallback");
assert.match(vault, /missesOnly \? model\.markers\.filter\(marker => marker\.isMiss\) : model\.markers/, "misses-only view filters the preserved marker set");
assert.match(vault, /vaultEvidenceOverlay\(model, \{ missesOnly: true \}\)/, "misses-only view reuses Vault target rendering");
assert.match(vault, /No missed taps in this session\./, "zero-miss sessions retain a clean explanatory state");
assert.match(vault, /vault-record-summary--tst12/, "control and styling remain scoped to TST-12 Vault cards");
assert.match(vault, /function tst12VaultStationDetails\(session\) \{\s+const result = authorityPackage\(session\);/, "TST-12 Vault station details use the records-side authoritative package resolver");
assert.doesNotMatch(vault, /function tst12VaultStationDetails\(session\) \{\s+const result = canonicalResult\(session\);/, "TST-12 Vault cannot call a runtime-private helper");
assert.match(css, /vault-tst12-misses-control>summary::after\{content:"▶"/, "closed control uses the right arrow");
assert.match(css, /vault-tst12-misses-control\[open\]>summary::after\{content:"▼"/, "open control uses the down arrow");
assert.match(css, /vault-record-summary--tst12 \.contract-missed-tap-identifiers\{[^}]*color:#17130a/, "Vault missed-tap numbers use the approved dark treatment");
assert.match(css, /contract-missed-tap-identifiers strong\{color:#5b4200/, "MISSED TAPS label remains distinct");
assert.match(css, /vault-record-summary--tst12 \.history-thumb-impact\{[^}]*background:rgba\(255,216,77,\.08\)/, "Vault hit centers remain see-through");
assert.match(css, /history-thumb-impact\.is-missed-tap\{[^}]*background:rgba\(214,40,40,\.08\)/, "Vault miss centers remain see-through");
assert.match(css, /vault-impact-count\{[^}]*left:calc\(100% \+ 3px\)/, "Vault count identifier sits outside the preserved center");

console.log("PASS TST-12 Vault misses-only presentation");
