const fs = require("fs");
const path = require("path");
const assert = require("assert");

const shootHtmlPath = path.join(__dirname, "..", "shoot.html");
const shootHtml = fs.readFileSync(shootHtmlPath, "utf8");

const helperStart = shootHtml.indexOf("function backendPoibDisplayCoordinate(authorityPackage)");
const markerStart = shootHtml.indexOf("function renderBackendAuthorityMarkers(authorityPackage)");

assert(helperStart >= 0, "backendPoibDisplayCoordinate helper must exist");
assert(markerStart > helperStart, "renderBackendAuthorityMarkers must follow POIB display helper");

const helperSource = shootHtml.slice(helperStart, markerStart);

assert(
  helperSource.includes("safePoint(authorityPackage.poib || authorityPackage.groupCenter)"),
  "POIB display must bind only to backend poib/groupCenter"
);
assert(
  helperSource.includes("POIB unavailable from backend authority."),
  "Missing backend POIB must produce the dev warning"
);
assert(
  !helperSource.includes("averageImpactCoordinate"),
  "Frontend must not average impacts to create POIB"
);
assert(
  !/\bimpacts\b|\bhits\b|renderCoordinates/.test(helperSource),
  "POIB display helper must not synthesize POIB from hit dots or render coordinates"
);
assert(
  shootHtml.includes('markerPointHtml("target-marker poib-auto-marker", poib'),
  "POIB marker must render from backendPoibDisplayCoordinate output"
);

console.log("PASS POIB display governance test");
