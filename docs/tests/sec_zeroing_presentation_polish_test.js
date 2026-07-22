const fs = require("fs");
const path = require("path");
const assert = require("assert");

const records = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const styles = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

assert(records.includes("function correctionInstruction(value, axis)"), "SEC must format backend correction instructions for presentation");
assert(records.includes('return `${direction} ${amount} ${Number(amount) === 1 ? "click" : "clicks"}`;'), "correction wording must lead with the authoritative direction");
assert(!records.includes("function compactClick"), "SEC must not reduce correction directions to arrow-only shorthand");
assert(records.includes('class="sec-correction-callout"'), "scope corrections must receive a prominent presentation region");
assert(records.includes("Scope Corrections"), "correction region must use shooter-readable language");

assert(records.includes('<div><span>Group</span><strong>${escapeHtml(impactsDisplay)}</strong></div>'), "impact count must describe the recorded group");
assert(records.includes('metrics.push(["Group Size", pkg.group.display])'), "group size must remain backend-authoritative");
assert(records.includes('metrics.push(["POIB", poib])'), "POIB must remain visible and backend-derived");
assert(records.includes("typeof rawImpactCount === \"number\""), "missing impact count must not be coerced into zero");
assert(records.includes('typeof correction.xInches !== "number"'), "missing POIB coordinates must not be coerced into centered zero");

assert(records.includes("Scope / Optic"), "SEC must retain scope information from Weapon Setup");
for (const field of ["opticType", "opticBrand", "opticModel", "magnification", "opticClickValue", "opticAdjustmentUnit"]) {
  assert(records.includes(`snapshot.${field}`), `SEC must retain ${field} from Weapon Setup`);
}

assert(styles.includes("/* SEC zeroing presentation refinement */"), "SEC polish styles must be explicitly scoped");
assert(styles.includes(".records-page .sec-heading > div"), "SEC title must use the compact horizontal heading treatment");
assert(styles.includes(".records-page .sec-correction-callout"), "correction callout must have a dedicated visual rule");
assert(styles.includes(".records-page .sec-authority-detail"), "POIB and group size must have a readable metrics layout");

console.log("PASS SEC zeroing presentation polish test");
