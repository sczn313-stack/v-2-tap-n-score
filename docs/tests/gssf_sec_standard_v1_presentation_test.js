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
assert(renderer.includes("sec-before-after"), "GSSF must retain the universal two-panel TARGET footprint");
assert(renderer.includes('class="sec-before-after sec-gssf-evidence-grid"'), "GSSF TARGET row must use the governed content-height evidence grid");
assert(renderer.includes("Confirmed Impacts"), "GSSF left TARGET panel must show confirmed target evidence");
assert(renderer.includes("Shot Distribution"), "GSSF right TARGET panel must show scoring analysis");
assert(renderer.includes("Down Zero") && renderer.includes("+1") && renderer.includes("+3") && renderer.includes("Miss / Other"), "GSSF analysis must retain all governed scoring buckets");
assert(renderer.includes("shotIds.join"), "GSSF scoring buckets must retain shot-number traceability");
assert(renderer.includes('class="sec-gssf-hit-count"') && renderer.includes('class="sec-gssf-hit-label"'), "GSSF count and Hits label must expose independently governed typography");
assert(!renderer.includes("Compact Shot Distribution"), "GSSF SEC must not duplicate the four governed scoring buckets in a compact summary");
assert(renderer.includes("Timer") && renderer.includes("GSSF Final Results"), "timer and final result must remain in the universal sequence below TARGET");
assert(!renderer.includes('class="sec-correction-call"'), "GSSF must not restore an oversized score hero");
assert(!/Backend shot classifications|Diagnostic validation evidence|Marker coordinate validation/.test(renderer), "GSSF SEC must not expose developer diagnostics");

assert(/\.records-page \.m4-reference-sec-card\{/.test(m4Styles), "GSSF must use the governed reference-card footprint");
assert(/\.records-page \.sec-gssf-evidence-grid \.sec-comparison-target\{[^}]*min-height:clamp\(360px,48vw,520px\);aspect-ratio:auto/.test(m4Styles), "GSSF evidence panels must grow to reveal the complete shot distribution");
assert(/\.sec-gssf-hit-count\{[^}]*font-size:clamp\(23px,4vw,31px\)/.test(m4Styles), "GSSF hit count must retain a contained responsive hierarchy");
assert(/\.sec-gssf-hit-label\{[^}]*font-size:8px/.test(m4Styles), "GSSF Hits label must use the smallest governed typography necessary for containment");
assert(/@media\(min-width:461px\) and \(max-width:900px\)\{[\s\S]*?\.sec-gssf-analysis-grid strong\{display:grid;gap:1px\}[\s\S]*?\.sec-gssf-hit-count\{justify-self:start;max-width:100%;font-size:clamp\(14px,1\.8vw,18px\)\}[\s\S]*?\.sec-gssf-hit-label\{justify-self:start;max-width:100%;font-size:clamp\(7px,\.9vw,8px\)\}/.test(m4Styles), "the narrow two-panel range must place Hits beneath the count without changing card geometry");
assert(/@media\(max-width:460px\)\{[\s\S]*?\.sec-gssf-analysis-grid strong\{display:grid;gap:1px\}[\s\S]*?\.sec-gssf-hit-count\{justify-self:start;max-width:100%;font-size:16px\}[\s\S]*?\.sec-gssf-hit-label\{justify-self:start;max-width:100%;font-size:7px\}/.test(m4Styles), "the 390px range must contain count and Hits typography without changing card geometry");
assert(/@media\(max-width:460px\)\{[\s\S]*?\.records-page \.sec-gssf-evidence-grid \.sec-comparison-target\{min-height:420px\}/.test(m4Styles), "stacked 390px GSSF evidence panels must retain one equal governed footprint");
assert(/\.vault-scoring-panel\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(vaultStyles), "Vault GSSF analysis must remain compact inside the second evidence panel");
assert(records.includes('? "ANALYSIS" : "AFTER"'), "Vault browse must label the GSSF exception as ANALYSIS");

console.log("PASS GSSF universal SEC presentation contract");
