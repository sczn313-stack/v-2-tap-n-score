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
  "Take Photo",
  "Choose Photo",
  "Retake Photo",
  "Choose Another",
  "Undo Last Mark",
  "Clear Bullet Holes",
  "Show Results"
]) {
  assert.match(html, new RegExp(`>${control}<`), `Missing shooter control: ${control}`);
}

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
assert.match(visibleMarkup, /Continue to SEC/i);
assert.doesNotMatch(visibleMarkup, /Shot 1|order fired|firing order/i);
assert.doesNotMatch(visibleMarkup, /scoring model|pending verification|supported analysis/i);
assert.match(script, /Tap every bullet hole you can see\./);
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
assert.match(script, /ResizeObserver/);
assert.match(css, /\.sl-target-page\.sl-workspace-active \.sl-target-introduction\{display:none\}/);
assert.match(css, /scroll-margin-top:66px/);
assert.match(script, /headerBottom/);
assert.match(script, /continuationState = "pending"/);
assert.match(script, /Opening your Shooter Experience Card…/);
assert.doesNotMatch(script, /catch \(error\) \{[\s\S]{0,500}workspace\.scrollIntoView/);
assert.match(script, /Add another bullet hole, undo or clear a mark, or show results\./);
assert.match(html, /Highest score wins/);
assert.match(script, /classificationAuthority === "backend"/);
assert.match(script, /distribution\.zoneCounts\[zone\]/);
assert.match(script, /scoring\.zoneValues\[zone\]/);
assert.match(script, /scoring\.subtotals\[zone\]/);
assert.match(script, /totalScore\.textContent = String\(scoring\.total\)/);
assert.match(script, /founderReview.*mission-a-canonical/);
assert.match(script, /BAKER_SL_ST1_PRINTER_PRODUCT_IMAGE\.webp/);
assert.match(script, /loadImage\(new File/);

console.log("PASS Baker SL-ST1 Phase 4 Target Page presentation contract");
