import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const sessionAuthority = await readFile(new URL("../backend/session_authority.py", import.meta.url), "utf8");
const authorityService = await readFile(new URL("../backend/authority_service.py", import.meta.url), "utf8");
const sec = await readFile(new URL("../sec.html", import.meta.url), "utf8");
const records = await readFile(new URL("../records.html", import.meta.url), "utf8");
const secStyles = await readFile(new URL("../m4-sec.css", import.meta.url), "utf8");
const navigation = await readFile(new URL("../navigation.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const matrix = await readFile(new URL("../matrix.html", import.meta.url), "utf8");
const shoot = await readFile(new URL("../shoot.html", import.meta.url), "utf8");
const buildSite = await readFile(new URL("./build-site.mjs", import.meta.url), "utf8");
const buildNetlify = await readFile(new URL("./build-netlify.mjs", import.meta.url), "utf8");
const favicon = await readFile(new URL("../favicon.ico", import.meta.url));

assert.match(sessionAuthority, /"confirmationAuthority": \{[\s\S]*?"status": "authority_unavailable"[\s\S]*?"requiredConfirmationShotCount": None[\s\S]*?"authorityProvenance": None/, "100 Yard ATP must expose the unresolved authority fields without invented values");
assert.match(authorityService, /"evidenceStatus": "recorded"[\s\S]*?"confirmed": None[\s\S]*?"reason": "authoritative_confirmation_standard_not_registered"/, "confirmation evidence remains preserved while the decision fails closed");

assert.match(sec, /class="sec-evidence-plane" id="beforeEvidencePlane"[\s\S]*?class="marker-layer" id="beforeEvidenceMarkers"/, "live SEC evidence and overlays share one governed plane");
assert.match(records, /function evidencePlane\([\s\S]*?--evidence-aspect:/, "Vault and historical SECs use the shared evidence-plane renderer");
assert.match(secStyles, /\.sec-comparison-target\{[\s\S]*?place-items:center/, "all evidence panels use a stable centered viewport");
assert.match(secStyles, /\.sec-evidence-plane\{[\s\S]*?aspect-ratio:var\(--evidence-aspect/, "evidence keeps its source aspect within the governed viewport");
assert.match(secStyles, /\.sec-evidence-plane>\.marker-layer\{[\s\S]*?width:100%;height:100%/, "markers remain registered to the evidence plane");

assert.match(navigation, /DESKTOP_DESTINATIONS[\s\S]*?filter\(item => item\.page !== activePage\)/, "desktop navigation omits the current page");
assert.match(styles, /@media \(max-width:800px\)\{[\s\S]*?\.platform-quick-nav\{display:none\}/, "quick navigation remains a desktop-only presentation");

assert.match(matrix, /function sessionAuthorityShooterMessage\([\s\S]*?session service is temporarily unavailable[\s\S]*?target requirements changed/, "session failures are classified before shooter guidance is selected");
assert.match(shoot, /function authorityFailureShooterMessage\([\s\S]*?cannot reach the analysis service[\s\S]*?analysis service is temporarily unavailable/, "analysis failures distinguish network reachability from backend availability");
assert.doesNotMatch(shoot, /Results couldn’t be calculated\. Check your connection, then try again\./, "unexpected failures must not be mislabeled as connection failures");

assert.equal(favicon[0], 0x89, "favicon must contain a PNG signature");
assert.equal(favicon.subarray(1, 4).toString("ascii"), "PNG", "favicon must be a valid PNG asset");
assert.ok((await stat(new URL("../favicon.ico", import.meta.url))).size < 20_000, "favicon should remain lightweight");
assert.match(buildSite, /"favicon\.ico"/, "server build must include the favicon");
assert.match(buildNetlify, /"favicon\.ico"/, "Netlify build must include the favicon");

console.log("PASS Episode 53 Batch 1 governed contract");
