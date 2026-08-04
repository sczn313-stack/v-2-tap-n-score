import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const shoot = await readFile("shoot.html", "utf8");
const styles = await readFile("styles.css", "utf8");
const contextStyles = await readFile("workspace_correction_context.css", "utf8");
const universalUi = await readFile("universal-ui.css", "utf8");

assert.match(shoot, /class="authority-recovery-state"/, "failed scoring uses a dedicated recovery state");
assert.match(shoot, /data-authority-retry>Try Again</, "recovery preserves a direct retry action");
assert.match(shoot, /if \(!scoreCell && resultsShown\) \{[\s\S]*?grid\.innerHTML = targetIntelStackHtml\(\);[\s\S]*?scoreCell = document\.getElementById\("scoreCell"\);/, "a successful retry restores the results hierarchy");
assert.match(shoot, /Results couldn’t be calculated\. Check your connection, then try again\./, "recovery copy is concise and actionable");
assert.doesNotMatch(shoot, /Your target data has not been lost\./, "recovery removes unnecessary reassurance");
assert.doesNotMatch(shoot, />Your Score</, "a failed or zeroing result cannot present score as the visual hero");
assert.match(shoot, /if \(value === null \|\| value === undefined \|\| value === ""\) return null;/, "missing score data cannot render as a numeric zero");
assert.match(shoot, /id="shooterResultAction"/, "zeroing results lead with the next shooter action");
assert.match(shoot, /Apply \$\{windage\.direction\} \$\{windage\.count\}/, "the next action carries the precise click correction");

assert.match(styles, /\.target-page \.shooter-result-action\{[\s\S]*?border:2px solid #d9960b/, "the next action receives primary result emphasis");
assert.match(styles, /\.target-page \.target-intel-score\{[\s\S]*?min-height:42px/, "score is reduced to a compact supporting metric");
assert.match(styles, /\.target-page \.zeroing-setup-panel\{[\s\S]*?border:1px solid rgba\(255,255,255,\.18\)/, "zeroing setup uses subordinate visual weight");

assert.match(contextStyles, /\.sec-session-configuration strong\{[\s\S]*?overflow-wrap:anywhere;[\s\S]*?text-overflow:clip;[\s\S]*?white-space:normal;/, "preserved setup does not truncate");
assert.match(contextStyles, /\.sec-session-record-fields strong\{[\s\S]*?overflow-wrap:anywhere;[\s\S]*?text-overflow:clip;[\s\S]*?white-space:normal;/, "Target, Shooter, Date, and Time do not truncate");
assert.match(contextStyles, /@media\(max-width:560px\)\{[\s\S]*?\.sec-session-record-fields\{[\s\S]*?grid-template-columns:1fr;/, "preservation fields stack at mobile width");

assert.match(universalUi, /Founder Review Batch 3 — navigation rests neutrally/, "the shared menu owns the neutral resting state");
assert.match(universalUi, /\.package-menu\[aria-expanded="true"\]/, "the hamburger becomes active only while open");
assert.match(universalUi, /\.platform-page \.mobile-platform-menu\[open\] summary/, "details menus share the active-open state");

console.log("PASS Founder Review Batch 3 UI corrections");
