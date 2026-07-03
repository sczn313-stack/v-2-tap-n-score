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
  requestSource.includes("hitCoordinates: currentImpactPoints.map(safePoint).filter(Boolean)"),
  "GSSF request must send confirmed shot coordinates to backend authority"
);
assert(
  renderSource.includes("backendAuthorityPackage.display.resultLines"),
  "GSSF result display must render backend-provided display lines"
);
assert(
  !/downZeroCount\s*=|plusOneCount\s*=|plusThreeCount\s*=|missCount\s*=|totalPaperPenaltySeconds\s*=/.test(renderSource),
  "GSSF renderer must not calculate score buckets or paper penalty"
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
