const fs = require("fs");
const path = require("path");
const assert = require("assert");

const shoot = fs.readFileSync(path.join(__dirname, "..", "shoot.html"), "utf8");
const backend = fs.readFileSync(path.join(__dirname, "..", "backend", "authority_service.py"), "utf8");
const authority = fs.readFileSync(path.join(__dirname, "..", "backend", "gssf_ac_1_authority.py"), "utf8");

const requestStart = shoot.indexOf("function backendAuthorityRequest()");
const requestEnd = shoot.indexOf("\nasync function requestBackendAuthority()", requestStart);
const request = shoot.slice(requestStart, requestEnd);

assert(request.includes('missionFamily: GSSF_CANONICAL_AUTHORITY.missionFamily'), "missionFamily is explicit");
assert(request.includes("registrationPackageId"), "registration identity is supplied");
assert(request.includes("canonicalAssetSha256"), "canonical asset hash is supplied");
assert(request.includes("hitPixelCoordinates: registeredAssetObservations"), "ordered registered-asset observations are supplied");
assert(request.includes("shotId: point && point.shotId"), "stable shot IDs are supplied");
assert(!request.includes("hitCoordinates:"), "legacy percentage request is absent");
assert(shoot.includes("installGssfCanonicalEvidence()"), "live GSSF installs registered evidence");
assert(shoot.includes('dataUrl: "assets/gssf_ac_1_clean_reference.png"'), "live GSSF uses the clean registered PNG");
assert(shoot.includes("if (isGssfAuthoritySession()) return;"), "GSSF arbitrary upload path is isolated");
assert(backend.includes("return build_gssf_ac_1_canonical_asset_package(payload, profile)"), "GSSF has one canonical backend path");
assert(!backend.includes("targetWidthInches") && !backend.includes("zoneCenterPercent"), "legacy 19x30 and 50/50 scoring are absent");
assert(authority.includes('"registrationPackageId": "gssf-ac-1-clean-png-registration-v1"'), "registration is governed");
assert(authority.includes('"photographedPhysicalTargetSupport": False'), "photographed target support is not claimed");
assert(shoot.includes('TARGET_QUERY.get("gssf_canonical_export") === "1"'), "diagnostic export requires an explicit query flag");
assert(shoot.includes("request: exactWireRequest") && shoot.includes("response: JSON.parse(responseBody)"), "diagnostic export preserves exact request and response payloads");
assert(shoot.includes('evidenceStatus: "diagnostic_only"'), "export is explicitly diagnostic evidence only");
assert(shoot.includes("they are not scoring coordinates"), "registered-asset observations are not described as scoring coordinates");
assert(shoot.includes('"registration_package_transform"') && shoot.includes('"geometry_profile_canonical_inches"'), "export states the governed observation-to-geometry chain");
assert(shoot.includes("Download exact governed transaction"), "diagnostic transaction is downloadable for review");

console.log("PASS GSSF live canonical Target Authority test");
