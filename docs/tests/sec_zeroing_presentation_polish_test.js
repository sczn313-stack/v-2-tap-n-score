import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const [records, sharedComponents, zeroingStyles] = await Promise.all([
  readFile(new URL("../records.html", import.meta.url), "utf8"),
  readFile(new URL("../sec_framework.js", import.meta.url), "utf8"),
  readFile(new URL("../m4-sec.css", import.meta.url), "utf8")
]);

assert.match(records, /function correctionInstruction\(value, axis\)/, "SEC must format backend correction instructions for presentation");
assert.match(records, /return `\$\{direction\} \$\{amount\} \$\{Number\(amount\) === 1 \? "click" : "clicks"\}`;/, "correction wording must lead with the authoritative direction");
assert.doesNotMatch(records, /function compactClick/, "SEC must not reduce correction directions to arrow-only shorthand");
assert.match(records, /SCZN3SECComponents\.ZeroingCorrection\(\{ systemLabel: model\.label \|\| "Recorded sight setup", axes: \[axis\("elevation"\), axis\("windage"\)\] \}\)/, "zeroing SEC must use the governed shared correction component");
assert.doesNotMatch(records, /class="sec-correction-callout"/, "retired zeroing correction renderer must remain unreachable");

const window = {};
vm.runInNewContext(sharedComponents, { window, console, Object, Array, Number, String, Math });
const markup = window.SCZN3SECComponents.ZeroingCorrection({
  systemLabel: "Scope / Optic",
  axes: [
    { label: "Elevation", direction: "UP 4 clicks", supporting: "1.00 MOA offset · 0.25 MOA/click · turn UP" },
    { label: "Windage", direction: "LEFT 2 clicks", supporting: "0.50 MOA offset · 0.25 MOA/click · turn LEFT" }
  ]
});
assert.match(markup, /sec-sight-correction-story/);
assert.match(markup, /Adjustment system/);
assert.match(markup, /Scope \/ Optic/);
assert.match(markup, /Elevation[\s\S]*UP 4 clicks[\s\S]*1\.00 MOA offset · 0\.25 MOA\/click · turn UP/);
assert.match(markup, /Windage[\s\S]*LEFT 2 clicks[\s\S]*0\.50 MOA offset · 0\.25 MOA\/click · turn LEFT/);

assert.match(records, /<div class="sec-metric"><span>Confirmed Group<\/span><strong>\$\{escapeHtml\(impactsDisplay\)\}<\/strong><\/div>/, "impact count must describe the recorded group");
assert.match(records, /metrics\.push\(\["Group Size", pkg\.group\.display\]\)/, "group size must remain backend-authoritative");
assert.match(records, /metrics\.push\(\["POIB", poib\]\)/, "POIB must remain visible and backend-derived");
assert.match(records, /typeof rawImpactCount === "number"/, "missing impact count must not be coerced into zero");
assert.match(records, /typeof correction\.xInches !== "number"/, "missing POIB coordinates must not be coerced into centered zero");
assert.match(records, /typeof angularValue === "number" \? `\$\{angularValue\.toFixed\(2\)\} \$\{unit\} offset`/, "MOA/MRAD supporting authority must remain visible");
assert.match(records, /Number\.isFinite\(Number\(model\[`\$\{name\}PerClick`\]\)\)/, "sight click authority must remain visible");

assert.match(records, /const equipment = \[snapshot\.opticType, snapshot\.opticBrand, snapshot\.opticModel\]/, "SEC must retain scope information from Weapon Setup");
assert.match(records, /\{ label: "Firearm", value: firearm \}, \{ label: "Equipment", value: equipment \}/, "zeroing SEC must present the governed optic setup as Equipment");
for (const field of ["opticType", "opticBrand", "opticModel", "magnification", "opticClickValue", "opticAdjustmentUnit"]) {
  assert.match(records, new RegExp(`snapshot\\.${field}`), `SEC must retain ${field} from Weapon Setup`);
}

assert.match(zeroingStyles, /\.sec-sight-correction-story/);
assert.match(zeroingStyles, /\.sec-sight-correction-axis/);
assert.match(zeroingStyles, /@media\(max-width:640px\)[\s\S]*\.sec-sight-correction-grid\{grid-template-columns:1fr\}/, "shared correction axes must stack on narrow screens");

console.log("PASS governed shared SEC zeroing correction presentation test");
