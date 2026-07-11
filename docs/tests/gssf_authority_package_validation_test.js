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

function rendererFor(fileName, endMarker) {
  const source = fs.readFileSync(path.join(__dirname, "..", fileName), "utf8");
  const predicateSource = extractFunction(source, "isGssfAuthorityPackage");
  const rendererStart = source.indexOf("function gssfBucketDefinitions()");
  const rendererEnd = source.indexOf(endMarker, rendererStart);
  assert(rendererStart >= 0 && rendererEnd > rendererStart, `${fileName} GSSF renderer must be extractable`);
  const context = { Number, Set, Map };
  vm.createContext(context);
  vm.runInContext(`
    function escapeHtml(value) { return String(value ?? ""); }
    ${predicateSource}
    ${source.slice(rendererStart, rendererEnd)}
    this.predicate = isGssfAuthorityPackage;
    this.render = gssfBucketSummaryHtml;
  `, context);
  return context;
}

function validPackage() {
  return {
    ok: true,
    status: "calculated",
    target_profile_id: "gssf_ac_1",
    mission_family: "gssf",
    resultPackageType: "gssfPaperPenaltyResult",
    resultSource: "backend",
    totalPaperPenaltySeconds: 1,
    scoringBreakdown: [
      { zone: "downZero", count: 2, penaltySecondsPerHit: 0, subtotalPenaltySeconds: 0, shotIds: [11, 15] },
      { zone: "plusOne", count: 1, penaltySecondsPerHit: 1, subtotalPenaltySeconds: 1, shotIds: [22] },
      { zone: "plusThree", count: 0, penaltySecondsPerHit: 3, subtotalPenaltySeconds: 0, shotIds: [] },
      { zone: "miss", count: 0, penaltySecondsPerHit: 10, subtotalPenaltySeconds: 0, shotIds: [] }
    ]
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const runtimes = [
  ["live", rendererFor("shoot.html", "\nfunction setGssfResultDisplayMode")],
  ["saved", rendererFor("records.html", "\nfunction gssfScoringSourceLine")]
];

for (const [label, runtime] of runtimes) {
  const valid = validPackage();
  assert.strictEqual(runtime.predicate(valid), true, `${label} accepts a complete backend GSSF package`);
  const rendered = runtime.render(valid);
  assert(rendered.includes("Shot IDs:"), `${label} renders the authoritative shot-ID field`);
  assert(rendered.includes("11, 15"), `${label} renders backend shot IDs without inventing indexes`);
  assert(rendered.includes("None"), `${label} preserves legitimate empty authoritative buckets`);

  for (const field of ["count", "penaltySecondsPerHit", "subtotalPenaltySeconds"]) {
    const nullNumeric = clone(valid);
    nullNumeric.scoringBreakdown[0][field] = null;
    assert.strictEqual(runtime.predicate(nullNumeric), false, `${label} rejects null ${field}`);
    assert.strictEqual(runtime.render(nullNumeric), "", `${label} suppresses buckets for null ${field}`);

    const emptyNumeric = clone(valid);
    emptyNumeric.scoringBreakdown[0][field] = "";
    assert.strictEqual(runtime.predicate(emptyNumeric), false, `${label} rejects empty-string ${field}`);
    assert.strictEqual(runtime.render(emptyNumeric), "", `${label} suppresses buckets for empty-string ${field}`);
  }

  const missingBucket = clone(valid);
  missingBucket.scoringBreakdown.pop();
  assert.strictEqual(runtime.predicate(missingBucket), false, `${label} rejects missing buckets`);

  const duplicateZone = clone(valid);
  duplicateZone.scoringBreakdown[3].zone = "downZero";
  assert.strictEqual(runtime.predicate(duplicateZone), false, `${label} rejects duplicate zones`);

  const unknownZone = clone(valid);
  unknownZone.scoringBreakdown[3].zone = "other";
  assert.strictEqual(runtime.predicate(unknownZone), false, `${label} rejects unknown zones`);

  for (const [field, value] of [
    ["ok", false],
    ["target_profile_id", "baker_st_100yd_smart_zero"],
    ["mission_family", "zeroingCorrection"],
    ["status", "research"],
    ["resultSource", "frontend"],
    ["resultPackageType", "zeroingResult"]
  ]) {
    const invalidIdentity = clone(valid);
    invalidIdentity[field] = value;
    assert.strictEqual(runtime.predicate(invalidIdentity), false, `${label} rejects invalid ${field}`);
    assert.strictEqual(runtime.render(invalidIdentity), "", `${label} suppresses buckets for invalid ${field}`);
  }

  const invalidShotIds = clone(valid);
  invalidShotIds.scoringBreakdown[0].shotIds = null;
  assert.strictEqual(runtime.predicate(invalidShotIds), false, `${label} requires backend shotIds arrays`);

  const inventedShotId = clone(valid);
  inventedShotId.scoringBreakdown[0].shotIds = [11, "15"];
  assert.strictEqual(runtime.predicate(inventedShotId), false, `${label} rejects coercible shot-ID placeholders`);
}

const recordsSource = fs.readFileSync(path.join(__dirname, "..", "records.html"), "utf8");
const historyStart = recordsSource.indexOf("function renderHistory()");
const historyEnd = recordsSource.indexOf("\nrenderHistory();", historyStart);
assert(historyStart >= 0 && historyEnd > historyStart, "saved-record selection flow must be extractable");
const historySource = recordsSource.slice(historyStart, historyEnd);
const validSelection = historySource.indexOf("if (isGssfAuthorityPackage(pkg))");
const invalidSelection = historySource.indexOf("if (hasGssfAuthorityIdentity(pkg))");
assert(validSelection >= 0, "saved records must select GSSF rendering through the strict predicate");
assert(invalidSelection > validSelection, "invalid GSSF candidates must be handled after strict selection fails");
assert(
  historySource.includes("return renderInvalidGssfSecCard(session)"),
  "invalid GSSF candidates must render an explicit authority-unavailable record"
);

console.log("PASS strict GSSF authority-package validation test");
