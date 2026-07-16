const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `${name} must exist`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} must be extractable`);
}

function validPackage() {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: "gssf_ac_1",
    mission_family: "gssf",
    resultPackageType: "gssfPaperPenaltyResult",
    resultSource: "backend",
    totalPaperPenaltySeconds: 0,
    scoringBreakdown: [
      { zone: "downZero", count: 1, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [1] },
      { zone: "plusOne", count: 0, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "plusThree", count: 0, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
    ]
  };
}

function canonicalPackage() {
  return {
    ...validPackage(),
    targetProfileVersion: "1",
    canonicalAssetScoring: "accepted",
    authorityTrace: {
      targetProfileId: "gssf_ac_1",
      targetProfileVersion: "1",
      registrationPackageId: "gssf-ac-1-clean-png-registration-v1",
      registrationPackageVersion: "1",
      targetExecutionContractId: "gssf-ac-1-live-canonical-v1",
      canonicalAssetId: "gssf_ac_1_clean_reference_png_v1",
      canonicalAssetSha256: "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
      coordinateSystemVersion: "gssf-ac-1-canonical-coordinate-system-v1"
    }
  };
}

const recordsSource = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const context = { Number, Set };
vm.createContext(context);
vm.runInContext(`
  function escapeHtml(value) { return String(value ?? ""); }
  function authorityVisual() { return "governed-overlay"; }
  ${extractFunction(recordsSource, "isGssfAuthorityPackage")}
  ${extractFunction(recordsSource, "gssfCanonicalSavedEvidenceContract")}
  ${extractFunction(recordsSource, "hasGssfCanonicalSavedEvidenceAuthority")}
  ${extractFunction(recordsSource, "gssfSavedEvidenceDataUrl")}
  ${extractFunction(recordsSource, "gssfSavedEvidenceHtml")}
  this.select = gssfSavedEvidenceDataUrl;
  this.render = gssfSavedEvidenceHtml;
`, context);

const pkg = validPackage();
const validDataUrl = "data:image/png;base64,AAAA";
const validSession = {
  targetEvidenceImage: {
    evidenceType: "uploaded-target-image",
    dataUrl: validDataUrl
  }
};
assert.strictEqual(context.select(validSession, pkg), validDataUrl, "valid governed GSSF evidence is selected");
const validHtml = context.render(validSession, pkg);
assert(validHtml.includes(`<img src="${validDataUrl}"`), "valid GSSF evidence renders its saved image only");
assert(validHtml.includes("governed-overlay"), "valid GSSF evidence retains the authoritative overlay");

const canonicalSession = {
  targetEvidenceImage: {
    dataUrl: "assets/gssf_ac_1_clean_reference.png",
    assetRole: "scorable_canonical_asset",
    canonicalAssetId: "gssf_ac_1_clean_reference_png_v1",
    canonicalAssetSha256: "e08eb090f31e64a2fd75f6e88b7267ed9798da4eb438322d1dbc8246e362f030",
    registrationPackageId: "gssf-ac-1-clean-png-registration-v1",
    registrationPackageVersion: "1",
    canonicalCoordinateSystemVersion: "gssf-ac-1-canonical-coordinate-system-v1",
    imageWidthPx: 1125,
    imageHeightPx: 1373
  }
};
assert.strictEqual(
  context.select(canonicalSession, canonicalPackage()),
  "assets/gssf_ac_1_clean_reference.png",
  "the exact governed canonical GSSF asset is selected"
);
assert(
  context.render(canonicalSession, canonicalPackage()).includes("assets/gssf_ac_1_clean_reference.png"),
  "the governed canonical target image renders in the saved SEC"
);

for (const [label, mutateSession, mutatePackage] of [
  ["canonical asset hash mismatch", session => { session.targetEvidenceImage.canonicalAssetSha256 = "wrong"; }],
  ["canonical registration mismatch", session => { session.targetEvidenceImage.registrationPackageId = "wrong"; }],
  ["canonical dimensions mismatch", session => { session.targetEvidenceImage.imageWidthPx = 1; }],
  ["canonical coordinate mismatch", session => { session.targetEvidenceImage.canonicalCoordinateSystemVersion = "wrong"; }],
  ["authority trace mismatch", () => {}, pkgValue => { pkgValue.authorityTrace.targetExecutionContractId = "wrong"; }]
]) {
  const sessionValue = JSON.parse(JSON.stringify(canonicalSession));
  const packageValue = JSON.parse(JSON.stringify(canonicalPackage()));
  mutateSession(sessionValue);
  if (mutatePackage) mutatePackage(packageValue);
  assert.strictEqual(context.select(sessionValue, packageValue), null, `${label} refuses canonical evidence`);
}

for (const [label, session] of [
  ["missing", {}],
  ["null", { targetEvidenceImage: null }],
  ["wrong evidence type", { targetEvidenceImage: { evidenceType: "generic-target", dataUrl: validDataUrl } }],
  ["empty data URL", { targetEvidenceImage: { evidenceType: "uploaded-target-image", dataUrl: "" } }],
  ["remote URL", { targetEvidenceImage: { evidenceType: "uploaded-target-image", dataUrl: "https://example.com/target.png" } }],
  ["malformed data URL", { targetEvidenceImage: { evidenceType: "uploaded-target-image", dataUrl: "data:image/png;base64,not valid" } }]
]) {
  assert.strictEqual(context.select(session, pkg), null, `${label} GSSF evidence is rejected`);
  const html = context.render(session, pkg);
  assert(html.includes("GSSF evidence unavailable"), `${label} GSSF evidence renders an explicit unavailable state`);
  assert(!html.includes("<img"), `${label} GSSF evidence does not render a substitute image`);
  assert(!html.includes("BAKER_ST_100YD_SMART"), `${label} GSSF evidence never selects the Baker fallback`);
}

const invalidPackage = { ...pkg, mission_family: "zeroingCorrection" };
assert.strictEqual(context.select(validSession, invalidPackage), null, "evidence requires the strict GSSF package predicate");

const gssfRendererStart = recordsSource.indexOf("function renderGssfSecCard(");
const gssfRendererEnd = recordsSource.indexOf("\nfunction renderInvalidGssfSecCard", gssfRendererStart);
const gssfRendererSource = recordsSource.slice(gssfRendererStart, gssfRendererEnd);
assert(!gssfRendererSource.includes("BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"), "GSSF saved renderer has no Baker fallback");

const historyStart = recordsSource.indexOf("function renderHistory()");
const historyEnd = recordsSource.indexOf("\nrenderHistory();", historyStart);
const nonGssfHistorySource = recordsSource.slice(historyStart, historyEnd);
assert(nonGssfHistorySource.includes('"assets/BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"'), "non-GSSF saved-record fallback remains unchanged");

console.log("PASS saved GSSF evidence governance test");
