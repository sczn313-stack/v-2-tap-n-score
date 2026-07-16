const assert = require("assert");
const fs = require("fs");
const path = require("path");

const docs = path.resolve(__dirname, "..");
const analytics = require(path.join(docs, "analytics.js"));
const indexHtml = fs.readFileSync(path.join(docs, "index.html"), "utf8");
const analyticsHtml = fs.readFileSync(path.join(docs, "analytics.html"), "utf8");

function gssfPackage(overrides = {}) {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: "gssf_ac_1",
    targetProfileVersion: "1",
    mission_family: "gssf",
    resultPackageType: "gssfPaperPenaltyResult",
    resultSource: "backend",
    authorityVersion: "gssf-authority-v1",
    totalPaperPenaltySeconds: 4,
    rawTimeSeconds: null,
    finalTimeSeconds: null,
    finalTimeStatus: "unavailable_without_raw_time",
    authorityTrace: {
      registrationPackageId: "gssf-ac-1-clean-reference-registration-v1",
      geometryProfileVersion: "1",
      scoringProfileVersion: "1",
      missionProfileVersion: "1",
      targetExecutionContractId: "gssf-ac-1-live-canonical-v1"
    },
    canonicalAsset: {
      canonicalAssetId: "gssf_ac_1_clean_reference_png_v1",
      canonicalAssetSha256: "hash"
    },
    scoringBreakdown: [
      { zone: "downZero", count: 1, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [1] },
      { zone: "plusOne", count: 1, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 1, shotIds: [2] },
      { zone: "plusThree", count: 1, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 3, shotIds: [3] },
      { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
    ],
    ...overrides
  };
}

function session(pkg, savedAt = "2026-07-16T14:00:00-04:00") {
  return { savedToSEC: true, savedAt, backendAuthorityPackage: pkg };
}

assert.strictEqual(analytics.actualFiniteNumber(null), null, "null is unavailable");
assert.strictEqual(analytics.actualFiniteNumber("0"), null, "numeric strings are unavailable");
assert.strictEqual(analytics.actualFiniteNumber(0, { nonnegative: true }), 0, "explicit numeric zero remains valid");

const valid = session(gssfPackage());
const malformed = session(gssfPackage({ totalPaperPenaltySeconds: null }));
const mixedMission = session({ ...gssfPackage(), mission_family: "zeroingCorrection" });
const analysis = analytics.analyzeSessions([valid, malformed, mixedMission], "all", new Date("2026-07-16T18:00:00Z"));
assert.strictEqual(analysis.completedSessions, 1, "only authority-complete records count as completed sessions");
assert.strictEqual(analysis.authoritativeShots, 3, "authoritative shot total comes from governed buckets");
assert.strictEqual(analysis.unavailableRecords, 2, "invalid authority remains unavailable");

assert.strictEqual(analytics.recordResult(analytics.eligibleRecord(valid)), "4 sec Paper Penalty", "missing timer never becomes Final Time");
const fabricatedFinal = session(gssfPackage({ rawTimeSeconds: null, finalTimeSeconds: 4, finalTimeStatus: "calculated" }));
assert.strictEqual(analytics.recordResult(analytics.eligibleRecord(fabricatedFinal)), "4 sec Paper Penalty", "final status cannot override missing timer authority");
const numericZero = session(gssfPackage({ rawTimeSeconds: 0, finalTimeSeconds: 4, finalTimeStatus: "calculated" }));
assert.strictEqual(analytics.recordResult(analytics.eligibleRecord(numericZero)), "4 sec Final Time", "explicit numeric zero timer is valid");

const comparison = analytics.gssfAnalytics([
  analytics.eligibleRecord(valid),
  analytics.eligibleRecord(session(gssfPackage({ targetProfileVersion: "2" }), "2026-07-16T15:00:00-04:00"))
]);
assert.strictEqual(comparison.records.length, 1, "target versions are never compared across contexts");
assert.strictEqual(comparison.excluded, 1, "incompatible record is explicitly excluded");

const evidenceSession = {
  ...valid,
  targetEvidenceImage: {
    dataUrl: "assets/gssf_ac_1_clean_reference.png",
    assetRole: "scorable_canonical_asset",
    canonicalAssetId: "gssf_ac_1_clean_reference_png_v1",
    canonicalAssetSha256: "hash",
    registrationPackageId: "gssf-ac-1-clean-reference-registration-v1"
  }
};
assert.strictEqual(analytics.governedEvidenceUrl(evidenceSession, analytics.eligibleRecord(evidenceSession)), "assets/gssf_ac_1_clean_reference.png", "approved canonical evidence renders");
assert.strictEqual(analytics.governedEvidenceUrl({ ...evidenceSession, targetEvidenceImage: null }, analytics.eligibleRecord(evidenceSession)), null, "missing evidence has no fallback");

assert(analyticsHtml.includes("Founder Dashboard") && analyticsHtml.includes("Founder authentication is required"), "analytics is relocated behind the founder access boundary");
assert(!analyticsHtml.includes("renderAnalyticsPage") && !analyticsHtml.includes('src="analytics.js"'), "public analytics URL requests and renders no analytics data");
for (const page of ["index.html", "matrix.html", "shoot.html", "records.html", "survey.html", "buy-targets.html"]) {
  const html = fs.readFileSync(path.join(docs, page), "utf8");
  assert(!html.includes('href="analytics.html"'), `${page} does not expose founder analytics in public navigation`);
}
assert(!indexHtml.includes("Completed Sessions") && !indexHtml.includes("Shooting Days"), "Home no longer presents analytics metrics");
assert(!indexHtml.includes("Average Score") && !indexHtml.includes("Best Score") && !indexHtml.includes("Targets Shot"), "fabricated universal metrics are removed");
assert(!indexHtml.includes("BAKER_ST_100YD_SMART_AUTHORITY_v1_ORIGINAL.png"), "Home has no Baker evidence fallback");

console.log("PASS shooter analytics truth governance");
