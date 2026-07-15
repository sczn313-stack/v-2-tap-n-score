const fs = require("fs");
const path = require("path");
const assert = require("assert");

const shootHtml = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");

const requestStart = shootHtml.indexOf("function backendAuthorityRequest()");
const requestEnd = shootHtml.indexOf("\nasync function requestBackendAuthority()", requestStart);
const renderStart = shootHtml.indexOf("function renderResults()");
const renderEnd = shootHtml.indexOf("\nfunction hideShooterTip()", renderStart);
const saveStart = shootHtml.indexOf('document.getElementById("saveMarks").addEventListener("click", () => {');
const saveEnd = shootHtml.indexOf("\nwindow.addEventListener(\"resize\"", saveStart);

assert(requestStart >= 0, "backendAuthorityRequest must exist");
assert(requestEnd > requestStart, "backendAuthorityRequest body must be extractable");
assert(renderStart >= 0, "renderResults must exist");
assert(renderEnd > renderStart, "renderResults body must be extractable");
assert(saveStart >= 0, "saveMarks handler must exist");
assert(saveEnd > saveStart, "saveMarks handler body must be extractable");

const requestSource = shootHtml.slice(requestStart, requestEnd);
const renderSource = shootHtml.slice(renderStart, renderEnd);
const saveSource = shootHtml.slice(saveStart, saveEnd);

assert(
  requestSource.includes('target_profile_id: "gssf_ac_1"'),
  "GSSF request must carry the authoritative target profile id"
);
assert(
  requestSource.includes('mission_family: "gssf"'),
  "GSSF request must carry the authoritative mission family"
);
assert(
  requestSource.includes("hitPixelCoordinates: registeredAssetObservations")
    && requestSource.includes("observationCount: registeredAssetObservations.length"),
  "GSSF request must send ordered observations on the registered asset to backend authority"
);
assert(
  requestSource.includes("registrationPackageId: GSSF_CANONICAL_AUTHORITY.registrationPackageId")
    && requestSource.includes("targetExecutionContractId: GSSF_CANONICAL_AUTHORITY.targetExecutionContractId"),
  "GSSF request must identify the governed registration and execution contract"
);
assert(
  !requestSource.includes("hitCoordinates:") && !requestSource.includes("xPercent") && !requestSource.includes("yPercent"),
  "GSSF backend request must not use legacy percentage observations"
);
assert(
  renderSource.includes("backendAuthorityPackage.display.resultLines"),
  "GSSF result display must render backend-provided display lines"
);
assert(
  shootHtml.includes("gssfScoringSourceHtml(authorityPackage)"),
  "GSSF result display must show backend scoring source validation"
);
assert(
  shootHtml.includes("gssfShotClassificationsHtml(authorityPackage)"),
  "GSSF result display must expose backend per-shot classifications"
);
assert(
  !/downZeroCount\s*=|plusOneCount\s*=|plusThreeCount\s*=|missCount\s*=|totalPaperPenaltySeconds\s*=/.test(renderSource),
  "GSSF renderer must not calculate score buckets or paper penalty"
);
assert(
  shootHtml.includes("function gssfShotClassificationsHtml(authorityPackage)"),
  "GSSF per-shot validation view helper must exist"
);
assert(
  shootHtml.includes("authorityPackage.hitClassifications"),
  "GSSF per-shot validation must read backend hit classifications"
);
assert(
  shootHtml.includes("function backendShotIdForHit(authorityPackage, hit, index)"),
  "GSSF display must resolve shot IDs from backend authority fields"
);
assert(
  !shootHtml.includes("hit.shot || index + 1"),
  "GSSF display must not invent shot IDs from frontend array indexes after backend classification"
);
assert(
  shootHtml.includes("authorityPackage.scoringBreakdown"),
  "GSSF time bucket cards must read the authoritative backend scoring breakdown"
);
assert(
  shootHtml.includes('authorityPackage.resultPackageType !== "gssfPaperPenaltyResult"'),
  "GSSF authority predicate must require the expected result package type"
);
assert(
  shootHtml.includes('authorityPackage.resultSource !== "backend"'),
  "GSSF authority predicate must require the backend source"
);
assert(
  shootHtml.includes('typeof authorityPackage.totalPaperPenaltySeconds !== "number"'),
  "GSSF authority predicate must require an actual numeric backend paper penalty"
);
assert(
  !shootHtml.includes("return Number.isFinite(Number(value)) ? Number(value) : 0"),
  "GSSF live scoring must not replace missing paper-penalty authority with zero"
);
assert(
  !shootHtml.includes("function gssfBucketTone("),
  "Unknown GSSF scoring zones must not be converted into a fallback bucket"
);
assert(
  shootHtml.includes("source.subtotalPenaltySeconds"),
  "GSSF time bucket cards must display backend-provided subtotals"
);
assert(
  !shootHtml.includes("count * multiplier"),
  "GSSF time bucket cards must not calculate subtotals in the frontend"
);
assert(
  shootHtml.includes("Scoring source:"),
  "GSSF validation must visibly identify the scoring source"
);
assert(
  saveSource.includes("isGssfAuthorityPackage(authorityPackage)"),
  "GSSF save path must be mission-specific"
);
assert(
  saveSource.includes('status: "backend-gssf-authority-calculated"'),
  "GSSF saved shot data must identify backend authority as the source"
);
assert(
  saveSource.includes("ugeoAuthorityPackage: null"),
  "GSSF save path must clear zeroing authority package fields"
);
assert(
  saveSource.includes("correctionStatus: \"not-applicable\""),
  "GSSF save path must not preserve zeroing correction status"
);

console.log("PASS GSSF backend authority governance test");
