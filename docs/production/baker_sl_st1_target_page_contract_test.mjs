import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, script, css, server, backend] = await Promise.all([
  readFile("t/baker/sl-st1/index.html", "utf8"),
  readFile("t/baker/sl-st1/target-page.js", "utf8"),
  readFile("t/baker/sl-st1/target-page.css", "utf8"),
  readFile("backend/server.py", "utf8"),
  readFile("backend/baker_sl_st1_target_page.py", "utf8")
]);

assert.match(html, /Silhouette Target \(USPSA\)/);
assert.match(html, /Baker Targets/);
assert.match(html, /Load your target photo to begin\./);
for (const control of [
  "Choose Photo",
  "Retake",
  "Replace",
  "Undo",
  "Clear",
  "Show Results"
]) {
  assert.match(html, new RegExp(`>${control}<`), `Missing shooter control: ${control}`);
}
assert.equal((html.match(/type="file"/g) || []).length, 3, "one initial photo chooser plus Retake and Replace inputs");
assert.equal((html.match(/for="libraryInput"/g) || []).length, 1, "one visible initial photo-entry action");
assert.doesNotMatch(html, />Take Photo</, "duplicate camera-only entry action is not presented");

const visibleMarkup = html.replace(/<script[\s\S]*?<\/script>/gi, "");
for (const forbidden of [
  "ATP",
  "UGO",
  "authority package",
  "geometry version",
  "evidence hash",
  "session contract",
  "founder_verification_pending",
  "backend status"
]) {
  assert.doesNotMatch(visibleMarkup, new RegExp(forbidden, "i"));
}
assert.doesNotMatch(visibleMarkup, /Continue to SEC|supportedResults|Backend-authoritative score/i);
assert.doesNotMatch(script, /Mission A Founder Flow|show the authoritative score|Loading the governed Baker|The governed Baker target/);
assert.doesNotMatch(visibleMarkup, /Shot 1|order fired|firing order/i);
assert.doesNotMatch(visibleMarkup, /scoring model|pending verification|supported analysis/i);
assert.match(script, /Tap every bullet hole you see\./);
assert.match(script, /Last mark removed\./);
assert.match(script, /Your bullet-hole marks are still here\. Try Show Results again\./);
assert.match(script, /requestConfirmation/);
assert.doesNotMatch(script, /window\.confirm|\bconfirm\(/);
assert.match(script, /xNorm/);
assert.match(script, /yNorm/);
assert.match(script, /authorityRequest\("prepare"/);
assert.match(script, /authorityRequest\("start"/);
assert.match(script, /ADAPTERS\.BAKER_SL_ST1/);
assert.doesNotMatch(script, /function\s+(?:score|classify)|calculateScore|scoreImpact/i);

assert.match(server, /\/api\/target\/baker-sl-st1\/analyze/);
assert.match(backend, /"impactCount": len\(normalized_impacts\)/);
assert.match(backend, /"numeric scoring"|"scoring"/i);
assert.match(backend, /"status": "unavailable"/);
assert.doesNotMatch(backend, /score\s*[+\-*\/]=|score\s*=\s*\d/i);

assert.match(css, /@media \(max-width:520px\)/);
assert.match(css, /overflow-x:hidden/);
assert.match(css, /touch-action:manipulation/);
assert.match(html, /id="workflowDock"/);
assert.match(css, /\.sl-workspace\{[\s\S]*?grid-template-rows:minmax\(0,1fr\) auto/);
assert.match(css, /\.sl-workflow-dock\{[\s\S]*?position:relative/);
assert.match(css, /height:var\(--sl-workspace-viewport-height/);
assert.match(script, /visualViewport\.offsetTop/);
assert.match(script, /viewportTop \+ viewportHeight - Math\.max\(viewportTop, headerBottom\)/);
assert.doesNotMatch(script, /Math\.max\(72,/);
assert.match(script, /geometry-preserving-display-derivative/);
assert.match(script, /maximumStoredBytes = 320000/);
assert.match(script, /await decodeDisplayedImage\(elements\.image\)/, "selected photograph decodes before the Target Workspace is revealed");
assert.match(script, /ResizeObserver/);
assert.match(css, /\.sl-target-page\.sl-workspace-active \.sl-target-introduction\{display:none\}/);
assert.match(css, /scroll-margin-top:66px/);
assert.match(script, /headerBottom/);
assert.match(script, /Opening your Shooter Experience Card…/);
assert.match(script, /async function persistResultAndOpenSec\(processingId\)/);
assert.match(script, /SCZN3Processing\?\.update\(processingId, "Opening your Shooter Experience Card…"\)/);
assert.match(script, /await persistResultAndOpenSec\(processingId\)/);
assert.match(script, /state\.result \? "Opening your Shooter Experience Card…" : "Analyzing your target and calculating your score…"/);
assert.doesNotMatch(script, /continueToSec|supportedResults|renderBackendResult/);
assert.doesNotMatch(script, /catch \(error\) \{[\s\S]{0,500}workspace\.scrollIntoView/);
assert.match(script, /Add another, Undo, Clear, or Show Results\./);
assert.doesNotMatch(html, /Highest score wins|class="sl-authoritative-score"/);
assert.doesNotMatch(script, /classificationAuthority === "backend"|distribution\.zoneCounts\[zone\]|totalScore\.textContent/, "Target Page must not duplicate SEC scoring presentation");
assert.match(script, /founderReview.*mission-a-canonical/);
assert.match(script, /BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE\.webp/);
assert.match(script, /loadImage\(new File/);

console.log("PASS Baker SL-ST1 Phase 4 Target Page presentation contract");
