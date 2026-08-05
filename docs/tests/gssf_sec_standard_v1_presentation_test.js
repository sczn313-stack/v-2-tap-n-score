const fs = require("fs");
const path = require("path");
const assert = require("assert");

const records = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const m4Styles = fs.readFileSync(path.join(__dirname, "..", "m4-sec.css"), "utf8");
const vaultStyles = fs.readFileSync(path.join(__dirname, "..", "ballistic-vault.css"), "utf8");
const renderStart = records.indexOf("function renderGssfM4ReferenceSec(");
const renderEnd = records.indexOf("\nfunction renderHistory", renderStart);

assert(renderStart >= 0 && renderEnd > renderStart, "universal GSSF SEC renderer must be extractable");
const renderer = records.slice(renderStart, renderEnd);

assert(renderer.includes('class="sec-experience m4-reference-sec-card gssf-m4-reference-sec-card"'), "GSSF must inherit the M4 SEC shell");
assert(renderer.includes('class="sec-before-after"'), "GSSF must retain the universal two-panel TARGET footprint");
assert(renderer.includes("Confirmed Impacts"), "GSSF left TARGET panel must show confirmed target evidence");
assert(renderer.includes("Shot Distribution"), "GSSF right TARGET panel must show scoring analysis");
assert(renderer.includes("Down Zero") && renderer.includes("+1") && renderer.includes("+3") && renderer.includes("Miss / Other"), "GSSF analysis must retain all governed scoring buckets");
assert(renderer.includes("shotIds.join"), "GSSF scoring buckets must retain shot-number traceability");
assert(renderer.includes("Timer") && renderer.includes("GSSF Final Results"), "timer and final result must remain in the universal sequence below TARGET");
assert(!renderer.includes('class="sec-correction-call"'), "GSSF must not restore an oversized score hero");
assert(!/Backend shot classifications|Diagnostic validation evidence|Marker coordinate validation/.test(renderer), "GSSF SEC must not expose developer diagnostics");

assert(/\.records-page \.m4-reference-sec-card\{/.test(m4Styles), "GSSF must use the governed reference-card footprint");
assert(/\.vault-scoring-panel\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(vaultStyles), "Vault GSSF analysis must remain compact inside the second evidence panel");
assert(records.includes('? "ANALYSIS" : "AFTER"'), "Vault browse must label the GSSF exception as ANALYSIS");

console.log("PASS GSSF universal SEC presentation contract");
