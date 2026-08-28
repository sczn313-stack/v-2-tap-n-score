import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const [owner, css, shoot] = await Promise.all([
  read("smart_target_workspace.js"),
  read("smart_target_workspace.css"),
  read("shoot.html")
]);

assert.match(owner, /function createPrecisionTap\(/, "shared workspace owns Precision Tap interaction");
assert.match(owner, /pointers\.size >= 2/, "shared owner supports two-pointer pinch");
assert.match(owner, /fitScale \* 12/, "shared owner supports useful magnification");
assert.match(owner, /singleStart\.moved/, "pan and tap are distinguished");
assert.match(owner, /onTap\(event, current\)/, "shared owner emits observations without interpreting them");
assert.doesNotMatch(owner, /enabled = !reviewing/, "Review preserves pinch and pan while canTap blocks new observations");
for (const forbidden of [/score/i, /qualif/i, /zeroing/i, /targetProfileId/i, /SKU/i]) {
  assert.doesNotMatch(owner, forbidden, `Precision Tap owner remains mission and target neutral: ${forbidden}`);
}

assert.match(shoot, /for="targetCameraInput">Take Photo<\/label>/);
assert.match(shoot, /for="targetImageInput">Choose Existing Photo<\/label>/);
assert.match(shoot, /id="targetCameraInput" type="file" accept="image\/\*" capture="environment"/);
assert.match(shoot, /SCZN3SmartTargetWorkspace\.createPrecisionTap\(/);
assert.match(shoot, /if \(markMode === "aim" \|\| !currentAimPoint\)/, "first required observation is aim");
assert.match(shoot, /currentImpactPoints\.push\(point\)/, "subsequent observations remain an unbounded shooter-declared collection");
assert.match(shoot, /precisionTapReviewing = true/);
assert.match(shoot, /precisionTapController\?\.setReviewing\(true\)/);
assert.match(shoot, /zeroingLivePhase = "confirmation";\s+precisionTapReviewing = false;/, "a new confirmation group reopens observation entry");
assert.match(shoot, /precisionTapEvidence: precisionTapEvidenceEnvelope\(\)/);
assert.match(shoot, /schemaVersion: "sczn3-precision-tap-observations-v1"/);
assert.match(shoot, /observationAuthority: "shooter_declared"/);
assert.match(shoot, /coordinateConvention: "normalized_source_image_top_left"/);
assert.match(shoot, /sourceImageSha256/);
assert.match(shoot, /originalSourceImageSha256/);
assert.match(shoot, /function governedPrecisionTapRegistration\(/);
assert.match(shoot, /function precisionTapShooterEvidenceReady\(evidence = activeEvidence\(\)\)/);
assert.match(shoot, /function precisionTapControlState\(rangeState, hasEvidence\)/);
assert.match(shoot, /dataset\.precisionTapControlState = precisionTapControlState/);
assert.match(shoot, /function renderPrecisionTapControls\(controlState, rangeState\)/);
assert.match(shoot, /id="precisionTapControlShellContent" data-precision-tap-control-owner="true"/, "one persistent child owns every Precision Tap control state");
assert.doesNotMatch(
  shoot.match(/function handleTargetImageSelection\(event\) \{[\s\S]*?\n\}/)?.[0] || "",
  /resetWorkspaceStageGeometry\(\)/,
  "photo selection replaces evidence without resetting the stay-on-screen workspace"
);
assert.match(shoot, /control\.hidden = !isVisible/);
assert.match(shoot, /control\.style\.setProperty\("display", "none", "important"\)/);
assert.match(shoot, /dataset\.precisionTapHasShots = currentImpactPoints\.length/);
assert.match(shoot, /function registeredExactAssetForUpload\(/);
assert.match(shoot, /imageEvidence\.sha256 !== authority\.sha256/);
assert.match(shoot, /imageEvidence\.width\) !== authority\.widthPx/);
assert.match(shoot, /TARGET_IMAGE_REGISTRATION_ENDPOINT[\s\S]*\/api\/authority\/target-image-registration/);
assert.match(shoot, /function activeTargetImageRegistrationAuthority\(/, "registration is inherited from governed Target Profile data");
assert.match(shoot, /\["exact", "estimated", "partial", "complete"\]\.includes\(String\(evidence\.registrationStatus/, "descriptive governed registration states replace the old binary gate");
assert.match(shoot, /registrationGlobalUncertaintyPx/);
assert.match(shoot, /registrationEvidenceId/);
assert.match(shoot, /We need a little more of the target in the picture\. Take another photo\. Your marks are still here\./);
assert.ok(
  shoot.indexOf("const registrationMessage = precisionTapRegistrationMessage()") < shoot.indexOf("const unavailableCapabilityMessage = unavailableResultCapabilityMessage()"),
  "registration fails closed before mission result authority is requested"
);
assert.match(shoot, /precision-tap-marker/);
assert.match(shoot, /precision-tap-aim-marker/);

assert.match(css, /\.precision-tap-viewport\{/);
assert.match(css, /touch-action:none/);
assert.match(css, /--precision-tap-marker-size,18px/);
assert.match(css, /background:rgba\(255,255,255,\.08\)/, "precision marker leaves the physical hole visible");
assert.doesNotMatch(css, /data-range-state="tap-aim"\] #setAimMode[\s\S]*display:none!important/);
assert.doesNotMatch(css, /data-range-state="tap-holes"\] #addImpactMode[\s\S]*display:none!important/);
assert.match(shoot, /Tap Your Aim Point/);
assert.match(shoot, /Tap Your Shots/);
assert.match(shoot, /nextStep = "setAimMode"/);
assert.match(shoot, /nextStep = "addImpactMode"/);
assert.match(shoot, /function governedCorrectionVector\(authorityPackage\)/);
assert.match(shoot, /return \{ start: poib, end: aim, intent: "POIB_TO_AIM" \}/);
assert.match(shoot, /vectorHtmlFromBackend\(governedCorrectionVector\(authorityPackage\)\)/);
assert.doesNotMatch(shoot, /arrowSvg\.style\.width = `\$\{layerRect\.width\}px`/);
assert.match(css, /data-sczn3-workspace-layout="stage-overlay"/);
assert.match(css, /data-sczn3-workspace-actions="true"[\s\S]*position:absolute/, "bottom action region stays anchored to the target workspace");
assert.match(css, /data-precision-tap-control-state="photo_entry"/);
assert.match(css, /data-precision-tap-control-state="aim_entry"/);
assert.match(css, /data-precision-tap-control-state="shot_entry"/);
assert.match(css, /data-precision-tap-control-state="result"/);
assert.match(css, /data-precision-tap-control-state="confirmation_entry"/);
assert.match(css, /data-precision-tap-control-state="save"/);
assert.match(css, /precision-tap-control-shell-content > \[hidden\][\s\S]*display:none!important/);
assert.match(css, /\.precision-tap-control-shell-content\{[\s\S]*width:100%;[\s\S]*height:100%/, "persistent state owner has invariant shell geometry");
assert.match(css, /\.precision-tap-photo-picker\{[\s\S]*height:100%;[\s\S]*background:transparent/, "photo-source choices replace shell contents without adding a panel");
assert.match(css, /precision-tap-photo-picker>div\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, "photo choices share one row in the persistent shell");
assert.match(css, /Defect #8[\s\S]*precision-tap-control-shell-content[\s\S]*border:0!important;[\s\S]*background:transparent!important;[\s\S]*box-shadow:none!important;/, "the workflow row remains the only painted visual shell");

console.log("PASS Episode 59 Precision Tap production boundary contract");
