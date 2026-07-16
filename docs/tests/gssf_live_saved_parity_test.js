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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function authoritativePackage(penalty = 4) {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: "gssf_ac_1",
    mission_family: "gssf",
    resultPackageType: "gssfPaperPenaltyResult",
    resultSource: "backend",
    totalPaperPenaltySeconds: penalty,
    scoringBreakdown: [
      { zone: "downZero", count: 2, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [101, 103] },
      { zone: "plusOne", count: 1, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 1, shotIds: [107] },
      { zone: "plusThree", count: 0, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
    ]
  };
}

const shootSource = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");
const recordsSource = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");

function liveRuntime() {
  const context = { Number, Set, Map, gssfOfficialMatchTimeSeconds: 12.5 };
  vm.createContext(context);
  vm.runInContext(`
    function escapeHtml(value) { return String(value ?? ""); }
    ${extractFunction(shootSource, "isGssfAuthorityPackage")}
    ${extractFunction(shootSource, "gssfBucketDefinitions")}
    ${extractFunction(shootSource, "gssfAuthoritativeBreakdown")}
    ${extractFunction(shootSource, "gssfBucketSummaryHtml")}
    ${extractFunction(shootSource, "gssfPaperPenaltySeconds")}
    ${extractFunction(shootSource, "gssfOfficialCompetitionResult")}
    this.accepts = isGssfAuthorityPackage;
    this.renderBuckets = gssfBucketSummaryHtml;
    this.result = gssfOfficialCompetitionResult;
  `, context);
  return context;
}

function savedRuntime() {
  const context = { Number, Set, Map };
  vm.createContext(context);
  vm.runInContext(`
    function escapeHtml(value) { return String(value ?? ""); }
    function authorityVisual() { return "governed-overlay"; }
    ${extractFunction(recordsSource, "isGssfAuthorityPackage")}
    ${extractFunction(recordsSource, "gssfBucketDefinitions")}
    ${extractFunction(recordsSource, "gssfAuthoritativeBreakdown")}
    ${extractFunction(recordsSource, "gssfBucketSummaryHtml")}
    ${extractFunction(recordsSource, "optionalNumber")}
    ${extractFunction(recordsSource, "gssfCompetitionRecord")}
    ${extractFunction(recordsSource, "gssfCanonicalSavedEvidenceContract")}
    ${extractFunction(recordsSource, "hasGssfCanonicalSavedEvidenceAuthority")}
    ${extractFunction(recordsSource, "gssfSavedEvidenceDataUrl")}
    ${extractFunction(recordsSource, "gssfSavedEvidenceHtml")}
    this.accepts = isGssfAuthorityPackage;
    this.renderBuckets = gssfBucketSummaryHtml;
    this.result = gssfCompetitionRecord;
    this.renderEvidence = gssfSavedEvidenceHtml;
  `, context);
  return context;
}

const live = liveRuntime();
const saved = savedRuntime();
const savedSession = {
  officialMatchTimeSeconds: 12.5,
  totalPaperPenaltySeconds: 999,
  officialFinalScoreSeconds: 999,
  shotData: { totalPaperPenaltySeconds: 999, officialFinalScoreSeconds: 999 }
};

function savedResult(pkg) {
  return saved.result(savedSession, pkg);
}

function assertParity(label, pkg, expected) {
  assert.strictEqual(live.accepts(pkg), expected, `live ${label} acceptance`);
  assert.strictEqual(saved.accepts(pkg), expected, `saved ${label} acceptance`);
  assert.strictEqual(live.accepts(pkg), saved.accepts(pkg), `${label} live/saved acceptance parity`);
  if (!expected) {
    assert.strictEqual(live.renderBuckets(pkg), "", `live ${label} suppresses bucket scoring`);
    assert.strictEqual(saved.renderBuckets(pkg), "", `saved ${label} suppresses bucket scoring`);
    const liveScore = live.result(pkg);
    const savedScore = savedResult(pkg);
    for (const [surface, result] of [["live", liveScore], ["saved", savedScore]]) {
      assert.strictEqual(result.totalPaperPenaltySeconds, null, `${surface} ${label} has no fallback penalty`);
      assert.strictEqual(result.officialFinalScoreSeconds, null, `${surface} ${label} has no plausible final score`);
      assert.strictEqual(result.finalScoreStatus, "authority_unavailable", `${surface} ${label} reports authority unavailable`);
    }
  }
}

const valid = authoritativePackage();
assertParity("valid authoritative package", valid, true);
const liveBuckets = live.renderBuckets(valid);
const savedBuckets = saved.renderBuckets(valid);
assert(liveBuckets.includes("101, 103") && savedBuckets.includes("101, 103"), "both flows render authoritative shot IDs");
assert(liveBuckets.includes("None") && savedBuckets.includes("None"), "both flows preserve legitimate empty buckets");
assert.strictEqual(live.result(valid).officialFinalScoreSeconds, 16.5, "live valid positive penalty score");
assert.strictEqual(savedResult(valid).officialFinalScoreSeconds, 16.5, "saved valid positive penalty score");

const mutations = [
  ["missing bucket", pkg => pkg.scoringBreakdown.pop()],
  ["duplicate zone", pkg => { pkg.scoringBreakdown[3].zone = "downZero"; }],
  ["unknown zone", pkg => { pkg.scoringBreakdown[3].zone = "other"; }],
  ["null numeric field", pkg => { pkg.scoringBreakdown[0].count = null; }],
  ["empty-string numeric field", pkg => { pkg.scoringBreakdown[0].subtotalPenaltySeconds = ""; }],
  ["mismatched target identity", pkg => { pkg.target_profile_id = "baker_st_100yd_smart_zero"; }],
  ["mismatched mission identity", pkg => { pkg.mission_family = "zeroingCorrection"; }],
  ["invalid source", pkg => { pkg.resultSource = "frontend"; }],
  ["invalid status", pkg => { pkg.status = "research"; }],
  ["invalid package type", pkg => { pkg.resultPackageType = "zeroingResult"; }],
  ["missing penalty", pkg => { delete pkg.totalPaperPenaltySeconds; }],
  ["shot-count / shot-ID mismatch", pkg => { pkg.scoringBreakdown[0].count = 3; }]
];

for (const [label, mutate] of mutations) {
  const pkg = clone(valid);
  mutate(pkg);
  assertParity(label, pkg, false);
}

const zeroPenalty = authoritativePackage(0);
assertParity("explicit numeric zero penalty", zeroPenalty, true);
assert.strictEqual(live.result(zeroPenalty).officialFinalScoreSeconds, 12.5, "live preserves explicit zero penalty");
assert.strictEqual(savedResult(zeroPenalty).officialFinalScoreSeconds, 12.5, "saved preserves explicit zero penalty");

live.gssfOfficialMatchTimeSeconds = null;
const liveMissingTimer = live.result(valid);
const savedMissingTimer = saved.result({}, valid);
assert.strictEqual(liveMissingTimer.finalScoreStatus, "unavailable_without_official_time", "live refuses Final Time without timer time");
assert.strictEqual(savedMissingTimer.finalScoreStatus, "unavailable_without_official_time", "saved refuses Final Time without timer time");
assert.strictEqual(liveMissingTimer.officialFinalScoreSeconds, savedMissingTimer.officialFinalScoreSeconds, "live/saved missing-timer parity");

const missingEvidenceHtml = saved.renderEvidence({}, valid);
assert(missingEvidenceHtml.includes("GSSF evidence unavailable"), "saved missing evidence is explicitly unavailable");
assert(!missingEvidenceHtml.includes("<img"), "saved missing evidence has no substitute image");
const governedEvidenceHtml = saved.renderEvidence({
  targetEvidenceImage: { evidenceType: "uploaded-target-image", dataUrl: "data:image/png;base64,AAAA" }
}, valid);
assert(governedEvidenceHtml.includes("data:image/png;base64,AAAA"), "saved valid governed evidence renders");
assert(governedEvidenceHtml.includes("governed-overlay"), "saved valid governed evidence retains authority overlay");

console.log("PASS GSSF live/saved behavioral parity test");
