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

function validPackage(penalty) {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: "gssf_ac_1",
    mission_family: "gssf",
    resultPackageType: "gssfPaperPenaltyResult",
    resultSource: "backend",
    totalPaperPenaltySeconds: penalty,
    scoringBreakdown: [
      { zone: "downZero", count: 1, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [1] },
      { zone: "plusOne", count: 0, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "plusThree", count: 0, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
    ]
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const shootSource = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");
const liveContext = { Number, Set, gssfOfficialMatchTimeSeconds: 12.5 };
vm.createContext(liveContext);
vm.runInContext(`
  ${extractFunction(shootSource, "isGssfAuthorityPackage")}
  ${extractFunction(shootSource, "gssfPaperPenaltySeconds")}
  ${extractFunction(shootSource, "gssfOfficialCompetitionResult")}
  this.predicate = isGssfAuthorityPackage;
  this.result = gssfOfficialCompetitionResult;
`, liveContext);

const recordsSource = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const savedContext = { Number, Set };
vm.createContext(savedContext);
vm.runInContext(`
  ${extractFunction(recordsSource, "isGssfAuthorityPackage")}
  ${extractFunction(recordsSource, "optionalNumber")}
  ${extractFunction(recordsSource, "gssfCompetitionRecord")}
  this.predicate = isGssfAuthorityPackage;
  this.result = gssfCompetitionRecord;
`, savedContext);

const session = { officialMatchTimeSeconds: 12.5, totalPaperPenaltySeconds: 999, officialFinalScoreSeconds: 999 };
const runtimes = [
  ["live", liveContext, packageValue => liveContext.result(packageValue)],
  ["saved", savedContext, packageValue => savedContext.result(session, packageValue)]
];

for (const [label, runtime, resultFor] of runtimes) {
  for (const [caseName, penalty] of [
    ["missing", undefined],
    ["null", null],
    ["empty string", ""],
    ["nonnumeric", "ten"],
    ["coercible numeric string", "10"],
    ["negative", -1]
  ]) {
    const packageValue = validPackage(4);
    if (caseName === "missing") delete packageValue.totalPaperPenaltySeconds;
    else packageValue.totalPaperPenaltySeconds = penalty;
    assert.strictEqual(runtime.predicate(packageValue), false, `${label} rejects ${caseName} penalty authority`);
    const result = resultFor(packageValue);
    assert.strictEqual(result.totalPaperPenaltySeconds, null, `${label} does not replace ${caseName} penalty with zero`);
    assert.strictEqual(result.officialFinalScoreSeconds, null, `${label} does not calculate a final score for ${caseName} penalty`);
    assert.strictEqual(result.finalScoreStatus, "authority_unavailable", `${label} reports authority unavailable for ${caseName} penalty`);
  }

  const zeroPackage = validPackage(0);
  assert.strictEqual(runtime.predicate(zeroPackage), true, `${label} accepts explicit numeric zero penalty`);
  const zeroResult = resultFor(zeroPackage);
  assert.strictEqual(zeroResult.totalPaperPenaltySeconds, 0, `${label} preserves explicit numeric zero penalty`);
  assert.strictEqual(zeroResult.officialFinalScoreSeconds, 12.5, `${label} combines manual time with explicit zero penalty`);
  assert.strictEqual(zeroResult.finalScoreStatus, "calculated", `${label} calculates with explicit zero authority`);

  const positivePackage = validPackage(4);
  assert.strictEqual(runtime.predicate(positivePackage), true, `${label} accepts valid positive penalty`);
  const positiveResult = resultFor(positivePackage);
  assert.strictEqual(positiveResult.totalPaperPenaltySeconds, 4, `${label} preserves backend positive penalty`);
  assert.strictEqual(positiveResult.officialFinalScoreSeconds, 16.5, `${label} combines manual time with backend positive penalty`);
}

console.log("PASS GSSF paper-penalty authority test");
