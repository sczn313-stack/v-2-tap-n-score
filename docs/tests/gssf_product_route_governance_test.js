const fs = require("fs");
const path = require("path");
const assert = require("assert");

const docs = path.join(__dirname, "..");
const route = fs.readFileSync(path.join(docs, "t", "gssf", "ac1", "index.html"), "utf8");
const notFound = fs.readFileSync(path.join(docs, "404.html"), "utf8");
const server = fs.readFileSync(path.join(docs, "backend", "server.py"), "utf8");
const catalog = fs.readFileSync(path.join(docs, "backend", "product_catalog.py"), "utf8");

assert(route.includes('const PUBLISHER_ROUTE_ID = "gssf"'), "route resolves publisher gssf");
assert(route.includes('const PRODUCT_ROUTE_ID = "ac1"'), "route resolves product ac1");
assert(route.includes('const EXPECTED_CONTRACT_ID = "gssf-ac-1-live-canonical-v1"'), "route requires approved execution contract");
assert(route.includes("/api/catalog/product-route"), "route uses governed backend product resolver");
assert(route.includes("payload.authorityResolution") && route.includes('authority.missionFamily === "gssf"'), "route validates resolved mission authority");
assert(route.includes("approvedExperienceUrl(payload.experienceUrl)"), "route refuses an unapproved redirect destination");
assert(route.includes("location.replace(payload.experienceUrl)"), "successful resolution uses explicit governed redirect");
assert(!route.includes('location.replace("/")'), "product route never falls back to homepage");

assert(notFound.includes('location.pathname.match(/^\\/t\\/'), "404 recognizes unresolved product routes");
assert(notFound.includes('title.textContent = "Product unavailable"'), "unknown products render visibly unavailable");
assert(notFound.includes("/api/catalog/product-route"), "404 asks governed resolver instead of guessing");
assert(notFound.includes("if (!match)") && notFound.includes('location.replace("/")'), "homepage redirect is limited to non-product 404s");

assert(server.includes('PRODUCT_ROUTE_PATHS = {"/api/catalog/product-route"'), "backend exposes exact product resolver endpoint");
assert(catalog.includes('"publicRoute": "/t/gssf/ac1"'), "catalog owns permanent route identity");
assert(catalog.includes('"brandingAuthorizationStatus": "external_authorization_unverified"'), "technical route does not claim branding permission");
assert(catalog.includes('"status": "product_unavailable"') || catalog.includes('"product_unavailable"'), "catalog has explicit unavailable refusal");
assert(catalog.includes('"authority_unavailable"'), "catalog refuses mismatched authority");
assert(!catalog.includes("zeroingCorrection") && !catalog.includes("zeroCorrectionResult"), "product catalog does not route through Zeroing Authority");

console.log("PASS GSSF governed product-route test");
